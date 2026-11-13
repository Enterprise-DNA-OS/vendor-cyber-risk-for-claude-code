select set_config('app.actor','fictional-demo-seed',true);
do $$ begin
 if exists(select 1 from vendors where domain='harbour-cloud.example') then return; end if;
 insert into vendors(id,name,domain,owner,criticality,status,personal_data,privacy_scope,transfer_mode,transfer_basis,service,country,review_due,imported_score,score_observed_on) values
 ('10000000-0000-4000-8000-000000000001','Harbour Cloud','harbour-cloud.example','Moana','critical','active','yes','NZ','processor','Storage-only contract reviewed; no independent use','Customer record hosting','NZ',current_date-8,840,current_date-70),
 ('10000000-0000-4000-8000-000000000002','Kauri Support','kauri-support.example','Ravi','high','active','yes','NZ','disclosure','','Customer support','US',current_date+10,790,current_date-40),
 ('10000000-0000-4000-8000-000000000003','Southern Hosting','southern-hosting.example','Alex','critical','active','yes','AU','processor','Effective-control contract recorded','Hosting infrastructure','AU',current_date+80,900,current_date-5),
 ('10000000-0000-4000-8000-000000000004','Tui Documents','tui-documents.example','Moana','standard','active','yes','NZ','none','','Document storage','NZ',current_date-2,880,current_date-5),
 ('10000000-0000-4000-8000-000000000005','Kauri Analytics','kauri-analytics.example','Ravi','high','active','yes','AU','disclosure','','Customer analytics','US',current_date+20,null,null),
 ('10000000-0000-4000-8000-000000000006','Copper Stationery','copper-stationery.example','Alex','standard','active','no','none','none','','Office supplies','NZ',current_date+90,null,null),
 ('10000000-0000-4000-8000-000000000007','New Partner','new-partner.example','','unclassified','pending','unknown','unknown','unknown','','Service awaiting scope','',null,null,null);
 insert into controls(code,name,question,evidence_required) values
 ('ACCESS','Access controls','Is access restricted and reviewed?',true),
 ('BACKUP','Recovery evidence','Has recovery been tested for this service?',true),
 ('INCIDENT','Incident handling','Is the incident notification process documented?',true),
 ('SUBPROCESSOR','Subprocessor review','Have subprocessors and data locations been reviewed?',true),
 ('RETENTION','Retention and deletion','Are retention and deletion arrangements documented?',true);
 insert into assessments(id,vendor_id,name,scope,due_on) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Harbour annual review','Hosted customer records',current_date-3),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Kauri onboarding','Overseas support access',current_date+7),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','Copper review','Office supplies, no personal data',current_date+4);
 insert into evidence(id,vendor_id,name,reference,verified_on,valid_until,verified_by) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Recovery exercise','demo://harbour/recovery',current_date-400,current_date-35,'Moana'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Access review','demo://harbour/access',current_date-20,current_date+70,'Ravi'),
 ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','Hosting safeguards','demo://southern/safeguards',current_date-10,current_date+355,'Alex');
 insert into responses(assessment_id,control_id,answer,note,evidence_id)
 select '20000000-0000-4000-8000-000000000001',id,'yes','Demo access review checked','30000000-0000-4000-8000-000000000002' from controls where code='ACCESS';
 insert into responses(assessment_id,control_id,answer,note,evidence_id)
 select '20000000-0000-4000-8000-000000000001',id,'yes','Recovery test is stale','30000000-0000-4000-8000-000000000001' from controls where code='BACKUP';
 insert into findings(id,vendor_id,name,likelihood,impact,owner,due_on) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Recovery test overdue',4,5,'Moana',current_date-14),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Support access lacks review',4,4,'Ravi',current_date-6),
 ('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','Notification contact untested',2,3,'Alex',current_date+5);
 insert into waivers(finding_id,name,reason,approver,expires_on) values
 ('40000000-0000-4000-8000-000000000002','Temporary support exception','Access review booked','Ravi',current_date-2),
 ('40000000-0000-4000-8000-000000000003','Notification exception','Manual escalation drill pending','Alex',current_date+12);
 insert into dependencies(vendor_id,provider_id,service) values
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','Compute hosting'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Support record storage'),
 ('10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000003','Document hosting');
 insert into notes(vendor_id,name,body) values('10000000-0000-4000-8000-000000000001','Recovery follow-up','Fictional demo: revised recovery evidence requested; nothing sent by this software.');
 insert into responses(assessment_id,control_id,answer,note)
 select '20000000-0000-4000-8000-000000000003',id,'na','Fictional supplies-only service with no system access or personal data' from controls;
 update assessments set state='approved',reviewer='Alex',decided_on=current_date,next_review_on=current_date+90,
 rationale='Fictional supplies-only review: all exclusions individually reviewed',
 snapshot=jsonb_build_object(
 'vendor',(select to_jsonb(v) from vendors v where v.id=assessments.vendor_id),
 'questionnaire',(select jsonb_agg(jsonb_build_object('code',c.code,'question',c.question,'answer',r.answer,'note',r.note)) from responses r join controls c on c.id=r.control_id where r.assessment_id=assessments.id),
 'errors','[]'::jsonb,'findings','[]'::jsonb,'waivers','[]'::jsonb,'dependencies','[]'::jsonb)
 where name='Copper review';
end $$;
