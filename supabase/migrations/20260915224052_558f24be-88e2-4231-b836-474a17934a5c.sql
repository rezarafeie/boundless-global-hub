insert into public.call_agent_extensions (email, extension, display_name, user_id, is_active)
values
 ('roghayealsadat@gmail.com','09171767519','رقیه السادات صالحی زاده',41852,true),
 ('Mightriderazadd@gmail.com','09371768605','هستی حیدرپور ازاد',1778,true),
 ('nazaninazizzadeh2@gmail.com','09054267720','Nazanin Azizzadeh',43410,true)
on conflict do nothing;

update public.calls c
set agent_id = e.user_id
from (values ('9171767519',41852),('9371768605',1778),('9054267720',43410),('9120784457',3)) as e(tail,user_id)
where c.agent_id is null
  and regexp_replace(coalesce(c.extension,''),'[^0-9]','','g') like '%' || e.tail;