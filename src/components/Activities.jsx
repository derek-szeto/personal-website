import { useId } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Section from './Section.jsx';

function EntryName({ title, url }) {
  return url ? <a className="activity-title-link" href={url} target="_blank" rel="noopener noreferrer">{title}</a> : title;
}

function ActivityCard({ activity }) {
  const details = Array.isArray(activity.details) ? activity.details.filter(Boolean) : [];
  const links = Array.isArray(activity.links) ? activity.links.filter(link => link?.label && link?.url) : [];
  const hasDetails = details.length > 0 || links.length > 0;
  const dialogLinks = [...links];
  if (activity.url && !dialogLinks.some(link => link.url === activity.url)) dialogLinks.unshift({ label: 'Website', url: activity.url });

  return <article className="activity-card">
    <div className="activity-card-heading"><h3><EntryName title={activity.title} url={activity.url} /></h3></div>
    {activity.highlight && <span className="activity-highlight">{activity.highlight}</span>}
    {activity.description && <p>{activity.description}</p>}
    {hasDetails && <Dialog.Root>
      <Dialog.Trigger asChild><button className="quest-details activity-details font-ui" type="button" aria-label={`Details for ${activity.title}`}>Details </button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="quest-overlay" />
        <Dialog.Content className="quest-dialog activity-dialog">
          <Dialog.Title>{activity.title}</Dialog.Title>
          <Dialog.Description className="activity-dialog-description">{activity.description}</Dialog.Description>
          {details.length > 0 && <ul className="activity-detail-list">{details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul>}
          {dialogLinks.length > 0 && <div className="activity-detail-links">{dialogLinks.map(link => <a className="button button-primary" key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} </a>)}</div>}
          <Dialog.Close className="quest-close" type="button" aria-label="Close activity details">&#215;</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>}
  </article>;
}

export default function Activities({ activities = [], honors = [] }) {
  const recognitionId = useId();
  return <Section id="activities" title="Activities">
    <ul className="activities-grid">
      {activities.map(activity => <li key={activity.id}><ActivityCard activity={activity} /></li>)}
    </ul>
    {honors.length > 0 && <section className="activity-recognition" aria-labelledby={recognitionId}>
      <h3 id={recognitionId}>Recognition</h3>
      <ul className="honors-grid">{honors.map(honor => <li key={honor.id}><article className="activity-card recognition-card"><h4><EntryName title={honor.title} url={honor.url} /></h4>{honor.description && <p>{honor.description}</p>}</article></li>)}</ul>
    </section>}
  </Section>;
}
