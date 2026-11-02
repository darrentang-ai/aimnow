// A teaching approximation of tokenisation — NOT a real tokeniser.
//
// Real ones (BPE and friends) learn their vocabulary from data, so the exact
// splits differ by model and cannot be derived from rules. Shipping a genuine
// tokeniser would mean a megabyte of merge tables in the bundle to make a
// point that the behaviour alone makes: text arrives as chunks, common words
// survive whole, unusual words and numbers shatter.
//
// So this mimics the behaviour and is labelled as an approximation wherever it
// is shown. The three rules below are the ones that matter pedagogically:
//
//   1. A leading space belongs to the word after it — " the" is one token,
//      which is why spacing affects counts at all.
//   2. Long or unusual words split into pieces, so the model never sees the
//      letters as letters. This is the whole explanation for miscounting them.
//   3. Digits go one at a time, which is a real property of several
//      tokenisers and a large part of why arithmetic is shaky.

const CHUNK = 4
const LONG_WORD = 6

function splitWord(word) {
  if (word.length <= LONG_WORD) return [word]
  const parts = []
  for (let i = 0; i < word.length; i += CHUNK) parts.push(word.slice(i, i + CHUNK))
  return parts
}

export function approximateTokens(text) {
  // Whitespace, letter runs, single digits, and any other single character.
  const pieces = text.match(/\s+|[A-Za-z']+|\d|[^\sA-Za-z'\d]/g) ?? []
  const tokens = []
  let pendingSpace = ''

  for (const piece of pieces) {
    if (/^\s+$/.test(piece)) {
      // One space joins the next token; anything more (a newline, an indent)
      // is its own token, which is why formatting costs money.
      if (piece === ' ') pendingSpace = ' '
      else tokens.push(piece)
      continue
    }
    const parts = /^[A-Za-z']+$/.test(piece) ? splitWord(piece) : [piece]
    parts[0] = pendingSpace + parts[0]
    pendingSpace = ''
    tokens.push(...parts)
  }

  if (pendingSpace) tokens.push(pendingSpace)
  return tokens
}
