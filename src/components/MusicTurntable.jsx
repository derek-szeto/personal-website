export default function MusicTurntable({ artwork, hasTrack = false, playing = false, spinning = false }) {
  return <div className="music-turntable" data-playing={playing} data-spinning={spinning} data-has-track={hasTrack} aria-hidden="true">
    <span className="music-platter-orbit" />
    <div className="music-vinyl">
      <div className="music-vinyl-spin"><span className="music-vinyl-label"><i /></span></div>
      <span className="music-vinyl-shine" />
    </div>
    <div className="music-album-sleeve">
      {artwork ? <img src={artwork} alt="" loading="lazy" decoding="async" /> : <span className="music-sleeve-placeholder"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="5.5" cy="18" rx="3.5" ry="2.5" /><ellipse cx="16.5" cy="16" rx="3.5" ry="2.5" /></svg></span>}
    </div>
    <span className="music-tonearm"><i /></span>
    <span className="music-deck-light" />
  </div>;
}
