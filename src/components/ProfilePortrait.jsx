export default function ProfilePortrait({ photo }) {
  if (!photo?.src) return null;
  return <figure className="profile-portrait"><img src={photo.src} alt={photo.alt || 'Portrait.'} width="919" height="1015" loading="lazy" decoding="async" /></figure>;
}
