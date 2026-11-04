import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import { createSpotifyService } from './spotify.mjs';
import { favoriteTracks } from '../src/data/favoriteTracks.js';

const root = fileURLToPath(new URL('../', import.meta.url));
// Direct launches (for example VS Code's Run File) must load the same local
// configuration as npm start, regardless of the terminal's working directory.
try { loadEnvFile(resolve(root, '.env.local')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const dist = resolve(root, 'dist');
const spotify = createSpotifyService({
  clientId: process.env.SPOTIFY_CLIENT_ID || '',
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/spotify/callback',
  profileUrl: process.env.SPOTIFY_PROFILE_URL || '',
  tokenFile: resolve(root, '.data/spotify-tokens.json'),
  favoritesFile: resolve(root, '.data/spotify-favorites.json'),
  defaultFavorites: favoriteTracks,
});
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2' };
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (await spotify.handleRequest(req, res, url)) return;
    if (url.pathname.startsWith('/api/')) { json(res, 404, { error:'Not found.' }); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { error:'Method not allowed.' }); return; }
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(dist + sep) || pathname.includes('\0') || pathname.includes('\\')) { json(res, 404, { error:'Not found.' }); return; }
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(file));
    } catch { json(res, 404, { error:'Not found. Run npm run build before serving the site.' }); }
  } catch { if (!res.headersSent) json(res, 500, { error:'Request could not be completed.' }); else res.end(); }
});
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`Website and API: http://${host}:${port}`);
  console.log(`Local Spotify setup: http://127.0.0.1:${port}/api/spotify/setup`);
});
