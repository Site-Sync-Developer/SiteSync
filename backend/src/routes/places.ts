import { Router } from 'express';

const router = Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';
const GOOGLE_MAPS_REGION = process.env.GOOGLE_MAPS_REGION ?? 'gb';

/** GET /api/places/autocomplete?input=QUERY */
router.get('/autocomplete', async (req, res) => {
  const input = (req.query.input as string | undefined)?.trim() ?? '';
  if (!GOOGLE_MAPS_API_KEY) return res.status(500).json({ error: 'Maps API key not configured' });
  if (input.length < 2) return res.json({ status: 'ZERO_RESULTS', predictions: [] });

  const params = new URLSearchParams({
    input,
    components: `country:${GOOGLE_MAPS_REGION}`,
    key: GOOGLE_MAPS_API_KEY,
  });
  const upstream = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );
  const data = await upstream.json();
  res.json(data);
});

/** GET /api/places/details?place_id=ID */
router.get('/details', async (req, res) => {
  const placeId = (req.query.place_id as string | undefined)?.trim() ?? '';
  if (!GOOGLE_MAPS_API_KEY) return res.status(500).json({ error: 'Maps API key not configured' });
  if (!placeId) return res.status(400).json({ error: 'place_id required' });

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'formatted_address,geometry',
    key: GOOGLE_MAPS_API_KEY,
  });
  const upstream = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );
  const data = await upstream.json();
  res.json(data);
});

export default router;
