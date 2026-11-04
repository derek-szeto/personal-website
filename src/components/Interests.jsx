function PreferenceIcon({ dislike }) {
  return <svg className="preference-thumb" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" data-icon={dislike ? 'thumbs-down' : 'thumbs-up'} aria-hidden="true" focusable="false">
    <g transform={dislike ? 'rotate(180 12 12)' : undefined}><path d="m8 10 4-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.4l-1.5 7a2 2 0 0 1-2 1.6H8Z" /><rect x="3" y="10" width="5" height="10" rx="1" /></g>
  </svg>;
}

export default function Interests({ interests }) {
  return (
      <div className="interests-grid preference-grid">
        {interests.map(interest => (
          <article className="interest-card preference-card border border-line bg-panel shadow-magic" key={interest.id} data-preference={interest.id} data-color={interest.id === 'dislikes' ? 'rose' : 'mint'}>
            <h2 className="font-heading">{interest.title}</h2>
            {interest.items.length ? (
              <ul className="preference-list">{interest.items.map(item => <li key={item}><span className="preference-icon"><PreferenceIcon dislike={interest.id === 'dislikes'} /></span><span className="preference-item-label">{item}</span></li>)}</ul>
            ) : <p>Coming soon.</p>}
          </article>
        ))}
      </div>
  );
}
