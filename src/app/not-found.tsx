import Link from 'next/link';
export default function NotFound() { return <section className="section-wrap empty-page"><p className="eyebrow">A LITTLE OFF THE BEATEN PATH</p><h1>This trail ends here.</h1><p>That page has wandered off. Your next favorite is still in the shop.</p><Link className="button primary" href="/#shop">Back to the collection →</Link></section>; }
