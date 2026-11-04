import * as Dialog from '@radix-ui/react-dialog';
import Section from './Section.jsx';

function PhotoPlaceholder({ category }) {
  return <svg viewBox="0 0 320 240" aria-hidden="true" className="photo-placeholder-art" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle className="photo-placeholder-orbit" cx="160" cy="120" r="70" strokeDasharray="3 10" />
    {category === 'Travel' ? <><path d="m94 154 42-72 35 58 20-34 35 48Z" /><path d="m122 107 14 10 11-10" /><circle cx="198" cy="80" r="13" /></> : category === 'Friends' ? <><circle cx="137" cy="99" r="15" /><circle cx="186" cy="104" r="13" /><path d="M107 155v-11a30 30 0 0 1 60 0v11m8-29a25 25 0 0 1 37 22v7" /><path d="m155 73 5-6 5 6" /></> : <><path d="M108 96h27l9-13h33l9 13h26v62H108Z" /><circle cx="160" cy="126" r="20" /><path d="M191 106h9" /></>}
    <path d="M232 66v12m-6-6h12M87 170v8m-4-4h8" />
  </svg>;
}

export default function Photos({ photos }) {
  const hasPhotos = photos.some(photo => photo.src);
  return <Section id="photos" title="Photos">
    {!hasPhotos && <p className="photo-coming-soon">Coming soon.</p>}
    <div className="photo-grid">
      {photos.map(photo => <figure className="photo-card border border-line bg-panel" data-category={photo.category.toLowerCase()} key={photo.id}>
        {photo.src ? <Dialog.Root>
          <Dialog.Trigger asChild><button className="photo-open" type="button" aria-label={`View photo: ${photo.caption}`}><img src={photo.src} alt={photo.alt || photo.caption} loading="lazy" decoding="async" /><span className="photo-expand" aria-hidden="true">&#8599;</span></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="quest-overlay" /><Dialog.Content className="photo-lightbox" aria-describedby={undefined}>
            <Dialog.Title className="visually-hidden">{photo.caption}</Dialog.Title>
            <img src={photo.src} alt={photo.alt || photo.caption} />
            <p className="photo-lightbox-caption">{photo.caption}{photo.location && <span>{photo.location}</span>}</p>
            <Dialog.Close className="quest-close" aria-label="Close photo">&#215;</Dialog.Close>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root> : <div className="photo-placeholder"><PhotoPlaceholder category={photo.category} /></div>}
        <figcaption>{photo.caption}{photo.location && <span>{photo.location}</span>}</figcaption>
      </figure>)}
    </div>
  </Section>;
}