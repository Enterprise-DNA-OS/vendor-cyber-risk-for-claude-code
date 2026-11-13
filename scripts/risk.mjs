#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const sources = {
 NZ_SECURITY:'https://www.privacy.org.nz/privacy-principles/5/',
 NZ_TRANSFER:'https://www.privacy.org.nz/privacy-principles/12/',
 AU_SECURITY:'https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information',
 AU_TRANSFER:'https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information',
 POLICY:'docs/compliance.md#local-review-policy'
};
const editable={
 vendor:['name','domain','owner','criticality','status','personal_data','privacy_scope','transfer_mode','transfer_basis','service','country','review_due'],
 evidence:['vendor_id','name','reference','valid_until','verified_by','verified_on'],
 finding:['vendor_id','name','likelihood','impact','owner','due_on'],
 note:['vendor_id','name','body']
};
const names={vendor:'vendors',evidence:'evidence',finding:'findings',assessment:'assessments',waiver:'waivers',control:'controls',note:'notes'};
export const readCommands=['vendors','assessments','controls','evidence','findings','waivers','fourth-parties','concentration','reviews-due','rating-freshness','decisions','audit','attention','compliance','weekly-review'];
function parse(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');opts[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}return {opts,pos};}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
const text=(x,k)=>{if(typeof x!=='string'||!x.trim())throw Error(`${k} is required`);return x.trim();};
function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error(`Invalid date: ${s}`);return s;}
const today=()=>new Date().toISOString().slice(0,10);
function domain(v){if(v==null||v==='')return null;const s=String(v).toLowerCase().trim().replace(/\.$/,'');if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(s))throw Error(`Invalid domain: ${v}`);return s;}
function dataObject(o){const d=JSON.parse(required(o,'data'));if(!d||Array.isArray(d)||typeof d!=='object')throw Error('--data must be an object');return d;}
export async function resolve(db,kind,term){const t=names[kind];if(!t)throw Error('Unknown record kind');text(term,'record');const rows=await db.query(`select * from ${t} where lower(name)=lower($1) or id::text like $2 order by name,id`,[term,term+'%']);let found=rows;if(!found.length)found=await db.query(`select * from ${t} where position(lower($1) in lower(name))>0 order by name,id`,[term]);if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No matching'} ${kind}: ${term}${found.length?'\n'+found.map(r=>`${r.id}  ${r.name}`).join('\n'):''}`);return found[0];}
async function tx(db,actor,fn){await db.exec('BEGIN');try{await db.query("select set_config('app.actor',$1,true)",[text(actor,'actor')]);const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function normalise(db,kind,d){for(const k of Object.keys(d))if(!editable[kind]?.includes(k))throw Error(`Unsupported ${kind} field: ${k}`);if('domain'in d)d.domain=domain(d.domain);for(const k of ['review_due','valid_until','verified_on','due_on'])if(d[k]!=null)date(d[k]);if(d.vendor_id)d.vendor_id=(await resolve(db,'vendor',d.vendor_id)).id;return d;}
async function insert(db,t,d){const keys=Object.keys(d);if(!keys.length)throw Error('No fields');return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,keys.map(k=>d[k])))[0];}
async function questionnaire(db,a){return db.query(`select c.id as control_id,c.code,c.name,c.question,c.evidence_required,r.answer,r.note,r.evidence_id,e.name as evidence,e.valid_until,e.verified_on,e.verified_by from controls c left join responses r on r.control_id=c.id and r.assessment_id=$1 left join evidence e on e.id=r.evidence_id order by c.code`,[a.id]);}
export async function compliance(db){
 const out=[];const add=(v,rule,reason,source)=>out.push({vendor:v.name,rule,reason,source});
 for(const v of await db.query("select * from vendors where status<>'retired' order by name")){
  if(!v.owner||v.criticality==='unclassified'||v.personal_data==='unknown'||v.privacy_scope==='unknown'||!v.service)add(v,'SCOPE','Complete owner, service, criticality and privacy scope',sources.POLICY);
  if(v.personal_data==='yes'){
   const laws=v.privacy_scope==='both'?['NZ','AU']:[v.privacy_scope];
   const current=await db.query('select id from evidence where vendor_id=$1 and verified_on<=current_date and valid_until>=current_date',[v.id]);
   for(const law of laws.filter(x=>['NZ','AU'].includes(x))){
    if(!current.length)add(v,law+'_SECURITY','No current verified safeguards evidence recorded; review required',sources[law+'_SECURITY']);
    if(v.transfer_mode==='unknown'||(['processor','disclosure'].includes(v.transfer_mode)&&!v.transfer_basis.trim()))add(v,law+'_TRANSFER','Record transfer classification and reviewed safeguards or exception basis',sources[law+'_TRANSFER']);
   }
   if(v.privacy_scope==='none')add(v,'SCOPE','Personal data has no recorded applicable privacy regime; review rationale',sources.POLICY);
  }
 }
 return out;
}
async function blockers(db,a){
 const v=await resolve(db,'vendor',a.vendor_id);const q=await questionnaire(db,a);const errors=[];
 for(const c of q){if(!c.answer)errors.push(`${c.code}: unanswered`);else if(c.answer==='no')errors.push(`${c.code}: negative answer must be remediated before approval`);else if(c.answer==='na'&&!c.note?.trim())errors.push(`${c.code}: exclusion rationale missing`);else if(c.answer==='yes'&&c.evidence_required&&(!c.evidence_id||c.valid_until<today()||c.verified_on>today()))errors.push(`${c.code}: current verified evidence required`);}
 const f=await db.query("select * from finding_position where vendor_id=$1 and state='open' and not waived and risk_score>=12",[v.id]);
 errors.push(...f.map(x=>`${x.name}: high risk ${x.risk_score} remains open`));
 errors.push(...(await compliance(db)).filter(x=>x.vendor===v.name).map(x=>`${x.rule}: ${x.reason}`));
 if(v.status==='retired')errors.push('Vendor is retired');
 return {vendor:v,questionnaire:q,errors};
}
async function attention(db){
 const a=[];
 for(const r of await db.query('select * from review_queue order by review_due nulls first,name'))a.push({vendor:r.name,issue:r.reason,owner:r.owner||'Unassigned',due:r.review_due});
 for(const f of await db.query("select * from finding_position where state='open' and due_on<current_date and not waived order by due_on"))a.push({vendor:f.vendor,issue:f.name,owner:f.owner,due:f.due_on});
 for(const e of await db.query('select e.*,v.name as vendor from evidence e join vendors v on v.id=e.vendor_id where e.valid_until<current_date order by e.valid_until'))a.push({vendor:e.vendor,issue:'Expired evidence: '+e.name,owner:e.verified_by,due:e.valid_until});
 for(const w of await db.query("select w.*,v.name as vendor from waivers w join findings f on f.id=w.finding_id join vendors v on v.id=f.vendor_id where not w.revoked and w.expires_on<current_date and f.state='open'"))a.push({vendor:w.vendor,issue:'Expired waiver: '+w.name,owner:w.approver,due:w.expires_on});
 return a;
}
function exportCsv(rows){if(!rows.length)return '';const keys=Object.keys(rows[0]);const enc=v=>'"'+String(v===null?'':typeof v==='object'?JSON.stringify(v):v).replaceAll('"','""')+'"';return [keys.map(enc).join(','),...rows.map(r=>keys.map(k=>enc(r[k])).join(','))].join('\r\n')+'\r\n';}
export function decodeImport(raw){
 const str=raw.replace(/^\uFEFF/,'').trim();
 if(str.startsWith('{')){const d=JSON.parse(str);if(!Array.isArray(d.vendors))throw Error('JSON must have a vendors array');return d.vendors;}
 if(str.startsWith('[')){
  // UpGuard's curl/jq recipe emits a stream of arrays, despite its .csv extension.
  const chunks=[];let depth=0,start=-1,inString=false,escape=false;
  for(let i=0;i<str.length;i++){const c=str[i];if(inString){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')inString=false;continue;}if(c==='"'){inString=true;continue;}if(c==='['){if(depth===0)start=i;depth++;}else if(c===']'){depth--;if(depth===0)chunks.push(JSON.parse(str.slice(start,i+1)));}else if(depth===0&&!/\s/.test(c))throw Error('Invalid JSON array stream');}
  if(depth||inString||!chunks.length)throw Error('Invalid JSON array stream');
  if(chunks.length===1&&chunks[0].every(x=>x&&typeof x==='object'&&!Array.isArray(x)))return chunks[0];
  return chunks.map(r=>{if(r.length!==4)throw Error('UpGuard arrays require four fields');return {name:r[0],primary_domain:r[1],score:r[2],labels:r[3]};});
 }
 return parseCsv(str);
}
function importRows(raw,asOf){return decodeImport(raw).map((r,i)=>{
 if(!r||typeof r!=='object'||Array.isArray(r))throw Error(`Import row ${i+1}: object required`);
 const name=text(pick(r,'name','Vendor name'),'vendor name');const d=domain(pick(r,'primary_domain','domain'));
 const score=pick(r,'score','security rating');const n=score===''||score===null?null:Number(score);
 if(n!==null&&(!Number.isInteger(n)||n<0||n>950))throw Error(`Import row ${i+1}: score must be an integer 0 to 950`);
 let labels=r.labels??pick(r,'labels')??[];
 if(typeof labels==='string'){try{labels=JSON.parse(labels);}catch{labels=labels.split(',').map(s=>s.trim()).filter(Boolean);}}
 if(!Array.isArray(labels)||labels.some(x=>typeof x!=='string'))throw Error(`Import row ${i+1}: labels must be text values`);
 return {name,domain:d,imported_score:n,score_observed_on:n===null?null:asOf,labels,source_record:r};
 });}

export async function execute(db,args){
 const {opts:o,pos}=parse(args);const [cmd='help',arg,arg2]=pos;
 const reads={
 vendors:'select * from vendor_position order by name',assessments:'select a.id,a.name,v.name as vendor,a.scope,a.due_on,a.state,a.reviewer from assessments a join vendors v on v.id=a.vendor_id order by a.due_on',controls:'select code,name,question,evidence_required from controls order by code',
 evidence:'select e.id,v.name as vendor,e.name,e.reference,e.verified_by,e.verified_on,e.valid_until from evidence e join vendors v on v.id=e.vendor_id order by e.valid_until',findings:'select * from finding_position order by risk_score desc,name',
 waivers:'select w.id,w.name,v.name as vendor,w.reason,w.approver,w.expires_on,w.revoked,(not w.revoked and w.expires_on>=current_date) as valid from waivers w join findings f on f.id=w.finding_id join vendors v on v.id=f.vendor_id order by w.expires_on',
 'fourth-parties':'select v.name as vendor,p.name as provider,d.service from dependencies d join vendors v on v.id=d.vendor_id join vendors p on p.id=d.provider_id order by v.name,p.name',
 concentration:'select provider,dependent_vendors,critical_vendors,affected_vendors from concentration order by dependent_vendors desc,provider',
 'reviews-due':'select name,owner,criticality,review_due,reason from review_queue order by review_due nulls first,name',
 'rating-freshness':"select name,imported_score,score_observed_on,rating_age_days,case when imported_score is null then 'No rating supplied' when rating_age_days>30 then 'Stale snapshot' else 'Dated snapshot only' end as rating_status from vendor_position where status<>'retired' order by rating_age_days desc nulls first,name",
 decisions:"select name,state,reviewer,decided_on,next_review_on,rationale,snapshot from assessments where state<>'open' order by decided_on desc,name",
 audit:'select table_name,action,actor,record_id,created_at from activity order by created_at desc,id limit 100'
 };
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='attention')return attention(db);
 if(cmd==='compliance')return compliance(db);
 if(cmd==='card'){const v=await resolve(db,'vendor',arg);return {vendor:v,assessments:await db.query('select * from assessments where vendor_id=$1 order by created_at',[v.id]),evidence:await db.query('select * from evidence where vendor_id=$1',[v.id]),findings:await db.query('select * from finding_position where vendor_id=$1',[v.id]),notes:await db.query('select * from notes where vendor_id=$1 order by created_at',[v.id])};}
 if(cmd==='questionnaire')return questionnaire(db,await resolve(db,'assessment',arg));
 if(cmd==='check-assessment')return blockers(db,await resolve(db,'assessment',arg));
 if(cmd==='weekly-review')return {attention:await attention(db),reviews_due:await db.query(reads['reviews-due']),concentration:await db.query(reads.concentration),compliance:await compliance(db)};
 if(cmd==='help')return {usage:'node scripts/risk.mjs <command> [record] [--json] [--actor=name]',read:[...readCommands,'card','questionnaire','check-assessment'],write:['add <vendor|evidence|finding|note> --data=JSON','set <vendor> --data=JSON','open-assessment <vendor> --name= --scope= --due=','answer <assessment> <control> --answer=yes|no|na --note= [--evidence=]','resolve-finding <finding> --proof=','waive <finding> --until= --reason= --approver=','revoke-waiver <waiver>','decide <assessment> --decision=approved|conditional|rejected --reviewer= --rationale= --next-review=','link <vendor> <provider> --service=','log <vendor> --note=','import upguard --file= --as-of=YYYY-MM-DD [--dry-run]','export [--out=directory]','draft-remediation <vendor>','draft-weekly-review']};
 if(cmd==='export'){
  const dir=path.resolve(o.out||path.join(REPO_ROOT,'exports',randomUUID()));fs.mkdirSync(dir,{recursive:true,mode:0o700});const snapshot={format:'vendor-cyber-risk/v1',exported_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN READ ONLY');try{for(const t of ['vendors','controls','assessments','evidence','responses','findings','waivers','dependencies','notes','activity']){const rows=await db.query(`select * from ${t} order by id`);snapshot.records[t]=rows;fs.writeFileSync(path.join(dir,t+'.csv'),exportCsv(rows),{mode:0o600,flag:'wx'});}fs.writeFileSync(path.join(dir,'snapshot.json'),JSON.stringify(snapshot,null,2),{mode:0o600,flag:'wx'});}finally{await db.exec('ROLLBACK');}return {directory:dir,counts:Object.fromEntries(Object.entries(snapshot.records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='draft-remediation'||cmd==='draft-weekly-review'){
  const data=cmd==='draft-weekly-review'?await execute(db,['weekly-review']):await execute(db,['card',arg]);
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,cmd+'-'+randomUUID()+'.md');
  fs.writeFileSync(file,`# Draft for review\n\n${cmd==='draft-remediation'?`Vendor: ${data.vendor.name}\n\nPlease review the recorded findings below and provide remediation evidence.`:'Weekly vendor risk review'}\n\n${JSON.stringify(data,null,2)}\n\nPrepared from records. Nothing sent.\n`,{mode:0o600,flag:'wx'});return {file};
 }
 const actor=required(o,'actor');
 return tx(db,actor,async()=>{
  if(cmd==='add'){
   if(!editable[arg])throw Error('add requires vendor, evidence, finding or note');const d=await normalise(db,arg,dataObject(o));
   if(arg==='evidence'&&d.verified_on&&d.verified_on>today())throw Error('Evidence cannot be verified in the future');
   return insert(db,names[arg],d);
  }
  if(cmd==='set'){
   const v=await resolve(db,'vendor',arg);const d=await normalise(db,'vendor',dataObject(o));const keys=Object.keys(d);if(!keys.length)throw Error('No fields');
   return (await db.query(`update vendors set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...keys.map(k=>d[k]),v.id]))[0];
  }
  if(cmd==='open-assessment'){
   const v=await resolve(db,'vendor',arg);if(v.status==='retired')throw Error('Cannot assess retired vendor');return insert(db,'assessments',{vendor_id:v.id,name:required(o,'name'),scope:required(o,'scope'),due_on:date(required(o,'due'))});
  }
  if(cmd==='answer'){
   const a=await resolve(db,'assessment',arg);if(a.state!=='open')throw Error('Assessment is already decided');
   const cs=await db.query('select * from controls where lower(code)=lower($1)',[arg2]);const c=cs[0]||await resolve(db,'control',arg2);const answer=required(o,'answer');if(!['yes','no','na'].includes(answer))throw Error('answer must be yes, no or na');
   const note=required(o,'note');const e=o.evidence?await resolve(db,'evidence',o.evidence):null;if(e&&e.vendor_id!==a.vendor_id)throw Error('Evidence belongs to another vendor');
   return (await db.query('insert into responses(assessment_id,control_id,answer,note,evidence_id) values($1,$2,$3,$4,$5) on conflict(assessment_id,control_id) do update set answer=excluded.answer,note=excluded.note,evidence_id=excluded.evidence_id returning *',[a.id,c.id,answer,note,e?.id||null]))[0];
  }
  if(cmd==='resolve-finding'){const f=await resolve(db,'finding',arg);if(f.state==='resolved')throw Error('Finding already resolved');return (await db.query("update findings set state='resolved',resolution=$1,resolved_on=current_date where id=$2 returning *",[required(o,'proof'),f.id]))[0];}
  if(cmd==='waive'){const f=await resolve(db,'finding',arg);if(f.state!=='open')throw Error('Only open findings can be waived');const until=date(required(o,'until'));if(until<today())throw Error('Waiver expiry is in the past');return insert(db,'waivers',{finding_id:f.id,name:'Exception: '+f.name,reason:required(o,'reason'),approver:required(o,'approver'),expires_on:until});}
  if(cmd==='revoke-waiver'){const w=await resolve(db,'waiver',arg);return (await db.query('update waivers set revoked=true where id=$1 returning *',[w.id]))[0];}
  if(cmd==='link'){
   await db.exec('LOCK TABLE dependencies IN SHARE ROW EXCLUSIVE MODE');const v=await resolve(db,'vendor',arg),p=await resolve(db,'vendor',arg2);
   if(v.id===p.id||(await db.query('select 1 from dependency_reach where vendor_id=$1 and provider_id=$2',[p.id,v.id])).length)throw Error('Dependency would create a cycle');
   return insert(db,'dependencies',{vendor_id:v.id,provider_id:p.id,service:required(o,'service')});
  }
  if(cmd==='log'){const v=await resolve(db,'vendor',arg);return insert(db,'notes',{vendor_id:v.id,name:'Operator note',body:required(o,'note')});}
  if(cmd==='decide'){
   // Serialise decision with all contributing records; snapshot is the exact reviewed evidence.
   await db.exec('LOCK TABLE vendors,controls,assessments,evidence,responses,findings,waivers,dependencies IN SHARE ROW EXCLUSIVE MODE');
   const a=await resolve(db,'assessment',arg);if(a.state!=='open')throw Error('Assessment is already decided');
   const decision=required(o,'decision');if(!['approved','conditional','rejected'].includes(decision))throw Error('Unknown decision');const review=date(required(o,'next-review'));if(review<=today())throw Error('Next review must be in the future');
   const checks=await blockers(db,a);if(decision!=='rejected'&&checks.errors.length)throw Error('Decision blocked:\n'+checks.errors.join('\n'));
   const open=await db.query("select * from finding_position where vendor_id=$1 and state='open'",[a.vendor_id]);
   if(decision==='approved'&&open.length)throw Error('Use conditional while findings or accepted exceptions remain open');
   const snapshot={...checks,findings:await db.query('select * from findings where vendor_id=$1',[a.vendor_id]),waivers:await db.query('select w.* from waivers w join findings f on f.id=w.finding_id where f.vendor_id=$1',[a.vendor_id]),dependencies:await db.query('select * from dependencies where vendor_id=$1',[a.vendor_id])};
   const result=(await db.query('update assessments set state=$1,reviewer=$2,rationale=$3,next_review_on=$4,decided_on=current_date,snapshot=$5 where id=$6 returning *',[decision,required(o,'reviewer'),required(o,'rationale'),review,JSON.stringify(snapshot),a.id]))[0];
   await db.query('update vendors set review_due=$1 where id=$2',[review,a.vendor_id]);return result;
  }
  if(cmd==='import'){
   if(arg!=='upguard')throw Error('Supported import: upguard');const asOf=date(required(o,'as-of'));if(asOf>today())throw Error('Snapshot date cannot be in the future');const rows=importRows(fs.readFileSync(path.resolve(required(o,'file')),'utf8'),asOf);
   const seen=new Set();for(const r of rows){const key=r.domain||'name:'+r.name.toLowerCase();if(seen.has(key))throw Error('Duplicate vendor in input: '+key);seen.add(key);}
   const counts={rows:rows.length,created:0,updated:0,dry_run:Boolean(o['dry-run'])};
   for(const r of rows){
    const old=await db.query(r.domain?'select * from vendors where domain=$1':'select * from vendors where domain is null and lower(name)=lower($1)',[r.domain||r.name]);if(old.length>1)throw Error('Ambiguous imported vendor: '+r.name);
    if(old[0]?.score_observed_on&&r.score_observed_on&&r.score_observed_on<old[0].score_observed_on)throw Error('Refusing older rating snapshot for '+r.name);
    counts[old.length?'updated':'created']++;
    if(o['dry-run'])continue;
    if(old.length){await db.query('update vendors set name=$1,imported_score=$2,score_observed_on=$3,labels=$4,source_record=$5 where id=$6',[r.name,r.imported_score,r.score_observed_on,JSON.stringify(r.labels),JSON.stringify(r.source_record),old[0].id]);}
    else await insert(db,'vendors',{...r,labels:JSON.stringify(r.labels),source_record:JSON.stringify(r.source_record)});
   }
   return counts;
  }
  throw Error('Unknown command: '+cmd);
 });
}
export function pretty(data){if(Array.isArray(data)){if(!data.length)return '(none)';return table(data.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v]))),Object.keys(data[0]).map(k=>({key:k,label:k,width:['id','vendor_id','control_id','record_id'].includes(k)?12:70})));}return JSON.stringify(data,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const args=process.argv.slice(2);const result=await execute(db,args);console.log(args.includes('--json')?JSON.stringify(result,null,2):pretty(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
