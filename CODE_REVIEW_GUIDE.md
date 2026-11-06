# Derek's code review practice guide

The goal is to explain a feature, find the code that controls it, and make one small change while predicting the result. You do not need to memorize every line.

## 1. A short explanation of the project

"This is a React portfolio. I split the interface into reusable components and keep most of my content in JavaScript data objects. App passes that data into components through props. State handles things that change, like filters and expanded agent stats. Effects handle browser events, timers, and API requests. Motion, CSS, and React Three Fiber handle different kinds of animation."

Trace the startup: `index.html` contains `#root`; `src/main.jsx` calls `createRoot(...).render(<App />)`; `src/App.jsx` assembles the components.

## 2. The files to learn first

| File | What to point out | A change to practice |
| --- | --- | --- |
| `src/main.jsx` | React mounts the component tree; global CSS is imported here. `StrictMode` helps reveal development problems. | Find the root element in `index.html`. |
| `src/App.jsx` | Parent component, props, conditional page rendering, hash navigation, and intro state. | Find where About, Activities, Photos, Projects, and Skills are rendered. |
| `src/data/siteData.js` | Arrays and objects for the profile, projects, activities, interests, agents, and photos. | Change a sentence, add a course, or add a project. |
| `src/components/About.jsx` and `CurrentClasses.jsx` | Destructured props, reusable components, `.map()`, and conditional rendering. | Change a heading or add a short paragraph. |
| `src/components/ProjectsPage.jsx` | Controlled inputs, `useState`, `.filter()`, derived results, and reset handlers. | Start on Games or change the search placeholder. |
| `src/components/ProjectCard.jsx` | One component reused with different data; maps tags; Radix opens a details dialog. | Change the Details button label for every project. |
| `src/components/ValorantSection.jsx` | The small `AgentCard` component is a clear example of state and event handling. | Make cards initially expanded. |

`src/styles/app.css` imports the stylesheet files. For specific changes, edit the component stylesheet: `about.css`, `music.css`, `grove-directory.css`, and so on. Theme color variables are in `cyber.css`; shared fonts and sizes are in `typography.css`.

## 3. Explain a component using real code

In `CurrentClasses.jsx`:

```jsx
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
```

- A component is a function that returns JSX describing the interface.
- `courses` is a prop supplied by its parent. The default `[]` handles an omitted prop.
- JSX uses `{...}` to insert JavaScript expressions into markup.
- `.map()` turns each course into a list item.
- `key` gives each sibling a stable identity when React updates a list. Project cards use `project.id` as their key. Keep IDs unique and stable.
- `if (!courses.length) return null` hides the whole component if there are no courses.
- `export default` lets another file import this component. Named exports such as `profile` are imported with braces.

The data flow is: `siteData.js` defines `profile.courses`; `App` passes it to `About`; `About` passes it to `CurrentClasses`.

## 4. Explain state and events

In `AgentCard` inside `ValorantSection.jsx`:

```jsx
const [expanded, setExpanded] = useState(false);
// The button uses:
onClick={() => setExpanded(value => !value)}
```

"State remembers whether this card is expanded. Clicking the button uses the previous value to calculate the next value. React renders the component again, and the new class name and accessibility attributes describe its expanded state. CSS animates the panel opening. Each AgentCard has its own state."

Do not write `expanded = true`. Use the setter so React can schedule an update. A normal local variable resets on the next render and does not request a render when changed.

In `ProjectsPage.jsx`:

```jsx
const [query, setQuery] = useState('');
// The existing input has:
value={query}
onChange={event => setQuery(event.target.value)}
```

"This is a controlled input. Its displayed value comes from React state. Typing updates that state. The component calculates `filtered` from the current query, category, and technology, then maps the results into ProjectCards. `filtered` does not need separate state because it can be calculated from existing state and props."

## 5. Common changes a teacher could request

### Change content or add a course

Edit the relevant value in `src/data/siteData.js`:

```js
introduction: 'I enjoy building apps and games.',
courses: ['Mobile Application Development', 'Multivariable Calculus', 'AP Statistics', 'Physics'],
```

Prediction: all components receiving those profile values display the updated data. The new course appears through the existing `.map()`; you do not manually add an `<li>`.

### Add a project

Add an object to the `projects` array in `siteData.js`, following the existing objects:

```js
{
  id: 'weather-app',
  title: 'Weather App',
  description: 'An app that displays a weather forecast.',
  details: ['Fetches weather data and displays the results.'],
  tags: ['React', 'API'],
  category: 'Apps & tools',
  sourceUrl: '',
  liveUrl: '',
},
```

Prediction: a ProjectCard appears on the full Projects page; React is added to the technology choices because they are derived from project tags. Use one of the existing category names. Home shows only projects marked `featured: true`, with a maximum of two in the current App code.

### Change the starting filter

In `ProjectsPage.jsx`, change:

```jsx
const [category, setCategory] = useState('Games');
```

Prediction: the page initially shows Games. The current Reset filters handler still resets to All. If the teacher wants Reset to return to Games too, change its `setCategory('All')` line as well.

### Change the initial agent state

In `AgentCard`, change `useState(false)` for `expanded` to `useState(true)`.

Prediction: each agent card starts open, and the existing click handler still toggles it.

### Rearrange or hide a section

Find the component calls in `App.jsx`. Moving the `<Activities ... />` call above `<About ... />` changes their order. To temporarily hide Activities, wrap its existing call in a JSX comment: `{/* ... */}`. Its navigation links may also need updating if the section is removed permanently.

### Change alignment or colors

The portrait/biography columns are controlled by `.about-story.about-story-with-portrait` in `profile-portrait.css`. `align-items: start` aligns their tops. `grid-template-columns` sets their widths; `gap` sets the space between them. The mobile media query changes them to a single column.

For theme changes, edit the relevant variable in both `:root` and `:root[data-theme=dark]` in `cyber.css`. Variables allow many components to use the same colors consistently.

## 6. Know the three animation systems

| System | Files | How it works | Change to practice |
| --- | --- | --- | --- |
| Motion | `Reveal.jsx`, `motion.js`, `IntroScreen.jsx`, `ProjectCard.jsx` | JSX declares starting, target, and exit values. Motion interpolates them. `AnimatePresence` keeps an exiting child mounted while its exit runs. | Change `revealTransition.duration` from `.46` to `.8`; reveals take longer. |
| CSS animation/transition | `music.css`, `game-previews.css`, `valorant.css`, `dialogs.css` | Keyframes repeat a sequence; transitions animate a property between states. React classes and data attributes select the correct state. | Change the record's `7s` duration to `12s`; one rotation takes longer. |
| Three.js through React Three Fiber | `GroveCanvas.jsx`, `GroveObjects.jsx`, `ZeroPointCanvas.jsx` | `Canvas` creates the 3D scene. Meshes combine geometry and materials. `useFrame` updates positions and rotations before frames are rendered. | Change a model material or the tree's bobbing amplitude. |

### Motion example

The actual `Reveal.jsx` uses:

```jsx
initial={reduced ? false : { opacity: 0, y: 12 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: .12 }}
transition={reduced ? { duration: 0 } : { ...revealTransition, delay }}
```

"It starts transparent and 12 pixels lower. When enough of it enters the viewport, it fades in and moves to its normal position. It runs once. The shared transition sets the duration and easing. Easing controls how the speed changes during the animation."

Change `y: 12` to `y: 24` for a longer travel distance. Change `.46` in `motion.js` for duration. Motion durations here are seconds; the intro's `INTRO_DURATION = 3400` is milliseconds because it is used with `setTimeout`.

### CSS example: Spotify record

`MusicSection.jsx` passes `spinning={isPlaying && motionActive}` to `MusicTurntable`. The turntable writes that value to `data-spinning`. In `music.css`, the matching selector changes `animation-play-state` to running. The record's animation is:

```css
animation: music-vinyl-turn 7s linear infinite;
/* The matching @keyframes ends at transform: rotate(360deg). */
```

"React decides when the animation should run; CSS performs the repeated rotation. The equalizer follows the playing and motion states too."

### 3D example: directory

`Directory.jsx` owns the clickable HTML links and hover/focus state. `GroveCanvas.jsx` owns the orthographic camera and lights. `GroveObjects.jsx` defines the actual geometry and its motion. `GroveFallback.jsx` supplies SVG versions if 3D cannot load.

In `GroveObjects.jsx`, this line makes a model bob:

```js
body.current.position.y = Math.sin(t * .72 + seed) * .035;
```

"Sine oscillates between minus one and one. Multiplying it by `.035` sets the vertical distance. `.72` affects its speed, and the seed offsets each model so they do not move together. A ref gives access to the Three.js object."

To make only About bob more, replace that line with:

```js
const amplitude = node.id === 'about' ? .06 : .035;
body.current.position.y = Math.sin(t * .72 + seed) * amplitude;
```

`useFrame` receives `delta`, the elapsed seconds since the previous frame. Spin accumulates `dt * speed.current`, so its speed is based on time. `MathUtils.damp` moves the current value smoothly toward a target, including when hover changes. The frame loop changes mesh refs directly; using React state for every frame would request unnecessary React renders. Avoid `Math.random()` during renders for constantly changing shapes.

## 7. Effects, refs, and cleanup

- `useEffect`: synchronizes with something outside React, such as browser events, timers, or fetching music. Dependencies determine when it needs to run again.
- Cleanup: the function returned by an effect removes listeners, clears timers, or aborts requests. It runs before an effect is set up again and when the component unmounts. This matters under development StrictMode too.
- `useRef`: retains a mutable value or element reference across renders. Updating `.current` does not request a React render. Examples: focusing the search box and moving a 3D mesh.
- `useReducer`: handles related state transitions with named actions. `introFlow.js` manages intro, gateway, and site phases; App dispatches events and performs browser effects.
- `useMemo`: retains a calculated value while its dependencies stay the same. The 3D palette uses it to retain material objects.
- `useCallback`: retains a function identity while dependencies stay the same; it does not call the function by itself.

`IntroScreen.jsx` is a simple cleanup example: an effect starts a timeout and returns `clearTimeout(timer)`. `MusicSection.jsx` is a larger example: fetch, loading/error state, interval polling, and cleanup with `AbortController`.

## 8. Answers you can explain with code

**Something difficult:** "Coordinating the intro, Zero Point, and directory was difficult because an outgoing screen has to finish animating before the next stage becomes interactive. I use a reducer for the phases and named actions, then AnimatePresence's onExitComplete callback advances the sequence. App locks scrolling while an overlay is active and moves focus when it finishes."

Be able to locate `INTRO_FINISHED`, `GATEWAY_ENTERED`, and `EXIT_COMPLETE` in `introFlow.js` and their dispatch calls in `App.jsx`.

**Something cool:** "The directory is made from reusable 3D React components. Each destination has geometry and materials inside a shared Canvas. Pointer and keyboard focus update an active ID; the frame loop smoothly changes the model's glow and movement. There are SVG fallbacks and the animations stop when the scene is not visible."

An easier example to demonstrate is the agent cards: one reusable component, independent state, a click handler, and a CSS transition.

**How Spotify works:** "The React component fetches my local server's music endpoint and puts the JSON into state. The server handles Spotify authorization and stored tokens, then returns public display data. Loading, disconnected, and error states have different UI. The record spins when the response says a song is playing and the music section can animate."

`server/index.mjs` creates the Node HTTP server; `server/spotify.mjs` handles Spotify. The portfolio uses hash navigation written in App. It does not use React Router or Express.

**Libraries:** React handles components and state; React DOM mounts them; Motion handles UI transitions; Three.js supplies 3D objects/materials and React Three Fiber connects them to React; Drei supplies helpers such as globe orbit controls; Radix supplies dialogs and the technology select; Tailwind and CSS style the interface; Vite runs development and builds production files. Rive is installed but has no current import in `src`, so do not describe it as driving these animations.

## 9. A ten-minute rehearsal

1. Explain the startup path without reading a script.
2. Change the introduction in `siteData.js`; predict every place it appears.
3. Add a course, then remove it again.
4. Type in the project search and explain the state-to-filter-to-render path.
5. Make agent cards start open, then restore them.
6. Slow down a Reveal transition, then restore it.
7. Find the tree bobbing code and explain the three numbers.

Use `npm.cmd run dev` for live frontend edits on Windows. If music is needed, keep the backend running with `npm.cmd start` in another terminal. `npm.cmd run build` checks the production build; the server on port 3001 serves that build, so rebuild to update that address. Edit `src` and `public`, rather than generated files in `dist` or packages in `node_modules`.
