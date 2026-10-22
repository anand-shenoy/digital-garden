// Local flat projection around central Chelmsford, metres. x east, z south.
export const ORIGIN = { lon: 0.4690, lat: 51.7356 };
const M_LAT = 111195.0;
const M_LON = M_LAT * Math.cos(ORIGIN.lat * Math.PI / 180);

export function project(lon, lat) {
  return [(lon - ORIGIN.lon) * M_LON, -(lat - ORIGIN.lat) * M_LAT];
}
export function unproject(x, z) {
  return [x / M_LON + ORIGIN.lon, -z / M_LAT + ORIGIN.lat];
}
