import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

const SCOPES = 'user-read-currently-playing user-top-read';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const TEN_MINUTES = 10 * 60 * 1000;
const METADATA_CACHE_MS = 60 * 1000;
const PLAYBACK_CACHE_MS = 12 * 1000;
const OAUTH_COOKIE = 'derek_spotify_oauth';
const SETUP_COOKIE = 'derek_spotify_setup';
const EMPTY = { nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: [] };
const MISSING_FAVORITES = Symbol('missing favorites');
export const MAX_FAVORITE_TRACKS = 12;

class SpotifyError extends Error {
  constructor(status, message, { retryAfter = 0, disconnected = false } = {}) {
    super(message); this.status = status; this.retryAfter = retryAfter; this.disconnected = disconnected;
  }
}

function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(value => value.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined));
}

function localAddress(value) {
  return value === '::1' || /^127\.(?:\d{1,3}\.){2}\d{1,3}$/.test(value || '') || /^::ffff:127\.(?:\d{1,3}\.){2}\d{1,3}$/.test(value || '');
}

function ownerOrigin(req, allowCrossSiteCallback = false) {
  if (!localAddress(req.socket?.remoteAddress) || (!allowCrossSiteCallback && req.headers['sec-fetch-site'] === 'cross-site')) return null;
  const host = String(req.headers.host || '');
  try {
    const url = new URL(`http://${host}`);
    if (url.host.toLowerCase() !== host.toLowerCase() || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function spotifyUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'open.spotify.com' && !url.username && !url.password && !url.port ? url.href : ''; } catch { return ''; }
}

function imageUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}

function text(value) { return typeof value === 'string' ? value : ''; }

function normalizeTrack(item) {
  if (!item || (item.type && item.type !== 'track')) return null;
  return {
    title: text(item.name),
    artists: Array.isArray(item.artists) ? item.artists.map(artist => text(artist?.name)).filter(Boolean).join(', ') : '',
    url: spotifyUrl(item.external_urls?.spotify),
    artwork: imageUrl(item.album?.images?.[0]?.url),
  };
}

function normalizeAlbum(album) {
  const id = text(album?.id);
  if (!/^[a-zA-Z0-9]{22}$/.test(id) || (album.type && album.type !== 'album')) return null;
  return {
    id,
    title: text(album.name),
    artists: Array.isArray(album.artists) ? album.artists.map(artist => text(artist?.name)).filter(Boolean).join(', ') : '',
    url: spotifyUrl(`https://open.spotify.com/album/${id}`),
    artwork: imageUrl(album.images?.[0]?.url),
  };
}

// A proxy based on medium-term top tracks, not actual album listening counts.
function inferTopAlbums(items) {
  const albums = new Map();
  (Array.isArray(items) ? items.slice(0, 50) : []).forEach((track, rank) => {
    if (!track || (track.type && track.type !== 'track')) return;
    const album = normalizeAlbum(track.album);
    if (!album) return;
    const existing = albums.get(album.id);
    if (existing) existing.count++;
    else albums.set(album.id, { album, count: 1, rank });
  });
  return [...albums.values()].sort((a, b) => b.count - a.count || a.rank - b.rank).slice(0, 3).map(item => item.album);
}

export function parseFavoriteTracks(input) {
  const lines = String(input || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length > 30) throw new SpotifyError(400, `Choose up to ${MAX_FAVORITE_TRACKS} Spotify track links.`);
  const tracks = [];
  for (const line of lines) {
    let parsed;
    try { parsed = new URL(line); } catch { throw new SpotifyError(400, 'Use complete Spotify track links.'); }
    const match = parsed.pathname.match(/^\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]{22})\/?$/);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'open.spotify.com' || parsed.username || parsed.password || parsed.port || !match) throw new SpotifyError(400, 'Use Spotify track links, one per line.');
    const canonical = `https://open.spotify.com/track/${match[1]}`;
    if (!tracks.includes(canonical)) tracks.push(canonical);
  }
  if (tracks.length > MAX_FAVORITE_TRACKS) throw new SpotifyError(400, `Choose up to ${MAX_FAVORITE_TRACKS} Spotify track links.`);
  return tracks;
}

function normalizeDefaultFavorites(items) {
  const tracks = [];
  for (const item of Array.isArray(items) ? items : []) {
    let urls;
    try { urls = parseFavoriteTracks(text(item?.url)); } catch { continue; }
    if (urls.length !== 1 || tracks.some(track => track.url === urls[0])) continue;
    tracks.push({ url: urls[0], title: text(item.title), artists: text(item.artists), artwork: imageUrl(item.artwork) });
    if (tracks.length === MAX_FAVORITE_TRACKS) break;
  }
  return tracks;
}

async function readJson(path, missing = null) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return missing; if (error instanceof SyntaxError) return null; throw error; }
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
    await rename(temporary, path);
  } catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}

async function requestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 16384) throw new SpotifyError(413, 'The request is too large.');
    chunks.push(bytes);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  const contentType = String(req.headers['content-type'] || '').split(';')[0];
  if (contentType === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(body));
  if (contentType === 'application/json') {
    try { const value = JSON.parse(body); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new SpotifyError(400, 'Invalid request.'); }
  }
  throw new SpotifyError(415, 'Use a form submission or JSON request.');
}

function json(res, status, payload, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(JSON.stringify(payload));
}

function html(res, status, title, content, extra = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer', ...extra,
  });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;padding:40px 20px;background:#0c232a;color:#e5eee5;font:16px/1.6 system-ui,sans-serif}main{max-width:660px;margin:0 auto;padding:28px;border:1px solid #2e4e53;border-radius:18px;background:#122e35}h1{margin:0 0 10px;font-size:28px}h2{font-size:19px;margin-top:30px}p{color:#b3c9c0}a,button{color:#0c232a;background:#a7e8cf;border:0;border-radius:8px;padding:10px 15px;text-decoration:none;font:inherit;display:inline-block;cursor:pointer}label{display:block;margin:15px 0 8px}textarea{box-sizing:border-box;width:100%;min-height:170px;padding:12px;background:#0c232a;color:#e5eee5;border:1px solid #52776f;border-radius:8px;font:13px/1.7 monospace}small{color:#a6bbb2}code{overflow-wrap:anywhere}button:focus-visible,a:focus-visible,textarea:focus-visible{outline:3px solid #eeacc8;outline-offset:4px}</style></head><body><main><h1>${escapeHtml(title)}</h1>${content}</main></body></html>`);
}

export function createSpotifyService({
  clientId = '', redirectUri = 'http://127.0.0.1:3001/api/spotify/callback', tokenFile, favoritesFile,
  profileUrl = '', defaultFavorites = [], fetchImpl = globalThis.fetch,
}) {
  if (!tokenFile || !favoritesFile) throw new Error('Spotify token and favorites file paths are required.');
  const defaultTracks = normalizeDefaultFavorites(defaultFavorites);
  const defaultTrackByUrl = new Map(defaultTracks.map(track => [track.url, track]));
  // Start local authorization on the callback's origin so its state cookie also
  // reaches the callback when setup was opened through Vite or localhost.
  let setupOrigin;
  try {
    const callback = new URL(redirectUri);
    if (callback.protocol === 'http:' && !callback.username && !callback.password && localAddress(callback.hostname.replace(/^\[|\]$/g, ''))) setupOrigin = callback.origin;
  } catch { /* Invalid configuration is reported by Spotify when connecting. */ }
  const states = new Map();
  const setupTokens = new Map();
  let tokens;
  let tokenRead;
  let refreshPromise;
  let metadataPromise;
  let metadataCache;
  let metadataUntil = 0;
  let metadataGeneration = 0;
  let playbackPromise;
  let playbackCache;
  let playbackUntil = 0;
  let playbackGeneration = 0;
  let blockedUntil = 0;
  const invalidateMetadata = () => { metadataCache = undefined; metadataUntil = 0; metadataPromise = undefined; metadataGeneration++; };
  const invalidate = () => {
    invalidateMetadata();
    playbackCache = undefined; playbackUntil = 0; playbackPromise = undefined; playbackGeneration++;
  };

  function sweep() {
    const now = Date.now();
    for (const [key, value] of states) if (value.expires < now) states.delete(key);
    for (const [key, expiry] of setupTokens) if (expiry < now) setupTokens.delete(key);
  }

  async function getTokens() {
    if (tokens !== undefined) return tokens;
    if (!tokenRead) tokenRead = readJson(tokenFile).then(value => { tokens = value; return value; });
    return tokenRead;
  }

  async function storeTokens(value, resetCache = true) {
    await writeJson(tokenFile, value); tokens = value; tokenRead = undefined;
    if (resetCache) invalidate();
  }

  async function upstream(url, options = {}) {
    if (blockedUntil > Date.now()) throw new SpotifyError(429, 'Music is temporarily unavailable.', { retryAfter: Math.ceil((blockedUntil - Date.now()) / 1000) });
    let response;
    try { response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(8000) }); } catch { throw new SpotifyError(502, 'Music is temporarily unavailable.'); }
    if (response.status === 429) {
      const wait = Math.min(3600, Math.max(1, Number.parseInt(response.headers.get('retry-after'), 10) || 60));
      blockedUntil = Date.now() + wait * 1000;
      throw new SpotifyError(429, 'Music is temporarily unavailable.', { retryAfter: wait });
    }
    if (response.status === 204) return null;
    let payload;
    try { payload = await response.json(); } catch { throw new SpotifyError(502, 'Music is temporarily unavailable.'); }
    if (!response.ok) {
      if (response.status === 401 || payload?.error === 'invalid_grant') throw new SpotifyError(401, 'Spotify needs to be reconnected.', { disconnected: true });
      if (response.status === 404) throw new SpotifyError(404, 'This track is unavailable.');
      throw new SpotifyError(502, 'Music is temporarily unavailable.');
    }
    return payload;
  }

  async function accessToken(force = false) {
    const saved = await getTokens();
    if (!clientId || !saved?.refreshToken || (saved.clientId && saved.clientId !== clientId)) throw new SpotifyError(401, 'Spotify is not connected.', { disconnected: true });
    if (!force && saved.accessToken && saved.expiresAt > Date.now() + 30000) return saved.accessToken;
    if (!refreshPromise) refreshPromise = (async () => {
      const refreshed = await upstream(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: saved.refreshToken, client_id: clientId }) });
      if (!text(refreshed?.access_token)) throw new SpotifyError(502, 'Music is temporarily unavailable.');
      await storeTokens({ ...saved, clientId, accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token || saved.refreshToken, expiresAt: Date.now() + (Number(refreshed.expires_in) || 3600) * 1000 }, false);
      return refreshed.access_token;
    })().finally(() => { refreshPromise = undefined; });
    return refreshPromise;
  }

  async function spotify(path, retried = false) {
    const token = await accessToken();
    try {
      return await upstream(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      if (error.status === 401 && !retried) { await accessToken(true); return spotify(path, true); }
      throw error;
    }
  }

  async function favoriteUrls() {
    const value = await readJson(favoritesFile, MISSING_FAVORITES);
    if (value === MISSING_FAVORITES) return defaultTracks.map(track => track.url);
    try { return parseFavoriteTracks((Array.isArray(value?.tracks) ? value.tracks : []).join('\n')); } catch { return []; }
  }

  async function disconnectedSnapshot(urls) {
    const selected = urls ?? await favoriteUrls();
    return { configured: false, ...EMPTY, favoriteTracks: selected.map(url => defaultTrackByUrl.get(url)).filter(Boolean) };
  }

  async function metadata(favorites) {
    const key = favorites.join('\n');
    if (metadataCache?.key === key && metadataUntil > Date.now()) return metadataCache.data;
    if (metadataPromise?.key === key) return metadataPromise.promise;
    const generation = metadataGeneration;
    const previousAlbums = metadataCache?.data.topAlbums || [];
    const pending = { key, promise: null };
    pending.promise = (async () => {
      const [artists, topTracks, tracks] = await Promise.all([
        spotify('/me/top/artists?limit=6&time_range=medium_term'),
        spotify('/me/top/tracks?limit=50&time_range=medium_term').catch(error => {
          // Album discovery is optional; authentication and global backoff are not.
          if (error.status !== 404 && error.status !== 502) throw error;
          return undefined;
        }),
        Promise.all(favorites.map(async url => {
          const id = new URL(url).pathname.split('/').pop();
          try { return normalizeTrack(await spotify(`/tracks/${id}`)); } catch (error) { if (error.status === 404) return null; throw error; }
        })),
      ]);
      const data = {
        topArtists: (Array.isArray(artists?.items) ? artists.items : []).slice(0, 6).map(artist => ({ name: text(artist?.name), url: spotifyUrl(artist?.external_urls?.spotify), image: imageUrl(artist?.images?.[0]?.url) })),
        topAlbums: topTracks === undefined ? previousAlbums : inferTopAlbums(topTracks?.items),
        favoriteTracks: tracks.filter(Boolean),
      };
      if (generation === metadataGeneration) { metadataCache = { key, data }; metadataUntil = Date.now() + METADATA_CACHE_MS; }
      return data;
    })().finally(() => { if (metadataPromise === pending) metadataPromise = undefined; });
    metadataPromise = pending;
    return pending.promise;
  }

  async function playback() {
    if (playbackUntil > Date.now()) return playbackCache;
    if (playbackPromise) return playbackPromise;
    const generation = playbackGeneration;
    const pending = (async () => {
      const playing = await spotify('/me/player/currently-playing');
      const track = normalizeTrack(playing?.item);
      const data = track ? { ...track, isPlaying: playing.is_playing === true } : null;
      if (generation === playbackGeneration) { playbackCache = data; playbackUntil = Date.now() + PLAYBACK_CACHE_MS; }
      return data;
    })().finally(() => { if (playbackPromise === pending) playbackPromise = undefined; });
    playbackPromise = pending;
    return pending;
  }

  async function snapshot() {
    const favorites = await favoriteUrls();
    const saved = await getTokens();
    if (!clientId || !saved?.refreshToken || (saved.clientId && saved.clientId !== clientId)) return disconnectedSnapshot(favorites);
    const [details, nowPlaying] = await Promise.all([metadata(favorites), playback()]);
    return { configured: true, nowPlaying, ...details };
  }

  async function setup(req, res, url) {
    const csrf = randomBytes(32).toString('base64url');
    setupTokens.set(csrf, Date.now() + TEN_MINUTES);
    const urls = await favoriteUrls();
    const saved = await getTokens();
    const connected = Boolean(clientId && saved?.refreshToken && (!saved.clientId || saved.clientId === clientId));
    const connection = clientId ? `<p>${connected ? 'Spotify is connected.' : 'Connect your Spotify account to display your listening.'}</p><a href="/api/spotify/connect">${connected ? 'Reconnect Spotify' : 'Connect Spotify'}</a>` : '<p>Add <code>SPOTIFY_CLIENT_ID</code> to <code>.env.local</code>, then restart the server. Use a Spotify Developer app owned by your Premium account.</p>';
    const savedNotice = url.searchParams.get('saved') === '1' ? '<p role="status">Your favorite tracks were saved.</p>' : '';
    html(res, 200, 'Your music setup', `<p>Only available on this computer.</p>${connection}${savedNotice}<h2>Favorite tracks</h2><form method="post" action="/api/spotify/favorites"><input type="hidden" name="csrf" value="${csrf}"><label for="tracks">Up to ${MAX_FAVORITE_TRACKS} Spotify track links, one per line.</label><textarea id="tracks" name="tracks" spellcheck="false" placeholder="https://open.spotify.com/track/...">${escapeHtml(urls.join('\n'))}</textarea><button type="submit">Save favorites</button></form><p><small>Favorites are selected by you. Spotify listening data is read-only; visitors never sign in.</small></p>`, {
      'Set-Cookie': `${SETUP_COOKIE}=${csrf}; HttpOnly; SameSite=Strict; Path=/api/spotify; Max-Age=600`,
      // A no-referrer navigation POST serializes Origin as "null" in browsers.
      // same-origin preserves the local Origin check without leaking it to Spotify.
      'Referrer-Policy': 'same-origin',
    });
  }

  async function connect(req, res) {
    if (!clientId) { html(res, 503, 'Spotify needs setup', '<p>Add your Spotify client ID to the server configuration first.</p><a href="/api/spotify/setup">Back to setup</a>'); return; }
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    states.set(state, { verifier, expires: Date.now() + TEN_MINUTES });
    const location = new URL('https://accounts.spotify.com/authorize');
    location.search = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri, state, scope: SCOPES, code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') }).toString();
    res.writeHead(302, { Location: location.href, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': `${OAUTH_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/api/spotify; Max-Age=600` }); res.end();
  }

  async function callback(req, res, url) {
    const state = url.searchParams.get('state');
    const entry = states.get(state);
    if (!entry || entry.expires < Date.now() || !equal(state, cookies(req)[OAUTH_COOKIE])) throw new SpotifyError(400, 'The Spotify connection request expired. Start again from setup.');
    states.delete(state);
    res.setHeader('Set-Cookie', `${OAUTH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/spotify; Max-Age=0`);
    if (url.searchParams.has('error')) { html(res, 400, 'Spotify was not connected', '<p>The connection was canceled.</p><a href="/api/spotify/setup">Back to setup</a>'); return; }
    const code = url.searchParams.get('code');
    if (!code || code.length > 2048) throw new SpotifyError(400, 'Spotify did not provide a valid authorization code.');
    const authorized = await upstream(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, code_verifier: entry.verifier }) });
    if (!text(authorized?.access_token) || !text(authorized?.refresh_token)) throw new SpotifyError(502, 'Spotify could not be connected. Try again from setup.');
    await storeTokens({ clientId, accessToken: authorized.access_token, refreshToken: authorized.refresh_token, expiresAt: Date.now() + (Number(authorized.expires_in) || 3600) * 1000, authorizedAt: Date.now() });
    html(res, 200, 'Spotify connected', '<p>Your music is ready. Return to your website to see it.</p><a href="/api/spotify/setup">Manage favorites</a>');
  }

  async function saveFavorites(req, res, origin) {
    if (req.headers.origin !== origin) throw new SpotifyError(403, 'This action is only available from local setup.');
    const cookie = cookies(req)[SETUP_COOKIE];
    if (!cookie || !setupTokens.has(cookie) || setupTokens.get(cookie) < Date.now()) throw new SpotifyError(403, 'Open local setup before saving favorites.');
    const body = await requestBody(req);
    if (!equal(text(body.csrf), cookie)) throw new SpotifyError(403, 'The setup request could not be verified.');
    const tracks = parseFavoriteTracks(body.tracks);
    await writeJson(favoritesFile, { tracks });
    invalidateMetadata();
    res.writeHead(303, { Location: '/api/spotify/setup?saved=1', 'Cache-Control': 'no-store' }); res.end();
  }

  return {
    async handleRequest(req, res, url) {
      const routes = ['/api/spotify', '/api/spotify/setup', '/api/spotify/connect', '/api/spotify/callback', '/api/spotify/favorites'];
      if (!routes.includes(url.pathname)) return false;
      sweep();
      try {
        const method = url.pathname === '/api/spotify/favorites' ? 'POST' : 'GET';
        if (req.method !== method) { json(res, 405, { error: 'Method not allowed.' }, { Allow: method }); return true; }
        if (url.pathname === '/api/spotify') {
          const data = await snapshot();
          json(res, 200, { ...data, ...(spotifyUrl(profileUrl) ? { profileUrl: spotifyUrl(profileUrl) } : {}) });
          return true;
        }
        // Spotify's top-level OAuth redirect is cross-site by design. The callback
        // still requires a local socket/Host and its one-use cookie-bound state.
        const origin = ownerOrigin(req, url.pathname === '/api/spotify/callback');
        if (!origin) throw new SpotifyError(403, 'This action is only available on the owner\'s computer.');
        if (setupOrigin && setupOrigin !== origin && ['/api/spotify/setup', '/api/spotify/connect'].includes(url.pathname)) {
          res.writeHead(302, { Location: new URL(url.pathname + url.search, setupOrigin).href, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
          res.end();
          return true;
        }
        if (url.pathname.endsWith('/setup')) await setup(req, res, url);
        else if (url.pathname.endsWith('/connect')) await connect(req, res);
        else if (url.pathname.endsWith('/callback')) await callback(req, res, url);
        else await saveFavorites(req, res, origin);
      } catch (error) {
        const known = error instanceof SpotifyError;
        const status = known ? error.status : 500;
        if (known && error.disconnected) invalidate();
        const disconnected = known && error.disconnected ? await disconnectedSnapshot().catch(() => ({ configured: false, ...EMPTY })) : {};
        const payload = { error: known ? error.message : 'Music is temporarily unavailable.', ...disconnected };
        const extra = known && error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {};
        if (url.pathname !== '/api/spotify' && String(req.headers.accept || '').includes('text/html')) {
          const retry = setupOrigin ? new URL('/api/spotify/setup', setupOrigin).href : '/api/spotify/setup';
          html(res, status, 'Spotify setup needs attention', `<p>${escapeHtml(payload.error)}</p><p>Your saved favorites have not changed. Reopen setup and try again.</p><a href="${escapeHtml(retry)}">Return to Spotify setup</a>`, extra);
        } else json(res, status, payload, extra);
      }
      return true;
    },
  };
}
