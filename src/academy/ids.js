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
