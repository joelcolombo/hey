import type { Template } from '../types'

export const visualIdentityTemplate: Template = {
  id: 'visual-identity',
  title: 'Visual Identity Questionnaire',
  intro:
    'This questionnaire will help us align on the strategic and visual direction for the new visual identity of {client}. Answer freely — there are no right or wrong responses. The more context you share, the better we can shape a meaningful and distinctive identity.',
  estimatedMinutes: 25,
  sections: [
    {
      id: 'about',
      title: 'About the Project',
      questions: [
        { id: 'purpose', type: 'longtext', prompt: "In your own words, how would you describe the purpose and role of {client} in one or two sentences?" },
        { id: 'key-message', type: 'longtext', prompt: "What do you believe is most important for people to understand about {client}?" },
      ],
    },
    {
      id: 'audience',
      title: 'Audience',
      questions: [
        { id: 'audiences', type: 'longtext', prompt: "Who are the primary audiences {client} needs to connect with?", hint: "Describe each audience: roles, age range, familiarity with your field, motivations and expectations." },
        { id: 'audience-priority', type: 'longtext', prompt: "Of those audiences, which is the most strategically important to reach in the next 12–24 months?" },
        { id: 'audience-gaps', type: 'longtext', prompt: "Are there audiences you struggle to connect with, or who misperceive {client}?" },
        { id: 'audience-channels', type: 'longtext', prompt: "How do these audiences currently discover or interact with {client}?", hint: "Conferences, publications, referrals, digital, etc." },
        { id: 'internal-buyin', type: 'longtext', prompt: "Are there internal audiences (staff, board, partners) whose buy-in is critical?" },
      ],
    },
    {
      id: 'personality',
      title: 'Brand Personality',
      questions: [
        { id: 'character', type: 'longtext', prompt: "If {client} were a person, how would you describe their character and demeanor?", hint: "e.g. insightful, pragmatic, visionary, approachable, rigorous, inspiring", suggestions: ['Insightful', 'Pragmatic', 'Visionary', 'Approachable', 'Rigorous', 'Inspiring'] },
        {
          id: 'traits',
          type: 'sliders-group',
          mode: 'dual',
          prompt: "Where is {client} today — and where should the new identity take it?",
          hint: "For each trait, set two markers: where you are now, and where you want to be.",
          sliders: [
            { id: 'academic-accessible', left: 'Academic', right: 'Accessible' },
            { id: 'conservative-experimental', left: 'Conservative', right: 'Experimental' },
            { id: 'data-human', left: 'Data-driven', right: 'Human-centered' },
            { id: 'established-emergent', left: 'Established', right: 'Emergent' },
            { id: 'global-regional', left: 'Global', right: 'Regionally grounded' },
            { id: 'institutional-progressive', left: 'Institutional', right: 'Progressive' },
            { id: 'serious-approachable', left: 'Serious', right: 'Approachable' },
            { id: 'technical-strategic', left: 'Technical', right: 'Strategic' },
            { id: 'leader-facilitator', left: 'Thought leader', right: 'Facilitator' },
            { id: 'urgent-patient', left: 'Urgent', right: 'Patient' },
          ],
        },
        { id: 'admired-orgs', type: 'longtext', prompt: "Name 2 or 3 organizations (any sector) whose personality or tone you admire. What resonates?" },
        { id: 'avoid-traits', type: 'longtext', prompt: "Are there personality traits {client} should explicitly avoid?", hint: "e.g. \"never bureaucratic\", \"not a Silicon Valley startup\"" },
      ],
    },
    {
      id: 'visual-tone',
      title: 'Visual Tone & Atmosphere',
      questions: [
        { id: 'world', type: 'longtext', prompt: "Which world should the brand lean closer to?", hint: "e.g. evidence-based · innovation + design · collaboration + community", suggestions: ['Evidence-based', 'Innovation + design', 'Collaboration + community'] },
        { id: 'visual-feel', type: 'longtext', prompt: "How should the overall visual language feel?", hint: "Minimalist or expressive · reserved or bold · formal or contemporary · neutral or vibrant", suggestions: ['Minimalist', 'Expressive', 'Reserved', 'Bold', 'Formal', 'Contemporary', 'Neutral', 'Vibrant'] },
        { id: 'imagery', type: 'longtext', prompt: "How important is photography or imagery to the brand? What should it feature?", hint: "People, data visualizations, abstract concepts, field-based imagery…", suggestions: ['People', 'Data visualizations', 'Abstract concepts', 'Field-based imagery'] },
        { id: 'system-flex', type: 'select', prompt: "Should the visual system feel unified and controlled, or flexible and modular?", options: ['Unified and controlled', 'Flexible and modular', 'Somewhere in between'] },
        { id: 'cliches', type: 'longtext', prompt: "Are there visual clichés in your sector you want to consciously avoid?" },
      ],
    },
    {
      id: 'legacy',
      title: 'Identity & Legacy',
      questions: [
        { id: 'legacy-relation', type: 'select', prompt: "How should the new identity relate to its origins?", options: ['Visually connected to our legacy', 'Fully independent and future-facing', 'Somewhere in between'] },
        { id: 'metaphors', type: 'longtext', prompt: "Are there concepts, metaphors, or themes that feel meaningful to you?", hint: "e.g. bridges, pathways, momentum, evidence, growth, systems, scale", suggestions: ['Bridges', 'Pathways', 'Momentum', 'Evidence', 'Growth', 'Systems', 'Scale'] },
        { id: 'visual-equity', type: 'longtext', prompt: "Is there existing visual equity (colors, shapes, patterns) that holds meaning or recognition value?" },
        { id: 'stakeholder-feel', type: 'longtext', prompt: "How should long-time stakeholders feel when they see the new identity?", hint: "Continuity? Evolution? Fresh start?", suggestions: ['Continuity', 'Evolution', 'Fresh start'] },
        { id: 'legacy-constraints', type: 'longtext', prompt: "Are there legal, political, or practical constraints we should know about?" },
        { id: 'transition-narrative', type: 'longtext', prompt: "What's the narrative you want to tell about this transition?", hint: "e.g. graduation, evolution, new chapter, independence", suggestions: ['Graduation', 'Evolution', 'New chapter', 'Independence'] },
      ],
    },
    {
      id: 'color-type',
      title: 'Color & Typography',
      questions: [
        { id: 'palette-mood', type: 'longtext', prompt: "Are there tones, moods, or palettes that feel aligned with {client}'s mission?", hint: "e.g. grounded, optimistic, serious, hopeful, bold, restrained", suggestions: ['Grounded', 'Optimistic', 'Serious', 'Hopeful', 'Bold', 'Restrained'] },
        { id: 'type-feel', type: 'select', prompt: "How should the typography feel?", options: ['Editorial / journalistic', 'Technical / scientific', 'Warm / humanistic', "A mix — I'll explain in the next question"] },
        { id: 'color-equity', type: 'longtext', prompt: "Any existing brand colors with equity or meaning worth preserving or referencing?" },
        { id: 'color-avoid', type: 'longtext', prompt: "Any colors strongly associated with competitors or peers that we should avoid?" },
      ],
    },
    {
      id: 'references',
      title: 'References & Inspiration',
      questions: [
        { id: 'references', type: 'longtext', prompt: "Share 2 or 3 visual references that resonate with the direction you envision.", hint: "Websites, identities, graphic systems — paste links if you have them." },
        { id: 'references-like', type: 'longtext', prompt: "What specifically do you like about them?" },
        { id: 'references-avoid', type: 'longtext', prompt: "Are there identities you actively dislike or don't want to resemble? What doesn't work?" },
      ],
    },
    {
      id: 'success',
      title: 'Success & Perception',
      questions: [
        { id: 'first-impression', type: 'longtext', prompt: "When someone encounters the new identity for the first time, how should they feel?" },
        { id: 'practical-success', type: 'longtext', prompt: "What would make this project a success in practical terms?", hint: "e.g. increased applications, media recognition, easier partnerships, internal pride" },
        { id: 'year-later', type: 'longtext', prompt: "A year from now, how will you know the new identity is working?" },
      ],
    },
    {
      id: 'verbal',
      title: 'Verbal Identity & Messaging',
      questions: [
        { id: 'key-phrases', type: 'longtext', prompt: "Are there key phrases, terms, or vocabulary central to how {client} communicates?" },
        { id: 'voice', type: 'longtext', prompt: "How would you describe {client}'s voice?", hint: "e.g. authoritative but warm, precise but inspiring", suggestions: ['Authoritative', 'Warm', 'Precise', 'Inspiring'] },
      ],
    },
    {
      id: 'final',
      title: 'Anything Else',
      questions: [
        { id: 'final-notes', type: 'longtext', prompt: "Any context, concern, or idea you'd like to share that could help shape this project?" },
      ],
    },
  ],
}
