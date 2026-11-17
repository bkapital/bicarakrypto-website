create table if not exists public.screener_ta_cache (
  symbol text not null,
  timeframe text not null check (timeframe in ('5m','15m','1h','4h','8h','12h','1d')),
  status text not null check (status in ('loading','ready','error')) default 'loading',
  candles jsonb not null default '[]'::jsonb,
  result jsonb,
  updated_at timestamptz,
  primary key (symbol, timeframe)
);

create table if not exists public.screener_ta_state (
  id boolean primary key default true check (id),
  symbols text[] not null default '{}',
  cursor integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.screener_ta_cache enable row level security;
alter table public.screener_ta_state enable row level security;
revoke all on public.screener_ta_cache, public.screener_ta_state from anon, authenticated;
grant all on public.screener_ta_cache, public.screener_ta_state to service_role;

create index if not exists screener_ta_cache_timeframe_status_idx
  on public.screener_ta_cache (timeframe, status);

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'screener-ta-refresh';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'screener-ta-refresh',
  '30 seconds',
  $$select net.http_post(
    url := 'https://mkggaqvvyascimolhmdp.supabase.co/functions/v1/market-data?action=refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_z-G0sGISHXnupVgrYOW9Yw_fABN8MN7',
      'x-refresh-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'ta_refresh_secret' order by created_at desc limit 1), '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );$$
);
