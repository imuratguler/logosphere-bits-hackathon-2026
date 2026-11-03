-- Logosphere BITS — atomic demo sale moves (preview + apply).
--
-- demo_sale_preview computes a listing move without writing:
-- nested collections, sets, publications, the USD recommended
-- total (one ISBN counted once), and the publications without
-- a USD recommendation.
-- demo_apply_sale writes the whole move in one transaction:
-- one ledger row per in-scope product, set, and the subject
-- collection, so partial writes are impossible. Manual tags
-- are product-only; set/collection tags derive from
-- recommendations. Expected tag/active values reject racing
-- updates instead of overwriting them.

create or replace function public.demo_sale_subtree(p_collection_id uuid)
returns table (collection_id uuid)
language sql
stable
set search_path = public
as $$
  with recursive down(id) as (
    select n.id
      from public.nodes as n
     where n.id = p_collection_id
       and n.kind = 'collection'
    union
    select n.id
      from public.nodes as n
      join down as d on n.parent_id = d.id
     where n.kind = 'collection'
  )
  select id from down;
$$;

revoke all on function public.demo_sale_subtree(uuid)
  from public, anon, authenticated;

create or replace function public.demo_sale_recommended(p_product_id uuid)
returns table (rec bigint, cur text)
language sql
stable
set search_path = public
as $$
  select e.market_recommended, e.currency
    from public.price_estimates as e
   where e.product_id = p_product_id
   order by e.created_at desc, e.id desc
   limit 1;
$$;

revoke all on function public.demo_sale_recommended(uuid)
  from public, anon, authenticated;

create or replace function public.demo_sale_total(p_products uuid[])
returns bigint
language sql
stable
set search_path = public
as $$
  with recs as (
    select distinct on (e.product_id)
      e.product_id,
      e.market_recommended as rec
      from public.price_estimates as e
     where e.product_id = any(p_products)
       and e.market_recommended is not null
       and e.market_recommended > 0
       and upper(e.currency) = 'USD'
     order by e.product_id, e.created_at desc, e.id desc
  ),
  grouped as (
    select max(r.rec) as best
      from recs as r
      left join public.product_bibliography as b
        on b.product_id = r.product_id
     group by coalesce(
       nullif(upper(regexp_replace(b.isbn13, '[^0-9X]', '', 'g')), ''),
       'pid:' || r.product_id::text
     )
  )
  select coalesce(sum(best), 0) from grouped;
$$;

revoke all on function public.demo_sale_total(uuid[])
  from public, anon, authenticated;

create or replace function public.demo_sale_preview(
  p_session_id uuid,
  p_subject text,
  p_subject_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  subject_scope text;
  scope_collections uuid[];
  scope_sets uuid[];
  scope_products uuid[];
  missing_count integer;
  currency_skipped integer;
  total_minor bigint;
begin
  if p_subject = 'product' then
    subject_scope := 'item';
  elsif p_subject = 'set' or p_subject = 'collection' then
    subject_scope := 'collection';
  else
    raise exception 'unknown sale subject';
  end if;
  perform public.demo_authorize(p_session_id, 'view', subject_scope);

  if p_subject = 'product' then
    if not exists (select 1 from public.products where id = p_subject_id) then
      raise exception 'unknown product';
    end if;
    scope_collections := '{}';
    scope_sets := '{}';
    scope_products := array[p_subject_id];
  elsif p_subject = 'set' then
    if not exists (select 1 from public.sets where id = p_subject_id) then
      raise exception 'unknown set';
    end if;
    scope_collections := '{}';
    scope_sets := array[p_subject_id];
    select coalesce(array_agg(p.id), '{}') into scope_products
      from public.products as p
     where p.set_id = p_subject_id;
  else
    if not exists (
      select 1 from public.nodes where id = p_subject_id and kind = 'collection'
    ) then
      raise exception 'unknown collection';
    end if;
    select coalesce(array_agg(s.collection_id), '{}') into scope_collections
      from public.demo_sale_subtree(p_subject_id) as s;
    select coalesce(array_agg(t.id), '{}') into scope_sets
      from public.sets as t
     where t.collection_id = any(scope_collections);
    select coalesce(array_agg(p.id), '{}') into scope_products
      from public.products as p
     where p.collection_id = any(scope_collections);
  end if;

  with ids as (select unnest(scope_products) as pid),
  recs as (
    select distinct on (e.product_id)
      e.product_id,
      e.market_recommended as rec,
      e.currency as cur
      from public.price_estimates as e
     where e.product_id = any(scope_products)
     order by e.product_id, e.created_at desc, e.id desc
  ),
  joined as (
    select i.pid, r.rec, r.cur
      from ids as i
      left join recs as r on r.product_id = i.pid
  )
  select count(*) filter (where j.rec is null or j.rec <= 0),
         count(*) filter (where j.rec > 0 and upper(j.cur) is distinct from 'USD')
    into missing_count, currency_skipped
    from joined as j;

  total_minor := public.demo_sale_total(scope_products);

  return jsonb_build_object(
    'collections', coalesce(array_length(scope_collections, 1), 0),
    'sets', coalesce(array_length(scope_sets, 1), 0),
    'products', coalesce(array_length(scope_products, 1), 0),
    'missing', missing_count,
    'non_usd', currency_skipped,
    'total', total_minor,
    'currency', 'USD'
  );
end;
$$;

grant execute on function public.demo_sale_preview(uuid, text, uuid)
  to anon, authenticated;

create or replace function public.demo_apply_sale(
  p_session_id uuid,
  p_subject text,
  p_subject_id uuid,
  p_tag_price bigint default null,
  p_is_active boolean default true,
  p_expected_tag bigint default null,
  p_expected_active boolean default null,
  p_check_expected boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  subject_scope text;
  scope_sets uuid[];
  scope_products uuid[];
  pid uuid;
  sid uuid;
  latest_tag bigint;
  latest_active boolean;
  keep_tag bigint;
  rec bigint;
  cur text;
  tag bigint;
  subject_tag bigint;
  applied integer := 0;
  skipped integer := 0;
  subtotal bigint;
  now_at timestamptz := now();
begin
  if p_subject = 'product' then
    subject_scope := 'item';
  elsif p_subject = 'set' or p_subject = 'collection' then
    subject_scope := 'collection';
  else
    raise exception 'unknown sale subject';
  end if;
  perform public.demo_authorize(p_session_id, 'sell_toggle', subject_scope);

  if p_tag_price is not null and p_tag_price <= 0 then
    raise exception 'tag price must be positive';
  end if;
  if p_subject <> 'product' and p_tag_price is not null then
    raise exception 'manual price is product-only';
  end if;

  if p_subject = 'product' then
    if not exists (select 1 from public.products where id = p_subject_id) then
      raise exception 'unknown product';
    end if;
    select t.tag_price, t.is_active into latest_tag, latest_active
      from public.sale_transactions as t
     where t.product_id = p_subject_id
     order by t.transaction_at desc, t.id desc
     limit 1;
    if p_check_expected
      and (latest_tag is distinct from p_expected_tag
        or latest_active is distinct from p_expected_active)
    then
      raise exception 'sale changed, reload';
    end if;
    tag := p_tag_price;
    if tag is null and p_is_active then
      select r.rec, r.cur into rec, cur
        from public.demo_sale_recommended(p_subject_id) as r;
      if rec is not null and rec > 0 and upper(cur) = 'USD' then
        tag := rec;
      end if;
    end if;
    if tag is null and p_is_active then
      raise exception 'tag price missing';
    end if;
    if tag is null then
      tag := latest_tag;
    end if;
    insert into public.sale_transactions
      (product_id, tag_price, is_active, transaction_scope, transaction_at)
    values (p_subject_id, tag, p_is_active, 'item', now_at);
    applied := 1;
    subject_tag := tag;
  else
    if p_subject = 'set' then
      if not exists (select 1 from public.sets where id = p_subject_id) then
        raise exception 'unknown set';
      end if;
      scope_sets := array[p_subject_id];
      select coalesce(array_agg(p.id), '{}') into scope_products
        from public.products as p
       where p.set_id = p_subject_id;
      select t.tag_price, t.is_active into latest_tag, latest_active
        from public.sale_transactions as t
       where t.set_id = p_subject_id
       order by t.transaction_at desc, t.id desc
       limit 1;
    else
      if not exists (
        select 1 from public.nodes where id = p_subject_id and kind = 'collection'
      ) then
        raise exception 'unknown collection';
      end if;
      select coalesce(array_agg(t.id), '{}') into scope_sets
        from public.sets as t
       where t.collection_id in (
         select s.collection_id from public.demo_sale_subtree(p_subject_id) as s
       );
      select coalesce(array_agg(p.id), '{}') into scope_products
        from public.products as p
       where p.collection_id in (
         select s.collection_id from public.demo_sale_subtree(p_subject_id) as s
       );
      select t.tag_price, t.is_active into latest_tag, latest_active
        from public.sale_transactions as t
       where t.collection_id = p_subject_id
       order by t.transaction_at desc, t.id desc
       limit 1;
    end if;
    if p_check_expected
      and (latest_tag is distinct from p_expected_tag
        or latest_active is distinct from p_expected_active)
    then
      raise exception 'sale changed, reload';
    end if;

    foreach pid in array scope_products loop
      if p_is_active then
        select r.rec, r.cur into rec, cur
          from public.demo_sale_recommended(pid) as r;
        if rec is null or rec <= 0 or upper(cur) is distinct from 'USD' then
          skipped := skipped + 1;
        else
          insert into public.sale_transactions
            (product_id, tag_price, is_active, transaction_scope, transaction_at)
          values (pid, rec, true, 'item', now_at);
          applied := applied + 1;
        end if;
      else
        select t.tag_price into keep_tag
          from public.sale_transactions as t
         where t.product_id = pid
         order by t.transaction_at desc, t.id desc
         limit 1;
        insert into public.sale_transactions
          (product_id, tag_price, is_active, transaction_scope, transaction_at)
        values (pid, keep_tag, false, 'item', now_at);
        applied := applied + 1;
      end if;
    end loop;
    if p_is_active and applied = 0 then
      raise exception 'no priced items';
    end if;

    foreach sid in array scope_sets loop
      if p_is_active then
        select public.demo_sale_total(
          (select coalesce(array_agg(p.id), '{}')
             from public.products as p
            where p.set_id = sid)
        ) into subtotal;
        if subtotal is not null and subtotal > 0 then
          insert into public.sale_transactions
            (set_id, tag_price, is_active, transaction_scope, transaction_at)
          values (sid, subtotal, true, 'set', now_at);
        end if;
      else
        select t.tag_price into keep_tag
          from public.sale_transactions as t
         where t.set_id = sid
         order by t.transaction_at desc, t.id desc
         limit 1;
        insert into public.sale_transactions
          (set_id, tag_price, is_active, transaction_scope, transaction_at)
        values (sid, keep_tag, false, 'set', now_at);
      end if;
    end loop;

    if p_subject = 'set' then
      if p_is_active then
        subject_tag := public.demo_sale_total(scope_products);
      else
        subject_tag := latest_tag;
      end if;
    else
      if p_is_active then
        subject_tag := public.demo_sale_total(scope_products);
      else
        subject_tag := latest_tag;
      end if;
      insert into public.sale_transactions
        (collection_id, tag_price, is_active, transaction_scope, transaction_at)
      values (p_subject_id, subject_tag, p_is_active, 'collection', now_at);
    end if;
  end if;

  return jsonb_build_object(
    'applied', applied,
    'skipped', skipped,
    'tag', subject_tag
  );
end;
$$;

grant execute on function public.demo_apply_sale(uuid, text, uuid, bigint, boolean, bigint, boolean, boolean)
  to anon, authenticated;
