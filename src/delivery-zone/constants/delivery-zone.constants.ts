// Polygon boundary (GeoJSON format — [lng, lat])
export const DELIVERY_POLYGON: [number, number][] = [
  [79.7904007, 11.9793644],  // 1. Toll Gate (North)
  [79.8009721, 11.9742956],  // 2. Sangamithra Convention Centre
  [79.8261897, 11.9675188],  // 5. Kottakuppam
  [79.8172165, 11.9556727],  // 6. Rock Beach
  [79.8077327, 11.9121809],  // 7. Thengaithittu
  [79.7701328, 11.9321315],  // 8. Moolakulam
  [79.7597358, 11.9490015],  // 9. Mettupalayam
  [79.7952277, 11.9614174],  // 3. Navarkulam
  [79.8059994, 11.9627188],  // 4. Tagore Arts & Science
  [79.7938461, 11.9809453],  // 10. Toll Gate (South)
  [79.7904007, 11.9793644],  // CLOSE polygon — must match first point
];

// Fallback radius check points (5km radius from each)
export const DELIVERY_POINTS = [
  { name: "Toll Gate North",               lat: 11.9793644, lng: 79.7904007 },
  { name: "Sangamithra Convention Centre", lat: 11.9742956, lng: 79.8009721 },
  { name: "Navarkulam",                    lat: 11.9614174, lng: 79.7952277 },
  { name: "Tagore Arts and Science",       lat: 11.9627188, lng: 79.8059994 },
  { name: "Kottakuppam",                   lat: 11.9675188, lng: 79.8261897 },
  { name: "Rock Beach",                    lat: 11.9556727, lng: 79.8172165 },
  { name: "Thengaithittu",                lat: 11.9121809, lng: 79.8077327 },
  { name: "Moolakulam",                    lat: 11.9321315, lng: 79.7701328 },
  { name: "Mettupalayam",                  lat: 11.9490015, lng: 79.7597358 },
  { name: "Toll Gate South",               lat: 11.9809453, lng: 79.7938461 },
];
