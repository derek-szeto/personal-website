export default function Footer({ name, onReplayIntro }) {
  return <footer className="site-container site-footer"><p>&copy; {new Date().getFullYear()} {name}</p><div className="footer-actions">{onReplayIntro && <button className="intro-replay" type="button" onClick={onReplayIntro} aria-label="Replay intro" title="Replay intro">&#8635;</button>}<a className="text-link" href="#home">Top &#8593;</a></div></footer>;
}
