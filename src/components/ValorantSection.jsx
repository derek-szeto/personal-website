import { useId, useState } from 'react';

// Brand glyph from Simple Icons (CC0):
// https://github.com/simple-icons/simple-icons/blob/develop/icons/valorant.svg
function ValorantMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M23.792 2.152a.252.252 0 0 0-.098.083c-3.384 4.23-6.769 8.46-10.15 12.69-.107.093-.025.288.119.265 2.439.003 4.877 0 7.316.001a.66.66 0 0 0 .552-.25c.774-.967 1.55-1.934 2.324-2.903a.72.72 0 0 0 .144-.49c-.002-3.077 0-6.153-.003-9.23.016-.11-.1-.206-.204-.167zM.077 2.166c-.077.038-.074.132-.076.205.002 3.074.001 6.15.001 9.225a.679.679 0 0 0 .158.463l7.64 9.55c.12.152.308.25.505.247 2.455 0 4.91.003 7.365 0 .142.02.222-.174.116-.265C10.661 15.176 5.526 8.766.4 2.35c-.08-.094-.174-.272-.322-.184z" /></svg>;
}

const displayValue = value => value == null || value === '' ? '\u2014' : value;

function RankIcon({ image }) {
  const [failed, setFailed] = useState(false);
  return image && !failed
    ? <img className="valorant-rank-icon" src={image} alt="" aria-hidden="true" width="56" height="56" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    : <span className="valorant-rank-icon valorant-rank-icon--empty" aria-hidden="true"><ValorantMark /></span>;
}

function RankStat({ label, rank, image }) {
  return <div className="valorant-stat"><span>{label}</span><div className="valorant-stat-content"><RankIcon key={image || rank || 'pending'} image={image} /><strong>{displayValue(rank)}</strong></div></div>;
}

function AgentArt({ agent }) {
  const [failed, setFailed] = useState(false);
  return agent.image && !failed
    ? <img className="valorant-agent-image" src={agent.image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    : <svg className="valorant-agent-placeholder" viewBox="0 0 160 190" aria-hidden="true" fill="none"><path d="m80 28 24 10 7 27-13 28H62L49 65l7-27Z" fill="currentColor" opacity=".15" /><path d="m62 94-31 18-14 59h126l-14-59-31-18-18 17Z" fill="currentColor" opacity=".1" /><path d="M80 17v8m0 150v8M13 99h9m116 0h9M48 22h-15v15m79-15h15v15M33 152v15h15m64 0h15v-15" stroke="currentColor" opacity=".35" /><path d="m56 38 24-10 24 10 7 27-13 28H62L49 65Z" stroke="currentColor" opacity=".2" /></svg>;
}

function PlayerIdentity({ player, riotId }) {
  const [failed, setFailed] = useState(false);
  const [fallbackName, fallbackTag] = (riotId || '').split('#');
  const name = player.name || fallbackName || 'Player profile';
  const tag = player.tag || fallbackTag;
  return <div className="valorant-player">
    <div className="valorant-player-card">
      {player.cardImage && !failed ? <img src={player.cardImage} alt={`${player.cardName || 'VALORANT'} player card for ${name}${tag ? `#${tag}` : ''}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <><ValorantMark className="valorant-player-card-mark" /><span>Coming soon</span></>}
    </div>
    <div className="valorant-player-identity"><span className="valorant-player-label">RIOT ID</span><h3>{name}{tag && <span>#{tag}</span>}</h3>{player.title && <p>{player.title}</p>}</div>
  </div>;
}

function AgentCard({ agent }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const nameId = `${id}-name`;
  const statsId = `${id}-stats`;
  return <article className={`valorant-agent${agent.placeholder ? ' is-placeholder' : ''}${expanded ? ' is-expanded' : ''}`}>
    <button className="valorant-agent-toggle" type="button" aria-expanded={expanded} aria-controls={statsId} aria-label={`${expanded ? 'Hide stats' : 'View stats'} for ${agent.name}`} onClick={() => setExpanded(value => !value)}>
      <span className="valorant-agent-art"><AgentArt agent={agent} /></span>
      <span className="valorant-agent-copy"><span className="valorant-agent-name" id={nameId}>{agent.name}</span>{agent.role && <span className="valorant-agent-role">{agent.role}</span>}<span className="valorant-agent-action">{expanded ? 'Hide stats' : 'View stats'}<span aria-hidden="true">{expanded ? '\u2212' : '+'}</span></span></span>
    </button>
    <div className="valorant-agent-details" id={statsId} role="region" aria-labelledby={nameId} aria-hidden={!expanded}>
      <div className="valorant-agent-details-inner"><dl className="valorant-agent-stat-grid">
        <div><dt>Hours played</dt><dd>{displayValue(agent.hours)}</dd></div>
        <div><dt>Lifetime kills</dt><dd>{displayValue(agent.lifetimeKills)}</dd></div>
        <div><dt>Best map</dt><dd>{displayValue(agent.bestMap)}</dd></div>
      </dl></div>
    </div>
  </article>;
}

export default function ValorantSection({ valorant = {}, player }) {
  const agents = valorant.agents?.length ? valorant.agents : [1, 2].map(number => ({ id: `placeholder-${number}`, name: 'Agent', placeholder: true }));
  const identity = player || valorant.player || {};
  return <section className="valorant-panel" id="interest-valorant" aria-labelledby="valorant-title">
    <ValorantMark className="valorant-watermark" />
    <header className="valorant-heading"><div className="valorant-heading-brand"><ValorantMark className="valorant-logo" /><h2 id="valorant-title">VALORANT</h2></div><span className="valorant-heading-label">COMPETITIVE PROFILE</span></header>
    <div className="valorant-introduction"><h3>My VALORANT story</h3><p>{valorant.introduction || 'Introduction coming soon.'}</p></div>
    <PlayerIdentity key={identity.cardImage || 'pending'} player={identity} riotId={valorant.riotId} />
    <div className="valorant-overview">
      <div className="valorant-stats">
        <RankStat label="Current rank" rank={valorant.currentRank} image={valorant.currentRankImage} />
        <RankStat label="Peak rank" rank={valorant.peakRank} image={valorant.peakRankImage} />
        <div className="valorant-stat valorant-earnings"><span>Earnings</span><div className="valorant-stat-content"><strong>{displayValue(valorant.earnings)}</strong></div></div>
      </div>
      {valorant.rankDescription && <p className="valorant-rank-description">{valorant.rankDescription}</p>}
    </div>
    {valorant.trackerUrl && <a className="valorant-tracker" href={valorant.trackerUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${valorant.riotId || 'my profile'} on Tracker.gg (opens in a new tab)`}>
      <span className="valorant-tracker-mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16h16M8 14l4-5 4 3 4-7" /><path d="M16 5h4v4" /></svg></span>
      <span className="valorant-tracker-copy"><strong>Tracker.gg</strong><span>{valorant.riotId}</span></span>
      <span className="valorant-tracker-action">View profile<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4 10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></svg></span>
    </a>}
    <div className="valorant-agents-heading"><h3>Most-played agents</h3><span aria-hidden="true">// AGENT ROSTER</span></div>
    <div className="valorant-agents">{agents.map((agent, index) => <AgentCard key={agent.id || agent.name || index} agent={agent} />)}</div>
    <div className="valorant-experience"><div className="valorant-experience-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v7m-4 1h8" /></svg></div><div><h3>Competitive experience</h3><p>{valorant.experience || 'Details coming soon.'}</p></div></div>
  </section>;
}
