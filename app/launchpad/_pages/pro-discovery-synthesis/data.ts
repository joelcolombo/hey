/**
 * PRO Brand Discovery synthesis. Hand-digested from the 7 questionnaire
 * responses (Aug 10 to 17, 2026). This is the source of truth for the page;
 * the Notion page of the same name is the long-form reference.
 */

export const respondents = [
  { name: 'Caitlin Tulloch', short: 'Caitlin', date: 'Aug 10', lens: 'Strategic, sector-critical lens; several visual questions left blank' },
  { name: 'Kayla Hoyer', short: 'Kayla', date: 'Aug 11', lens: 'Operational, donor-comms lens; dislikes the current visual' },
  { name: 'Sasha', short: 'Sasha', date: 'Aug 11', lens: 'Most detailed on voice, politics and competitor positioning' },
  { name: 'Ellie Lewis', short: 'Ellie', date: 'Aug 11', lens: 'Summer comms intern; hands-on usage lens (the green in Word docs)' },
  { name: 'Grace Morgan', short: 'Grace', date: 'Aug 12', lens: 'Richest on narrative, audiences and the list as product' },
  { name: 'Rob Rogers', short: 'Rob Rogers', date: 'Aug 12', lens: 'Mostly rolled off PRO to work on DIV; brought back the lifeboat' },
  { name: 'Rob Rosenbaum', short: 'Rob Rosenbaum', date: 'Aug 17', lens: 'Leadership lens; longest on audiences, DIV confusion and the forward story' },
] as const

export const TOTAL = respondents.length

export const tenThings = [
  { lede: 'Purpose is crystal clear and shared.', body: 'All 7 describe PRO the same way: identify cost-effective, proven, life-saving programs that lost funding, and connect them quickly with private philanthropy. Nobody disagrees on what PRO is.' },
  { lede: 'The personality is unanimous: pragmatic and rigorous.', body: '"Pragmatic" or "practical" appears in all 7 character descriptions; "rigorous" in 5. Secondary notes: honest, agile, inspiring, humane. Ellie’s "nerds in a basement" is the affectionate shorthand.' },
  { lede: 'Donors are the audience. Everything else is secondary.', body: 'HNWI and their advisors, EA-adjacent donors, small family foundations, new AI money. Press matters as a channel to donors. Implementing partners and policy circles are real but not the identity’s primary target.' },
  { lede: 'The needle to thread: approachable to newcomers, rigorous enough for the EA crowd.', body: 'Rob Rosenbaum names it explicitly. Rob Rogers wants PRO "squarely in the middle" between wonky and pitchy. Caitlin: "not too technocratic, not smug".' },
  { lede: 'Nobody wants a fresh start.', body: '4 vote "keep and refine its energy", 3 vote "a clear evolution", 0 vote "fresh start". The story is "same mission, sharper tools" in a new operating environment.' },
  { lede: 'But nobody loves the current logo either.', body: 'The only candidate visual equity is the dark green, and even that is a split: 3 see value in it, 3 see a blank slate, 1 is neutral.' },
  { lede: 'Relationship with DIV: related, with its own personality.', body: '6 of 7 pick that option. Sliders show the team wants PRO closer to DIV than it is today (6.0 to 4.6 on a 1 close / 7 distinct scale). Typography: 3 say share DIV’s, 2 say same family used differently.' },
  { lede: 'Visual language: contemporary, minimalist, clear. Live debate on neutral vs. vibrant.', body: 'Contemporary (5), minimalist (4), clear (4). Sasha is unsure, Rosenbaum wants "more vibrancy than the current neutral", Grace and Rosenbaum say bold, Ellie and Sasha say reserved.' },
  { lede: 'Palette mood converges on grounded plus optimistic.', body: 'Grounded (4), optimistic (3), hopeful (3), bold (2), scientific (2). Not somber, not cheerful: steady and forward-looking.' },
  { lede: 'The hard no’s are consistent.', body: 'Poverty porn, guilt-based appeals, donation pop-ups, looking like GiveWell, startup shininess, globes and loopy circles. And a shared instinct to lead with how PRO works (evidence, rigor, the list) rather than with need.' },
] as const

export const purposeQuotes = [
  { text: 'PRO is a totally neutral broker. It provides clear, timely analysis in an accessible format, to increase the speed and maximize the impact of donor funding.', who: 'Sasha' },
  { text: 'We serve as an intermediary in this market of implementers and funders, to reduce information asymmetries and enable transactions with strong confidence and little friction.', who: 'Rob Rosenbaum' },
  { text: 'We work with implementers to pare down their programs to the core drivers of impact and then connect them with philanthropists to plug critical gaps.', who: 'Grace' },
] as const

export const keyMessages = [
  { lede: 'Trusted, knowledgeable steward of a market', body: 'Rigor with common sense, "the forest not the trees" (Rosenbaum).' },
  { lede: 'The list is pre-vetted', body: 'Scoped for urgency and cost-effectiveness (Kayla, Ellie).' },
  { lede: 'Cost-effectiveness as a guide to giving saves lives', body: 'Caitlin. Grace: optimize available resources toward a chosen outcome.' },
  { lede: 'Beyond economics', body: '"This work is also about truth, justice, and love of others" (Sasha). The one voice pushing the moral register.' },
  { lede: 'Context', body: 'Programs that lost funding due to foreign-assistance cuts (Rogers).' },
] as const

export const audiences = [
  { tier: 'Primary', who: 'HNWI and their advisors (mainstream newcomers, low-information but impact-hungry); EA and EA-adjacent donors; small family foundations; new AI-IPO money.', by: 'All 7', implication: 'Must read as credible at a glance and be easy to navigate for a non-expert.' },
  { tier: 'Secondary', who: 'Philanthropic and donor-advisory organisations; peer evidence orgs; press.', by: 'Nearly all', implication: 'Press has been the main acquisition channel. The identity must be quotable and recognisable.' },
  { tier: 'Tertiary', who: 'Implementing partners; global health and development foundations; policy circles (think tanks, Hill, State Dept, multilaterals); former USAID networks.', by: 'Rosenbaum, Grace, Rogers, Ellie', implication: 'Political neutrality. Nothing that reads as partisan.' },
] as const

export const needleQuote = { text: 'This continues to be the needle to thread: how to sound approachable to new entrants while being rigorous enough for those with higher base knowledge and expectations.', who: 'Rob Rosenbaum' }

export const misreadings = [
  { myth: 'PRO and the DIV Fund are the same thing, or overlap more than they do', reality: 'PRO is narrower: only life-saving, only proven. The relationship needs to be legible at a glance.', who: 'Sasha, Grace, Rosenbaum. Rogers notes few even know the relationship yet.' },
  { myth: 'PRO has its own pool of money and makes grants', reality: 'PRO connects implementing partners to donors. It does not fund.', who: 'Kayla' },
  { myth: 'Cost-effectiveness means innovation (what DIV funds)', reality: 'PRO backs "routinely delivering, well-evidenced, almost boring programs".', who: 'Caitlin' },
  { myth: 'PRO is the USAID-saver, full stop', reality: 'The team wants a forward-looking identity not tethered to the genesis story.', who: 'Rosenbaum' },
] as const

export const constraints = [
  { lede: 'Political neutrality', body: 'Born from the USAID/DOGE moment and donors were motivated by it, so don’t erase it. But never read as the antithesis of State Dept; policymakers on both sides must take PRO seriously. (Sasha, Rosenbaum, Rogers)' },
  { lede: 'Tiny team', body: '2 FTE. Don’t imply a big institution; don’t make the size obvious either. (Ellie)' },
  { lede: 'The live database', body: 'An Airtable embed on the site is the core product and has been technically painful. Treat the list as a first-class design component. (Grace)' },
  { lede: 'Materials are made in Word', body: 'Give the team something low-effort (a colour, a rule, a header) they can apply themselves. (Ellie)' },
] as const

export const characterWords = [
  { word: 'Pragmatic', count: 7, detail: 'pragmatic, practical, "not letting perfect be the enemy of the good"' },
  { word: 'Rigorous', count: 5, detail: 'rigorous, methodical, analytic, detail-oriented' },
  { word: 'Agile', count: 4, detail: 'nimble, agile, timely, resilient, persistent' },
  { word: 'Inspiring', count: 3, detail: 'Grace, Rogers, Rosenbaum' },
  { word: 'Honest', count: 3, detail: 'honest, honorable, operates with integrity' },
  { word: 'Human', count: 3, detail: 'humane, connected, engaged, approachable, thoughtful' },
  { word: 'Authoritative', count: 1, detail: 'Ellie, plus "nerds in a basement" as self-image' },
] as const

export const voiceWords = [
  { word: 'Precise', who: 'Sasha, Grace, Rogers' },
  { word: 'Inspiring', who: 'Grace, Rogers. Sasha: "it could be more inspiring"' },
  { word: 'Knowledgeable, humble, open to learning', who: 'Rosenbaum' },
  { word: 'Practical, commanding, urgent, accessible', who: 'Kayla' },
  { word: 'Direct, informative, caveated', who: 'Ellie' },
] as const

/** 1 = left pole, 7 = right pole. Averages across respondents who answered. */
export const sliders = [
  { left: 'Established', right: 'Emergent', n: 7, today: 5.1, future: 4.0, range: [3, 6], read: 'Feels emergent today; wants to read as more established. Strongest from Rosenbaum (7 to 3).' },
  { left: 'Close to DIV', right: 'Fully distinct', n: 5, today: 6.0, future: 4.6, range: [4, 5], read: 'Very distinct today; everyone wants to move closer to DIV, to the middle, not merged.' },
  { left: 'Thought leader', right: 'Facilitator', n: 7, today: 4.4, future: 3.0, range: [2, 5], read: 'Wants to become more of a thought leader (Kayla, Sasha: 5 to 2). Grace, Ellie, Rogers stay nearer facilitator.' },
  { left: 'Urgent', right: 'Patient', n: 7, today: 1.9, future: 2.9, range: [2, 4], read: 'Very urgent today; keep the urgency but feel less frantic, more durable.' },
  { left: 'Global', right: 'Regionally grounded', n: 6, today: 2.2, future: 2.8, range: [1, 5], read: 'Global. Sasha is the outlier leaning regional.' },
  { left: 'Technical', right: 'Strategic', n: 7, today: 3.3, future: 3.9, range: [2, 6], read: 'Slightly more strategic. Kayla wants 6, Sasha wants 2: genuine spread.' },
  { left: 'Academic', right: 'Accessible', n: 7, today: 3.6, future: 4.0, range: [3, 6], read: 'Slightly more accessible. Rogers pushes hardest (3 to 6).' },
  { left: 'Institutional', right: 'Progressive', n: 5, today: 5.4, future: 5.0, range: [4, 6], read: 'Progressive, with a touch more institutional weight wanted.' },
  { left: 'Conservative', right: 'Experimental', n: 6, today: 3.3, future: 3.5, range: [2, 5], read: 'Centre. Not a place for visual experimentation for its own sake.' },
  { left: 'Data-driven', right: 'Human-centered', n: 6, today: 2.5, future: 2.8, range: [2, 4], read: 'Firmly data-driven; nobody wants "human-centered" as the lead.' },
  { left: 'Serious', right: 'Approachable', n: 7, today: 4.6, future: 4.7, range: [3, 7], read: 'Widest disagreement: Kayla 7, Grace 6 vs. Sasha 3, Rosenbaum 3. Middle, leaning approachable, is the safe centre.' },
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
  { option: 'Related but with its own personality', count: 6, who: 'Caitlin, Kayla, Sasha, Ellie, Grace, Rogers' },
  { option: 'Independent with a subtle connection', count: 1, who: 'Rosenbaum' },
  { option: 'Clearly part of the same family', count: 0, who: '' },
] as const

export const typographyVotes = [
  { option: 'Share DIV’s typography', count: 3, who: 'Sasha, Ellie, Rosenbaum' },
  { option: 'Same family but used differently', count: 2, who: 'Grace, Rogers' },
  { option: 'A complementary voice of its own', count: 0, who: '' },
  { option: 'No answer', count: 2, who: 'Caitlin, Kayla' },
] as const

export const divNuances = [
  'Rosenbaum’s "independent with subtle connection" sits next to his own slider (6 to 5, still fairly distinct) and his wish for shared typography. Read together: clear kinship at the system level (type), distinct personality at the expression level.',
  'Ellie sees the dark green as what differentiates PRO from "the bright innovation bend of the DIV visual identity": a calm, grounded counterpart.',
  'Grace admires the DIV rebrand ("fresh, exciting, something I’d want to be part of") and is happy to sit next to it.',
  'Practical driver (Ellie): success means ease in co-communicating and fundraising with the DIV Fund. Shared building blocks make joint decks and docs easier.',
] as const

export const divHypothesis = 'Shared typographic family and grid logic with DIV. A distinct colour world and tone: grounded and steady where DIV is bright and innovative. A clear, repeatable way to say "an initiative of The DIV Fund".'

export const legacyVotes = [
  { option: 'Keep and refine its energy', count: 4, who: 'Kayla, Sasha, Ellie, Grace' },
  { option: 'A clear evolution', count: 3, who: 'Caitlin, Rogers, Rosenbaum' },
  { option: 'A fresh start', count: 0, who: '' },
] as const

export const greenPositions = [
  { position: 'Keep a green thread', who: 'Sasha, Ellie, Rosenbaum', quotes: ['The green might be worth keeping.', 'Dark green feels calm and grounded, and differentiates it from DIV.', 'The color scheme is probably the closest thing we have to a visual identity.'] },
  { position: 'Blank slate', who: 'Kayla, Grace, Rogers', quotes: ['No.', 'It was not chosen for any particular reason. I’d assume basically a blank slate!', 'Colors or logo feel like they could be changed.'] },
  { position: 'Neutral', who: 'Caitlin', quotes: ['I like it, but I don’t know that it’s deeply meaningful.', 'I don’t think any of us truly loves the PRO logo.'] },
] as const

export const storyLines = [
  { line: 'Same mission, sharper tools', who: 'Ellie, Rogers' },
  { line: 'Same mission, new operating environment', who: 'Caitlin, Grace' },
  { line: 'From crisis response to a durable methodology, now deployed forward-looking', who: 'Rosenbaum' },
  { line: 'The emergency is not over, but the universe of supportable work is much broader', who: 'Sasha' },
  { line: 'Evolution, a new chapter', who: 'Kayla' },
] as const

export const stakeholderFeel = 'Continuity plus evolution (Rogers, Grace, Rosenbaum). Pride, and security in PRO’s professional authority (Ellie). "Clear, limited evolution that matches how the world has changed since March 2025" (Caitlin). Rosenbaum: "a clear through line, but not just chasing this single moment in time."'

export const visualFeel = [
  { word: 'Contemporary', count: 5, who: 'Caitlin, Sasha, Ellie, Grace, Rogers' },
  { word: 'Minimalist', count: 4, who: 'Sasha, Grace, Rogers, Rosenbaum' },
  { word: 'Clear / clean / simple', count: 4, who: 'Caitlin, Kayla, Ellie, Grace' },
  { word: 'Bold', count: 2, who: 'Grace, Rosenbaum' },
  { word: 'Expressive', count: 2, who: 'Caitlin ("somewhat"), Rogers' },
  { word: 'Reserved', count: 2, who: 'Sasha, Ellie' },
  { word: 'Grounded', count: 1, who: 'Ellie' },
  { word: 'Intriguing', count: 1, who: 'Kayla' },
] as const

export const vibrancyQuotes = [
  { text: 'I’m not sure about whether we’re neutral or vibrant! I think we could be either.', who: 'Sasha' },
  { text: 'Would like some more vibrancy on what is currently quite neutral, but not swaying too far.', who: 'Rob Rosenbaum' },
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
  { theme: 'Field photography with dignity and agency', who: 'Caitlin, Sasha, Grace, Rogers, Rosenbaum', detail: '"Emphasizing dignity and agency of recipients of aid." Beneficiaries as the why. "Bring the projects to life."' },
  { theme: 'Photos come from implementing partners', who: 'Kayla, Ellie', detail: '"They should not be decoupled from their sources." PRO doesn’t generate its own field imagery.' },
  { theme: 'Data visualisation', who: 'Caitlin, Sasha, Rogers, Rosenbaum', detail: 'Sasha on references: "less text, more data". Ellie: useful, but maybe not relevant to much of the site.' },
  { theme: 'The list as hero', who: 'Grace', detail: '"Our main public good is an actual database. There’s something about the literal list that feels important."' },
  { theme: 'Maps', who: 'Kayla', detail: '"Easily accessible and clear without fuss. People love maps for some reason."' },
  { theme: 'Low importance overall', who: 'Rosenbaum', detail: '"Probably not super important." The brand can stand without heavy photography.' },
] as const

export const metaphors = [
  { word: 'Evidence', count: 4, who: 'Kayla, Sasha, Ellie, Rosenbaum' },
  { word: 'Scale', count: 4, who: 'Ellie, Grace, Rogers, Rosenbaum' },
  { word: 'Bridge', count: 2, who: 'Kayla, Grace' },
  { word: 'Progress / momentum', count: 2, who: 'Kayla, Sasha' },
  { word: 'Lifeboat', count: 1, who: 'Rogers: "I’d love to bring it back"' },
  { word: 'Systems, urgency, impact, solidarity', count: 1, who: 'Ellie, Sasha' },
] as const

export const systemVotes = [
  { option: 'Unified and controlled', count: 2, who: 'Kayla, Ellie' },
  { option: 'Somewhere in between', count: 3, who: 'Grace, Rogers, Rosenbaum' },
  { option: 'Flexible and modular', count: 1, who: 'Caitlin' },
  { option: 'No answer', count: 1, who: 'Sasha' },
] as const

export const cliches = [
  { item: 'Poverty porn: the sad-faced child, random smiling children, savior-complex photography', who: 'Kayla, Ellie, Grace, Rosenbaum' },
  { item: 'Centering (usually white) evaluation experts instead of frontline implementers', who: 'Caitlin' },
  { item: 'A donation pop-up as the first thing you see', who: 'Grace (IRC), Rosenbaum (Save the Children)' },
  { item: 'Globes', who: 'Rogers' },
  { item: 'Loopy circles and the sector’s usual subtext', who: 'Sasha' },
  { item: 'Looking like GiveWell, Coefficient Giving, Founders Pledge or Charity Navigator', who: 'Sasha, Grace, Rogers' },
  { item: 'Mulago’s look (the writing is liked, the brand is not)', who: 'Sasha' },
  { item: 'The current PRO visual', who: 'Kayla' },
] as const

export const references = [
  { name: 'GiveDirectly', who: 'Grace, Rogers, Rosenbaum', why: 'Straightforward, simple to understand; branding aligned with the underlying work.' },
  { name: 'Patagonia', who: 'Grace, Rosenbaum', why: 'Values-driven identity present throughout the whole story.' },
  { name: 'The DIV Fund rebrand', who: 'Grace', why: 'Fresh, exciting; innovation central to the tone.' },
  { name: 'Everlane', who: 'Grace', why: 'Radical transparency on costs; "quietly confident and minimalist".' },
  { name: 'Renaissance Philanthropy', who: 'Ellie', why: '"Text-driven in a way that resonates with PRO."', url: 'https://www.renaissancephilanthropy.org/' },
  { name: 'Ford Foundation, PopHive', who: 'Sasha', why: 'Lukewarm ("don’t love, don’t hate"). Likes "less text, more data".', url: 'https://www.pophive.org/' },
  { name: 'Pratham', who: 'Rogers', why: 'Clear mission, human-centered images and tone.' },
  { name: 'Wikipedia', who: 'Caitlin', why: 'Neutral, trusted, utilitarian public good.' },
  { name: 'Mulago, Institute for Progress, Saloni Dattani', who: 'Sasha', why: 'Writing tone: clear, candid, data-rich yet compelling.' },
] as const

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
  '"Urgent & Vetted" remains the flagship phrase. The team wants to shift from "list" to "database". "Best Bets" may persist. (Grace)',
  'Cost-effectiveness and cost-efficiency are different things and both are used deliberately. Don’t blur them in copy. (Grace)',
] as const

export const success = [
  { lede: 'Donor traction', body: 'More and deeper philanthropist relationships, fundraising success, inbound interest. All 7.' },
  { lede: 'Media recognition', body: 'Kayla, Sasha, Rogers.' },
  { lede: 'Clarity on what PRO is and how it relates to DIV', body: 'Caitlin, Ellie, Grace ("fewer questions to our inbox about how we relate to DIV").' },
  { lede: 'Internal truth and pride', body: 'Rosenbaum: "zero daylight between what we say we do, how we think about ourselves, where we’re going, and how we present all of this publicly." Ellie: pride, security in PRO’s authority.' },
  { lede: 'Practical', body: 'Easier co-communication with DIV (Ellie); a clearer starting point for first donor conversations (Grace); donors find what they need (Rosenbaum).' },
] as const

export const convergence = [
  { topic: 'Purpose and message', agree: 'Broker of cost-effective, proven, life-saving programs; lead with how (evidence, rigor).', split: 'How much moral register to allow (Sasha: truth, justice, love; others: no sentiment).' },
  { topic: 'Personality', agree: 'Pragmatic and rigorous; honest; agile; not jargon-heavy, not salesy.', split: 'Serious vs. approachable (3 to 7); how much "inspiring".' },
  { topic: 'Audience', agree: 'Donors first; press as channel.', split: 'Optimise for mainstream newcomers or for EA rigour.' },
  { topic: 'Legacy', agree: 'Evolution, never a fresh start; nobody loves the logo.', split: 'Keep the green (3) vs. blank slate (3).' },
  { topic: 'DIV relationship', agree: 'Related, own personality; move closer than today; shared type family likely.', split: 'Share DIV type exactly vs. same family used differently; Rosenbaum’s "independent".' },
  { topic: 'Visual feel', agree: 'Contemporary, minimalist, clear, grounded.', split: 'Neutral and reserved vs. bold and vibrant.' },
  { topic: 'Palette mood', agree: 'Grounded plus optimistic and hopeful.', split: 'Serious (Sasha) vs. hopeful (Rogers, Grace).' },
  { topic: 'Imagery', agree: 'No poverty porn; dignity and agency; data viz welcome; photos from partners.', split: 'Text-driven (Ellie) vs. "less text, more data" (Sasha); how central photography is.' },
  { topic: 'System', agree: 'Tight core, limited variation.', split: 'Unified (2) vs. in between (3) vs. modular (1).' },
  { topic: 'Metaphor', agree: 'Evidence, scale, bridge and connection.', split: 'Lifeboat (Rogers): emotionally strong but crisis-tethered.' },
] as const

export const tensions = [
  { title: 'Green: thread or blank slate?', body: 'A middle path exists: keep a deep green as the grounding anchor (continuity, differentiation from DIV, already in use in docs) but re-specify it and surround it with a new, more vibrant secondary. Test both boards.' },
  { title: 'Reserved vs. vibrant', body: 'The consensus floor is minimalist and grounded; the question is the accent. Explore a board where vibrancy comes from one bold accent plus data-viz colour, not from the whole palette.' },
  { title: 'How close to DIV', body: 'Everyone wants to be closer than today but nobody wants to merge. Likely answer: same typographic family and structural logic, a different colour temperature and a calmer rhythm.' },
  { title: 'Newcomer-friendly vs. EA-credible', body: 'Visual translation: clarity and hierarchy for newcomers; density, precision and real numbers for experts. The list is where both meet.' },
  { title: 'Text-driven vs. data-driven', body: 'Possibly both: editorial typography for narrative, a strong data-viz language for the database. The moodboard should show how they coexist.' },
  { title: 'Urgency without panic', body: 'Sliders say stay urgent but less frantic. Avoid alarm reds and sirens; express urgency through directness and timing cues, not visual noise.' },
  { title: 'Lifeboat', body: 'Decide whether it’s a brand metaphor or a campaign device. It’s loved by one, but could re-tether PRO to the crisis story others want to outgrow.' },
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
    body: 'Deep green as anchor (calm, grounded, already recognised), warm neutrals, one optimistic accent for calls to action and data highlights.',
    swatches: ['#1d3b2f', '#2f5d47', '#e9e3d6', '#c9bfae', '#e8a33d'],
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
    'A strong, honest data-visualisation language (bars, comparisons, cost per outcome). Clarity over decoration.',
    'The list as a signature component, the thing people remember. Can its structure (rows, tags, status) become a graphic motif?',
    'Connection, bridge and conduit as the underlying metaphor; evidence and scale as secondary themes. Lifeboat only as an optional exploration.',
    'Low-effort assets for the team: a colour, a header bar, a typographic rule that works in Word and email.',
  ],
  tone: 'The board should feel like a trusted expert’s desk, not a campaign: ordered, evidence-rich, human in the photos, confident in the headlines, with a single warm, hopeful note running through it.',
} as const

export type Verbatim = { q: string; answers: Array<{ who: string; text: string }> }

export const appendix: Verbatim[] = [
  { q: 'Purpose and role of PRO', answers: [
    { who: 'Caitlin', text: 'PRO identifies the most cost-effectively life-saving health and humanitarian projects which might formerly have been funded by governments, and identified private or philanthropic funding to keep these projects going.' },
    { who: 'Kayla', text: 'To fill critical funding gaps for lifesaving development and humanitarian programs.' },
    { who: 'Sasha', text: 'PRO was designed to make it as easy and clear as humanly possible for donors to find and fund critical development and humanitarian projects that will measurably and meaningfully improve the lives of the most vulnerable. PRO is a totally neutral broker, driven solely by this goal: it provides clear, timely analysis and in an accessible format, to increase the speed and maximize the impact of donor funding.' },
    { who: 'Ellie', text: 'Project Resource Optimization connects implementing partners with donors to fund life-saving and highly effective projects in need of urgent funding. As governments cut ODA spending across the globe, PRO identifies programs that can still provide critical services and facilitates continued service delivery.' },
    { who: 'Grace', text: 'Our main purpose is to direct funding to what we know works in order to cost-effectively save lives. We work with implementers to pare down their programs to the core drivers of impact and then connect them with philanthropists to plug critical gaps.' },
    { who: 'Rob Rogers', text: 'To connect philanthropic donors with highly leveraged and vetted humanitarian opportunities.' },
    { who: 'Rob Rosenbaum', text: 'PRO’s purpose is to identify some of the most cost-effective global health and humanitarian programs, delivering life-saving programming at scale, and to crowd-in private philanthropy to (quickly) fund that work. We serve as an intermediary in this market (of implementers and funders) to reduce information asymmetries and enable transactions (in the form of donations) to happen with strong confidence and little friction.' },
  ] },
  { q: 'Key message', answers: [
    { who: 'Caitlin', text: 'Donors have the opportunity to save lives and preserve the capacity of frontline humanitarian organizations, if they use cost-effectiveness as a guide for their giving.' },
    { who: 'Kayla', text: 'That our list of awards are pre-vetted and scoped for urgency and cost-effectiveness.' },
    { who: 'Sasha', text: 'We are driven by a team that is deeply driven by evidence. We are trying to maximize the impact of available budgets, but see the imperative as far more than economic; this work is also about truth, justice, and love of others.' },
    { who: 'Ellie', text: 'How PRO identifies projects. PRO has a trusted network of implementing partners, but needs to continue building an authoritative voice that donors can trust. The value add here is the niche of projects that PRO identifies: urgently needing funding, already proven at scale, trimmed of additional services that don’t make as much impact in a funding-scarce environment.' },
    { who: 'Grace', text: 'We can’t possibly address all of the problems or outcomes within the development space. But, in order to have impact, we have to optimize available resources to achieve a chosen outcome in the best way we know how. That’s why PRO prioritizes projects that implement proven interventions at saving lives. Our goal is to direct more private philanthropy into this space.' },
    { who: 'Rob Rogers', text: 'PRO identifies cost-effective life saving giving opportunities which have lost funding due to foreign assistance budget cuts.' },
    { who: 'Rob Rosenbaum', text: 'That we are knowledgeable and trustworthy stewards of this market. We make unbiased, evidence-based appraisals of projects using rigorous methods but are not unreasonably hard-lined in the face of a deeply complex world and implementing environment. In other words we combine rigor with common-sense and see the forest in our approach rather than just the "trees" of a single model or indicator to use to recommend funding.' },
  ] },
  { q: 'Audiences and priority', answers: [
    { who: 'Caitlin', text: 'EA-adjacent philanthropic donors; philanthropic advisors; peer organizations and policy groups. Priority: individual donors and philanthropic advisors.' },
    { who: 'Kayla', text: 'Philanthropic donors, press, HNWI, AI IPO funds and foundations. "We primarily partner with IPs but our comms should be tailored to donors and potential donors; our IP partnerships are well established." Priority: donors (foundations, HNWIs, funds).' },
    { who: 'Sasha', text: 'Philanthropic donors, press, foundations. Priority: individual and institutional donors.' },
    { who: 'Ellie', text: 'HNWI; donor advisement organizations; evidence-based policy advisory groups; former USAID networks. Priority: HNWI and their donor-advisors, particularly EA-adjacent people and people with new AI-IPO money.' },
    { who: 'Grace', text: 'Philanthropic donors (EA or adjacent), smaller family foundations, HNWI first. Secondary: implementing partners, peer organizations. Press has been key historically. "I predict our continued success will come from the already known networks we have in the EA and EA-adjacent space." Priority: foundations and HNWI in the EA-adjacent space who see additional value in PRO over typical advisors such as GiveWell.' },
    { who: 'Rob Rogers', text: 'Philanthropic donors, implementing partners, press. Priority: philanthropic donors.' },
    { who: 'Rob Rosenbaum', text: 'Six groups. (1) HNWI and advisors, new to the field, low-information but impact-hungry, "by far the largest source of money we’ve moved"; (2) EA HNWI, donors and foundations, who require a high bar of rigor; (3) global health and development foundations, co-funders and sources; (4) implementing partners; (5) media and press: "a pretty clear through line from media coverage to reaching new donors"; (6) policy circles. Priority: "pretty much all the donor groups. Torn between mainstream rich people new to the space and the EA crowd."' },
  ] },
  { q: 'Misreadings and constraints', answers: [
    { who: 'Caitlin', text: 'Many think cost-effectiveness is about innovating (DIV) whereas many cost-effective projects are routinely delivering well-evidenced, "almost boring" programs. No constraints.' },
    { who: 'Kayla', text: 'Most common misconception: PRO has its own pool of funding and makes funding decisions, rather than connecting IPs to donors. No constraints.' },
    { who: 'Sasha', text: 'Confusion is more around DIV than PRO, or thinking they overlap more than they do; PRO is narrower (only life-saving, only proven). Constraint: politically neutral outwardly. Born out of the Trump/DOGE moment but must be taken seriously by policymakers on both sides.' },
    { who: 'Ellie', text: 'Students applying for internships; some peer orgs. Constraint: the team is 2 FTE. Don’t give the false impression of a big team.' },
    { who: 'Grace', text: 'Definite confusion about how PRO is distinct from DIV and what being housed together means. Constraint: the live Airtable database embed on the website is essential but has been technically painful.' },
    { who: 'Rob Rogers', text: 'Not sure anyone thinks there’s a relationship between PRO and DIV yet. Political and legal constraints around the USAID history.' },
    { who: 'Rob Rosenbaum', text: 'Lots of confusion about PRO and DIV, especially among those who know both. "We still haven’t nailed the elevator pitch of both together." People see PRO as the USAID-saver; building a future-looking identity less tethered to that. Constraint: don’t be overtly political; there are people inside the administration to engage.' },
  ] },
  { q: 'Character, voice and traits to avoid', answers: [
    { who: 'Caitlin', text: 'Honest, pragmatic, humane, connected. Avoid: too technocratic; detracting from other humanitarian and development actors; smug.' },
    { who: 'Kayla', text: 'Rigorous but deeply pragmatic, not letting perfect be the enemy of the good, nimble. Voice: practical, knowledgeable, commanding, urgent, authoritative, accessible.' },
    { who: 'Sasha', text: 'Rigorous, honorable, methodical, operates with integrity, but agile: urgency and pragmatism as opposed to absolutism. Voice: precise, could be more inspiring. Avoid: Silicon Valley startup; bureaucratic or stodgy; loose methods; sloppy work.' },
    { who: 'Ellie', text: '"Nerds in a basement", keep that; pragmatic, authoritative, detail-oriented. Voice: direct, pragmatic, informative, educational, detail-oriented, caveated. Avoid: flashy, too high-concept.' },
    { who: 'Grace', text: 'Analytic, pragmatic, rigorous, timely, inspiring, resilient, persistent. Voice: precise, inspiring. Avoid: rigid, formulaic, isolated third-party evaluator, sentimental or guilt-driven.' },
    { who: 'Rob Rogers', text: 'Pragmatic, rigorous, inspiring. Voice: precise, inspiring. Avoid: overly technical or wonky; overly simplified and pitchy. "Squarely in the middle."' },
    { who: 'Rob Rosenbaum', text: 'Rigorous, practical, engaged, inspiring, thoughtful, approachable. Voice: knowledgeable, informed and rigorous, but humble and open to learning. Avoid: too much jargon, smarter than thou, guilt-trippy, poverty porn.' },
  ] },
  { q: 'First impression and stakeholder feeling', answers: [
    { who: 'Caitlin', text: 'Empowered, clear. Stakeholders: clear, limited evolution matching how the world changed since March 2025.' },
    { who: 'Kayla', text: 'Excited that this platform will make their lives easier: commit funding with trust in PRO’s structure and evaluation. Stakeholders: fresh start, evolution.' },
    { who: 'Sasha', text: 'Like they’ve found the experts they’ve been looking for. Stakeholders: evolution.' },
    { who: 'Ellie', text: 'A trusted source of information they can act on. Stakeholders: pride, security in PRO’s professional authority, positioned to keep providing impactful insights.' },
    { who: 'Grace', text: 'Confident, able to act, a sense of resolution at filling an identified gap, not confused about how to help. Stakeholders: continuity and evolution; people may remember the website and the list more than the logo.' },
    { who: 'Rob Rogers', text: 'Did not engage with the question. Stakeholders: continuity, evolution.' },
    { who: 'Rob Rosenbaum', text: 'Impressed and inspired to do something: "This is what I’ve been looking for." Stakeholders: evolution with continuity; a clear through line, but not chasing the single USAID moment.' },
  ] },
  { q: 'Visual feel, palette mood and imagery', answers: [
    { who: 'Caitlin', text: 'Clear, contemporary, somewhat expressive. Imagery: some field photography emphasizing dignity and agency; some data visualizations.' },
    { who: 'Kayla', text: 'Accessible, intriguing and attention grabbing, clear, simple. Imagery: NOT a ton of starving children; photos provided by IPs; clear maps.' },
    { who: 'Sasha', text: 'Minimalist, reserved, contemporary; unsure whether neutral or vibrant. Mood: serious, bold, grounded. Imagery: reasonably important; project photos plus data viz.' },
    { who: 'Ellie', text: 'Reserved, contemporary, grounded, clean. Mood: grounded, scientific. Imagery: photos only from IPs, not decoupled from sources; data viz great but maybe not relevant to much of the site.' },
    { who: 'Grace', text: 'Minimalist, bold, contemporary, clear-cut, accurate and not exaggerated but optimistic. Mood: grounded, optimistic, hopeful, bold. Imagery: field photography positioning beneficiaries as the purpose; the presentation of the list is central to the brand.' },
    { who: 'Rob Rogers', text: 'Contemporary, minimalist, expressive. Mood: hopeful, optimistic, analytical. Imagery: field photography, people, data visualizations.' },
    { who: 'Rob Rosenbaum', text: 'Minimalist has worked; bold, not overly formal, more vibrancy than the current neutral without swaying too far. Mood: grounded, optimistic, urgent, hopeful. Imagery: not super important; data viz especially, some photos.' },
  ] },
  { q: 'Legacy, equity and transition narrative', answers: [
    { who: 'Caitlin', text: 'Clear evolution. Likes the palette but not deeply meaningful. "I don’t think any of us truly loves the PRO logo." Story: same mission, new operating environment.' },
    { who: 'Kayla', text: 'Keep and refine its energy. Palette: no. Dislikes the current "weird PRO visual". Story: evolution, a new chapter.' },
    { who: 'Sasha', text: 'Keep and refine. Green might be worth keeping, otherwise no attachment. Story: evolution as the situation changed; the emergency is not over, the universe of supportable work is much broader; a refined approach, a consistent mission.' },
    { who: 'Ellie', text: 'Keep and refine. Dark green feels calm and grounded, differentiates from DIV’s bright innovation bend; already used in donor comms as a low-effort cue. Story: same mission, sharper tools.' },
    { who: 'Grace', text: 'Keep and refine. No ties to the current logo: blank slate. Story: same mission with a shifting landscape; same tools applied to a different challenge. "We’re still here to respond to these shifts."' },
    { who: 'Rob Rogers', text: 'Clear evolution. Colors or logo could be changed. Story: evolution, same mission, sharper tools.' },
    { who: 'Rob Rosenbaum', text: 'Clear evolution. Doesn’t love the colors but they’re one of the few visual identifiers people have. Story: crisis response produced a methodology that extends far beyond that moment; now deployed forward-looking against gaps in the global health paradigm.' },
  ] },
  { q: 'References, admired organisations, dislikes, clichés', answers: [
    { who: 'Caitlin', text: 'Admires Wikipedia. Dislikes GiveWell (self-focused on analysis and process). Cliché: centering (usually white) evaluation experts instead of frontline implementers.' },
    { who: 'Kayla', text: 'Dislikes the current PRO visual. No references given.' },
    { who: 'Sasha', text: 'References: Ford Foundation, PopHive ("less text, more data"). Admires Mulago (writing), Institute for Progress, Saloni Dattani. Dislikes Mulago’s look. "We’re not shiny and we’re not selling you anything." Clichés: loopy circles; don’t look like GiveWell or Coefficient Giving.' },
    { who: 'Ellie', text: 'Reference: Renaissance Philanthropy (text-driven). Cliché: poverty porn, random smiling children.' },
    { who: 'Grace', text: 'Admires the DIV rebrand, GiveDirectly, Patagonia, Everlane. Dislikes the IRC-style donation pop-up; wants to lead with purpose and HOW. Cliché: savior-complex depictions. Avoid looking exactly like GiveWell.' },
    { who: 'Rob Rogers', text: 'Admires GiveDirectly, Pratham. Cliché: globes. Avoid the palettes of GiveWell, Charity Navigator.' },
    { who: 'Rob Rosenbaum', text: 'Admires GiveDirectly, Patagonia. Dislikes Save the Children (leads with asking for money, pity-inducing, no navigation). Cliché: poverty porn.' },
  ] },
  { q: 'Metaphors, key phrases, system, typography, kinship', answers: [
    { who: 'Caitlin', text: 'Phrases: vetted, cost-effective, life-saving, opportunity. System: flexible and modular. Kinship: related, own personality.' },
    { who: 'Kayla', text: 'Metaphors: bridges, momentum, evidence. Phrases: urgent, vetted, cost-effective, evidence-informed. System: unified and controlled. Kinship: related, own personality.' },
    { who: 'Sasha', text: 'Metaphors: progress, evidence, impact, solidarity. Phrases: evidence-driven, cost-effective, urgent, vetted, life-saving. Typography: share DIV’s. Kinship: related, own personality.' },
    { who: 'Ellie', text: 'Metaphors: evidence, systems, scale, urgency. Phrases: urgent, vetted, cost-effective, evidence-informed, life-saving, most-vulnerable populations, critical timing. Typography: share DIV’s. System: unified. Kinship: related, own personality.' },
    { who: 'Grace', text: 'Metaphors: a bridge to sustain lifesaving programming; at-scale programs; grounded in evidence. Phrases: "Urgent & Vetted" (shift from list to database), "Best Bets", cost-effective, lifesaving, proven evidence base; cost-effectiveness vs cost-efficiency used precisely. Typography: same family used differently. System: in between. Kinship: related, own personality.' },
    { who: 'Rob Rogers', text: 'Metaphors: lifeboat, scale. Phrases: urgent, vetted, cost-effective, save lives today. Typography: same family used differently. System: in between. Kinship: related, own personality.' },
    { who: 'Rob Rosenbaum', text: 'Metaphors: evidence, scale. Phrases: cost-effective, save lives today, vetted, urgent. Typography: share DIV’s. System: in between. Kinship: independent with a subtle connection.' },
  ] },
  { q: 'Success, and a year from now', answers: [
    { who: 'Caitlin', text: 'Strong brand recognition and trust from donors; clarity on PRO’s approach in the evidence and philanthropic-advising sector. A year later: fundraising success.' },
    { who: 'Kayla', text: 'Increased donor interest and media recognition. A year later: a clearer brand identity, more traction with donors.' },
    { who: 'Sasha', text: 'Media recognition, increased fundraising attention. A year later: word of mouth, donor input, media uptake.' },
    { who: 'Ellie', text: 'Easier partnerships, ease in co-communicating and fundraising with DIV. A year later: people inside and outside have a clear idea of what PRO is and does.' },
    { who: 'Grace', text: 'More engagement from philanthropists and foundations; a clearer starting point for new-donor conversations; outside clarity on how PRO relates to DIV. A year later: more and deeper relationships; fewer inbox questions about DIV; more credibility among peers.' },
    { who: 'Rob Rogers', text: 'Media recognition, web traffic, inbound interest, positive feedback from partners and donors.' },
    { who: 'Rob Rosenbaum', text: 'Team and peers feel real pride; donors navigate easily; track donor traffic and duration. A year later: zero daylight between what we say, how we think of ourselves, where we’re going, and how we present it publicly.' },
  ] },
]
