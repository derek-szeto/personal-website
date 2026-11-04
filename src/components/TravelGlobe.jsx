import { Component, lazy, memo, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';

const TravelGlobeCanvas = memo(lazy(() => import('./TravelGlobeCanvas.jsx')));

class GlobeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function PinIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

export default function TravelGlobe({ destinations, selectedId, onSelect, galleryId }) {
  const stage = useRef(null);
  const pinNodes = useRef(new Map());
  const destinationNodes = useRef(new Map());
  const hintId = useId();
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(isAmbientPaused);
  const [reduced, setReduced] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [focusRequest, setFocusRequest] = useState(0);
  const [night, setNight] = useState(() => typeof document === 'undefined' || document.documentElement.dataset.theme === 'dark');
  const mappedDestinations = useMemo(() => destinations.filter(place => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)), [destinations]);
  const selected = destinations.find(place => place.id === selectedId);
  const running = visible && pageVisible && !paused && !reduced;
  const selectDestination = useCallback(id => {
    const gallery = document.getElementById(galleryId);
    if (gallery?.contains(document.activeElement)) destinationNodes.current.get(id)?.focus({ preventScroll: true });
    onSelect(id);
    setFocusRequest(request => request + 1);
  }, [onSelect, galleryId]);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
    for (const [id, node] of pinNodes.current) {
      if (document.activeElement === node) destinationNodes.current.get(id)?.focus({ preventScroll: true });
      node.dataset.visible = 'false';
      node.tabIndex = -1;
    }
  }, []);
  // Projection changes only move the three DOM controls, not the React gallery.
  const onProjectPins = useCallback(pins => {
    for (const pin of pins) {
      const node = pinNodes.current.get(pin.id);
      if (!node) continue;
      const shown = pin.visible && Number.isFinite(pin.x) && Number.isFinite(pin.y);
      if (shown) {
        node.style.left = `${pin.x}%`;
        node.style.top = `${pin.y}%`;
        const width = stage.current?.clientWidth || 1;
        const halfLabel = (node.lastElementChild?.offsetWidth || 120) / 2;
        const x = pin.x / 100 * width;
        const clamped = Math.min(width - halfLabel - 8, Math.max(halfLabel + 8, x));
        node.style.setProperty('--pin-label-offset', `${clamped - x}px`);
        node.dataset.labelPosition = pin.y > 80 ? 'above' : 'below';
      } else if (document.activeElement === node) {
        destinationNodes.current.get(pin.id)?.focus({ preventScroll: true });
      }
      node.dataset.visible = String(shown);
      node.tabIndex = shown ? 0 : -1;
    }
  }, []);

  useEffect(() => subscribeAmbientPaused(() => setPaused(isAmbientPaused())), []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduced(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    const theme = new MutationObserver(() => setNight(document.documentElement.dataset.theme === 'dark'));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
      theme.disconnect();
    };
  }, []);
  useEffect(() => {
    const element = stage.current;
    if (!element) return undefined;
    if (!window.IntersectionObserver) {
      setLoad(true);
      setVisible(true);
      return undefined;
    }
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoad(true);
        preload.disconnect();
      }
    }, { rootMargin: '240px' });
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    preload.observe(element);
    visibility.observe(element);
    return () => { preload.disconnect(); visibility.disconnect(); };
  }, []);

  return <div className="travel-world" data-running={running} data-scene-ready={ready && !failed}>
    <div ref={stage} className="travel-globe-stage" role="group" aria-label="Interactive Earth with vacation photo pins" aria-describedby={hintId}>
      <div className="travel-globe-stars" aria-hidden="true" />
      <div className="travel-globe-orbit" aria-hidden="true"><i /></div>
      <div className="travel-earth-fallback" aria-hidden="true"><img src="/images/travel/earth-fallback.svg" alt="" width="640" height="640" decoding="async" /></div>
      <div className="travel-globe-canvas" aria-hidden="true">{load && !failed && mappedDestinations.length > 0 && <GlobeBoundary onFailure={onFailure}>
        <Suspense fallback={null}><TravelGlobeCanvas destinations={mappedDestinations} selectedId={selectedId} focusRequest={focusRequest} running={running} reduced={reduced} night={night} onSelect={selectDestination} onReady={onReady} onFailure={onFailure} onProjectPins={onProjectPins} /></Suspense>
      </GlobeBoundary>}</div>
      <div className="travel-globe-pins">{mappedDestinations.map(place => <button key={place.id} ref={node => { if (node) pinNodes.current.set(place.id, node); else pinNodes.current.delete(place.id); }} type="button" className="travel-globe-pin" tabIndex={-1} aria-label={`Show ${place.label} photos`} aria-pressed={selectedId === place.id} aria-controls={galleryId} style={{ '--pin-color': place.color }} onClick={() => selectDestination(place.id)}>
        <span className="travel-pin-target" aria-hidden="true"><PinIcon /></span><span className="travel-pin-label">{place.label}</span>
      </button>)}</div>
      <p className="travel-globe-hint" id={hintId}>{failed ? 'Choose a destination to see its photos.' : 'Drag to explore. Select a pin.'}</p>
    </div>
    <div className="travel-destination-list" role="group" aria-label="Vacation destinations">
      <p className="travel-destination-label">Places I’ve been</p>
      {destinations.map(place => <button key={place.id} ref={node => { if (node) destinationNodes.current.set(place.id, node); else destinationNodes.current.delete(place.id); }} type="button" className="travel-destination" aria-pressed={selectedId === place.id} aria-controls={galleryId} onClick={() => selectDestination(place.id)} style={{ '--pin-color': place.color }}>
        <span className="travel-destination-dot" aria-hidden="true" />
        <span className="travel-destination-copy"><strong>{place.label}</strong><span>{[place.country, place.period].filter(Boolean).join(' · ')}</span></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>)}
      <button className="travel-view-photos" type="button" onClick={() => {
        const gallery = document.getElementById(galleryId);
        gallery?.focus({ preventScroll: true });
        gallery?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      }}>View {selected?.photoCount || ''} {selected?.photoCount === 1 ? 'photo' : 'photos'}<span aria-hidden="true">↓</span></button>
    </div>
  </div>;
}
