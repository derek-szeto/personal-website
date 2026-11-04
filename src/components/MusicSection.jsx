import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { quickTransition } from '../motion.js';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';
import MusicTurntable from './MusicTurntable.jsx';

const EMPTY = { nowPlaying: null, topArtists: [], topAlbums: [], favoriteTracks: [] };

function spotifyLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'open.spotify.com' ? url.href : undefined; } catch { return undefined; }
}

function imageLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; }
}

function SpotifyBrand() {
  return <span className="spotify-brand"><svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="currentColor" /><g fill="none" stroke="var(--page)" strokeLinecap="round"><path d="M5 8.8c4.7-1.4 9.8-1 14 1.2" strokeWidth="1.8" /><path d="M5.8 12.1c3.8-1.1 8.3-.8 11.8 1.1" strokeWidth="1.6" /><path d="M6.7 15.2c3-.8 6.6-.6 9.6 1" strokeWidth="1.4" /></g></svg><span>Spotify</span></span>;
}

function MusicNote() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="5.5" cy="18" rx="3.5" ry="2.5" /><ellipse cx="16.5" cy="16" rx="3.5" ry="2.5" /></svg>;
}

function TrackArtwork({ src }) {
  const url = imageLink(src);
  return url ? <img className="music-track-artwork" src={url} alt="" loading="lazy" decoding="async" /> : <span className="music-track-artwork music-track-artwork-empty"><MusicNote /></span>;
}

function TrackRow({ track }) {
  const href = spotifyLink(track.url);
  const Tag = href ? 'a' : 'div';
  return <Tag className="music-track-row" href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}>
    <TrackArtwork src={track.artwork} />
    <span className="music-track-text"><strong>{track.title || 'Untitled track'}</strong><span>{track.artists || 'Unknown artist'}</span></span>
    {href && <span className="music-track-arrow" aria-hidden="true">&#8599;</span>}
  </Tag>;
}

export function MusicArtistCard({ artist }) {
  const href = spotifyLink(artist.url);
  const image = imageLink(artist.image);
  const name = artist.name || 'Unknown artist';
  const Tag = href ? 'a' : 'div';
  return <Tag className="music-artist" href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}>
    {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <span className="music-artist-placeholder" aria-hidden="true"><MusicNote /></span>}
    <span className="music-artist-name">{name === 'PARTYNEXTDOOR' ? <>PARTY<wbr />NEXT<wbr />DOOR</> : name}</span>
    {href && <span className="music-artist-arrow" aria-hidden="true">&#8599;</span>}
  </Tag>;
}

export function MusicAlbumCard({ album }) {
  const href = spotifyLink(album.url);
  const artwork = imageLink(album.artwork);
  const Tag = href ? 'a' : 'div';
  return <Tag className="music-album" href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}>
    <span className="music-album-cover">{artwork ? <img src={artwork} alt="" loading="lazy" decoding="async" /> : <span className="music-album-placeholder" aria-hidden="true"><MusicNote /></span>}{href && <span className="music-album-arrow" aria-hidden="true">&#8599;</span>}</span>
    <span className="music-album-copy"><strong>{album.title || 'Untitled album'}</strong><span>{album.artists || 'Unknown artist'}</span></span>
  </Tag>;
}

function MusicSkeleton({ tracks = false }) {
  return <div className={tracks ? 'music-track-list music-skeleton-list' : 'music-artists-list music-skeleton-list'} aria-hidden="true">
    {Array.from({ length: 6 }, (_, index) => <div className={tracks ? 'music-track-row' : 'music-artist'} key={index}>
      <span className="music-skeleton-cover" /><span className="music-skeleton-copy"><i /><i /></span>
    </div>)}
  </div>;
}

export default function MusicSection({ endpoint = '/api/spotify', enabled = false, profileUrl = '', favorites = [] }) {
  const reduced = useReducedMotion();
  const section = useRef(null);
  const [motionActive, setMotionActive] = useState(false);
  const [snapshot, setSnapshot] = useState(() => ({ source: endpoint, data: EMPTY, favorites: null, hasData: false, status: enabled ? 'loading' : 'disconnected', refreshing: false }));
  const latest = useRef(snapshot);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = !('IntersectionObserver' in window);
    const sync = () => setMotionActive(visible && !document.hidden && !media.matches && !isAmbientPaused());
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting === true;
      sync();
    }, { threshold: 0 }) : null;
    if (section.current) observer?.observe(section.current);
    const unsubscribe = subscribeAmbientPaused(sync);
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer?.disconnect();
      unsubscribe();
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  useEffect(() => {
    if (!enabled) {
      latest.current = { source: endpoint, data: EMPTY, favorites: null, hasData: false, status: 'disconnected', refreshing: false };
      setSnapshot(latest.current);
      return undefined;
    }
    const controller = new AbortController();
    let inFlight = false;
    let active = true;
    function commit(patch) {
      if (!active) return;
      latest.current = { ...latest.current, ...patch };
      setSnapshot(latest.current);
    }
    if (latest.current.source !== endpoint) {
      commit({ source: endpoint, data: EMPTY, favorites: null, hasData: false, status: 'loading', refreshing: false });
    }
    async function refresh() {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      commit({ refreshing: true, status: latest.current.hasData ? latest.current.status : 'loading' });
      try {
        const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!active) return;
        const payload = await response.json().catch(error => {
          if (response.status === 401) return {};
          throw error;
        });
        if (!active) return;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Music is unavailable');
        // An explicit empty array is a saved selection, rather than a reason to
        // restore defaults. Keep it through later refresh or connection errors.
        if (Array.isArray(payload.favoriteTracks)) commit({ favorites: payload.favoriteTracks.filter(item => item && typeof item === 'object') });
        if (response.status === 401 || payload.configured === false) {
          commit({ data: EMPTY, hasData: false, status: 'disconnected', refreshing: false });
          return;
        }
        if (!response.ok) throw new Error('Music is unavailable');
        const data = {
          nowPlaying: payload.nowPlaying && typeof payload.nowPlaying === 'object' ? payload.nowPlaying : null,
          topArtists: Array.isArray(payload.topArtists) ? payload.topArtists.filter(item => item && typeof item === 'object').slice(0, 6) : [],
          topAlbums: Array.isArray(payload.topAlbums) ? payload.topAlbums.filter(item => item && typeof item === 'object').slice(0, 3) : [],
          favoriteTracks: Array.isArray(payload.favoriteTracks) ? payload.favoriteTracks.filter(item => item && typeof item === 'object') : [],
        };
        commit({ data, hasData: true, status: 'ready', refreshing: false });
      } catch (error) {
        if (active && error.name !== 'AbortError') commit({ status: 'error', refreshing: false });
      } finally {
        inFlight = false;
      }
    }
    refresh();
    const interval = window.setInterval(refresh, 15000);
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    return () => { active = false; controller.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('focus', refresh); };
  }, [endpoint, enabled, retry]);

  const currentSource = enabled && snapshot.source === endpoint;
  const effectiveStatus = currentSource ? snapshot.status : enabled ? 'loading' : 'disconnected';
  const ready = currentSource && snapshot.hasData;
  const data = ready ? snapshot.data : EMPTY;
  const track = data.nowPlaying;
  const refreshing = currentSource && snapshot.refreshing;
  const loading = effectiveStatus === 'loading';
  const selectedFavorites = currentSource && Array.isArray(snapshot.favorites) ? snapshot.favorites : Array.isArray(favorites) ? favorites : [];
  const favoritesLoading = loading && !selectedFavorites.length && !(currentSource && Array.isArray(snapshot.favorites));
  const favoritesEmpty = ready || (currentSource && Array.isArray(snapshot.favorites)) ? 'No tracks selected yet.' : effectiveStatus === 'error' ? 'Temporarily unavailable.' : 'Coming soon.';
  const stale = effectiveStatus === 'error' && ready;
  const currentHref = spotifyLink(track?.url);
  const isPlaying = track?.isPlaying === true && effectiveStatus === 'ready';
  const profileHref = spotifyLink(profileUrl);
  const stateText = loading ? 'Loading music...' : stale ? 'Last available music' : effectiveStatus === 'error' ? 'Music is unavailable right now.' : effectiveStatus === 'disconnected' ? 'Spotify not connected yet.' : track ? (track.isPlaying ? 'Now playing' : 'Paused') : 'Not playing right now.';
  const emptyText = ready ? 'No artists to show yet.' : effectiveStatus === 'error' ? 'Temporarily unavailable.' : 'Coming soon.';
  return <section ref={section} id="music" className="music-section" aria-labelledby="music-title" data-playing={isPlaying} data-motion-active={motionActive}>
    <div className="music-section-heading"><h2 id="music-title">Music</h2><SpotifyBrand /></div>
    <div className="music-layout">
      <article className="music-now-card" aria-label="Spotify player">
        <div className="music-now-heading"><span className={`music-status-dot${isPlaying ? ' is-playing' : ''}${loading ? ' is-loading' : ''}`} aria-hidden="true" /><p role="status">{stateText}</p><span className="music-update-control">{effectiveStatus === 'error' ? <button type="button" className="music-retry" disabled={refreshing} onClick={() => setRetry(value => value + 1)}>{refreshing ? 'Retrying' : 'Retry'}</button> : <span className={`music-refresh-label${refreshing && ready ? ' is-visible' : ''}`} aria-hidden="true">Updating</span>}</span></div>
        <div className="music-now-body">
          <MusicTurntable artwork={imageLink(track?.artwork)} hasTrack={Boolean(track)} playing={isPlaying} spinning={isPlaying && motionActive} />
          <motion.div className="music-now-text" key={track ? `${track.url || track.title}-${track.artists}` : 'silence'} initial={reduced || !track ? false : { opacity: .6 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : quickTransition}>
            {track ? <><div className="music-track-title-line"><h3>{track.title || 'Untitled track'}</h3><span className="music-equalizer" aria-hidden="true"><i /><i /><i /><i /><i /></span></div><p>{track.artists || 'Unknown artist'}</p>{currentHref && <a className="music-listen-link" href={currentHref} target="_blank" rel="noopener noreferrer">Listen on Spotify <span aria-hidden="true">&#8599;</span></a>}</> : loading ? <span className="music-now-skeleton music-skeleton-copy" aria-hidden="true"><i /><i /></span> : <span className="music-silent-mark" aria-hidden="true"><MusicNote /></span>}
          </motion.div>
        </div>
        {profileHref && <a className="music-profile-link" href={profileHref} target="_blank" rel="noopener noreferrer">My Spotify <span aria-hidden="true">&#8599;</span></a>}
      </article>
      <article className="music-artists-card"><div className="music-card-heading"><h3>Top artists</h3><span className="music-card-light" aria-hidden="true" /></div>
        <div className="music-artists-stage" aria-busy={loading}>
        {ready && data.topArtists.length ? <ol className="music-artists-list">{data.topArtists.map((artist, index) => <li key={`${artist.url || artist.name}-${index}`}><MusicArtistCard artist={artist} /></li>)}</ol> : loading ? <MusicSkeleton /> : <div className="music-artists-empty"><div className="music-empty-orbits" aria-hidden="true"><i /><i /><i /></div><p>{emptyText}</p></div>}
        </div>
      </article>
      <article className="music-albums-card" aria-labelledby="music-albums-title">
        <div className="music-card-heading"><div className="music-albums-heading"><h3 id="music-albums-title">Top 3 albums</h3><p>Based on my top tracks</p></div><span className="music-card-light" aria-hidden="true" /></div>
        <div className="music-albums-stage" aria-busy={loading}>
          {ready && data.topAlbums.length ? <ol className="music-albums-list">{data.topAlbums.map((album, index) => <li key={album.id || album.url || `${album.title}-${index}`}><MusicAlbumCard album={album} /></li>)}</ol> : loading ? <div className="music-albums-list music-skeleton-list" aria-hidden="true">{[0,1,2].map(index => <div className="music-album" key={index}><span className="music-album-cover music-album-placeholder" /><span className="music-skeleton-copy"><i /><i /></span></div>)}</div> : <div className="music-albums-empty"><MusicNote /><p>{ready ? 'No albums to show yet.' : effectiveStatus === 'error' ? 'Temporarily unavailable.' : 'Albums will appear here.'}</p></div>}
        </div>
      </article>
      <article className="music-favorites-card"><div className="music-card-heading"><h3>Favorite tracks</h3><span className="music-card-light" aria-hidden="true" /></div><div className="music-favorites-stage" aria-busy={favoritesLoading}>{selectedFavorites.length ? <div className="music-track-list">{selectedFavorites.map((item, index) => <TrackRow key={`${item.url || item.title}-${index}`} track={item} />)}</div> : favoritesLoading ? <MusicSkeleton tracks /> : <div className="music-favorites-empty"><MusicNote /><p>{favoritesEmpty}</p></div>}</div></article>
    </div>
  </section>;
}
