import { forwardRef } from 'react';
import ForestArt from './ForestArt.jsx';
import GamePreview from './GamePreview.jsx';
import ProjectImage from './ProjectImage.jsx';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useIsPresent, useReducedMotion } from 'motion/react';
import { easeOut, quickTransition, revealTransition } from '../motion.js';

const ProjectCard = forwardRef(function ProjectCard({ project, number = 1 }, ref) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const tags = project.tags || [];
  const details = project.details || [];
  const images = project.images || [];
  const hasPreview = ['gridgame', 'minesweeper'].includes(project.preview);
  const hasLinks = Boolean(project.sourceUrl || project.liveUrl);
  return <motion.article ref={ref} className="project-card overflow-hidden" inert={!present || undefined} aria-hidden={!present || undefined} layout={reduced ? false : 'position'} initial={reduced ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .1 }} exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: .16, ease: easeOut } }} transition={reduced ? { duration: 0 } : { ...revealTransition, layout: quickTransition }}>
    <div className={`project-art${hasPreview ? ' project-art-demo' : images.length ? ` project-art-image${images[0].cover ? ' project-art-cover' : ''}` : ''}`} style={images[0]?.background ? { background: images[0].background } : undefined} aria-hidden="true">
      {hasPreview ? <GamePreview kind={project.preview} /> : images.length ? <ProjectImage image={images[0]} fit={images[0].cover ? 'cover' : 'contain'} /> : <ForestArt compact pink={number % 2 === 0} />}
    </div>
    <div className="project-content">
      {project.category && <p className="card-category">{project.category}</p>}<h3 className="font-heading">{project.title}</h3><p className="project-summary">{project.description}</p>
      {tags.length > 0 && <ul className="tags" aria-label="Project technologies">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
      <Dialog.Root>
        <Dialog.Trigger asChild><button className="quest-details font-ui" type="button" aria-label={`Details for ${project.title}`}>Details </button></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="quest-overlay" />
          <Dialog.Content className="quest-dialog project-dialog">
            {project.category && <p className="card-category">{project.category}</p>}
            <Dialog.Title>{project.title}</Dialog.Title>
            <Dialog.Description className="project-dialog-description">{project.description}</Dialog.Description>
            {hasPreview && <div className="project-demo-gallery"><GamePreview kind={project.preview} /></div>}
            {images.length > 0 && <div className="project-image-gallery">{images.map(image => <figure key={image.src} style={image.background ? { background: image.background } : undefined}><ProjectImage image={image} alt={image.alt || project.title} /></figure>)}</div>}
            {details.length > 0 && <ul className="project-detail-list">{details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul>}
            {tags.length > 0 && <ul className="tags" aria-label="Project technologies">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
            {hasLinks && <div className="project-links">
              {project.sourceUrl && <a className="button button-primary" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Source code</a>}
              {project.liveUrl && <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noopener noreferrer">View project</a>}
            </div>}
            <Dialog.Close className="quest-close" aria-label="Close project details">&#215;</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </motion.article>;
});

export default ProjectCard;
