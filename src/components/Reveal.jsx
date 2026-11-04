import { motion, useReducedMotion } from 'motion/react';
import { revealTransition } from '../motion.js';

export default function Reveal({ as = 'div', children, delay = 0, ...props }) {
  const reduced = useReducedMotion();
  const Element = motion[as];
  return <Element {...props}
    initial={reduced ? false : { opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: .12 }}
    transition={reduced ? { duration: 0 } : { ...revealTransition, delay }}>
    {children}
  </Element>;
}
