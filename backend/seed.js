// seed.js
// Seeds the ServiceLink backend with plumbing providers across Jamaica for
// fairness testing. Registers each provider via the real /api/auth/register
// endpoint (so passwords hash correctly), then creates a listing for each.
//
// After running this, run the SQL in backdate.sql to age some providers so you
// have a mix of "new" (<30 days) and "established" (>30 days) providers.
//
// Usage:  node seed.js
// Requires Node 18+ (uses built-in fetch).

const BASE_URL = 'http://localhost:3000';

// Plumbing providers spread across Jamaica with realistic coordinates.
// All compete in the same category so fairness/visibility is meaningful.
const PROVIDERS = [
  { name: 'Kingston Plumbing Co',     parish: 'Kingston',       lat: 17.9714, lng: -76.7936 },
  { name: 'Half Way Tree Pipes',      parish: 'Half Way Tree',  lat: 18.0114, lng: -76.7975 },
  { name: 'Portmore Plumbers',        parish: 'Portmore',       lat: 17.9500, lng: -76.8800 },
  { name: 'Spanish Town Drains',      parish: 'Spanish Town',   lat: 18.0167, lng: -76.9748 },
  { name: 'Mandeville Waterworks',    parish: 'Mandeville',     lat: 18.0420, lng: -77.5070 },
  { name: 'Mo Bay Pipe Pros',         parish: 'Montego Bay',    lat: 18.4762, lng: -77.8939 },
  { name: 'Ocho Rios Plumbing',       parish: 'Ocho Rios',      lat: 18.4070, lng: -77.1030 },
  { name: 'May Pen Plumb Masters',    parish: 'May Pen',        lat: 17.9700, lng: -77.2450 },
  { name: 'Old Harbour Fixers',       parish: 'Old Harbour',    lat: 17.9410, lng: -77.1090 },
  { name: 'Linstead Leak Stoppers',   parish: 'Linstead',       lat: 18.1380, lng: -77.0320 },
];

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function seedProvider(p, index) {
  const email = `plumber${index + 1}@seed.test`;
  const password = 'password123';

  // 1. Register the provider
  const reg = await post('/api/auth/register', {
    name: p.name,
    email,
    password,
    role: 'provider',
  });

  if (reg.status !== 201) {
    // Likely already exists from a previous run — try logging in instead
    const login = await post('/api/auth/login', { email, password });
    if (login.status !== 200) {
      console.log(`  ✗ ${p.name}: could not register or login (${reg.data.message})`);
      return;
    }
    reg.data = login.data;
  }

  const token = reg.data.token;

  // 2. Create a listing for this provider
  const listing = await post('/api/listings', {
    title: `${p.name} - Plumbing Services`,
    description: `Professional plumbing repairs and installations in ${p.parish}.`,
    category: 'Plumbing',
    price: 4000 + index * 250, // small price spread
    location: `${p.parish}, Jamaica`,
    latitude: p.lat,
    longitude: p.lng,
  }, token);

  if (listing.status === 201) {
    console.log(`  ✓ ${p.name} (${p.parish}) — provider + listing created`);
  } else {
    console.log(`  ⚠ ${p.name}: registered but listing failed (${listing.data.message})`);
  }
}

async function main() {
  console.log('Seeding plumbing providers across Jamaica...\n');
  for (let i = 0; i < PROVIDERS.length; i++) {
    await seedProvider(PROVIDERS[i], i);
  }
  console.log('\nDone seeding.');
  console.log('\nNEXT STEPS:');
  console.log('1. Approve the new listings (admin), or run the SQL to auto-approve.');
  console.log('2. Run backdate.sql in psql to age ~half the providers to "established".');
  console.log('3. Run: node fairness.js  to compute Jain\'s index.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
});
