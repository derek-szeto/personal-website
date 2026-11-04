import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { createSpotifyService, MAX_FAVORITE_TRACKS, parseFavoriteTracks } from './spotify.mjs';

const CLIENT = 'test-client-id';
const TRACK = 'A'.repeat(22);
const TRACK_TWO = 'B'.repeat(22);
const ORIGIN = 'http://127.0.0.1:3001';
const secret = { accessToken: 'private-access-token', refreshToken: 'private-refresh-token' };
const response = (payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const fakeTrack = id => ({ id, type: 'track', name: `Track ${id[0]}`, artists: [{ name: 'Artist' }], album: { images: [{ url: 'https://i.scdn.co/image/art' }] }, external_urls: { spotify: `https://open.spotify.com/track/${id}` }, privateRawField: secret.refreshToken });
const trackUrl = id => `https://open.spotify.com/track/${id}`;
const curatedTrack = id => ({ url: trackUrl(id), title: `Curated ${id[0]}`, artists: 'Selected artist', artwork: 'https://i.scdn.co/image/curated' });
const fakeAlbum = (id, title = `Album ${id[0]}`) => ({ id, type: 'album', name: title, artists: [{ name: 'Album artist' }], images: [{ url: 'https://i.scdn.co/image/album' }], external_urls: { spotify: `https://open.spotify.com/album/${id}` }, privateRawField: secret.refreshToken });
const expectedAlbum = album => ({ id: album.id, title: album.name, artists: album.artists.map(artist => artist.name).join(', '), url: `https://open.spotify.com/album/${album.id}`, artwork: album.images[0].url });
function deferred() { let resolvePromise; const promise = new Promise(resolve => { resolvePromise = resolve; }); return { promise, resolve: resolvePromise }; }

async function fixture(t, overrides = {}) {
  const folder = await mkdtemp(join(tmpdir(), 'spotify-test-'));
  t.after(async () => {
    const absolute = resolve(folder);
    assert.ok(absolute.startsWith(resolve(tmpdir()) + sep) && basename(absolute).startsWith('spotify-test-'));
    await rm(absolute, { recursive: true, force: true });
  });
  const config = { clientId: CLIENT, tokenFile: join(folder, 'tokens.json'), favoritesFile: join(folder, 'favorites.json'), fetchImpl: async () => { throw new Error('Unexpected upstream call'); }, ...overrides };
  return { ...config, service: createSpotifyService(config) };
}

async function request(service, path, { method = 'GET', remote = '127.0.0.1', headers = {}, body = '' } = {}) {
  const req = Readable.from(body ? [body] : []);
  req.method = method;
  req.headers = { host: '127.0.0.1:3001', ...headers };
  req.socket = { remoteAddress: remote };
  const res = {
    status: 200, headers: {}, body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    writeHead(status, values) { this.status = status; for (const [key, value] of Object.entries(values || {})) this.setHeader(key, value); },
    end(value = '') { this.body += value; },
  };
  const handled = await service.handleRequest(req, res, new URL(path, ORIGIN));
  return { ...res, handled };
}

async function setup(service) {
  const result = await request(service, '/api/spotify/setup');
  assert.equal(result.status, 200);
  const csrf = result.body.match(/name="csrf" value="([^"]+)"/)[1];
  const cookie = result.headers['set-cookie'].split(';')[0];
  return { csrf, cookie };
}

function form(csrf, tracks) { return new URLSearchParams({ csrf, tracks }).toString(); }

test('unconfigured public API returns only a disconnected snapshot', async t => {
  const { service } = await fixture(t, { clientId: '' });
  const result = await request(service, '/api/spotify', { remote: '198.51.100.2', headers: { host: 'example.com' } });
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body), { configured: false, nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: [] });
  assert.equal((await request(service, '/not-spotify')).handled, false);
  assert.equal((await request(service, '/api/spotify', { method: 'POST' })).status, 405);
});

test('disconnected API publishes nine selected default favorites in order without private fields', async t => {
  const defaults = 'ABCDEFGHI'.split('').map(letter => curatedTrack(letter.repeat(22)));
  const { service } = await fixture(t, { clientId: '', defaultFavorites: defaults.map(track => ({ ...track, privateRawField: secret.refreshToken })) });
  const result = await request(service, '/api/spotify', { remote: '198.51.100.2', headers: { host: 'example.com' } });
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body), { configured: false, nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: defaults });
  assert.ok(!result.body.includes(secret.refreshToken));
  const local = await request(service, '/api/spotify/setup');
  assert.match(local.body, /Up to 12 Spotify track links/);
  assert.ok(local.body.includes(defaults.map(track => track.url).join('\n')));
});

test('saved selections override defaults, retain their order, and an empty save stays cleared', async t => {
  const defaults = [curatedTrack(TRACK), curatedTrack(TRACK_TWO)];
  const { service, favoritesFile } = await fixture(t, { defaultFavorites: defaults });
  await writeFile(favoritesFile, JSON.stringify({ tracks: [trackUrl(TRACK_TWO), trackUrl(TRACK)] }));
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, [defaults[1], defaults[0]]);
  const { csrf, cookie } = await setup(service);
  const cleared = await request(service, '/api/spotify/favorites', { method: 'POST', headers: { origin: ORIGIN, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: form(csrf, '') });
  assert.equal(cleared.status, 303);
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks: [] });
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, []);
  await writeFile(favoritesFile, 'invalid json');
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, []);
});

test('default metadata canonicalizes safe URLs, deduplicates, and exposes only selected matching tracks', async t => {
  const defaults = [
    { ...curatedTrack(TRACK), url: `${trackUrl(TRACK)}?si=tracking`, artwork: 'javascript:alert(1)', privateRawField: secret.refreshToken },
    { ...curatedTrack(TRACK), title: 'Duplicate' },
    { ...curatedTrack(TRACK_TWO), url: `https://open.spotify.com.evil.test/track/${TRACK_TWO}` },
  ];
  const { service, favoritesFile } = await fixture(t, { defaultFavorites: defaults });
  const expected = { ...curatedTrack(TRACK), artwork: '' };
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, [expected]);
  await writeFile(favoritesFile, JSON.stringify({ tracks: [trackUrl(TRACK_TWO)] }));
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, []);
});

test('setup and mutations require both a local socket and a local Host', async t => {
  const { service } = await fixture(t);
  for (const path of ['/api/spotify/setup', '/api/spotify/connect', '/api/spotify/callback']) {
    assert.equal((await request(service, path, { remote: '198.51.100.2' })).status, 403);
    assert.equal((await request(service, path, { headers: { host: 'example.com' } })).status, 403);
    assert.equal((await request(service, path, { headers: { host: '127.0.0.1.example.com' } })).status, 403);
    if (path !== '/api/spotify/callback') assert.equal((await request(service, path, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  }
  const local = await request(service, '/api/spotify/setup', { remote: '::ffff:127.0.0.1' });
  assert.equal(local.status, 200);
  assert.match(local.headers['set-cookie'], /HttpOnly; SameSite=Strict/);
  assert.match(local.headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.ok(!local.body.includes(secret.refreshToken));
});

test('favorite parser canonicalizes only handpicked Spotify track links', () => {
  assert.deepEqual(parseFavoriteTracks(`https://open.spotify.com/track/${TRACK}?si=abc\nhttps://open.spotify.com/intl-en/track/${TRACK}\nhttps://open.spotify.com/track/${TRACK_TWO}`), [`https://open.spotify.com/track/${TRACK}`, `https://open.spotify.com/track/${TRACK_TWO}`]);
  assert.deepEqual(parseFavoriteTracks(''), []);
  for (const url of [`http://open.spotify.com/track/${TRACK}`, `https://open.spotify.com.evil.test/track/${TRACK}`, `https://open.spotify.com/playlist/${TRACK}`, `https://person@open.spotify.com/track/${TRACK}`, `https://open.spotify.com:8443/track/${TRACK}`, 'javascript:alert(1)']) assert.throws(() => parseFavoriteTracks(url));
  assert.equal(MAX_FAVORITE_TRACKS, 12);
  const tracks = 'ABCDEFGHIJKL'.split('').map(letter => trackUrl(letter.repeat(22)));
  assert.deepEqual(parseFavoriteTracks(tracks.slice(0, 9).map(url => `${url}?si=tracking`).join('\n')), tracks.slice(0, 9));
  assert.deepEqual(parseFavoriteTracks(tracks.join('\n')), tracks);
  assert.throws(() => parseFavoriteTracks([...tracks, trackUrl('M'.repeat(22))].join('\n')));
});

test('setup preserves the native form Origin and confirms successful saves', async t => {
  const { service } = await fixture(t);
  const page = await request(service, '/api/spotify/setup');
  assert.equal(page.headers['referrer-policy'], 'same-origin');
  assert.match(page.headers['content-security-policy'], /form-action 'self'/);
  const { csrf, cookie } = await setup(service);
  const saved = await request(service, '/api/spotify/favorites', { method: 'POST', headers: { origin: ORIGIN, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: form(csrf, trackUrl(TRACK)) });
  assert.equal(saved.status, 303);
  const confirmation = await request(service, saved.headers.location);
  assert.equal(confirmation.status, 200);
  assert.match(confirmation.body, /role="status">Your favorite tracks were saved/);
  assert.ok(confirmation.body.includes(trackUrl(TRACK)));
});

test('setup and connect use the callback origin before creating cookies or OAuth state', async t => {
  const { service } = await fixture(t);
  for (const host of ['localhost:3001', '127.0.0.1:5173']) {
    for (const path of ['/api/spotify/setup', '/api/spotify/connect']) {
      const redirected = await request(service, path, { headers: { host } });
      assert.equal(redirected.status, 302);
      assert.equal(redirected.headers.location, ORIGIN + path);
      assert.equal(redirected.headers['set-cookie'], undefined);
    }
  }
  const connect = await request(service, '/api/spotify/connect');
  assert.equal(new URL(connect.headers.location).origin, 'https://accounts.spotify.com');
  assert.equal(connect.headers['referrer-policy'], 'no-referrer');
  assert.match(connect.headers['set-cookie'], /SameSite=Lax/);
});

test('null, missing, and mismatched Origins remain rejected and browser errors offer recovery', async t => {
  const { service, favoritesFile } = await fixture(t);
  await writeFile(favoritesFile, JSON.stringify({ tracks: [trackUrl(TRACK)] }));
  const { csrf, cookie } = await setup(service);
  const headers = { cookie, 'content-type': 'application/x-www-form-urlencoded' };
  for (const origin of [undefined, 'null', 'http://127.0.0.1:5173', 'https://evil.test']) {
    const rejected = await request(service, '/api/spotify/favorites', { method: 'POST', headers: { ...headers, origin }, body: form(csrf, '') });
    assert.equal(rejected.status, 403);
  }
  const browserError = await request(service, '/api/spotify/favorites', { method: 'POST', headers: { ...headers, origin: 'null', accept: 'text/html' }, body: form(csrf, '') });
  assert.equal(browserError.status, 403);
  assert.match(browserError.headers['content-type'], /text\/html/);
  assert.match(browserError.body, /Return to Spotify setup/);
  assert.ok(browserError.body.includes(ORIGIN + '/api/spotify/setup'));
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks: [trackUrl(TRACK)] });
});

test('saving favorites requires Origin, setup cookie, and CSRF token', async t => {
  const { service, favoritesFile } = await fixture(t);
  const { csrf, cookie } = await setup(service);
  const body = form(csrf, `https://open.spotify.com/track/${TRACK}`);
  const headers = { origin: ORIGIN, cookie, 'content-type': 'application/x-www-form-urlencoded' };
  assert.equal((await request(service, '/api/spotify/favorites', { method: 'POST', headers: { ...headers, cookie: '' }, body })).status, 403);
  assert.equal((await request(service, '/api/spotify/favorites', { method: 'POST', headers: { ...headers, origin: 'https://evil.test' }, body })).status, 403);
  assert.equal((await request(service, '/api/spotify/favorites', { method: 'POST', headers, body: form('wrong-token', `https://open.spotify.com/track/${TRACK}`) })).status, 403);
  const saved = await request(service, '/api/spotify/favorites', { method: 'POST', headers, body });
  assert.equal(saved.status, 303);
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks: [`https://open.spotify.com/track/${TRACK}`] });
  const invalid = await request(service, '/api/spotify/favorites', { method: 'POST', headers, body: form(csrf, 'https://evil.test/track/not-real') });
  assert.equal(invalid.status, 400);
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks: [`https://open.spotify.com/track/${TRACK}`] });
});

test('local setup saves nine ordered canonical favorites and rejects thirteen without changing them', async t => {
  const { service, favoritesFile } = await fixture(t);
  const { csrf, cookie } = await setup(service);
  const headers = { origin: ORIGIN, cookie, 'content-type': 'application/x-www-form-urlencoded' };
  const tracks = 'ABCDEFGHI'.split('').map(letter => trackUrl(letter.repeat(22)));
  const saved = await request(service, '/api/spotify/favorites', { method: 'POST', headers, body: form(csrf, tracks.map(url => `${url}?si=tracking`).join('\n')) });
  assert.equal(saved.status, 303);
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks });
  const tooMany = 'ABCDEFGHIJKLM'.split('').map(letter => trackUrl(letter.repeat(22)));
  const rejected = await request(service, '/api/spotify/favorites', { method: 'POST', headers, body: form(csrf, tooMany.join('\n')) });
  assert.equal(rejected.status, 400);
  assert.deepEqual(JSON.parse(await readFile(favoritesFile, 'utf8')), { tracks });
});

test('PKCE callback validates cookie-bound state, stores tokens privately, and rejects replay', async t => {
  const calls = [];
  const { service, tokenFile } = await fixture(t, { fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return response({ access_token: secret.accessToken, refresh_token: secret.refreshToken, expires_in: 3600 });
  } });
  const connect = await request(service, '/api/spotify/connect');
  assert.equal(connect.status, 302);
  const url = new URL(connect.headers.location);
  assert.equal(url.origin, 'https://accounts.spotify.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('scope'), 'user-read-currently-playing user-top-read');
  assert.ok(!url.searchParams.has('client_secret'));
  const state = url.searchParams.get('state');
  const cookie = connect.headers['set-cookie'].split(';')[0];
  assert.equal((await request(service, '/api/spotify/callback?code=test&state=wrong', { headers: { cookie } })).status, 400);
  assert.equal((await request(service, `/api/spotify/callback?code=test&state=${state}`)).status, 400);
  assert.equal((await request(service, '/api/spotify/callback?code=test', { headers: { cookie, 'sec-fetch-site': 'cross-site' } })).status, 400);
  assert.equal((await request(service, `/api/spotify/callback?code=test&state=${state}`, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 400);
  assert.equal(calls.length, 0);
  const callback = await request(service, `/api/spotify/callback?code=test&state=${state}`, { headers: { cookie, 'sec-fetch-site': 'cross-site' } });
  assert.equal(callback.status, 200);
  assert.ok(!callback.body.includes(secret.accessToken) && !callback.body.includes(secret.refreshToken));
  const body = calls[0].options.body;
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(createHashForTest(body.get('code_verifier')), url.searchParams.get('code_challenge'));
  assert.equal(body.get('client_secret'), null);
  assert.equal(JSON.parse(await readFile(tokenFile, 'utf8')).refreshToken, secret.refreshToken);
  assert.equal((await request(service, `/api/spotify/callback?code=test&state=${state}`, { headers: { cookie } })).status, 400);
});

function createHashForTest(value) { return createHash('sha256').update(value).digest('base64url'); }
import { createHash } from 'node:crypto';

test('token refresh, snapshot coalescing, and sanitization keep credentials private', async t => {
  const counts = new Map();
  const { service, tokenFile, favoritesFile } = await fixture(t, { fetchImpl: async (url, options) => {
    counts.set(url, (counts.get(url) || 0) + 1);
    if (url.includes('/api/token')) {
      assert.equal(options.body.get('client_id'), CLIENT);
      assert.equal(options.body.get('client_secret'), null);
      assert.equal(options.body.get('refresh_token'), secret.refreshToken);
      return response({ access_token: secret.accessToken, expires_in: 3600 });
    }
    assert.equal(options.headers.Authorization, `Bearer ${secret.accessToken}`);
    if (url.includes('/currently-playing')) return response({ is_playing: true, item: fakeTrack(TRACK), device: { id: 'private-device', name: 'Private computer' } });
    if (url.includes('/me/top/artists')) return response({ items: [{ name: 'Artist', images: [{ url: 'https://i.scdn.co/image/artist' }], external_urls: { spotify: 'https://open.spotify.com/artist/' + TRACK }, secret: secret.refreshToken }] });
    if (url.includes('/me/top/tracks')) return response({ items: [] });
    if (url.includes('/tracks/')) return response(fakeTrack(TRACK_TWO));
    throw Error('Unexpected URL');
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, expiresAt: 0 }));
  await writeFile(favoritesFile, JSON.stringify({ tracks: [`https://open.spotify.com/track/${TRACK_TWO}`] }));
  const results = await Promise.all([request(service, '/api/spotify'), request(service, '/api/spotify'), request(service, '/api/spotify')]);
  assert.ok(results.every(result => result.status === 200));
  const payload = JSON.parse(results[0].body);
  assert.equal(payload.configured, true);
  assert.equal(payload.nowPlaying.isPlaying, true);
  assert.equal(payload.favoriteTracks[0].title, 'Track B');
  assert.equal(payload.topArtists[0].name, 'Artist');
  assert.equal(counts.get('https://accounts.spotify.com/api/token'), 1);
  assert.equal([...counts.values()].reduce((a, b) => a + b, 0), 5);
  for (const value of [secret.accessToken, secret.refreshToken, 'private-device', 'Private computer']) assert.ok(!results[0].body.includes(value));
  const previousCount = [...counts.values()].reduce((a, b) => a + b, 0);
  await request(service, '/api/spotify');
  assert.equal([...counts.values()].reduce((a, b) => a + b, 0), previousCount);
});

test('connected snapshots refresh default favorite metadata from Spotify without a private selection file', async t => {
  const { service, tokenFile } = await fixture(t, { defaultFavorites: [curatedTrack(TRACK_TWO)], fetchImpl: async url => {
    if (url.includes('/currently-playing')) return new Response(null, { status: 204 });
    if (url.includes('/me/top/artists')) return response({ items: [] });
    if (url.includes('/me/top/tracks')) return response({ items: [] });
    assert.equal(url, `https://api.spotify.com/v1/tracks/${TRACK_TWO}`);
    return response(fakeTrack(TRACK_TWO));
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: Date.now() + 3600000 }));
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body), { configured: true, nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: [{ title: 'Track B', artists: 'Artist', url: trackUrl(TRACK_TWO), artwork: 'https://i.scdn.co/image/art' }] });
  assert.ok(!result.body.includes(secret.refreshToken));
});

test('upstream failures are sanitized and rate limits back off', async t => {
  let count = 0;
  const { service, tokenFile } = await fixture(t, { fetchImpl: async () => { count++; return response({ error: secret.refreshToken }, 429, { 'retry-after': '60' }); } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: Date.now() + 3600000 }));
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 429);
  assert.equal(result.headers['retry-after'], '60');
  assert.ok(!result.body.includes(secret.refreshToken));
  const previousCount = count;
  const again = await request(service, '/api/spotify');
  assert.equal(again.status, 429);
  assert.equal(count, previousCount);
});

test('invalid_grant requires reconnection without retrying token refresh and keeps curated favorites', async t => {
  let count = 0;
  const defaults = [curatedTrack(TRACK)];
  const { service, tokenFile } = await fixture(t, { defaultFavorites: defaults, fetchImpl: async () => { count++; return response({ error: 'invalid_grant', privateDetail: secret.refreshToken }, 400); } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, expiresAt: 0 }));
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 401);
  assert.equal(JSON.parse(result.body).configured, false);
  assert.deepEqual(JSON.parse(result.body).favoriteTracks, defaults);
  assert.equal(count, 1);
  assert.ok(!result.body.includes(secret.refreshToken));
});

test('top albums group canonical album IDs, rank by top-track count, and break ties by earliest track', async t => {
  const albumA = { ...fakeAlbum('C'.repeat(22), 'Shared title'), external_urls: { spotify: 'https://evil.test/album' }, images: [{ url: 'javascript:alert(1)' }] };
  const albumB = fakeAlbum('D'.repeat(22), 'Most represented');
  const albumC = fakeAlbum('E'.repeat(22), 'Fourth album');
  const albumD = fakeAlbum('F'.repeat(22), 'Shared title');
  const tracks = [albumD, albumB, albumA, albumB, null, albumD, albumA, albumC, albumB].map((album, index) => ({ ...fakeTrack(String(index).repeat(22)), album }));
  tracks.push(null, {}, { type: 'episode', album: albumB }, { album: { id: 'invalid/id' } });
  const { service, tokenFile } = await fixture(t, { fetchImpl: async url => {
    if (url.includes('/currently-playing')) return new Response(null, { status: 204 });
    if (url.includes('/me/top/artists')) return response({ items: [] });
    assert.equal(url, 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term');
    return response({ items: tracks, privateRawField: secret.refreshToken });
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: Date.now() + 3600000 }));
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body).topAlbums, [expectedAlbum(albumB), expectedAlbum(albumD), { ...expectedAlbum(albumA), artwork: '' }]);
  assert.ok(!result.body.includes(secret.refreshToken) && !result.body.includes('evil.test') && !result.body.includes('javascript:'));
});

test('playback refreshes independently in twelve seconds while metadata and in-flight token refresh are shared', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const counts = new Map();
  let playing = { is_playing: true, item: fakeTrack(TRACK) };
  const { service, tokenFile } = await fixture(t, { defaultFavorites: [curatedTrack(TRACK_TWO)], fetchImpl: async (url, options) => {
    counts.set(url, (counts.get(url) || 0) + 1);
    if (url.includes('/api/token')) {
      assert.equal(options.body.get('grant_type'), 'refresh_token');
      return response({ access_token: secret.accessToken, expires_in: 3600 });
    }
    if (url.includes('/currently-playing')) return playing ? response(playing) : new Response(null, { status: 204 });
    if (url.includes('/me/top/')) return response({ items: [] });
    return response(fakeTrack(TRACK_TWO));
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: now + 35000 }));
  const burst = () => Promise.all([request(service, '/api/spotify'), request(service, '/api/spotify'), request(service, '/api/spotify')]);
  const playbackUrl = 'https://api.spotify.com/v1/me/player/currently-playing';
  const artistsUrl = 'https://api.spotify.com/v1/me/top/artists?limit=6&time_range=medium_term';
  const albumsUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term';
  const favoriteUrl = `https://api.spotify.com/v1/tracks/${TRACK_TWO}`;
  assert.ok((await burst()).every(result => result.status === 200));
  for (const url of [playbackUrl, artistsUrl, albumsUrl, favoriteUrl]) assert.equal(counts.get(url), 1);
  now += 11000;
  await request(service, '/api/spotify');
  assert.equal(counts.get(playbackUrl), 1);
  playing = null;
  now += 2000;
  const idle = await burst();
  assert.ok(idle.every(result => result.status === 200 && JSON.parse(result.body).nowPlaying === null));
  assert.equal(counts.get(playbackUrl), 2);
  assert.equal(counts.get('https://accounts.spotify.com/api/token'), 1);
  for (const url of [artistsUrl, albumsUrl, favoriteUrl]) assert.equal(counts.get(url), 1);
  await request(service, '/api/spotify');
  assert.equal(counts.get(playbackUrl), 2);
  playing = { is_playing: false, item: fakeTrack(TRACK_TWO) };
  now += 48000;
  const refreshed = await burst();
  assert.ok(refreshed.every(result => result.status === 200 && JSON.parse(result.body).nowPlaying.isPlaying === false));
  assert.equal(counts.get(playbackUrl), 3);
  for (const url of [artistsUrl, albumsUrl, favoriteUrl]) assert.equal(counts.get(url), 2);
  assert.equal(counts.get('https://accounts.spotify.com/api/token'), 1);
});

test('clearing favorites invalidates metadata immediately and an older in-flight response cannot restore it', async t => {
  const favoriteStarted = deferred();
  const favoriteResponse = deferred();
  const counts = new Map();
  const { service, tokenFile } = await fixture(t, { defaultFavorites: [curatedTrack(TRACK_TWO)], fetchImpl: async url => {
    counts.set(url, (counts.get(url) || 0) + 1);
    if (url.includes('/currently-playing')) return response({ is_playing: true, item: fakeTrack(TRACK) });
    if (url.includes('/me/top/')) return response({ items: [] });
    favoriteStarted.resolve();
    return favoriteResponse.promise;
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: Date.now() + 3600000 }));
  const older = request(service, '/api/spotify');
  await favoriteStarted.promise;
  const { csrf, cookie } = await setup(service);
  const saved = await request(service, '/api/spotify/favorites', { method: 'POST', headers: { origin: ORIGIN, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: form(csrf, '') });
  assert.equal(saved.status, 303);
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, []);
  favoriteResponse.resolve(response(fakeTrack(TRACK_TWO)));
  assert.equal((await older).status, 200);
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).favoriteTracks, []);
  assert.equal(counts.get('https://api.spotify.com/v1/me/player/currently-playing'), 1);
  assert.equal(counts.get('https://api.spotify.com/v1/me/top/artists?limit=6&time_range=medium_term'), 2);
  assert.equal(counts.get(`https://api.spotify.com/v1/tracks/${TRACK_TWO}`), 1);
});

test('optional album discovery failures keep prior albums without hiding working playback or artists', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  let failAlbums = false;
  const album = fakeAlbum('C'.repeat(22));
  const fetchImpl = async url => {
    if (url.includes('/currently-playing')) return response({ is_playing: !failAlbums, item: fakeTrack(failAlbums ? TRACK_TWO : TRACK) });
    if (url.includes('/me/top/artists')) return response({ items: [{ name: failAlbums ? 'Updated artist' : 'Original artist' }] });
    if (url.includes('/me/top/tracks')) return failAlbums ? response({ error: secret.refreshToken }, 503) : response({ items: [{ type: 'track', album }] });
    throw Error('Unexpected URL');
  };
  const { service, tokenFile } = await fixture(t, { fetchImpl });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: now + 3600000 }));
  assert.deepEqual(JSON.parse((await request(service, '/api/spotify')).body).topAlbums, [expectedAlbum(album)]);
  failAlbums = true;
  now += 61000;
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 200);
  const payload = JSON.parse(result.body);
  assert.deepEqual(payload.topAlbums, [expectedAlbum(album)]);
  assert.equal(payload.nowPlaying.title, 'Track B');
  assert.equal(payload.nowPlaying.isPlaying, false);
  assert.equal(payload.topArtists[0].name, 'Updated artist');
  const fresh = await fixture(t, { fetchImpl });
  await writeFile(fresh.tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: now + 3600000 }));
  const withoutPrevious = await request(fresh.service, '/api/spotify');
  assert.equal(withoutPrevious.status, 200);
  assert.deepEqual(JSON.parse(withoutPrevious.body).topAlbums, []);
  assert.ok(!result.body.includes(secret.refreshToken));
});

test('album endpoint rate limits remain global and are not treated as optional missing albums', async t => {
  let count = 0;
  const { service, tokenFile } = await fixture(t, { fetchImpl: async url => {
    count++;
    if (url.includes('/me/top/tracks')) return response({ error: secret.refreshToken }, 429, { 'retry-after': '45' });
    if (url.includes('/currently-playing')) return new Response(null, { status: 204 });
    return response({ items: [] });
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: Date.now() + 3600000 }));
  const result = await request(service, '/api/spotify');
  assert.equal(result.status, 429);
  assert.equal(result.headers['retry-after'], '45');
  assert.ok(!result.body.includes(secret.refreshToken));
  const previousCount = count;
  assert.equal((await request(service, '/api/spotify')).status, 429);
  assert.equal(count, previousCount);
});

test('OAuth reconnection clears both caches and a later playback 401 clears cached account metadata', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  let account = 'first';
  let playbackCalls = 0;
  let artistCalls = 0;
  let refreshCalls = 0;
  const albumA = fakeAlbum('C'.repeat(22));
  const albumB = fakeAlbum('D'.repeat(22));
  const defaults = [curatedTrack(TRACK_TWO)];
  const { service, tokenFile } = await fixture(t, { defaultFavorites: defaults, fetchImpl: async (url, options) => {
    if (url.includes('/api/token')) {
      if (options.body.get('grant_type') === 'authorization_code') {
        account = 'second';
        return response({ access_token: secret.accessToken, refresh_token: secret.refreshToken, expires_in: 3600 });
      }
      refreshCalls++;
      return response({ error: 'invalid_grant', privateDetail: secret.refreshToken }, 400);
    }
    if (url.includes('/currently-playing')) {
      playbackCalls++;
      return account === 'revoked' ? response({ error: 'expired' }, 401) : response({ is_playing: true, item: fakeTrack(account === 'first' ? TRACK : TRACK_TWO) });
    }
    if (url.includes('/me/top/artists')) { artistCalls++; return response({ items: [{ name: account }] }); }
    if (url.includes('/me/top/tracks')) return response({ items: [{ type: 'track', album: account === 'first' ? albumA : albumB }] });
    return response(fakeTrack(TRACK_TWO));
  } });
  await writeFile(tokenFile, JSON.stringify({ clientId: CLIENT, refreshToken: secret.refreshToken, accessToken: secret.accessToken, expiresAt: now + 3600000 }));
  assert.equal(JSON.parse((await request(service, '/api/spotify')).body).topArtists[0].name, 'first');
  const connect = await request(service, '/api/spotify/connect');
  const state = new URL(connect.headers.location).searchParams.get('state');
  const callback = await request(service, `/api/spotify/callback?code=test&state=${state}`, { headers: { cookie: connect.headers['set-cookie'].split(';')[0], 'sec-fetch-site': 'cross-site' } });
  assert.equal(callback.status, 200);
  const reconnected = JSON.parse((await request(service, '/api/spotify')).body);
  assert.equal(reconnected.topArtists[0].name, 'second');
  assert.equal(reconnected.topAlbums[0].id, albumB.id);
  assert.equal(reconnected.nowPlaying.title, 'Track B');
  assert.equal(playbackCalls, 2);
  assert.equal(artistCalls, 2);
  account = 'revoked';
  now += 13000;
  const revoked = await request(service, '/api/spotify');
  assert.equal(revoked.status, 401);
  assert.deepEqual(JSON.parse(revoked.body), { error: 'Spotify needs to be reconnected.', configured: false, nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: defaults });
  assert.equal(refreshCalls, 1);
  assert.ok(!revoked.body.includes(secret.refreshToken) && !revoked.body.includes(secret.accessToken));
});
