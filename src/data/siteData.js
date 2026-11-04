// Edit your public profile and site content here.
// Unfilled sections use placeholders until you add your details.
import { favoriteTracks } from './favoriteTracks.js';
export const profile = {
  name: 'Derek Szeto',
  initials: 'DS',
  label: 'Senior at James B. Conant High School',
  headline: 'Games, apps, and things I build.',
  introduction: 'I make games, apps, and websites.',
  about: [
    "I'm a senior at James B. Conant High School and an aspiring computer science student.",
    'A lot of my ideas come from things my friends and I want to use, like a better way to plan hangouts or keep our memories in one place.',
  ],
  courses: ['Mobile Application Development', 'Multivariable Calculus', 'AP Statistics'],
  portrait: { src: '/photos/derek.png', alt: 'Portrait of Derek Szeto.' },
  // Empty contact values stay hidden.
  email: 'derekszeto09@gmail.com',
  phone: '224-384-2635',
  // Public profiles shown in the contact section.
  socialLinks: [
    { label: 'GitHub', url: 'https://github.com/derek-szeto', icon: 'github' },
    { label: 'Instagram', url: 'https://www.instagram.com/derekszeto/', icon: 'instagram' },
  ],
};

export const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Photos', href: '#photos' },
  { label: 'Projects', href: '#/projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Interests', href: '#/interests' },
  { label: 'Contact', href: '#contact' },
];

export const projects = [
  {
    id: 'gridgame',
    title: 'GridGame',
    preview: 'gridgame',
    description: 'A two-player Java game built around blocks with different abilities.',
    details: ['Uses 2D arrays and inheritance to handle the board and different block types.', 'Players use blocks with special abilities to win.'],
    tags: ['Java', '2D arrays', 'Inheritance'],
    category: 'Games',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'beeswarm',
    title: 'BeeSwarm',
    images: [{ src: '/images/projects/beeswarm.png', alt: 'Colorful Bee Swarm fan artwork with bees, flowers, and a central blue character.', width: 299, height: 168, background: '#e7d58e' }],
    description: "Recreating parts of Roblox's Bee Swarm Simulator in JavaFX.",
    details: ['A JavaFX take on selected parts of the original game.'],
    tags: ['Java', 'JavaFX'],
    category: 'Games',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    preview: 'minesweeper',
    description: 'A faithful recreation of Minesweeper in JavaFX.',
    details: ['Uses 2D arrays to represent and manage the board.'],
    tags: ['Java', 'JavaFX', '2D arrays'],
    category: 'Games',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'steal-an-egg-from-a-sniper',
    title: 'Steal an Egg from a Sniper',
    images: [{ src: '/images/projects/steal-an-egg-from-a-sniper.png', alt: 'Roblox game artwork showing a sniper in a wooden tower, a player climbing toward an egg, and a sunset landscape.', width: 1455, height: 564, crop: { x: 0, y: 8, width: 959, height: 540 }, cover: true, background: '#16232d' }],
    description: 'A published Roblox game with assets I made in Blender and game logic I worked on.',
    details: ['Developed game assets in Blender and handled game logic.', 'Planned the development schedule and balanced abilities.', 'Reached 1,000 users.'],
    tags: ['Roblox', 'Blender', 'Game logic'],
    category: 'Games',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'chickeninc',
    title: 'ChickenInc',
    description: 'A simple Android game that tracks and saves player data.',
    details: ['Built in Android Studio, with persistent player data.'],
    tags: ['Android Studio', 'Data persistence'],
    category: 'Games',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'restaurant-research',
    title: 'Restaurant Failure Research',
    description: 'A Cox-model study of 200+ restaurants in Illinois’ northwest suburbs.',
    details: [
      'Focused on Schaumburg, Hoffman Estates, Streamwood, and Palatine, with additional datasets from Elk Grove and Rolling Meadows.',
      'Consulted Scott Davis at Schaumburg Township District Library for historical municipal data and contacts.',
      'Worked with data from Hoffman Estates Economic Development Manager Matthew Galloway and local economic development departments.',
      'Built a Cox model to study how different factors relate to restaurant survival over time.',
      'Interviewed 10+ businesses, consulted three experts, and presented findings to 5+ businesses.',
    ],
    tags: ['Cox model', 'Research'],
    category: 'Research',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'ascend-ed',
    title: 'Ascend-Ed',
    description: 'A React website for free, student-led K–12 tutoring in the Chicago area.',
    details: [
      'Built the React website and deployed it on Netlify for Ascend-Ed, a student-led initiative working to close Illinois’ education gap.',
      'Explains free K–12 community classes in math and computer science, plus SAT/ACT prep recommended for eighth graders and high school students.',
      'Helps families find class registration and program information, with sections for FAQs, getting involved, and supporting the initiative.',
      'Added a Stripe-powered merchandise store with free local fulfillment to support student-led fundraising.',
      'Tutoring is hosted at National IndiaHub, Kenneth Young Center, and Alive Center.',
    ],
    images: [{ src: '/images/projects/ascend-ed.png', alt: 'Ascend-Ed logo with a green sprout rising from an open gold book.', width: 1254, height: 1254 }],
    tags: ['React', 'Netlify', 'Stripe', 'Education'],
    category: 'Websites',
    featured: true,
    sourceUrl: '',
    liveUrl: 'https://ascend-ed.org/',
  },
  {
    id: 'schaumburg-hackathon',
    title: 'Schaumburg Hackathon',
    description: 'The website for a student hackathon focused on solving community problems.',
    images: [{ src: '/images/projects/schaumburg-hackathon.png', alt: 'Schaumburg Hackathon logo with a teal circuit-style S on black.', width: 105, height: 109, background: '#000' }],
    details: ['Built and published schaumburghackathon.com, and co-founded and co-managed the event series.', 'Led two events with 50+ students building projects to solve community problems.', 'Participants presented their projects to youth engineers in National IndiaHub’s robotics class and CEO Harish Kolasani.', 'Secured National IndiaHub sponsorship and a venue, raised $120 for pizza and prizes, and arranged .xyz sponsorship for winners.'],
    tags: ['Website', 'Hackathon'],
    category: 'Websites',
    sourceUrl: '',
    liveUrl: 'https://schaumburghackathon.com/',
  },
  {
    id: 'memoryroom',
    title: 'MemoryRoom',
    description: 'A shared workspace for saving the memories my friends and I make in high school.',
    details: ['Built in React and hosted locally.', 'Takes inspiration from Google Slides and Google Docs, with a blank workspace for organizing memories.', 'Uses Supabase to manage user interactions.'],
    tags: ['React', 'Supabase'],
    category: 'Apps & tools',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'coderight',
    title: 'CodeRight',
    description: 'An AI coding tool used in an AP Computer Science Principles class.',
    details: ['Uses class notes to guide coding explanations and help students understand how to write code the right way.'],
    tags: ['AI', 'Education'],
    category: 'Apps & tools',
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'gather',
    title: 'Gather',
    description: 'An Android app that helps my friends plan hangouts and keep track of events.',
    details: ['Built to make organizing and communicating plans with friends easier, with 20+ users.', 'Uses Geoapify API calls and MapLibre for mapping.', 'Built in Android Studio with SharedPreferences, SQLite, and Firebase for data and backend features.'],
    tags: ['Android Studio', 'Geoapify', 'MapLibre', 'Firebase'],
    category: 'Apps & tools',
    featured: true,
    sourceUrl: '',
    liveUrl: '',
  },
];

export const skills = [
  { id: 'languages', title: 'Languages', description: 'Java, JavaScript, and C++.' },
  { id: 'interfaces', title: 'Apps & interfaces', description: 'React, JavaFX, and Android Studio.' },
  { id: 'data', title: 'Data & backend', description: 'Supabase, Firebase, SQLite, and SharedPreferences.' },
  { id: 'maps', title: 'Maps & APIs', description: 'Geoapify, MapLibre, and API integration.' },
  { id: 'games', title: '3D & game tools', description: 'Blender, game logic, and physics engines.' },
  { id: 'systems', title: 'Systems & hosting', description: 'Linux and Cloudflare.' },
];

export const activities = [
  {
    id: 'ascend-ed', title: 'Ascend-Ed Initiative',
    description: 'Co-founder and lead developer. Free, student-led tutoring to help close Illinois’ education gap.',
    url: 'https://ascend-ed.org/',
    details: [
      'Provided free SAT and STEM instruction to 100+ students through community classes led by student volunteers.',
      'Programs include K–12 math foundations, problem-solving, coding fundamentals, and creative projects. SAT/ACT prep is recommended for eighth graders and high school students.',
      'Consulted Illinois State Representative Michelle Mussman and District Director Christi Wessel about getting Ascend-Ed started.',
      'Secured fiscal sponsorship through CEO Harish Kolasani and COO Sireesha Tipparaju.',
      'Serves families in the greater Chicago area, with tutoring at National IndiaHub, Kenneth Young Center, and Alive Center.',
      'Built the React website on Netlify and a Stripe-powered store offering free local fulfillment.',
      'Designed merchandise with 100+ sales and raised $5,000 for the initiative.',
      'Recruited younger students to continue Ascend-Ed after I graduate.',
    ],
    links: [{ label: 'Website', url: 'https://ascend-ed.org/' }, { label: 'Instagram', url: 'https://www.instagram.com/future.ascended/' }],
  },
  {
    id: 'restaurant-research', title: 'Restaurant research',
    description: 'Built a Cox model to study 200+ restaurants in Illinois’ northwest suburbs.',
    details: [
      'Focused on Schaumburg, Hoffman Estates, Streamwood, and Palatine, with additional datasets from Elk Grove and Rolling Meadows.',
      'Consulted Scott Davis, the Business and Career Liaison Librarian at Schaumburg Township District Library, for historical municipal data and people to contact.',
      'Worked with data from Hoffman Estates Economic Development Manager Matthew Galloway and the six municipalities’ economic development departments.',
      'Built a Cox model, a statistical regression method for studying restaurant survival over time.',
      'Interviewed 10+ businesses and consulted three experts. Wrote a report and presented findings to 5+ businesses.',
    ],
  },
  {
    id: 'hackathon', title: 'Schaumburg Hackathon',
    description: 'Co-founder and co-manager of a student hackathon focused on community problems.',
    url: 'https://schaumburghackathon.com/',
    details: [
      'Led two events with 50+ students building projects to solve community problems.',
      'Secured National IndiaHub sponsorship and a venue.',
      'Raised $120 for Little Caesars pizza and participant prizes, and secured .xyz sponsorship as a reward for winners.',
      'Participants presented their work to youth engineers in National IndiaHub’s robotics class and CEO Harish Kolasani.',
      'Built and published the event website.',
    ],
  },
  { id: 'business', title: 'Business Professionals of America', description: 'Qualified for the national conference in Economic Research Team. I couldn’t attend because of the cost.', details: ['Co-wrote a monetary policy and inflation research paper with a team of four.', 'Gathered sources, designed the presentation and script, and set a practice schedule.'] },
  { id: 'math-team', title: 'Math Team', description: 'Competed with Conant Math Team in NSML and ICTM.', details: ['North Suburban Math League (NSML) and Illinois Council of Teachers of Mathematics (ICTM).', 'Competed in 6+ NSML meets, organized four extra ICTM practices, and coached 10+ freshmen and sophomores.', 'One state appearance and two regional appearances.'] },
  { id: 'cs-intern', title: 'AP Computer Science Principles', description: 'Student teacher and intern, helping classmates learn JavaScript.', details: ['Taught about 20 students JavaScript at lunch.', 'Built a class-aligned AI tutor for coding and project feedback.', 'Tutored four students after school and graded 15+ projects.'] },
  { id: 'aapi', title: 'Asian American Pacific Islander Club', description: 'Vice president and board member.', details: ['Organized 5+ events and about 15 meetings, and helped membership grow from 40 to 75+.', 'Founded the school’s first Night Market, with 300+ attendees and $2,000 raised.', 'Designed five cultural presentations.', 'All money raised at our AAPI Night Market will go directly to BRAC economic relief.'] },
  { id: 'github', title: 'Game & app development', description: 'Independent games and apps, with code on GitHub.', url: 'https://github.com/derek-szeto', details: ['Projects span Java games, Android apps, React websites, and Roblox experiences.', 'Gather has 20+ users; my published Roblox game has reached 1,000 users.'] },
  { id: 'tennis', title: 'Tennis', description: 'Conant JV doubles. Third place at the MSL conference.', details: ['Trained in the off-season and added extra practice to improve serve power, consistency, and match strategy.'] },
  { id: 'work', title: 'Work experience', description: 'Team member at Blaze Pizza in Woodfield Mall, Schaumburg.', details: ['Blaze Pizza: October–present.', 'Previously employed at Dave’s Hot Chicken in Schaumburg from August to September.', 'Worked cashier, food preparation, frying, and plating during busy shifts.', 'Handled rushes of 100+ meals per hour and helped train five new hires.'] },
];

export const honors = [
  { id: 'harper-art-show', title: 'Harper Art Show', description: 'Video work featured in Conant High School’s 4D gallery.', url: 'https://www.harperartshow.com/conant-high-school-3' },
];

// Add favorite things and pet peeves here. Empty lists show a placeholder.
export const interests = [
  { id: 'likes', title: 'Likes', items: ['Drawing', 'Tennis', 'Pickleball', 'Shopping', 'Volleyball', 'Physics', 'Arcades'] },
  { id: 'dislikes', title: 'Dislikes', items: ['History classes', 'English class', 'Seafood'] },
];

// Edit all Valorant content here. No API connection is required.
export const valorant = {
  riotId: 'D4y#0303',
  trackerUrl: 'https://tracker.gg/valorant/profile/riot/D4y%230303/overview?platform=pc&playlist=competitive&season=d816f426-48ea-f052-117f-9697a155b319',
  introduction: "VALORANT is a 5v5 tactical first-person shooter. I started playing in 2021 and spent a lot of time grinding and learning the game.\n\nSchool keeps me busy now, so I play less, but I still make time to queue with my duo. I mostly play duelists, though I have a strong understanding of almost every agent.",
  currentRank: 'Ascendant 3',
  currentRankImage: '/images/valorant/ascendant-3.png',
  peakRank: 'Immortal 1',
  peakRankImage: '/images/valorant/immortal-1.png',
  rankDescription: '',
  experience: "Along the way, I've played against pros, streamers, and international champions. My next goal is to lead a Premier team and work toward the VCT Americas open qualifiers.",
  earnings: '$378',
  // Manually maintained agent stats; null values show a dash.
  agents: [
    { id: 'yoru', name: 'Yoru', role: 'Duelist', image: '/images/valorant/yoru-portrait.png', hours: '400+', lifetimeKills: '12,000+', bestMap: 'Bind' },
    { id: 'neon', name: 'Neon', role: 'Duelist', image: '/images/valorant/neon-portrait.png', hours: '100+', lifetimeKills: '8,000', bestMap: 'Sunset' },
    { id: 'waylay', name: 'Waylay', role: 'Duelist', image: '/images/valorant/waylay-portrait.png', hours: '50+', lifetimeKills: '800', bestMap: 'Abyss' },
  ],
  player: {
    name: 'D4y',
    tag: '0303',
    cardName: 'Polyfrog',
    cardImage: '/images/valorant/polyfrog-wide.png',
    title: '',
  },
};

export const music = { profileUrl: '', favorites: favoriteTracks };

// Add images to public/photos, then set src (e.g. '/photos/trip.jpg'),
// a descriptive alt, a short caption, and an optional location.
// Travel photos with the same trip and period share a vacation album.
export const vacationDestinations = [
  { trip: 'Phuket, Thailand', label: 'Phuket', country: 'Thailand', latitude: 7.876533, longitude: 98.381529, color: '#ff98d1' },
  { trip: 'Toronto', label: 'Toronto', country: 'Canada', latitude: 43.664645, longitude: -79.389459, color: '#71dcff' },
  { trip: 'Macau', label: 'Macau', country: '', latitude: 22.189135, longitude: 113.544375, color: '#a6f4df' },
];

export const photos = [
  { id: 'thailand-summer-2026', category: 'Travel', trip: 'Phuket, Thailand', period: 'Summer 2026', caption: 'Beach at sunset', location: 'Phuket, Thailand · Summer 2026', src: '/photos/thailand-summer-2026.png', alt: 'A beach at sunset with ocean waves and palm trees in Phuket, Thailand.', width: 1824, height: 1368 },
  { id: 'phuket-pool-summer-2026', category: 'Travel', trip: 'Phuket, Thailand', period: 'Summer 2026', caption: 'Poolside in Phuket', location: 'Phuket, Thailand · Summer 2026', src: '/photos/phuket-pool-summer-2026.png', alt: 'Blue and pink pool lights beside palm trees and a beachfront resort at dusk in Phuket, Thailand.', width: 1152, height: 2048 },
  { id: 'phuket-evening-summer-2026', category: 'Travel', trip: 'Phuket, Thailand', period: 'Summer 2026', caption: 'An evening in Phuket', location: 'Phuket, Thailand · Summer 2026', src: '/photos/phuket-evening-summer-2026.png', alt: 'A glowing candle, flowers, and cutlery on a marble table on a covered patio in Phuket, Thailand.', width: 1152, height: 2048 },
  { id: 'homecoming-with-friends', category: 'Friends', caption: 'Homecoming with friends', src: '/photos/friends-homecoming.jpg', alt: 'Derek and friends dressed up for homecoming in front of a brick wall.', width: 1200, height: 900 },
  { id: 'late-night-pickleball', category: 'Friends', caption: 'Late-night pickleball with friends', src: '/photos/late-night-pickleball.png', alt: 'Friends walking toward illuminated pickleball courts at night.', width: 1368, height: 1824 },
  { id: 'toronto-summer-2026', category: 'Travel', trip: 'Toronto', period: 'Summer 2026', caption: 'Toronto · Summer 2026', src: '/photos/toronto-summer-2026.png', alt: 'A waterfall, river, and tour boats during a summer trip.', width: 1152, height: 2048 },
  { id: 'macau-2025', category: 'Travel', trip: 'Macau', period: '2025', caption: 'Macau · 2025', src: '/photos/macau-2025.png', alt: 'A historic stone facade above broad steps and landscaped gardens in Macau.', width: 1368, height: 1824 },
  { id: 'plushie-collection', category: 'Plushies', caption: 'My plushie collection', src: '/photos/plushie-collection.png', alt: 'A collection of colorful animal and pineapple plushies arranged together on a bed.', width: 1368, height: 1824 },
];
