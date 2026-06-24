// fairness.js
// Measures provider visibility fairness using Jain's Fairness Index.
//
// Runs N simulated searches from random locations across Jamaica, counts how
// often each provider appears in the top-K results, and computes Jain's index
// two ways: WITH the new-provider boost and WITHOUT it. The comparison shows
// whether the boost improves fairness of visibility across providers.
//
// Jain's index:  J = (Σxᵢ)² / (n · Σxᵢ²),  where xᵢ = times provider i shown.
//   J = 1.0  -> perfectly fair (every provider shown equally)
//   J -> 1/n -> maximally unfair (one provider dominates)
//
// Usage:  node fairness.js
// Requires Node 18+ (built-in fetch) and a logged-in token (set below).

const BASE_URL = 'http://localhost:3000';

// ---- CONFIG ----
const SEARCHES = 200;   // number of simulated searches
const TOP_K = 5;        // how many top results count as "shown" (matches charter: top 5)
const CATEGORY = 'Plumbing';

// A customer token is needed because search requires auth.
// Get one by logging in (POST /api/auth/login) and paste it here,
// or the script will auto-login with the test customer below.
const TEST_CUSTOMER = { email: 'test@test.com', password: 'password' };
// --------------------------------

// Bounding box roughly covering populated Jamaica, to randomize search origins
const JM_BOUNDS = { latMin: 17.85, latMax: 18.50, lngMin: -78.30, lngMax: -76.20 };

function randomLocation() {
  const lat = JM_BOUNDS.latMin + Math.random() * (JM_BOUNDS.latMax - JM_BOUNDS.latMin);
  const lng = JM_BOUNDS.lngMin + Math.random() * (JM_BOUNDS.lngMax - JM_BOUNDS.lngMin);
  return { lat, lng };
}

// Jain's fairness index over an object of counts { providerId: timesShown }
function jainsIndex(counts) {
  const x = Object.values(counts);
  const n = x.length;
  if (n === 0) return 0;
  const sum = x.reduce((a, b) => a + b, 0);
  const sumSq = x.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 0;
  return (sum * sum) / (n * sumSq);
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_CUSTOMER),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error('Could not log in test customer: ' + (data.message || 'unknown'));
  }
  return data.token;
}

async function runSearch(token, lat, lng, applyBoost) {
  const params = new URLSearchParams({
    category: CATEGORY,
    lat: String(lat),
    lng: String(lng),
  });
  if (!applyBoost) params.set('boost', 'false');

  const res = await fetch(`${BASE_URL}/api/listings?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.listings || [];
}

async function simulate(token, applyBoost) {
  const counts = {};   // provider_id -> times shown in top-K
  const names = {};     // provider_id -> name (for the report)

  for (let i = 0; i < SEARCHES; i++) {
    const { lat, lng } = randomLocation();
    const results = await runSearch(token, lat, lng, applyBoost);
    const topK = results.slice(0, TOP_K);
    for (const listing of topK) {
      const pid = listing.provider_id;
      counts[pid] = (counts[pid] || 0) + 1;
      names[pid] = listing.provider_name;
    }
  }

  return { counts, names };
}

function report(label, counts, names) {
  const j = jainsIndex(counts);
  console.log(`\n=== ${label} ===`);
  console.log(`Jain's Fairness Index: ${j.toFixed(4)}  (1.0 = perfectly fair)`);
  const rows = Object.keys(counts)
    .map((pid) => ({ pid, name: names[pid], shown: counts[pid] }))
    .sort((a, b) => b.shown - a.shown);
  for (const r of rows) {
    console.log(`  ${String(r.shown).padStart(4)}  ${r.name}`);
  }
  return j;
}

async function main() {
  console.log(`Fairness simulation: ${SEARCHES} searches, top-${TOP_K}, category "${CATEGORY}"`);
  const token = await login();

  const without = await simulate(token, false);
  const jWithout = report('WITHOUT new-provider boost', without.counts, without.names);

  const withBoost = await simulate(token, true);
  const jWith = report('WITH new-provider boost', withBoost.counts, withBoost.names);

  console.log('\n--------------------------------------------------');
  console.log(`Jain's index without boost: ${jWithout.toFixed(4)}`);
  console.log(`Jain's index with boost:    ${jWith.toFixed(4)}`);
  const delta = jWith - jWithout;
  const dir = delta >= 0 ? 'improved' : 'reduced';
  console.log(`The new-provider boost ${dir} visibility fairness by ${Math.abs(delta).toFixed(4)}.`);
  console.log('--------------------------------------------------');
}

main().catch((err) => console.error('Simulation failed:', err));
