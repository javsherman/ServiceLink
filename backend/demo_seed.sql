-- demo_seed.sql
-- Populates bookings, reviews, and one pending listing so every Admin
-- analytics tab shows real data for the demo.
--   Run in psql:  \i C:/Users/javsh/Documents/React/backend/demo_seed.sql
--
-- Customers:  1 = Javaughn, 4 = Test Customer Two, 5 = test
-- Providers:  seeded plumbers are users 7..16 (plumber1..plumber10@seed.test)

-- ----------------------------------------------------------------------
-- 1. BOOKINGS across every status (drives Overview booking cards + tab)
-- ----------------------------------------------------------------------
INSERT INTO bookings (customer_id, provider_id, service_description, booking_date, booking_time, status, notes)
VALUES
  -- completed (these will get reviews below)
  (1, 7,  'Kitchen sink leak repair',        CURRENT_DATE - 10, '09:00', 'completed', 'Fixed under-sink pipe'),
  (4, 8,  'Bathroom faucet replacement',     CURRENT_DATE - 8,  '11:00', 'completed', 'Replaced both taps'),
  (5, 9,  'Burst pipe emergency',            CURRENT_DATE - 7,  '14:00', 'completed', 'Sealed and replaced section'),
  (1, 11, 'Water heater installation',       CURRENT_DATE - 6,  '10:30', 'completed', 'Installed new unit'),
  (4, 13, 'Drain unclog - kitchen',          CURRENT_DATE - 5,  '13:00', 'completed', 'Cleared blockage'),
  -- confirmed (upcoming)
  (5, 7,  'Toilet cistern repair',           CURRENT_DATE + 2,  '09:30', 'confirmed', NULL),
  (1, 9,  'Outdoor tap installation',        CURRENT_DATE + 3,  '15:00', 'confirmed', NULL),
  -- pending (awaiting provider confirmation)
  (4, 11, 'Shower pressure inspection',      CURRENT_DATE + 4,  '12:00', 'pending',   NULL),
  (5, 13, 'Leaking radiator check',          CURRENT_DATE + 5,  '16:00', 'pending',   NULL),
  -- cancelled
  (1, 8,  'Pipe relocation quote',           CURRENT_DATE - 3,  '10:00', 'cancelled', 'Customer cancelled'),
  -- rejected
  (4, 9,  'Full bathroom replumb',           CURRENT_DATE - 2,  '08:00', 'rejected',  'Provider unavailable');

-- ----------------------------------------------------------------------
-- 2. REVIEWS on the completed bookings only
--    (rating requires a completed booking per the invariant)
-- ----------------------------------------------------------------------
INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
SELECT b.id, b.customer_id, b.provider_id,
       r.rating, r.comment
FROM (
  VALUES
    ('Kitchen sink leak repair',    5, 'Fast and tidy, fixed it in an hour.'),
    ('Bathroom faucet replacement', 4, 'Good work, arrived a little late.'),
    ('Burst pipe emergency',        5, 'Came out same day, lifesaver.'),
    ('Water heater installation',   4, 'Professional and clean install.'),
    ('Drain unclog - kitchen',      3, 'Job done but a bit pricey.')
) AS r(descr, rating, comment)
JOIN bookings b ON b.service_description = r.descr AND b.status = 'completed';

-- ----------------------------------------------------------------------
-- 3. Leave one listing PENDING so the Moderation tab has something to act on
-- ----------------------------------------------------------------------
UPDATE listings
SET approval_status = 'pending'
WHERE id = (
  SELECT id FROM listings
  WHERE provider_id IN (SELECT id FROM users WHERE email LIKE '%@seed.test')
  ORDER BY id DESC
  LIMIT 1
);

-- ----------------------------------------------------------------------
-- 4. Verify what was created
-- ----------------------------------------------------------------------
SELECT status, COUNT(*) AS bookings FROM bookings GROUP BY status ORDER BY status;
SELECT COUNT(*) AS total_reviews, ROUND(AVG(rating),1) AS avg_rating FROM reviews;
SELECT COUNT(*) AS pending_listings FROM listings WHERE approval_status = 'pending';
