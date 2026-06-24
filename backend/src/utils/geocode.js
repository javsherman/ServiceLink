// src/utils/geocode.js
// Converts an address string (e.g. "Spanish Town, Jamaica") into coordinates
// using the Google Geocoding API. Returns { lat, lng } or null if not found.

async function geocode(address) {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in environment variables');
  }

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}&key=${key}`;

  const response = await fetch(url);
  const data = await response.json();

  // Google returns a status string; only OK means we got a usable result
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formatted_address: data.results[0].formatted_address };
}

module.exports = { geocode };