import { useId } from 'react';

export default function CurrentClasses({ courses = [] }) {
  const headingId = useId();
  if (!courses.length) return null;

  return <section className="about-courses" aria-labelledby={headingId}>
    <h3 id={headingId}>Current classes</h3>
    <ul className="about-course-list">
      {courses.map(course => <li key={course}>{course}</li>)}
    </ul>
  </section>;
}
