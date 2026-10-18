import type { Brand } from '../lib/types';

export const desk: Brand = {
  id: 'desk', name: 'Desk Ritual', wordmark: 'desk ritual', currency: 'USD', locale: 'en-US',
  tagline: 'A little room to think.', announcement: 'SMALL OBJECTS. CONSIDERED DAYS.',
  theme: { paper: '#F5F3EE', ink: '#343A38', accent: '#4C6159', hero: '#D9DED4', muted: '#E8E8DF', line: '#B4BAB3', display: 'DM Sans', body: 'DM Sans', cardShape: 'square' },
  navigation: [{ label: 'The collection', href: '/#shop' }, { label: 'Everyday objects', href: '/#collections' }, { label: 'Our approach', href: '/about' }],
  hero: { eyebrow: 'OBJECTS FOR EVERYDAY', lines: ['Make room.', 'For your ideas.'], description: 'A quiet collection of paper goods for the everyday work of thinking.', cta: 'Explore the collection', products: ['daily-notebook', 'note-block', 'weekly-planner'], note: 'Consider the everyday.' },
  catalog: { eyebrow: 'THE CONSIDERED COLLECTION', title: 'A quieter kind of useful.', description: 'Simple objects. Space for whatever comes next.' },
  collectionCopy: { eyebrow: 'THOUGHTFULLY GROUPED', title: 'A place for everything.', note: 'THE EVERYDAY EDIT' },
  story: { eyebrow: 'OUR APPROACH', title: 'Make a little room\nfor a good idea.', description: 'Tools for your thoughts, lists, sketches, and the things you don’t want to forget. Our collection is an invitation to slow down and put something on paper.', footnote: 'Thoughtful by design.' },
  collections: [{ slug: 'paper-goods', name: 'Put it on paper', eyebrow: 'PAPER GOODS', description: 'A place for the everyday.', color: '#D9DED4' }],
  products: [
    { id: 'daily-notebook', slug: 'daily-notebook', name: 'Daily Notebook', collection: 'paper-goods', description: 'A place for the first draft, the long list, and the next idea. Demonstration stationery item.', background: '#DBDED6', artwork: { shape: 'ticket', lines: ['DAILY', 'NOTES'], caption: 'ROOM TO THINK', paper: '#D1D5C9', ink: '#343A38', accent: '#343A38' }, variants: [{ id: 'daily-notebook-a5', label: 'A5 · Plain', price: 1800, available: true }] },
    { id: 'note-block', slug: 'note-block', name: 'Everyday Note Block', collection: 'paper-goods', description: 'For thoughts that deserve somewhere to land. Demonstration stationery item.', background: '#E6E1D6', artwork: { shape: 'ticket', lines: ['A SMALL', 'THOUGHT.'], caption: 'DESK RITUAL', paper: '#EEE7D9', ink: '#343A38', accent: '#343A38' }, variants: [{ id: 'note-block-standard', label: 'Standard', price: 900, available: true }] },
    { id: 'weekly-planner', slug: 'weekly-planner', name: 'Weekly Planner', collection: 'paper-goods', description: 'A little structure and plenty of white space. Demonstration stationery item.', background: '#CED4D0', artwork: { shape: 'ticket', lines: ['ONE WEEK', 'AT A TIME.'], caption: 'MONDAY → WHENEVER', paper: '#E6E9DE', ink: '#343A38', accent: '#343A38' }, variants: [{ id: 'weekly-planner-desk', label: 'Desk format', price: 2400, available: true }] },
  ],
};
