# Personal website starter — React + Vite

A small, component-based personal website written in JavaScript and JSX. The
text is intentionally placeholder content so we can decide what belongs on your
website next. It includes responsive navigation, an introduction, About,
Projects, Skills & Interests, and Contact.

## 1. Run the project

Install Node.js 22.12+ (or Node 24+) with npm. This project uses Vite 8.
Official Vite setup documentation: https://vite.dev/guide/

1. Extract the ZIP.
2. Open the **personal-website** folder in VSCode or WebStorm. This is the folder
   containing `package.json`; do not open only `src`.
3. Open the IDE terminal and run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite, usually `http://localhost:5173`.

Leave that terminal running. Changes to your source files appear in the browser
when you save. Use Ctrl+C in the terminal to stop the server. Do not open
`index.html` by double-clicking it or use a Live Server extension for this project.

## 2. Understand the structure

| File or folder | What it does |
| --- | --- |
| `index.html` | The HTML shell. Contains the `root` element and page metadata. |
| `src/main.jsx` | Starts React, loads global CSS, and mounts `<App />`. |
| `src/App.jsx` | Assembles the page using components and passes data through props. |
| `src/components/` | Reusable UI pieces and individual page sections. |
| `src/components/Section.jsx` | Shared section heading and spacing used by several sections. |
| `src/components/ProjectCard.jsx` | One project card, reused for every entry in the projects array. |
| `src/data/siteData.js` | Your name, text, navigation, projects, skills, and contact links. |
| `src/styles/index.css` | Shared styles, component styles, and responsive rules. |
| `public/` | Files served directly, such as the favicon or a future resume PDF. |
| `vite.config.js` | Vite configuration; enables the React plugin. |
| `package.json` | Lists dependencies and commands such as `npm run dev`. |
| `package-lock.json` | Records exact installed dependency versions. Commit this to Git. |

`App.jsx` is the correct filename here. `.jsx` allows HTML-like JSX inside
JavaScript. A component is a function that returns JSX. Its filename should
usually match its component name, such as `Navbar.jsx` and `Navbar`.

The page starts in this order: `index.html` loads `main.jsx`, which renders
`App.jsx`, which renders the components.

## 3. Start customizing

1. In `src/data/siteData.js`, change `profile.name` and `profile.initials`.
2. Update the introduction and About paragraphs.
3. Add only the projects, skills, and interests you actually want to share.
4. Add an email or social links when ready. Links with empty values are hidden.
5. Change the title and description in `index.html`.
6. Adjust `--accent` and other values at the top of `src/styles/index.css`.

Only add public information here. Frontend source and bundled data can be read
by visitors; never put API secrets, passwords, or private information in them.

Example project entry (replace the uppercase username and repository):

```js
{
  id: 'meal-planner',
  title: 'Meal Planner',
  description: 'Describe what your actual app does and what you contributed.',
  tags: ['React', 'CSS'],
  category: 'Personal project',
  sourceUrl: 'https://github.com/YOUR_USERNAME/YOUR_REPOSITORY',
  liveUrl: '',
}
```

The `projects.map(...)` call in `Projects.jsx` renders a `ProjectCard` for every
entry. Adding data adds another card without duplicating component markup.

## 4. Learn a few React concepts here

- **Components:** `App` combines smaller functions such as `Hero` and `Footer`.
- **Props:** `<Hero profile={profile} />` passes data into the Hero component.
- **Lists:** `.map()` turns project objects into cards. Each card gets a stable
  `key` from its project ID.
- **Conditional rendering:** Contact links appear only when values are supplied.
- **State:** `Navbar` uses `useState` to open and close the mobile menu.
- **Events:** Clicking its menu button changes state with `onClick`.
- **Children:** `Section` wraps different content through its `children` prop.

This starter uses one page with anchor links, so React Router is not needed.
It does not include a backend, database, analytics, or a contact form. The email
button opens the visitor's mail app once you provide an address.

## 5. Build for production

```bash
npm run build
npm run preview
```

`build` generates the `dist` folder. `preview` serves that production build
locally. For normal editing, use `npm run dev`. A build does not publish the site.
Your hosting configuration can be decided later.

## Next decisions

We can discuss the website's audience, your preferred display name, design,
which completed projects to show, skills you can demonstrate, and whether to
include education, a resume, hobbies, or public contact links. The sections are
suggestions: remove or rename them as your purpose becomes clearer.

## Interactive design tools

- Motion powers the sliding navigation marker, project-card interactions, and scenery entrance. Reduced-motion preferences are respected.
- Radix Dialog powers each project detail sheet, including keyboard focus handling and Escape to close.
- React Three Fiber, Three.js, and Drei power the optional 3D village. Choose **Explore in 3D** on the home page; drag to rotate. The scene is lazy-loaded and renders on demand. Storybook view remains available without WebGL.
- The Rive React Canvas runtime is installed for future custom animation assets. No Rive animation is active yet: it requires a `.riv` file created or exported from Rive.

Run `npm run dev` to preview. Visit `#/projects` for the searchable project journal. Edit `src/data/siteData.js` to replace the sample project entries.
## Forest design references

The current design uses an original wool forest with blocky sheep, teal and mint scenery, moonlight and rose accents. Light and dark themes have separate palettes. No outside drawing or 3D model is required for the current code-created artwork.

Design study (October 2026):
- Brittany Chiang: https://brittanychiang.com/ - clear hierarchy and separated project archive.
- Josh W. Comeau: https://www.joshwcomeau.com/animation/squash-and-stretch/ - subtle, responsive arrow interactions.
- Emil Kowalski: https://emilkowal.ski/ui/7-practical-animation-tips - restrained feedback and animation timing.
- Bruno Simon: https://bruno-simon.com/ - optional explorable world as portfolio context (Three.js reference, not a React implementation).

References informed general interaction principles. Forest illustrations and component styling are original to this project.
## Personal photo gallery

The Photos section has Travel, Friends, and Everyday placeholders. Add your own images under `public/photos/` and update the `photos` array in `src/data/siteData.js`:

```js
{ id: 'trip-01', category: 'Travel', caption: 'A short memory', src: '/photos/trip.jpg', alt: 'Describe what is in the photo', location: 'Optional location' }
```

Empty image paths show illustrated placeholders. Real photos open in a larger view with Escape to close. Add more entries to grow the gallery; captions and locations can stay short.
## Tailwind and botanical styling

Tailwind CSS v4 runs through the Vite plugin. `src/styles/app.css` defines the color and font tokens and loads the existing illustration/animation rules in a lower CSS layer. Tailwind utilities and `src/styles/tech.css` control the new panels, typography, grid details, and controls. The custom `.site-container` class avoids a collision with Tailwind's `container` utility.

`Botanical.jsx` supplies the ferns and shrubs used around the page and inside `ForestArt.jsx`. Decorative movement pauses outside the viewport and respects reduced motion. The 3D forest has matching shrub models. Existing sheep and intro animations remain available.