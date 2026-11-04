const RADIANS = Math.PI / 180;

function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be a finite number.`);
}

function validLatitude(latitude) {
  finite(latitude, 'Latitude');
  if (latitude < -90 || latitude > 90) throw new RangeError('Latitude must be between -90 and 90 degrees.');
}

export function normalizeLongitude(longitude) {
  finite(longitude, 'Longitude');
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

// Degrees. Greenwich is +Z, 90 degrees east is +X, and north is +Y.
export function latLonToVector(latitude, longitude, radius = 1) {
  validLatitude(latitude);
  finite(longitude, 'Longitude');
  finite(radius, 'Radius');
  if (radius < 0) throw new RangeError('Radius must not be negative.');
  const lat = latitude * RADIANS;
  const lon = normalizeLongitude(longitude) * RADIANS;
  return [radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon)];
}

// GeoJSON order is [longitude, latitude]. The north pole is at canvas y=0.
// Preserve literal +180 at the right edge so pre-cut coastlines do not wrap.
export function lonLatToCanvas(coordinate, width = 1, height = 1) {
  if (!Array.isArray(coordinate) || coordinate.length < 2) throw new TypeError('A longitude/latitude pair is required.');
  const [longitude, latitude] = coordinate;
  finite(longitude, 'Longitude');
  validLatitude(latitude);
  finite(width, 'Width');
  finite(height, 'Height');
  if (width <= 0 || height <= 0) throw new RangeError('Canvas dimensions must be positive.');
  const lon = longitude >= -180 && longitude <= 180 ? longitude : normalizeLongitude(longitude);
  return [(lon + 180) / 360 * width, (90 - latitude) / 180 * height];
}

// Perspective-facing test for a point on a sphere centred at the origin.
// Rotate the point into world coordinates first; use the camera's world position.
export function isGlobePointVisible(point, cameraPosition = [0, 0, 3]) {
  for (const vector of [point, cameraPosition]) {
    if (!Array.isArray(vector) || vector.length < 3 || !vector.slice(0, 3).every(Number.isFinite)) throw new TypeError('Three finite vector coordinates are required.');
  }
  return point.reduce((dot, value, index) => index < 3 ? dot + value * (cameraPosition[index] - value) : dot, 0) > 1e-9;
}
