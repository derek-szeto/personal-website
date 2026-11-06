import * as Dialog from '@radix-ui/react-dialog';
import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import Section from './Section.jsx';
import TravelGlobe from './TravelGlobe.jsx';
import { easeOut } from '../motion.js';

const photoRatio = ({ width, height }) => width > 0 && height > 0 ? width / height : 1;

function PhotoPlaceholder({ category }) {
  return <svg viewBox="0 0 320 240" aria-hidden="true" className="photo-placeholder-art" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle className="photo-placeholder-orbit" cx="160" cy="120" r="70" strokeDasharray="3 10" />
    {category === 'Travel' ? <><path d="m94 154 42-72 35 58 20-34 35 48Z" /><path d="m122 107 14 10 11-10" /><circle cx="198" cy="80" r="13" /></> : category === 'Friends' ? <><circle cx="137" cy="99" r="15" /><circle cx="186" cy="104" r="13" /><path d="M107 155v-11a30 30 0 0 1 60 0v11m8-29a25 25 0 0 1 37 22v7" /><path d="m155 73 5-6 5 6" /></> : <><path d="M108 96h27l9-13h33l9 13h26v62H108Z" /><circle cx="160" cy="126" r="20" /><path d="M191 106h9" /></>}
    <path d="M232 66v12m-6-6h12M87 170v8m-4-4h8" />
  </svg>;
}

function PhotoCard({ photo, showCaption = true }) {
  const ratio = photoRatio(photo);
  const label = [photo.caption, photo.location].filter(Boolean).join(', ');
  return <figure className={`photo-card${photo.src ? ' is-interactive' : ''}`} data-category={photo.category.toLowerCase()} style={{ '--photo-ratio': ratio }}>
        {photo.src ? <Dialog.Root>
          <Dialog.Trigger asChild><button className="photo-open" type="button" aria-label={`View photo: ${label}`}><img src={photo.src} alt={photo.alt || photo.caption} width={photo.width} height={photo.height} loading="lazy" decoding="async" /></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="quest-overlay" /><Dialog.Content className="photo-lightbox" aria-describedby={undefined}>
            <Dialog.Title className="visually-hidden">{photo.caption}</Dialog.Title>
            <img src={photo.src} alt={photo.alt || photo.caption} width={photo.width} height={photo.height} />
            <p className="photo-lightbox-caption">{photo.caption}{photo.location && <span>{photo.location}</span>}</p>
            <Dialog.Close className="quest-close" aria-label="Close photo">&#215;</Dialog.Close>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root> : <div className="photo-placeholder"><PhotoPlaceholder category={photo.category} /></div>}
        {showCaption && <figcaption>{photo.caption}{photo.location && <span>{photo.location}</span>}</figcaption>}
      </figure>;
}

export function VacationGallery({ album, headingId }) {
  return <section className={`vacation-album${album.photos.length === 1 ? ' is-solo' : ''}`} aria-labelledby={headingId} data-trip={album.trip} style={{ '--album-ratio': photoRatio(album.photos[0]) }}>
    <header className="vacation-album-heading"><h4 id={headingId}>{album.trip}{' '}<span className="vacation-photo-count">{album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}</span></h4>{album.period && <p>{album.period}</p>}</header>
    <div className="vacation-grid" data-count={album.photos.length}>{album.photos.map(photo => <PhotoCard key={photo.id} photo={photo} showCaption={false} />)}</div>
  </section>;
}

function VacationAlbumTransition({ album, headingId, reduced }) {
  const present = useIsPresent();
  return <motion.div inert={!present || undefined} aria-hidden={!present || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .24, ease: easeOut }}>
    <VacationGallery album={album} headingId={headingId} />
  </motion.div>;
}

const emptyDestinations = [];

export function groupVacationAlbums(photos) {
  return [...photos.filter(photo => photo.category === 'Travel').reduce((groups, photo) => {
    const trip = photo.trip?.trim() || photo.location?.trim() || 'Travel';
    const period = photo.period?.trim() || '';
    const key = JSON.stringify([trip, period]);
    if (!groups.has(key)) groups.set(key, { key, trip, period, photos: [] });
    groups.get(key).photos.push(photo);
    return groups;
  }, new Map()).values()];
}

export default function Photos({ photos = [], destinations = emptyDestinations }) {
  const albumId = useId();
  const reduced = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState(null);
  const hasPhotos = photos.some(photo => photo.src);
  const plushies = photos.filter(photo => photo.category === 'Plushies');
  const friends = photos.filter(photo => photo.category === 'Friends');
  const otherPhotos = photos.filter(photo => !['Travel', 'Friends', 'Plushies'].includes(photo.category));
  const albums = useMemo(() => groupVacationAlbums(photos), [photos]);
  const places = useMemo(() => albums.map(album => {
    const place = destinations.find(destination => destination.trip === album.trip);
    return { ...place, id: album.key, label: place?.label || album.trip, color: place?.color || '#71dcff', period: album.period, photoCount: album.photos.length };
  }), [albums, destinations]);
  const selectedAlbum = albums.find(album => album.key === selectedKey) || albums[0];
  const galleryId = `${albumId}-vacation-gallery`;
  return <Section id="photos" title="Photos">
    <div className="photo-collections">
    {!hasPhotos && <p className="photo-coming-soon">Coming soon.</p>}
    {albums.length > 0 && <section className="vacation-area" id="vacations" aria-labelledby="vacations-title">
      <h3 id="vacations-title">Vacation</h3>
      <TravelGlobe destinations={places} selectedId={selectedAlbum.key} onSelect={setSelectedKey} galleryId={galleryId} />
      <p className="visually-hidden" role="status">Showing {selectedAlbum.trip}{selectedAlbum.period ? `, ${selectedAlbum.period}` : ''}: {selectedAlbum.photos.length} {selectedAlbum.photos.length === 1 ? 'photo' : 'photos'}.</p>
      <div className="vacation-selected-gallery" id={galleryId} tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}><VacationAlbumTransition key={selectedAlbum.key} album={selectedAlbum} headingId={`${albumId}-selected-trip`} reduced={reduced} /></AnimatePresence>
      </div>
    </section>}
    {friends.length > 0 && <section className="photo-friends-area" aria-labelledby="photo-friends-title">
      <h3 id="photo-friends-title">Friends</h3>
      <div className="photo-grid">{friends.map(photo => <PhotoCard key={photo.id} photo={photo} />)}</div>
    </section>}
    {otherPhotos.length > 0 && <div className="photo-grid photo-other-grid">{otherPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}</div>}
    {plushies.length > 0 && <section className="plushies-area" id="plushies" aria-labelledby="plushies-title">
      <h3 id="plushies-title">Plushies</h3>
      <div className="plushies-grid">{plushies.map(photo => <PhotoCard key={photo.id} photo={photo} showCaption={false} />)}</div>
    </section>}
    </div>
  </Section>;
}
