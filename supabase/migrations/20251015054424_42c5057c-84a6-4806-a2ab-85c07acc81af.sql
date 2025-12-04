-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Insert initial exchange rates (these will be updated by the cron job)
INSERT INTO currency_rates (base_currency, target_currency, rate, last_updated) VALUES
('GBP', 'USD', 1.27, now()),
('GBP', 'EUR', 1.17, now()),
('GBP', 'CAD', 1.78, now()),
('GBP', 'AUD', 1.95, now()),
('GBP', 'JPY', 190.50, now())
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate, last_updated = EXCLUDED.last_updated;

-- Set up cron job to refresh exchange rates daily at midnight
SELECT cron.schedule(
  'refresh-exchange-rates',
  '0 0 * * *', -- Daily at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://quibvppxriibzfvhrhwv.supabase.co/functions/v1/fetch-exchange-rates',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aWJ2cHB4cmlpYnpmdmhyaHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTE3NjMsImV4cCI6MjA3NDEyNzc2M30.-7fTNHTnidfohrUhSJ3_5vXdDOXO_G5X-jq_M46QHlQ"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);