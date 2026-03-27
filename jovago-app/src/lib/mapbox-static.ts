/**
 * Mapbox Static Images API URL for group cards.
 * Uses outdoors-v12 for a realistic terrain look (matches 3D interactive maps).
 * https://docs.mapbox.com/api/maps/static-images/
 */
const STYLE = "mapbox/outdoors-v12";
const WIDTH = 320;
const HEIGHT = 128;
const ZOOM = 8;

export function getStaticMapImageUrl(
  lng: number,
  lat: number,
  token: string | undefined
): string | null {
  if (!token?.trim()) return null;
  return `https://api.mapbox.com/styles/v1/${STYLE}/static/${lng},${lat},${ZOOM}/${WIDTH}x${HEIGHT}@2x?access_token=${token}`;
}
