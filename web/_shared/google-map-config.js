/* Public configuration contract. Do not put server credentials in this file.
   Supply a website-restricted Maps browser key to enable the interactive map.
   routeEndpoint must point to the authenticated IMQ backend, not Google Directions.
   routeApiBaseUrl is the original VITE_LINQ_API_URL (including /api).
   The authenticated host may supply routeHeaders(query) at runtime, including
   Authorization and the original fleet context headers. Never persist tokens here.
   A host may inject loadRoute(query, {signal}) instead of routeEndpoint. */
window.MIQMapConfig = Object.assign({
  apiKey: 'AIzaSyCuuwTgq2dW3sF7xWO0KS8PMsdo_fvKwPo',
  routeEndpoint: '',
  routeApiBaseUrl: '',
  routeHeaders: null,
  timeZone: 'Asia/Seoul'
}, window.MIQMapConfig || {});
