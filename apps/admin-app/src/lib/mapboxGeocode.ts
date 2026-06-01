/**
 * Address autocomplete via backend proxy (avoids CORS on web).
 * Backend proxies to Google Places Autocomplete + Places Details APIs.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type MapboxSuggestion = {
  id: string;
  /** Short description shown in the dropdown (e.g. "Kimberley Way, Rugeley, UK") */
  placeName: string;
};

export type PlaceDetails = {
  /** Full formatted address (e.g. "Kimberley Way, …, WS15 1RE, United Kingdom") */
  placeName: string;
  /** [longitude, latitude] */
  center: [number, number];
};

export type ReverseGeocodeResult = {
  placeName: string;
  center: [number, number];
};

export function isMapboxConfigured(): boolean {
  return API_BASE.length > 0;
}

/**
 * Returns address suggestions via the backend Places Autocomplete proxy.
 */
export async function fetchAddressSuggestions(query: string): Promise<MapboxSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({ input: q });
  const res = await fetch(`${API_BASE}/places/autocomplete?${params}`, {
  });
  if (!res.ok) throw new Error(`Places autocomplete failed (${res.status})`);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('[mapboxGeocode] autocomplete error:', data.status, data.error_message);
    return [];
  }
  return (data.predictions ?? []).slice(0, 8).map((p: { place_id: string; description: string }) => ({
    id: p.place_id,
    placeName: p.description,
  }));
}

/**
 * Fetches the full formatted address and coordinates for a place_id via the backend proxy.
 */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const params = new URLSearchParams({ place_id: placeId });
  const res = await fetch(`${API_BASE}/places/details?${params}`, {
  });
  if (!res.ok) throw new Error(`Place details failed (${res.status})`);
  const data = await res.json();
  if (data.status !== 'OK' || !data.result) return null;
  const { lat, lng } = data.result.geometry.location;
  return {
    placeName: data.result.formatted_address,
    center: [lng, lat],
  };
}

/**
 * Reverse geocode coordinates to nearest address via the Google Geocoding API.
 * (Geocoding API supports CORS so this can be called directly from the browser.)
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: apiKey,
  });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  if (!res.ok) throw new Error(`Google reverse geocoding failed (${res.status})`);
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) return null;
  return {
    placeName: first.formatted_address,
    center: [first.geometry.location.lng, first.geometry.location.lat],
  };
}
