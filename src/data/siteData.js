// Start customizing here. Everything below is placeholder content, not a claim
// about you. Keep only the sections and details you want to share publicly.
export const profile = {
  name: 'Derek Szeto',
  initials: 'DS',
  label: 'My personal corner of the internet',
  headline: 'A little about me. A place for what I build.',
  introduction: 'Welcome to my website. This is a starting point for sharing my story, exploring my interests, and showing the things I create.',
  about: ['More about me coming soon.'],
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
  { label: 'Interests', href: '#interests' },
  { label: 'Contact', href: '#contact' },
];

export const projects = [
  {
    id: 'first-project',
    title: 'Project 01',
    description: 'Coming soon.',
    tags: [],
    category: '',
    // Add real URLs to display these links. Leave empty until ready.
    sourceUrl: '',
    liveUrl: '',
  },
  {
    id: 'second-project',
    title: 'Project 02',
    description: 'Coming soon.',
    tags: [],
    category: '',
    sourceUrl: '',
    liveUrl: '',
  },
];

export const skills = [
  { id: 'building', title: 'Tools', description: 'Coming soon.' },
  { id: 'learning', title: 'Learning', description: 'Coming soon.' },
];

// Add favorite things and pet peeves here. Empty lists show a placeholder.
export const interests = [
  { id: 'likes', title: 'Likes', items: [] },
  { id: 'dislikes', title: 'Dislikes', items: [] },
];

// Add images to public/photos, then set src (e.g. '/photos/trip.jpg'),
// a descriptive alt, a short caption, and an optional location.
export const photos = [
  { id: 'travel', category: 'Travel', caption: 'Travel', src: '', alt: '', location: '' },
  { id: 'friends', category: 'Friends', caption: 'Friends', src: '', alt: '', location: '' },
  { id: 'everyday', category: 'Everyday', caption: 'Everyday', src: '', alt: '', location: '' },
];
