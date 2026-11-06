// The identifiers and thresholds that are shared with the database, split out
// from the course content itself so that something only needing the course id
// — the admin report, say — doesn't pull every lesson into its bundle along
// with it. content/index.js re-exports all of these, so authoring code can go
// on importing them from there.

export const COURSE_ID = 'genai-fundamentals'

// A module's quiz is a checkpoint, the final is the certificate gate — so the
// final is the stricter of the two.
export const MODULE_PASS_MARK = 75
export const FINAL_PASS_MARK = 80

// The assessment_id a final attempt is stored under. Module quizzes use the
// module's own slug.
export const FINAL_ID = 'final'

// The course's shape, stated here so that screens which only advertise it —
// the portal's Academy card — can say "of 24" without importing 60KB of
// lessons to count them. content/index.js checks these against the authored
// course in development, so the two cannot drift silently.
export const COURSE_SHAPE = { modules: 6, lessons: 24 }

// The modules in order, with how many lessons each has, so the card can say
// which module someone is up to ("Resume: Module 3") from their completed
// lesson ids alone. Checked against the authored course in development, like
// COURSE_SHAPE.
export const MODULE_SHAPE = [
  { slug: 'what-generative-ai-is', title: 'What Generative AI Actually Is', lessons: 4 },
  { slug: 'how-models-work', title: 'How Large Language Models Work', lessons: 4 },
  { slug: 'prompting', title: 'Prompting as a Working Skill', lessons: 4 },
  { slug: 'limits-and-quality', title: 'Limits, Failure Modes and Quality', lessons: 4 },
  { slug: 'your-data-and-tools', title: 'Connecting Models to Your Data and Tools', lessons: 4 },
  { slug: 'responsible-adoption', title: 'Responsible Adoption at Work', lessons: 4 },
]

// What someone can do afterwards, rather than what the lessons contain. Shared
// by the course page and the portal card so the two say the same thing.
export const COURSE_OUTCOMES = [
  'Judge where generative AI helps and where it fails',
  'Brief and evaluate AI work with confidence',
  'Set sensible policies for adopting it',
]

// The lessons add up to about 290 minutes, plus the exercises and quizzes. Said
// as a round number on the card; not checked against the content, so revisit it
// if lessons are added.
export const COURSE_HOURS = 5

// The course and the final assessment are free; the certificate is what is
// charged for. Shown on the Academy card and the applicant heading so that
// nobody reaches the end and is surprised by it. An admin records the payment
// — see academy_certificate_payments in supabase/academy.sql.
export const CERTIFICATE_PRICE = '$39'
