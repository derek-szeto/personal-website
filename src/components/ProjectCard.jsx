import ForestArt from './ForestArt.jsx';
import Arrow from './Arrow.jsx';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'motion/react';
export default function ProjectCard({ project, number }) {
  const reduced = useReducedMotion();
  return <motion.article className="project-card overflow-hidden border border-line bg-panel shadow-magic" layout initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={reduced ? undefined : { y: -6 }} transition={{ duration: .25 }}>
    <div className="project-art" aria-hidden="true">
      <ForestArt compact pink={number % 2 === 0} />
    </div>
    <div className="project-content p-6">
      {project.category && <p className="card-category">{project.category}</p>}<h3 className="font-sans text-lg font-medium">{project.title}</h3><p>{project.description}</p>
      <ul className="tags" aria-label="Project technologies or interests">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <Dialog.Root>
        <Dialog.Trigger asChild><button className="quest-details font-mono" type="button">Details <Arrow /></button></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="quest-overlay" />
          <Dialog.Content className="quest-dialog">
            <Dialog.Title>{project.title}</Dialog.Title>
            <Dialog.Description>{project.description}</Dialog.Description>
            <p className="card-category">{project.category}</p>
            <ul className="tags" aria-label="Project technologies or interests">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            <div className="project-links">
              {project.sourceUrl && <a className="button button-primary" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Source code &#8599;</a>}
              {project.liveUrl && <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noopener noreferrer">View project &#8599;</a>}
              {!project.sourceUrl && !project.liveUrl && <p className="placeholder-label">Links coming soon.</p>}
            </div>
            <Dialog.Close className="quest-close" aria-label="Close project details">&#215;</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </motion.article>;
}