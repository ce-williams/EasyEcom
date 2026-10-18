import type { Brand, Product } from '../lib/types';

const make = (id: string, name: string, collection: string, lines: string[], shape: Product['artwork']['shape'], paper: string, ink: string, background: string, description: string, caption: string, motif?: Product['artwork']['motif']): Product => ({
  id, slug: id, name, collection, description, background,
  artwork: { shape, lines, caption, paper, ink, accent: ink, motif },
  variants: [{ id: `${id}-matte`, label: 'Matte · 3 inch', price: 500, available: true }],
});

const products: Product[] = [
  { ...make('i-survived-i70', 'I Survived I-70', 'roadside-humor', ['I SURVIVED', 'I–70'], 'road', '#244857', '#F8F0D9', '#E9BC7A', 'For the road trip that became a character-building exercise. A small tribute to Colorado’s least relaxing scenic route.', 'EVENTUALLY.'), featured: true },
  { ...make('mentally-on-a-chairlift', 'Mentally on a Chairlift', 'ski-culture', ['MENTALLY', 'ON A', 'CHAIRLIFT'], 'oval', '#F3AD98', '#6B2F29', '#D5DDB6', 'Body at your desk. Brain on lift number six. You know the feeling.', 'OUT OF OFFICE, IN SPIRIT.', 'lift'), featured: true },
  { ...make('powder-over-productivity', 'Powder Over Productivity', 'ski-culture', ['POWDER', 'OVER', 'PRODUCTIVITY'], 'ticket', '#D8E77A', '#243D33', '#E4BAAA', 'Some priorities are weather-dependent. This one speaks for itself.', 'THE FORECAST MADE ME DO IT.', 'spark'), featured: true },
  { ...make('apres-is-my-cardio', 'Après Is My Cardio', 'ski-culture', ['APRÈS IS', 'MY CARDIO'], 'circle', '#BD3D2B', '#F8F0D9', '#E7C991', 'You came for the turns. You stayed for the very important post-turn activities.', 'ELEVATED LEISURE CLUB', 'spark'), featured: true },
  make('altitude-adjustment', 'Altitude Adjustment', 'colorado-state-of-mind', ['ALTITUDE', 'ADJUSTMENT'], 'arch', '#F5E5A2', '#344E3C', '#C7D3CD', 'A change of scenery with a little less oxygen and a lot more perspective.', 'TAKE THE HIGH ROAD.', 'sun'),
  make('weekend-mountain-local', 'Weekend Mountain Local', 'colorado-state-of-mind', ['WEEKEND', 'MOUNTAIN', 'LOCAL'], 'oval', '#3C5949', '#F8F0D9', '#F0C9AD', 'A deeply committed part-time resident of wherever the weekend takes you.', 'FRIDAY NIGHT → SUNDAY NIGHT'),
  make('trail-mix-emotions', 'Trail Mix Emotions', 'outside-ish', ['TRAIL MIX', 'EMOTIONS'], 'burst', '#D9A0B0', '#493145', '#DAD9B7', 'A little salty, a little sweet, and only mildly lost. A snack-sized mood.', 'HIKING THROUGH IT.', 'spark'),
  make('camp-more-scroll-less', 'Camp More. Scroll Less.', 'outside-ish', ['CAMP MORE.', 'SCROLL LESS.'], 'arch', '#D8E77A', '#243D33', '#D7B69D', 'A gentle reminder to trade the feed for a place with no reception.', 'OUTSIDE IS CALLING.', 'tree'),
  make('colorado-layering-expert', 'Colorado Layering Expert', 'colorado-state-of-mind', ['LAYERING', 'EXPERT'], 'circle', '#E8B971', '#543E2C', '#BFD0C8', 'Four seasons before lunch. You didn’t overpack; you came prepared.', 'SUN. SNOW. REPEAT.', 'sun'),
  make('brake-for-scenic-routes', 'I Brake for Scenic Routes', 'roadside-humor', ['I BRAKE FOR', 'SCENIC ROUTES'], 'road', '#BD3D2B', '#FFF2D0', '#E9C4B8', 'Sometimes the long way home is the whole point. Sorry about the pace.', 'SORRY, I’M LOOKING AT STUFF.'),
  make('out-of-office-outside', 'Out of Office. Outside.', 'outside-ish', ['OUT OF', 'OFFICE.', 'OUTSIDE.'], 'ticket', '#315547', '#F8F0D9', '#E2CE9C', 'No signal. No spreadsheet. No particular plans to come back indoors.', 'REPLIES MAY BE ELEVATED.', 'tree'),
  make('front-range-free-range', 'Front Range. Free Range.', 'colorado-state-of-mind', ['FRONT RANGE.', 'FREE RANGE.'], 'oval', '#F5E2B5', '#354E68', '#C3C5D8', 'For the people who measure the week in potential escape routes.', 'ROAM RESPONSIBLY.', 'spark'),
];
// A second visible option exercises the three-interaction variant path.
products[1].variants.push({ id: 'mentally-on-a-chairlift-gloss', label: 'Gloss · 3 inch', price: 550, available: true });
products[8].variants.push({ id: 'colorado-layering-expert-gloss', label: 'Gloss · 3 inch', price: 550, available: true });

export const apres: Brand = {
  id: 'apres', name: 'Après Club', wordmark: 'après club.', currency: 'USD', locale: 'en-US',
  tagline: 'Less serious. More outside.', announcement: 'A LITTLE MOUNTAIN ATTITUDE. A LOT OF PERSONALITY.',
  theme: { paper: '#F8F0D9', ink: '#243D33', accent: '#BD3D2B', hero: '#F0BF77', muted: '#EEE5CD', line: '#B9BEA7', display: 'Bricolage Grotesque', body: 'DM Sans', cardShape: 'arch' },
  navigation: [{ label: 'All stickers', href: '/#shop' }, { label: 'Mountain moods', href: '/#collections' }, { label: 'Our kind of people', href: '/about' }],
  hero: { eyebrow: 'COLORADO STATE OF MIND', lines: ['GOOD VIBES.', 'BAD TRAFFIC.'], description: 'A little mountain attitude for your bottle, cooler, or bumper.', cta: 'Find your sticker', products: ['powder-over-productivity', 'apres-is-my-cardio', 'i-survived-i70'], note: 'Small goods. High spirits.' },
  catalog: { eyebrow: 'STICK WITH YOUR PEOPLE', title: 'Pick your personality.', description: 'For the powder chasers, scenic-route takers, and “one more run” people.' },
  collectionCopy: { eyebrow: 'SAME ALTITUDE. DIFFERENT ATTITUDES.', title: 'Find your kind of people.', note: 'A MOOD FOR EVERY DAY' },
  story: { eyebrow: 'THE CLUB WITH NO MEMBERSHIP FEE', title: 'A little less serious.\nA little more outside.', description: 'We’re here for questionable weather decisions, snacks at the summit, and the stories that start with “so we took I-70.” Small reminders to keep your sense of humor along for the ride.', footnote: 'Colorado attitude. Goes everywhere.' },
  collections: [
    { slug: 'ski-culture', name: 'Lift tickets & life choices', eyebrow: 'SKI CULTURE', description: 'For the “one more run” crowd.', color: '#D5DDB6' },
    { slug: 'roadside-humor', name: 'The scenic route', eyebrow: 'ROADSIDE HUMOR', description: 'Good company. Questionable ETA.', color: '#E9BC7A' },
    { slug: 'outside-ish', name: 'Out of office. Outside.', eyebrow: 'OUTSIDE-ISH', description: 'Leave the feed. Bring the snacks.', color: '#E4BAAA' },
    { slug: 'colorado-state-of-mind', name: 'Altitude is an attitude', eyebrow: 'COLORADO STATE OF MIND', description: 'Locals, almost-locals, and locals in spirit.', color: '#C7D3CD' },
  ], products,
};
