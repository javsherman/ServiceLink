-- backdate.sql
-- Run in psql AFTER node seed.js
--   psql -d servicelink -f backdate.sql
-- (or paste the statements into your psql session)

-- 1. Approve all seeded plumbing listings so they show up in search.
UPDATE listings
SET approval_status = 'approved'
WHERE location LIKE '%Jamaica%'
  AND category = 'Plumbing'
  AND provider_id IN (SELECT id FROM users WHERE email LIKE '%@seed.test');

-- 2. Backdate roughly half the seeded providers to "established"
--    (created_at older than 30 days) so the new-provider boost has a
--    meaningful contrast. Even-numbered seed emails become established.
UPDATE users
SET created_at = NOW() - INTERVAL '120 days'
WHERE email IN (
  'plumber2@seed.test',
  'plumber4@seed.test',
  'plumber6@seed.test',
  'plumber8@seed.test',
  'plumber10@seed.test'
);

-- 3. Verify: list seeded providers with age + boost status
SELECT u.id, u.name, u.email,
       u.created_at::date AS joined,
       CASE WHEN (NOW() - u.created_at) < INTERVAL '30 days'
            THEN 'NEW' ELSE 'established' END AS status
FROM users u
WHERE u.email LIKE '%@seed.test'
ORDER BY u.id;
