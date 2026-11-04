export default function ProjectImage({ image, alt = '', fit = 'contain' }) {
  const crop = image.crop;
  const cropped = crop && [crop.x, crop.y, crop.width, crop.height, image.width, image.height].every(Number.isFinite)
    && crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0
    && crop.x + crop.width <= image.width && crop.y + crop.height <= image.height;

  // Frame screenshot artwork in the layout while keeping the supplied file intact.
  if (cropped) return <svg className="project-cropped-image" viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} width={crop.width} height={crop.height} preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={!alt || undefined}>
    <image href={image.src} width={image.width} height={image.height} preserveAspectRatio="none" />
  </svg>;

  return <img src={image.src} alt={alt} width={image.width} height={image.height} loading="lazy" decoding="async" />;
}
