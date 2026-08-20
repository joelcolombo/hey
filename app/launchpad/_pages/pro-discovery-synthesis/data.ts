/**
 * PRO Brand Discovery synthesis. Hand-digested from the 7 questionnaire
 * responses (Aug 10 to 17, 2026). This is the source of truth for the page;
 * the Notion page of the same name is the long-form reference with full
 * attribution. Here the reading is deliberately group-oriented: positions
 * are counted, not attributed. Appendix answers are numbered, not named.
 */

export const respondents = [
  { name: 'Caitlin Tulloch', date: 'Aug 10' },
  { name: 'Kayla Hoyer', date: 'Aug 11' },
  { name: 'Sasha', date: 'Aug 11' },
  { name: 'Ellie Lewis', date: 'Aug 11' },
  { name: 'Grace Morgan', date: 'Aug 12' },
  { name: 'Rob Rogers', date: 'Aug 12' },
  { name: 'Rob Rosenbaum', date: 'Aug 17' },
] as const

export const TOTAL = respondents.length

export const tenThings = [
  { lede: 'Purpose is crystal clear and shared', body: 'Everyone describes PRO the same way: identify cost-effective, proven, life-saving programs that lost funding, and connect them quickly with private philanthropy. Nobody disagrees on what PRO is.' },
  { lede: 'The personality is unanimous: pragmatic and rigorous', body: '"Pragmatic" or "practical" appears in every character description; "rigorous" in most. Secondary notes: honest, agile, inspiring, humane. "Nerds in a basement" is the affectionate in-house shorthand.' },
  { lede: 'Donors are the audience. Everything else is secondary', body: 'HNWI and their advisors, EA-adjacent donors (effective altruism), small family foundations, new AI money. Press matters as a channel to donors. Implementing partners and policy circles are real but not the identity’s primary target.' },
  { lede: 'Approachable to newcomers, rigorous enough for the EA crowd', body: 'Named explicitly in the responses: PRO should sit "squarely in the middle" between wonky and pitchy, "not too technocratic, not smug".' },
  { lede: 'Nobody wants a fresh start', body: '4 vote "keep and refine its energy", 3 vote "a clear evolution", 0 vote "fresh start". The story is "same mission, sharper tools" in a new operating environment.' },
  { lede: 'But there’s no attachment to the current logo either', body: 'The only candidate visual equity is the dark green, and even that is a split: 3 see value in it, 3 see a blank slate, 1 is neutral.' },
  { lede: 'Relationship with DIV: related, with its own personality', body: 'All but one pick that option; the single dissent votes independent with a subtle connection. Sliders show the team wants PRO closer to DIV than it is today. Typography: 3 say share DIV’s, 2 say same family used differently.' },
  { lede: 'Visual language: contemporary, minimalist, clear', body: 'Contemporary (5), minimalist (4), clear (4). One respondent is unsure between neutral and vibrant; another asks for "more vibrancy than the current neutral"; bold and reserved appear twice each.' },
  { lede: 'Palette mood converges on grounded plus optimistic', body: 'Grounded (4), optimistic (3), hopeful (3), bold (2), scientific (2). Not somber, not cheerful: steady and forward-looking.' },
  { lede: 'The hard no’s are consistent', body: 'Poverty porn, guilt-based appeals, donation pop-ups, looking like GiveWell, startup shininess, globes and loopy circles. And a shared instinct to lead with how PRO works (evidence, rigor, the list) rather than with need.' },
] as const

export const purposeQuotes = [
  { text: 'PRO is a totally neutral broker. It provides clear, timely analysis in an accessible format, to increase the speed and maximize the impact of donor funding.' },
  { text: 'We serve as an intermediary in this market of implementers and funders, to reduce information asymmetries and enable transactions with strong confidence and little friction.' },
  { text: 'We work with implementers to pare down their programs to the core drivers of impact and then connect them with philanthropists to plug critical gaps.' },
] as const

export const keyMessages = [
  { lede: 'Trusted, knowledgeable steward of a market', body: 'Rigor with common sense, "the forest not the trees".' },
  { lede: 'The list is pre-vetted', body: 'Scoped for urgency and cost-effectiveness.' },
  { lede: 'Cost-effectiveness as a guide to giving saves lives', body: 'Optimize available resources toward a chosen outcome.' },
  { lede: 'Beyond economics', body: '"This work is also about truth, justice, and love of others." One voice pushes the moral register; the rest stay analytical.' },
  { lede: 'Context', body: 'Programs that lost funding due to foreign-assistance cuts.' },
] as const

export const audiences = [
  { tier: 'Primary', who: 'HNWI and their advisors (mainstream newcomers, low-information but impact-hungry); EA and EA-adjacent donors; small family foundations; new AI-IPO money.', by: 'All', implication: 'Must read as credible at a glance and be easy to navigate for a non-expert.' },
  { tier: 'Secondary', who: 'Philanthropic and donor-advisory organizations; peer evidence orgs; press.', by: 'Nearly all', implication: 'Press has been the main acquisition channel. The identity must be quotable and recognizable.' },
  { tier: 'Tertiary', who: 'Implementing partners; global health and development foundations; policy circles (think tanks, Hill, State Dept, multilaterals); former USAID networks.', by: 'Several', implication: 'Political neutrality. Nothing that reads as partisan.' },
] as const

export const needleQuote = { text: 'This continues to be the needle to thread: how to sound approachable to new entrants while being rigorous enough for those with higher base knowledge and expectations.', who: 'From the responses' }

export const misreadings = [
  { myth: 'PRO and the DIV Fund are the same thing, or overlap more than they do', reality: 'PRO is narrower: only life-saving, only proven. The relationship needs to be legible at a glance, though some note few even know the relationship yet.' },
  { myth: 'PRO has its own pool of money and makes grants', reality: 'PRO connects implementing partners to donors. It does not fund.' },
  { myth: 'Cost-effectiveness means innovation (what DIV funds)', reality: 'PRO backs "routinely delivering, well-evidenced, almost boring programs".' },
  { myth: 'PRO is the USAID-saver, full stop', reality: 'The team wants a forward-looking identity not tethered to the genesis story.' },
] as const

export const characterWords = [
  { word: 'Pragmatic', count: 7, detail: 'pragmatic, practical, "not letting perfect be the enemy of the good"' },
  { word: 'Rigorous', count: 5, detail: 'rigorous, methodical, analytic, detail-oriented' },
  { word: 'Agile', count: 4, detail: 'nimble, agile, timely, resilient, persistent' },
  { word: 'Inspiring', count: 3, detail: 'named as aspiration more than current trait' },
  { word: 'Honest', count: 3, detail: 'honest, honorable, operates with integrity' },
  { word: 'Human', count: 3, detail: 'humane, connected, engaged, approachable, thoughtful' },
  { word: 'Authoritative', count: 1, detail: '"nerds in a basement" as affectionate self-image' },
] as const

export const voiceWords = [
  { word: 'Precise', note: 'the most repeated word (3 mentions)' },
  { word: 'Inspiring', note: 'twice as a wish: "it could be more inspiring"' },
  { word: 'Knowledgeable but humble', note: 'informed and rigorous, open to learning' },
  { word: 'Practical and commanding', note: 'urgent, authoritative, accessible' },
  { word: 'Direct and caveated', note: 'informative, educational, detail-oriented' },
] as const

/** 1 = left pole, 7 = right pole. Averages across respondents who answered. */
export const sliders = [
  { left: 'Established', right: 'Emergent', n: 7, today: 5.1, future: 4.0, range: [3, 6], read: 'Feels emergent today; the team wants it to read as more established. The strongest single shift in the set (7 to 3).' },
  { left: 'Close to DIV', right: 'Fully distinct', n: 5, today: 6.0, future: 4.6, range: [4, 5], read: 'Very distinct today; everyone wants to move closer to DIV, to the middle, not merged.' },
  { left: 'Thought leader', right: 'Facilitator', n: 7, today: 4.4, future: 3.0, range: [2, 5], read: 'A clear pull toward thought leadership, though part of the group stays nearer facilitator.' },
  { left: 'Urgent', right: 'Patient', n: 7, today: 1.9, future: 2.9, range: [2, 4], read: 'Very urgent today; keep the urgency but feel less frantic, more durable.' },
  { left: 'Global', right: 'Regionally grounded', n: 6, today: 2.2, future: 2.8, range: [1, 5], read: 'Global, with one outlier leaning regional.' },
  { left: 'Technical', right: 'Strategic', n: 7, today: 3.3, future: 3.9, range: [2, 6], read: 'Slightly more strategic, but with genuine spread: future answers run from 2 to 6.' },
  { left: 'Academic', right: 'Accessible', n: 7, today: 3.6, future: 4.0, range: [3, 6], read: 'Slightly more accessible, with one strong push in that direction (3 to 6).' },
  { left: 'Institutional', right: 'Progressive', n: 5, today: 5.4, future: 5.0, range: [4, 6], read: 'Progressive, with a touch more institutional weight wanted.' },
  { left: 'Conservative', right: 'Experimental', n: 6, today: 3.3, future: 3.5, range: [2, 5], read: 'Center. Not a place for visual experimentation for its own sake.' },
  { left: 'Data-driven', right: 'Human-centered', n: 6, today: 2.5, future: 2.8, range: [2, 4], read: 'Firmly data-driven; nobody wants "human-centered" as the lead.' },
  { left: 'Serious', right: 'Approachable', n: 7, today: 4.6, future: 4.7, range: [3, 7], read: 'The widest disagreement in the set: future answers span 3 to 7. Middle, leaning approachable, is the safe center.' },
] as const

export const avoidTraits = [
  'Jargon, technocratic, "smarter than thou"',
  'Pitchy, salesy, Silicon Valley startup',
  'Guilt-driven, sentimental, poverty porn',
  'Flashy, high-concept',
  'Rigid, formulaic, bureaucratic, stodgy',
  'Smug, detracting from other humanitarian actors',
  'Isolated third-party evaluator',
  'Sloppy, loose in its methods',
] as const

export const kinshipVotes = [
  { option: 'Related but with its own personality', count: 6, who: '' },
  { option: 'Independent with a subtle connection', count: 1, who: '' },
  { option: 'Clearly part of the same family', count: 0, who: '' },
] as const

export const typographyVotes = [
  { option: 'Share DIV’s typography', count: 3, who: '' },
  { option: 'Same family but used differently', count: 2, who: '' },
  { option: 'A complementary voice of its own', count: 0, who: '' },
  { option: 'No answer', count: 2, who: '' },
] as const

export const divNuances = [
  'The lone "independent with a subtle connection" vote comes paired with a wish for shared typography. Read together: clearly related at the system level (type), distinct personality at the expression level.',
  'The dark green is read as what differentiates PRO from "the bright innovation bend of the DIV visual identity": a calm, grounded counterpart.',
  'Ease in co-communicating and fundraising with the DIV Fund. Shared building blocks make joint decks and docs easier.',
] as const

export const divHypothesis = 'Shared typographic family and grid logic with DIV. A distinct color world and tone: grounded and steady where DIV is bright and innovative. A clear, repeatable way to say "an initiative of The DIV Fund".'

export const legacyVotes = [
  { option: 'Keep and refine its energy', count: 4, who: '' },
  { option: 'A clear evolution', count: 3, who: '' },
  { option: 'A fresh start', count: 0, who: '' },
] as const

export const greenPositions = [
  { position: 'Keep a green thread', who: '3 votes', quotes: ['The green might be worth keeping.', 'Dark green feels calm and grounded, and differentiates it from DIV.', 'The color scheme is probably the closest thing we have to a visual identity.'] },
  { position: 'Blank slate', who: '3 votes', quotes: ['No.', 'It was not chosen for any particular reason. I’d assume basically a blank slate!', 'Colors or logo feel like they could be changed.'] },
  { position: 'Neutral', who: '1 vote', quotes: ['I like it, but I don’t know that it’s deeply meaningful.', 'I don’t think any of us truly loves the PRO logo.'] },
] as const

export const storyLines = [
  'Same mission, sharper tools',
  'Same mission, new operating environment',
  'From crisis response to a durable methodology, now deployed forward-looking',
  'The emergency is not over, but the universe of supportable work is much broader',
  'Evolution, a new chapter',
] as const

export const stakeholderFeel = 'Continuity plus evolution is the dominant note, along with pride and security in PRO’s professional authority: "clear, limited evolution that matches how the world has changed since March 2025", and "a clear through line, but not just chasing this single moment in time."'

export const visualFeel = [
  { word: 'Contemporary', count: 5 },
  { word: 'Minimalist', count: 4, detail: '"has worked to date, our general vibe"' },
  { word: 'Clear / clean / simple', count: 4 },
  { word: 'Bold', count: 2 },
  { word: 'Expressive', count: 2 },
  { word: 'Reserved', count: 2 },
  { word: 'Grounded', count: 1 },
  { word: 'Intriguing', count: 1 },
] as const

export const vibrancyQuotes = [
  { text: 'I’m not sure about whether we’re neutral or vibrant! I think we could be either.' },
  { text: 'Would like some more vibrancy on what is currently quite neutral, but not swaying too far.' },
] as const

export const paletteMood = [
  { word: 'Grounded', count: 4 },
  { word: 'Optimistic', count: 3 },
  { word: 'Hopeful', count: 3 },
  { word: 'Bold', count: 2 },
  { word: 'Scientific', count: 2 },
  { word: 'Serious', count: 1 },
  { word: 'Urgent', count: 1 },
] as const

export const imagery = [
  { theme: 'Field photography with dignity and agency', detail: '"Emphasizing dignity and agency of recipients of aid." Beneficiaries as the why. "Bring the projects to life." The most shared position.' },
  { theme: 'Photos come from implementing partners', detail: '"They should not be decoupled from their sources." PRO doesn’t generate its own field imagery.' },
  { theme: 'Data visualization', detail: '"Less text, more data." Welcomed by most, with one caveat that it may not be relevant to much of the site.' },
  { theme: 'The list as hero', detail: '"Our main public good is an actual database. There’s something about the literal list that feels important."' },
  { theme: 'Maps', detail: '"Easily accessible and clear without fuss. People love maps for some reason."' },
  { theme: 'Low importance overall', detail: 'One counterpoint: "probably not super important". The brand can stand without heavy photography.' },
] as const

export const metaphors = [
  { word: 'Evidence', count: 4 },
  { word: 'Scale', count: 4 },
  { word: 'Bridge', count: 2 },
  { word: 'Progress / momentum', count: 2 },
  { word: 'Lifeboat', count: 1, detail: '"I’d love to bring it back"' },
  { word: 'Systems, urgency, impact, solidarity', count: 1, detail: 'one mention each' },
] as const

export const systemVotes = [
  { option: 'Unified and controlled', count: 2, who: '' },
  { option: 'Somewhere in between', count: 3, who: '' },
  { option: 'Flexible and modular', count: 1, who: '' },
  { option: 'No answer', count: 1, who: '' },
] as const

export const cliches = [
  'Poverty porn: the sad-faced child, random smiling children, savior-complex photography',
  'Centering (usually white) evaluation experts instead of frontline implementers',
  'A donation pop-up as the first thing you see',
  'Globes',
  'Loopy circles and the sector’s usual subtext',
  'Looking like GiveWell, Coefficient Giving, Founders Pledge or Charity Navigator',
  'The current PRO visual',
] as const

export type RefLink = { label: string; url?: string }

export const references: ReadonlyArray<{ names: RefLink[]; mentions: string; why: string }> = [
  { names: [{ label: 'GiveDirectly', url: 'https://www.givedirectly.org/' }], mentions: '3 mentions', why: 'Straightforward, simple to understand; branding aligned with the underlying work.' },
  { names: [{ label: 'Patagonia', url: 'https://www.patagonia.com/' }], mentions: '2 mentions', why: 'Values-driven identity present throughout the whole story.' },
  { names: [{ label: 'The DIV Fund rebrand', url: 'https://div.fund/' }], mentions: '', why: 'Fresh, exciting; innovation central to the tone.' },
  { names: [{ label: 'Everlane', url: 'https://www.everlane.com/' }], mentions: '', why: 'Radical transparency on costs; "quietly confident and minimalist".' },
  { names: [{ label: 'Renaissance Philanthropy', url: 'https://www.renaissancephilanthropy.org/' }], mentions: '', why: '"Text-driven in a way that resonates with PRO."' },
  { names: [{ label: 'Ford Foundation', url: 'https://www.fordfoundation.org/' }, { label: 'PopHive', url: 'https://www.pophive.org/' }], mentions: '', why: 'Lukewarm ("don’t love, don’t hate"). Named for "less text, more data".' },
  { names: [{ label: 'Pratham', url: 'https://www.pratham.org/' }], mentions: '', why: 'Clear mission, human-centered images and tone.' },
  { names: [{ label: 'Wikipedia', url: 'https://www.wikipedia.org/' }], mentions: '', why: 'Neutral, trusted, utilitarian public good.' },
  { names: [{ label: 'Mulago Foundation', url: 'https://www.mulagofoundation.org/' }, { label: 'Institute for Progress', url: 'https://ifp.org/' }, { label: 'Saloni Dattani', url: 'https://www.scientificdiscovery.dev/' }], mentions: '', why: 'Writing tone only: clear, candid, data-rich yet compelling.' },
]

export const vocabulary = [
  { word: 'Vetted', count: 7 },
  { word: 'Cost-effective', count: 7 },
  { word: 'Urgent', count: 6 },
  { word: 'Life-saving', count: 6 },
  { word: 'Evidence-informed', count: 3 },
  { word: 'Save lives today', count: 2 },
  { word: 'Proven evidence base', count: 1 },
  { word: 'Most-vulnerable populations', count: 1 },
  { word: 'Critical timing', count: 1 },
  { word: 'Opportunity', count: 1 },
] as const

export const vocabularyNotes = [
  '"Urgent & Vetted" remains the flagship phrase. The team wants to shift from "list" to "database". "Best Bets" may persist.',
  'Cost-effectiveness and cost-efficiency are different things and both are used deliberately. Don’t blur them in copy.',
] as const

export const success = [
  { lede: 'Donor traction', body: 'More and deeper philanthropist relationships, fundraising success, inbound interest. Named by everyone.' },
  { lede: 'Media recognition', body: 'Press coverage has led directly to new donors, and several name it as a success measure.' },
  { lede: 'Clarity on what PRO is and how it relates to DIV', body: '"Fewer questions to our inbox about how we relate to DIV."' },
  { lede: 'Internal truth and pride', body: '"Zero daylight between what we say we do, how we think about ourselves, where we’re going, and how we present all of this publicly."' },
  { lede: 'Practical', body: 'Easier co-communication with DIV; a clearer starting point for first donor conversations; donors find what they need.' },
] as const

export const convergence = [
  { topic: 'Purpose and message', agree: 'Broker of cost-effective, proven, life-saving programs; lead with how (evidence, rigor).', split: 'How much moral register to allow: one voice says truth, justice, love; the rest say no sentiment.' },
  { topic: 'Personality', agree: 'Pragmatic and rigorous; honest; agile; not jargon-heavy, not salesy.', split: 'Serious vs. approachable (future answers span 3 to 7); how much "inspiring".' },
  { topic: 'Audience', agree: 'Donors first; press as channel.', split: 'Optimize for mainstream newcomers or for EA rigor.' },
  { topic: 'Legacy', agree: 'Evolution, never a fresh start; no attachment to the logo.', split: 'Keep the green (3) vs. blank slate (3).' },
  { topic: 'DIV relationship', agree: 'Related, own personality; move closer than today; shared type family likely.', split: 'Share DIV type exactly (3) vs. same family used differently (2); one vote for independent.' },
  { topic: 'Visual feel', agree: 'Contemporary, minimalist, clear, grounded.', split: 'Neutral and reserved vs. bold and vibrant.' },
  { topic: 'Palette mood', agree: 'Grounded plus optimistic and hopeful.', split: 'Serious vs. hopeful.' },
  { topic: 'Imagery', agree: 'No poverty porn; dignity and agency; data viz welcome; photos from partners.', split: 'Text-driven vs. "less text, more data"; how central photography is.' },
  { topic: 'System', agree: 'Tight core, limited variation.', split: 'Unified (2) vs. in between (3) vs. modular (1).' },
  { topic: 'Metaphor', agree: 'Evidence, scale, bridge and connection.', split: 'Lifeboat: emotionally strong but crisis-tethered.' },
] as const

export const tensions = [
  { title: 'Green: thread or blank slate?', body: 'A middle path exists: keep a deep green as the grounding anchor (continuity, differentiation from DIV, already in use in docs) but re-specify it and surround it with a new, more vibrant secondary. Test both boards.' },
  { title: 'Reserved vs. vibrant', body: 'The consensus floor is minimalist and grounded; the question is the accent. Explore a board where vibrancy comes from one bold accent plus data-viz color, not from the whole palette.' },
  { title: 'How close to DIV', body: 'Everyone wants to be closer than today but nobody wants to merge. Likely answer: same typographic family and structural logic, a different color temperature and a calmer rhythm.' },
  { title: 'Newcomer-friendly vs. EA-credible', body: 'Visual translation: clarity and hierarchy for newcomers; density, precision and real numbers for experts. The list is where both meet.' },
  { title: 'Text-driven vs. data-driven', body: 'Possibly both: editorial typography for narrative, a strong data-viz language for the database. The moodboard should show how they coexist.' },
  { title: 'Urgency without panic', body: 'Sliders say stay urgent but less frantic. Avoid alarm reds and sirens; express urgency through directness and timing cues, not visual noise.' },
  { title: 'Lifeboat', body: 'Decide whether it’s a brand metaphor or a campaign device. It’s loved, but could re-tether PRO to the crisis story the team wants to outgrow.' },
] as const

export const brandSentence = 'PRO is the rigorous, pragmatic broker that helps donors fund proven, life-saving programs at scale, quickly and with confidence. Grounded, precise and quietly hopeful. Never salesy, never sentimental.'

export const keywords = {
  core: ['Grounded', 'Precise', 'Pragmatic', 'Clear', 'Contemporary', 'Minimalist', 'Trustworthy'],
  accent: ['Optimistic', 'Hopeful', 'Bold (in moderation)', 'Inspiring', 'Established'],
  avoid: ['Flashy', 'Startup-shiny', 'Academic-dense', 'Sentimental', 'Bureaucratic', 'Cheesy (globes)', 'Generic NGO (loopy circles)'],
} as const

export const boards = [
  {
    name: 'Board A',
    title: 'Continuity',
    body: 'Starts from the palette PRO uses today: the deep teal-green anchor, its brighter green accent, pale sage and warm ink. Re-specify these, then test one new optimistic accent for calls to action and data highlights.',
    swatches: ['#005955', '#3bb598', '#f4f6ea', '#332c21', '#e8a33d'],
  },
  {
    name: 'Board B',
    title: 'Blank slate',
    body: 'Grounded base (ink, slate, stone) plus a vibrant hopeful accent. Clearly not GiveWell, Coefficient, Founders Pledge or Charity Navigator.',
    swatches: ['#16181d', '#3a4048', '#8a8f96', '#e4e1db', '#ff6a3d'],
  },
] as const

export const briefNotes = {
  typography: [
    'Start from DIV’s typographic family (3 votes plus the desire to move closer). Explore the same family with different weights and rhythm, calmer and more editorial, vs. identical usage.',
    'It needs to handle dense tables and lists (the database), long-form caveated writing, and short confident headlines equally well.',
  ],
  imagery: [
    'Field photography sourced from implementing partners: people with agency, at work, in context. No close-up pity shots. Credit sources.',
    'A strong, honest data-visualization language (bars, comparisons, cost per outcome). Clarity over decoration.',
    'The list as a signature component, the thing people remember. Can its structure (rows, tags, status) become a graphic motif?',
    'Connection, bridge and conduit as the underlying metaphor; evidence and scale as secondary themes. Lifeboat only as an optional exploration.',
    'Low-effort assets for the team: a color, a header bar, a typographic rule that works in Word and email.',
  ],
  tone: 'The board should feel like a trusted expert’s desk, not a campaign: ordered, evidence-rich, human in the photos, confident in the headlines, with a single warm, hopeful note running through it.',
} as const
