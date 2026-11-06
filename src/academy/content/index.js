import { COURSE_ID, COURSE_SHAPE, FINAL_ID, FINAL_PASS_MARK, MODULE_SHAPE } from '../ids'
import module1 from './module1'
import module2 from './module2'
import module3 from './module3'
import module4 from './module4'
import module5 from './module5'
import module6 from './module6'

// The course lives in code rather than in the database on purpose — see the
// note at the top of supabase/academy.sql. The slugs below are the join
// between the two, so renaming one orphans the progress rows recorded against
// it. Add modules freely; rename existing slugs only with a migration.

// Re-exported so the content files stay the single place anything about the
// course is imported from, while code that only needs an identifier can import
// ../ids directly and leave the lessons out of its bundle.
export { COURSE_ID, FINAL_ID, FINAL_PASS_MARK, MODULE_PASS_MARK } from '../ids'

export const modules = [module1, module2, module3, module4, module5, module6]

// Drawn from across the course rather than repeated from the module quizzes:
// a final that reuses the checkpoint questions tests recall of four screens
// ago, not whether any of it joined up.
export const finalAssessment = {
  id: FINAL_ID,
  title: 'Final assessment',
  summary:
    'Fifteen questions across all six modules. ' +
    FINAL_PASS_MARK +
    '% to pass. You can retake it as often as you need — every attempt is kept.',
  questions: [
    {
      id: 'f1',
      prompt: 'Which task is the strongest fit for generative AI?',
      options: [
        'Reconciling two ledgers to the penny',
        'Turning 60 open-ended survey responses into themes for a human to review',
        'Deciding which applicants are rejected',
        'Generating a legally binding quotation sent directly to a customer',
      ],
      answer: 1,
      why: 'Language-shaped, reviewed anyway, and useful even when only roughly right.',
    },
    {
      id: 'f2',
      prompt: 'What is a token?',
      options: [
        'A unit of billing unrelated to the text itself',
        'A chunk of text, typically a few characters, that the model reads and writes',
        'A security credential for the API',
        'One complete word',
      ],
      answer: 1,
      why: 'Tokens are the unit of text, and therefore of pricing, context limits and speed.',
    },
    {
      id: 'f3',
      prompt: 'Why can two identical prompts produce different answers?',
      options: [
        'The model retrains between requests',
        'Output is sampled from a probability distribution over next tokens',
        'The context window shifts',
        'Different servers hold different knowledge',
      ],
      answer: 1,
      why: 'Sampling is what makes output varied; temperature controls how adventurous it is.',
    },
    {
      id: 'f4',
      prompt: 'Which stage gives an assistant its characteristic tone and its refusals?',
      options: ['Pretraining', 'Tokenisation', 'Preference tuning, together with the system prompt', 'Vector indexing'],
      answer: 2,
      why: 'Preference tuning shapes helpfulness and style; the system prompt sets the product-specific rules on top.',
    },
    {
      id: 'f5',
      prompt: 'Which prompt element most reliably improves a first draft?',
      options: [
        'A polite opening',
        'Stating the audience, the format and what makes an answer good',
        'Asking the model to be creative',
        'Increasing max output tokens',
      ],
      answer: 1,
      why: 'Specification removes the decisions the model would otherwise make for you, differently each run.',
    },
    {
      id: 'f6',
      prompt: 'Few-shot prompting is most valuable when you need to pin down…',
      options: ['Factual accuracy', 'Format, tone and the judgement calls at the boundary', 'Response speed', 'Token cost'],
      answer: 1,
      why: 'Examples convey format and judgement far more precisely than description. They do not supply facts.',
    },
    {
      id: 'f7',
      prompt: 'Extraction from documents keeps inventing values for fields the source does not mention. Best first fix?',
      options: [
        'Raise the temperature',
        'Instruct it to return null or "Not stated" when the source is silent',
        'Split the document into more parts',
        'Switch to an open-weights model',
      ],
      answer: 1,
      why: 'Helpfulness tuning fills gaps unless an explicit escape hatch is offered.',
    },
    {
      id: 'f8',
      prompt: 'Why delimit pasted content clearly in a prompt?',
      options: [
        'To reduce token cost',
        'To mark the boundary between your instructions and untrusted data that may read like instructions',
        'Because APIs reject undelimited text',
        'To improve spelling',
      ],
      answer: 1,
      why: 'Delimiting is the first defence against prompt injection, and it stops the model guessing where your instructions end.',
    },
    {
      id: 'f9',
      prompt: 'Which best describes hallucination?',
      options: [
        'A bug fixed in newer model versions',
        'Fluent, confident output that is false, arising from predicting likely text rather than looking facts up',
        'What happens when the context window is exceeded',
        'A deliberate safety behaviour',
      ],
      answer: 1,
      why: 'It falls out of the mechanism itself, which is why grounding and review are the controls rather than a patch.',
    },
    {
      id: 'f10',
      prompt: 'What should accompany an evaluation score for it to be meaningful?',
      options: [
        'The number of users',
        'Written acceptance criteria, the model and prompt version, and the human review design',
        'The vendor’s published benchmark results',
        'The temperature used',
      ],
      answer: 1,
      why: 'A percentage is uninterpretable without what was graded, against which version, and what checking sits beside it.',
    },
    {
      id: 'f11',
      prompt: 'Where do retrieval-based assistants most commonly fail?',
      options: [
        'In generation — the model writes poorly',
        'In retrieval and content hygiene — wrong, stale or missing passages',
        'In tokenisation',
        'In the choice of temperature',
      ],
      answer: 1,
      why: 'Finding the right, current passage is the hard part. The generation step is comparatively reliable.',
    },
    {
      id: 'f12',
      prompt: '"The model does not know our internal policies." Which approach fits?',
      options: ['Fine-tuning on the policies', 'Retrieval over the policies', 'A higher temperature', 'A longer system prompt alone'],
      answer: 1,
      why: 'Fine-tuning shapes behaviour, not knowledge. Facts that must stay current, cited and access-controlled belong in retrieval.',
    },
    {
      id: 'f13',
      prompt: 'An agent can write to live systems. Which control matters most?',
      options: [
        'The newest model version',
        'Human approval before consequential actions, narrow tool permissions and full logging',
        'A lower temperature',
        'A larger context window',
      ],
      answer: 1,
      why: 'Once a model can act, the controls that matter are approval, least privilege and an audit trail.',
    },
    {
      id: 'f14',
      prompt: 'A colleague wants to paste a customer list into a personal AI account to tidy the formatting. The best response is to…',
      options: [
        'Allow it — formatting is harmless',
        'Point them to the approved tool, and send only the fields the task needs',
        'Refuse and leave it there',
        'Allow it if they delete the chat afterwards',
      ],
      answer: 1,
      why: 'A sanctioned route plus data minimisation. A flat refusal with no alternative is what produces shadow usage.',
    },
    {
      id: 'f15',
      prompt: 'Which measure shows an AI rollout is delivering value?',
      options: [
        'Licences issued',
        'Prompts sent per week',
        'Time to complete the task, rework rate and downstream quality against the old baseline',
        'Number of tools evaluated',
      ],
      answer: 2,
      why: 'Activity metrics are not value. Compare against the honest baseline of the process being replaced.',
    },
  ],
}

export const course = {
  id: COURSE_ID,
  title: 'Generative AI Fundamentals',
  subtitle:
    'A working grounding in how generative AI behaves, what it is good for, where it fails, and how to adopt it without regret.',
  audience: 'Written for people who will use, commission or govern this technology — no maths, no coding required.',
  modules,
  final: finalAssessment,
}

// "module-slug/lesson-slug". The id stored in academy_lesson_progress, so its
// shape is a contract with the database rather than a display detail.
export function lessonId(moduleSlug, lessonSlug) {
  return `${moduleSlug}/${lessonSlug}`
}

export const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => lessonId(m.slug, l.slug)))

export const totalLessons = allLessonIds.length

// Dev-only, and deliberately loud: COURSE_SHAPE is what the portal card tells
// learners the course contains, and it is written by hand because that card
// must not import the lessons. Adding a lesson without updating it would make
// the card quietly wrong, which is the sort of thing nobody notices for a
// year. import.meta.env.DEV is false under `vite build`, so this never runs in
// production.
if (import.meta.env.DEV && (modules.length !== COURSE_SHAPE.modules || totalLessons !== COURSE_SHAPE.lessons)) {
  throw new Error(
    `COURSE_SHAPE in src/academy/ids.js says ${COURSE_SHAPE.modules} modules and ${COURSE_SHAPE.lessons} lessons, ` +
      `but the content has ${modules.length} and ${totalLessons}. Update ids.js to match.`
  )
}

if (
  import.meta.env.DEV &&
  (MODULE_SHAPE.length !== modules.length ||
    MODULE_SHAPE.some((m, i) => m.slug !== modules[i].slug || m.title !== modules[i].title || m.lessons !== modules[i].lessons.length))
) {
  throw new Error('MODULE_SHAPE in src/academy/ids.js does not match the modules in this course. Update it.')
}

export const totalMinutes = modules.reduce(
  (sum, m) => sum + m.lessons.reduce((s, l) => s + l.minutes, 0),
  0
)

export function findModule(slug) {
  return modules.find((m) => m.slug === slug) ?? null
}

export function findLesson(moduleSlug, lessonSlug) {
  const mod = findModule(moduleSlug)
  if (!mod) return { module: null, lesson: null }
  return { module: mod, lesson: mod.lessons.find((l) => l.slug === lessonSlug) ?? null }
}

// Flat reading order — every lesson, with its module's quiz after it, then the
// next module. What the Next button walks, so it lives here beside the content
// rather than being rebuilt in the screen that renders it.
export const sequence = modules.flatMap((m) => [
  ...m.lessons.map((l) => ({ kind: 'lesson', to: `/academy/${m.slug}/${l.slug}`, title: l.title, module: m })),
  { kind: 'quiz', to: `/academy/${m.slug}/quiz`, title: `${m.title} — quiz`, module: m },
])

export function neighbours(path) {
  const i = sequence.findIndex((s) => s.to === path)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? sequence[i - 1] : null,
    // The last module's quiz leads to the final assessment.
    next: i < sequence.length - 1 ? sequence[i + 1] : { kind: 'final', to: '/academy/final', title: 'Final assessment' },
  }
}
