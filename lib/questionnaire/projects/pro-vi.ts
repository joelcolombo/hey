import { applyOverrides } from '../merge'
import { visualIdentityTemplate } from '../templates/visual-identity'
import type { ProjectConfig } from '../types'

/**
 * PRO (proimpact.tools), Visual Identity. Tailored from the Aug 6 2026
 * deepdive (Carolyn, Rob, Grace) and the DIV Fund / PRO comms strategy memo:
 *
 * - The open strategic question is how closely PRO's identity should relate
 *   to The DIV Fund's (endorsed-brand decision is made; the degree is not).
 *   Captured as a select plus an extra dual slider in the traits group.
 * - PRO's current identity was built fast in an urgent moment and earned real
 *   recognition in 18 months. The legacy questions honor that (no loaded
 *   wording) while probing how far the evolution should go.
 * - Audience is primarily philanthropic donors; scope is logo/color/type
 *   ahead of a September announcement. Three questions the strategy already
 *   answers were removed to keep the form under the promised hour.
 */
export const proVi: ProjectConfig = {
  clientSlug: 'pro',
  projectSlug: 'visual-identity',
  clientName: 'PRO',
  projectTitle: 'Visual Identity',
  notionDatabaseId: null, // paste the ID printed by `npm run questionnaire:setup -- pro/visual-identity`
  template: applyOverrides(visualIdentityTemplate, {
    removeQuestions: ['internal-buyin', 'audience-channels', 'world'],
    replaceQuestions: [
      {
        id: 'audiences',
        type: 'longtext',
        prompt: 'Who are the primary audiences PRO needs to connect with?',
        hint: 'e.g. philanthropic donors, foundations, implementing partners, press. The more detail on motivations and expectations, the better.',
        suggestions: ['Philanthropic donors', 'Foundations', 'Implementing partners', 'Press', 'Peer organizations'],
      },
      {
        id: 'audience-gaps',
        type: 'longtext',
        prompt: 'Are there audiences that misread PRO today, or mix up what PRO does versus The DIV Fund?',
      },
      {
        id: 'traits',
        type: 'sliders-group',
        mode: 'dual',
        prompt: 'Where is PRO today, and where should the new identity take it?',
        hint: 'For each trait, set two markers: where you are now, and where you want to be.',
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
          { id: 'div-alignment', left: 'Close to The DIV Fund', right: 'Fully distinct' },
        ],
      },
      {
        id: 'imagery',
        type: 'longtext',
        prompt: 'How important is photography or imagery to the brand? What should it feature?',
        hint: 'Field photography, data visualizations, how the vetted projects are presented...',
        suggestions: ['Field photography', 'Data visualizations', 'People', 'Abstract concepts'],
      },
      {
        id: 'legacy-relation',
        type: 'select',
        prompt: "PRO's current identity came together quickly to meet an urgent moment, and it has earned real recognition. How should the new identity relate to it?",
        options: ['Keep its energy, refined', 'A clear evolution', 'A fresh start'],
      },
      {
        id: 'transition-narrative',
        type: 'longtext',
        prompt: "What's the story you want this new identity to tell?",
        hint: 'e.g. evolution, coming of age, same mission with sharper tools, a new chapter',
        suggestions: ['Evolution', 'Coming of age', 'Same mission, sharper tools', 'A new chapter'],
      },
      {
        id: 'type-feel',
        type: 'select',
        prompt: 'Typography can tie PRO to The DIV Fund or set it apart. What feels right?',
        options: ["Share The DIV Fund's typography", 'Same family, used differently', 'A complementary voice of its own'],
      },
      {
        id: 'color-equity',
        type: 'longtext',
        prompt: "Does PRO's current palette hold meaning or recognition worth keeping?",
        hint: 'Think of the colors people already associate with PRO today.',
      },
      {
        id: 'cliches',
        type: 'longtext',
        prompt: 'Are there visual clichés in your sector you want to consciously avoid?',
        hint: 'e.g. handshake photos, globes, generic innovation imagery, charity-appeal tropes',
      },
      {
        id: 'key-phrases',
        type: 'longtext',
        prompt: 'Are there key phrases, terms, or vocabulary central to how PRO communicates?',
        hint: 'e.g. urgent, vetted, cost-effective, evidence-informed, save lives today',
        suggestions: ['Urgent', 'Vetted', 'Cost-effective', 'Evidence-informed', 'Save lives today'],
      },
    ],
    addQuestions: [
      {
        sectionId: 'legacy',
        after: 'legacy-relation',
        question: {
          id: 'div-kinship',
          type: 'select',
          prompt: 'PRO lives alongside The DIV Fund. When someone sees both brands, how related should they feel?',
          hint: 'Think of it as a spectrum, from clearly part of the same family to quietly connected.',
          options: [
            'Clearly part of the same family',
            'Related, with its own personality',
            'Independent, with a subtle connection',
          ],
        },
      },
    ],
  }),
}
