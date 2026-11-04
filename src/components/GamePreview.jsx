import { useEffect, useId, useRef, useState } from 'react';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';

const slidingBlocks = [
  { x: 72, y: 42, size: 46, color: '#70dcff', duration: 13, delay: -3, reverse: false },
  { x: 348, y: 51, size: 30, color: '#ff94cf', duration: 17, delay: -9, reverse: true },
  { x: 452, y: 118, size: 58, color: '#96e6d2', duration: 16, delay: -5, reverse: false },
  { x: 200, y: 151, size: 68, color: '#6baeff', duration: 19, delay: -12, reverse: true },
  { x: 54, y: 249, size: 32, color: '#c4a4fa', duration: 12, delay: -7, reverse: false },
  { x: 366, y: 247, size: 42, color: '#f6a2ce', duration: 15, delay: -2, reverse: true },
];

function SlidingBlocks({ id }) {
  return <svg className="game-preview-scene" viewBox="0 0 600 320" role="img" aria-label="Colored blocks sliding smoothly across the screen.">
    <defs><clipPath id={`${id}-blocks`}><rect width="600" height="320" /></clipPath></defs>
    <g clipPath={`url(#${id}-blocks)`}>{slidingBlocks.map((block, index) => <g key={index} transform={`translate(${block.x} ${block.y})`} style={{ color: block.color }}>
      <g className="grid-sliding-block" style={{ '--block-from': `${-block.x - block.size - 50}px`, '--block-to': `${650 - block.x}px`, '--block-duration': `${block.duration}s`, '--block-delay': `${block.delay}s`, '--block-direction': block.reverse ? 'reverse' : 'normal' }}>
        <rect className="grid-sliding-face" width={block.size} height={block.size} rx="4" />
      </g>
    </g>)}</g>
  </svg>;
}

const MINE_COLUMNS = 10;
const MINE_ROWS = 6;
const MINES = new Set([8, 17, 24, 35, 42, 58]);
const FLAGS = new Set([8, 58]);
const OPEN_CELLS = new Set([0, 1, 10, 11, 20]);
function neighboringMines(index) {
  const row = Math.floor(index / MINE_COLUMNS), column = index % MINE_COLUMNS;
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const r = row + dy, c = column + dx;
    if ((dx || dy) && r >= 0 && r < MINE_ROWS && c >= 0 && c < MINE_COLUMNS && MINES.has(r * MINE_COLUMNS + c)) count++;
  }
  return count;
}

function Bomb() {
  return <g className="mine-bomb"><path d="M-11 0h22M0-11v22m-8-8L8 8M-8 8 8-8" /><circle r="7" /><circle className="mine-bomb-glint" cx="-2.5" cy="-2.5" r="2" /></g>;
}

function Explosion({ x, y, delay }) {
  const sparks = [[-36,-27],[8,-42],[38,-18],[43,15],[19,39],[-21,36],[-43,7],[-13,-34]];
  return <g className="mine-explosion" transform={`translate(${x} ${y})`} style={{ '--blast-delay': `${delay}s` }}>
    <circle className="mine-blast-ring" r="24" />
    <path className="mine-blast-core" d="m0-22 7 12 13-8-4 15 14 5-15 6 7 14-15-5-7 14-6-15-15 6 6-15-15-5 15-6-5-14 14 6Z" />
    {sparks.map(([dx,dy], index) => <g className="mine-blast-spark" key={index} style={{ '--spark-x': `${dx}px`, '--spark-y': `${dy}px` }}><rect x="-3" y="-3" width={index % 2 ? 5 : 7} height={index % 2 ? 5 : 7} rx="1" /></g>)}
  </g>;
}

function MineArena() {
  return <svg className="game-preview-scene" viewBox="0 0 600 320" role="img" aria-label="Animated Minesweeper preview with numbered tile reveals, flagged mines, and small chain-reaction explosions.">
    <rect className="mine-board-frame" x="91" y="31" width="418" height="258" rx="10" />
    {Array.from({ length: MINE_COLUMNS * MINE_ROWS }, (_, index) => {
      const row = Math.floor(index / MINE_COLUMNS), column = index % MINE_COLUMNS;
      const number = MINES.has(index) ? 0 : neighboringMines(index);
      const flag = FLAGS.has(index);
      return <g key={index} transform={`translate(${100 + column * 40} ${40 + row * 40})`}>
        <rect className={`mine-open-tile${index === 35 ? ' mine-hit-tile' : ''}`} width="38" height="38" rx="3" />
        {MINES.has(index) ? <g transform="translate(19 19)"><Bomb /></g> : number > 0 ? <text className={`mine-number mine-number-${number}`} x="19" y="20">{number}</text> : null}
        {!OPEN_CELLS.has(index) && <g className={`mine-cover${flag ? ' mine-cover-flag' : MINES.has(index) ? ' mine-cover-bomb' : ` mine-reveal-${Math.min(2, Math.floor(column / 4))}`}`}><rect className="mine-closed-tile" width="38" height="38" rx="3" /><path className="mine-bevel" d="M3 34V3h31" />{flag && <g transform="translate(19 19)"><path className="mine-flag-pole" d="M0-11v22m-7 0H7" /><path className="mine-flag" d="M0-11 11-5 0 0Z" /></g>}</g>}
      </g>;
    })}
    <g className="mine-cursor"><path d="M0 0v24l6-6 5 10 6-3-5-10h9Z" /></g>
    <Explosion x={319} y={179} delay={0} />
    <Explosion x={279} y={139} delay={.9} />
    <Explosion x={399} y={99} delay={1.8} />
    <path className="mine-side-trace" d="M48 85v65h25m454 40h25v45M43 75h10m494 170h10" />
  </svg>;
}

export default function GamePreview({ kind }) {
  const id = useId();
  const root = useRef(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = !('IntersectionObserver' in window);
    const sync = () => setRunning(visible && !document.hidden && !media.matches && !isAmbientPaused());
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting === true; sync(); }, { threshold: 0 }) : null;
    if (root.current) observer?.observe(root.current);
    const unsubscribe = subscribeAmbientPaused(sync);
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer?.disconnect(); unsubscribe(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const grid = kind === 'gridgame';
  return <div ref={root} className={`game-preview game-preview-${kind}`} data-running={running}>
    <div className="game-preview-stage">{grid ? <SlidingBlocks id={id} /> : <MineArena />}</div>
  </div>;
}
