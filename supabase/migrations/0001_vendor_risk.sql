create function stamp_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table activity (id uuid primary key default gen_random_uuid(), table_name text not null, record_id uuid not null, action text not null, actor text not null, before_record jsonb, after_record jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create function record_activity() returns trigger language plpgsql as $$
declare who text; begin
 who := nullif(current_setting('app.actor',true),'');
 if who is null then raise exception 'app.actor is required for changes'; end if;
 insert into activity(table_name,record_id,action,actor,before_record,after_record) values(TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,who,case when TG_OP<>'INSERT' then to_jsonb(old) end,case when TG_OP<>'DELETE' then to_jsonb(new) end);
 return coalesce(new,old); end $$;
create function immutable_activity() returns trigger language plpgsql as $$ begin raise exception 'Activity is append-only'; end $$;
create trigger immutable_activity before update or delete on activity for each row execute function immutable_activity();
create table vendors (id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), domain text unique, owner text not null default '', criticality text not null default 'unclassified' check(criticality in ('critical','high','standard','unclassified')), status text not null default 'pending' check(status in ('pending','active','retired')), personal_data text not null default 'unknown' check(personal_data in ('yes','no','unknown')), privacy_scope text not null default 'unknown' check(privacy_scope in ('NZ','AU','both','none','unknown')), transfer_mode text not null default 'unknown' check(transfer_mode in ('none','processor','disclosure','unknown')), transfer_basis text not null default '', service text not null default '', country text not null default '', labels jsonb not null default '[]', imported_score integer check(imported_score between 0 and 950), score_observed_on date, review_due date, source_record jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on vendors for each row execute function stamp_updated();
create trigger audit after insert or update or delete on vendors for each row execute function record_activity();
create table controls (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, question text not null, evidence_required boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on controls for each row execute function stamp_updated();
create trigger audit after insert or update or delete on controls for each row execute function record_activity();
create table assessments (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), name text not null unique, scope text not null, due_on date not null, state text not null default 'open' check(state in ('open','approved','conditional','rejected')), reviewer text, decided_on date, next_review_on date, rationale text, snapshot jsonb, check((state='open' and decided_on is null) or (state<>'open' and decided_on is not null and reviewer is not null and rationale is not null and snapshot is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on assessments for each row execute function stamp_updated();
create trigger audit after insert or update or delete on assessments for each row execute function record_activity();
create table evidence (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), name text not null, reference text not null check(length(trim(reference))>0), valid_until date not null, verified_by text not null check(length(trim(verified_by))>0), verified_on date not null default current_date, check(valid_until>=verified_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on evidence for each row execute function stamp_updated();
create trigger audit after insert or update or delete on evidence for each row execute function record_activity();
create table responses (id uuid primary key default gen_random_uuid(), assessment_id uuid not null references assessments(id), control_id uuid not null references controls(id), answer text not null check(answer in ('yes','no','na')), note text not null, evidence_id uuid references evidence(id), unique(assessment_id,control_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on responses for each row execute function stamp_updated();
create trigger audit after insert or update or delete on responses for each row execute function record_activity();
create table findings (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), name text not null, likelihood integer not null check(likelihood between 1 and 5), impact integer not null check(impact between 1 and 5), owner text not null check(length(trim(owner))>0), due_on date not null, state text not null default 'open' check(state in ('open','resolved')), resolution text, resolved_on date, check(state<>'resolved' or (length(trim(resolution))>0 and resolved_on is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on findings for each row execute function stamp_updated();
create trigger audit after insert or update or delete on findings for each row execute function record_activity();
create table waivers (id uuid primary key default gen_random_uuid(), finding_id uuid not null references findings(id), name text not null, reason text not null check(length(trim(reason))>0), approver text not null check(length(trim(approver))>0), expires_on date not null, revoked boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on waivers for each row execute function stamp_updated();
create trigger audit after insert or update or delete on waivers for each row execute function record_activity();
create table dependencies (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), provider_id uuid not null references vendors(id), service text not null, unique(vendor_id,provider_id), check(vendor_id<>provider_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on dependencies for each row execute function stamp_updated();
create trigger audit after insert or update or delete on dependencies for each row execute function record_activity();
create table notes (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), name text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stamp before update on notes for each row execute function stamp_updated();
create trigger audit after insert or update or delete on notes for each row execute function record_activity();
create unique index one_open_assessment on assessments(vendor_id) where state='open';
create index findings_vendor on findings(vendor_id);
create index evidence_vendor on evidence(vendor_id);
create index assessments_vendor on assessments(vendor_id);
create function protect_decision() returns trigger language plpgsql as $$ begin
 if old.state<>'open' then raise exception 'Decided assessments are immutable; open a new review'; end if;
 return coalesce(new,old); end $$;
create trigger decision_lock before update or delete on assessments for each row execute function protect_decision();
create function protect_response() returns trigger language plpgsql as $$
declare a uuid; v uuid; e uuid;
begin
 a:=coalesce(new.assessment_id,old.assessment_id);
 select vendor_id into v from assessments where id=a and state='open' for update;
 if v is null then raise exception 'Responses require an open assessment'; end if;
 if new.evidence_id is not null then
 select vendor_id into e from evidence where id=new.evidence_id;
 if e is distinct from v then raise exception 'Evidence belongs to another vendor'; end if;
 end if;
 return coalesce(new,old); end $$;
create trigger response_lock before insert or update or delete on responses for each row execute function protect_response();
create view finding_position as
 select f.id,f.vendor_id,v.name as vendor,f.name,f.likelihood,f.impact,f.likelihood*f.impact as risk_score,f.owner,f.due_on,f.state,
 exists(select 1 from waivers w where w.finding_id=f.id and not w.revoked and w.expires_on>=current_date) as waived
 from findings f join vendors v on v.id=f.vendor_id;
create view vendor_position as
 select v.id,v.name,v.domain,v.owner,v.criticality,v.status,v.personal_data,v.privacy_scope,v.transfer_mode,v.review_due,
 v.imported_score,v.score_observed_on,case when v.score_observed_on is null then null else current_date-v.score_observed_on end as rating_age_days,
 (select count(*)::int from finding_position f where f.vendor_id=v.id and f.state='open' and not f.waived) as unwaived_findings,
 (select max(risk_score) from finding_position f where f.vendor_id=v.id and f.state='open' and not f.waived) as highest_open_risk,
 (select count(*)::int from evidence e where e.vendor_id=v.id and e.valid_until<current_date) as expired_evidence
 from vendors v;
create view review_queue as
 select id,name,owner,criticality,review_due,case when review_due is null then 'No review date' when review_due<current_date then 'Overdue' else 'Due soon' end as reason
 from vendors where status<>'retired' and (review_due is null or review_due<=current_date+30);
create view dependency_reach as
 with recursive walk as (
 select vendor_id,provider_id,array[vendor_id,provider_id] as visited,1 as depth from dependencies
 union all
 select w.vendor_id,d.provider_id,w.visited||d.provider_id,w.depth+1 from walk w join dependencies d on d.vendor_id=w.provider_id where not d.provider_id=any(w.visited)
 ) select vendor_id,provider_id,min(depth) as depth from walk group by vendor_id,provider_id;
create view concentration as
 select p.id,p.name as provider,count(distinct v.id)::int as dependent_vendors,
 count(distinct v.id) filter(where v.criticality='critical')::int as critical_vendors,
 string_agg(distinct v.name,', ' order by v.name) as affected_vendors
 from dependency_reach d join vendors p on p.id=d.provider_id join vendors v on v.id=d.vendor_id where v.status<>'retired' group by p.id,p.name;
alter table vendors enable row level security; revoke all on vendors from public;
alter table controls enable row level security; revoke all on controls from public;
alter table assessments enable row level security; revoke all on assessments from public;
alter table evidence enable row level security; revoke all on evidence from public;
alter table responses enable row level security; revoke all on responses from public;
alter table findings enable row level security; revoke all on findings from public;
alter table waivers enable row level security; revoke all on waivers from public;
alter table dependencies enable row level security; revoke all on dependencies from public;
alter table notes enable row level security; revoke all on notes from public;
alter table activity enable row level security; revoke all on activity from public;
revoke all on finding_position from public;
revoke all on vendor_position from public;
revoke all on review_queue from public;
revoke all on dependency_reach from public;
revoke all on concentration from public;
