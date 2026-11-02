// Module 3 — the practical core. Written as technique rather than tricks: the
// "magic phrase" framing dates badly and teaches nothing that transfers to the
// next model.

export default {
  slug: 'prompting',
  title: 'Prompting as a Working Skill',
  summary:
    'The anatomy of a prompt that works, how to supply context and examples, how to control the shape of the output, and how to iterate instead of guessing.',
  lessons: [
    {
      slug: 'anatomy-of-a-prompt',
      title: 'The anatomy of a working prompt',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'A weak prompt is usually not badly worded. It is under-specified: it assumes context the model does not have, and leaves the model to guess the audience, the format and the standard. The fix is structural.',
        },
        {
          type: 'steps',
          items: [
            'Role and task — what it is doing, in one sentence. "You are reviewing supplier contracts for renewal risk."',
            'Context — the material and the situation. Who the output is for, what has already been decided, what constraints apply.',
            'The input itself — the document, data or question, clearly delimited from your instructions.',
            'Output specification — format, length, structure, and what to do with anything uncertain.',
            'Quality bar — what makes an answer good, and what to avoid. This is the part most people skip and it is the one that moves results most.',
          ],
        },
        {
          type: 'example',
          title: 'Thin',
          text: 'Summarise this contract.',
        },
        {
          type: 'example',
          title: 'Specified',
          text: 'You are preparing a renewal briefing for our procurement lead, who has not read this contract.\n\nFrom the contract below, produce:\n1. Term and renewal mechanics — dates, notice period, auto-renewal.\n2. Financial commitments — fees, escalators, minimums.\n3. Exit terms — termination rights on each side.\n4. Anything a reviewer should flag.\n\nQuote the clause number beside each point. If the contract does not address one of these, write "Not addressed" rather than inferring. Maximum 350 words.\n\n<contract>\n…\n</contract>',
        },
        {
          type: 'check',
          id: 'm3l1-check',
          prompt: 'In the specified prompt above, which line is doing the most work?',
          options: [
            '"You are preparing a renewal briefing for our procurement lead, who has not read this contract."',
            '"Maximum 350 words."',
            'The numbered list of sections',
            'The tags around the contract',
          ],
          answer: 0,
          why: 'Audience and purpose decide everything downstream — what to include, what to assume, what register to use. The word count only trims what has already been chosen.',
        },
        {
          type: 'p',
          text: 'The second prompt is not longer for the sake of it. Every added line removes a decision the model would otherwise have made for you — and made differently on the next run.',
        },
      ],
    },
    {
      slug: 'context-and-examples',
      title: 'Context, examples and delimiters',
      minutes: 11,
      blocks: [
        { type: 'h', text: 'Show, do not only tell' },
        {
          type: 'p',
          text: 'Describing a style takes a paragraph and still misses. Two examples of the thing you want convey it exactly. This is few-shot prompting, and for format and tone it is reliably the highest-return technique available.',
        },
        {
          type: 'list',
          items: [
            'Zero-shot — instructions only. Fine for common, well-understood tasks.',
            'One-shot — a single worked example. Enough to pin down format.',
            'Few-shot — two to five examples, ideally including an awkward case. Enough to pin down judgement as well as format.',
          ],
        },
        {
          type: 'callout',
          title: 'Choose edge cases as examples',
          text: 'Three examples of the easy case teach very little. One easy, one ambiguous and one that should be refused or marked "unclear" teaches the boundary — and the boundary is where your output quality is actually decided.',
        },
        { type: 'h', text: 'Delimit your inputs' },
        {
          type: 'p',
          text: 'When you paste a document into a prompt, wrap it in clear markers — XML-style tags, triple backticks, a labelled heading. Without them the model has to infer where your instructions end and the material begins, and a document containing the words "ignore the above" becomes a real problem rather than a hypothetical one.',
        },
        {
          type: 'check',
          id: 'm3l2-check',
          prompt: 'You supply three examples, all of them straightforward cases. What has the model still not learned?',
          options: [
            'The output format',
            'Your tone of voice',
            'What to do when a case is ambiguous',
            'The subject matter',
          ],
          answer: 2,
          why: 'Easy examples pin down format and tone and leave every judgement call open — and the judgement calls are where your output quality is actually decided.',
        },
        {
          type: 'callout',
          title: 'Prompt injection, in one sentence',
          text: 'Anything you paste in, retrieve or let a model browse is data, not instructions — and it can contain text written to be read as instructions. Delimit it, tell the model to treat it as content, and never let untrusted text decide an action with real consequences.',
        },
      ],
    },
    {
      slug: 'structure-and-output-control',
      title: 'Controlling the shape of the answer',
      minutes: 11,
      blocks: [
        {
          type: 'p',
          text: 'If the output feeds a human, you want readable structure. If it feeds a system, you want a schema and nothing else. Both are specified the same way: say exactly what you want, and give an example of it.',
        },
        {
          type: 'table',
          head: ['Goal', 'Technique'],
          rows: [
            ['Machine-readable output', 'Specify JSON with named fields and types, show one filled example, and say "output only the JSON".'],
            ['Consistent documents', 'Supply the headings verbatim and require them to appear in order.'],
            ['Harder reasoning', 'Ask it to work through the steps before giving a conclusion — order matters, since a conclusion stated first is what the rest gets written to justify.'],
            ['Shorter answers', 'Give a word count and a format. "Be concise" is weak; "no more than 80 words, no preamble" is not.'],
            ['Honest gaps', 'State the escape hatch explicitly: "If the document does not say, write Not stated."'],
          ],
        },
        {
          type: 'check',
          id: 'm3l3-check',
          prompt: 'Why ask for the reasoning before the conclusion rather than after it?',
          options: [
            'It reads better',
            'A conclusion stated first becomes the thing everything after it is written to justify',
            'It uses fewer tokens',
            'It reduces refusals',
          ],
          answer: 1,
          why: 'The model is predicting forwards, one token at a time. Whatever comes first conditions all of it.',
        },
        { type: 'h', text: 'Give it permission to decline' },
        {
          type: 'p',
          text: 'Models are tuned to be helpful, and an unhelpful truthful answer loses to a helpful invented one unless you say otherwise. A single line — "If the source does not contain the answer, say so and stop" — removes a large share of fabrication in extraction work.',
        },
        {
          type: 'example',
          title: 'Structured extraction, specified',
          text: 'Return only JSON matching this shape:\n{ "party_a": string, "party_b": string, "effective_date": "YYYY-MM-DD" | null, "notice_days": number | null }\n\nUse null for anything the contract does not state. Do not infer dates from context. No commentary before or after the JSON.',
        },
      ],
    },
    {
      slug: 'iterating-and-reusing',
      title: 'Iterating, testing and reusing',
      minutes: 10,
      blocks: [
        {
          type: 'p',
          text: 'The first prompt is a hypothesis. Treating prompting as a one-shot act of phrasing is what keeps people stuck; treating it as a short improvement loop is what produces prompts worth saving.',
        },
        {
          type: 'steps',
          items: [
            'Write the prompt and run it on a real input, not a toy one.',
            'Read the output as a reviewer, not an author. Name precisely what is wrong — too long, wrong audience, invented detail, missed clause.',
            'Change one thing. Changing three leaves you unable to say which helped.',
            'Re-run on the same input, then on two inputs you have not used yet.',
            'When it holds, save it with a note on what it is for and which model it was tuned against.',
          ],
        },
        { type: 'h', text: 'A prompt is an asset' },
        {
          type: 'p',
          text: 'A prompt that reliably produces an acceptable supplier summary is organisational knowledge, in the same way a good checklist is. Keep them somewhere shared, with the task they serve, an example input and output, and the date and model. Without that record you cannot tell, six months later, whether a change in quality came from the prompt or from a model update.',
        },
        {
          type: 'check',
          id: 'm3l4-check',
          prompt: 'You change three things at once and the output improves. What do you actually know?',
          options: [
            'All three changes helped',
            'The prompt is now correct',
            'Something helped — but not what, so you cannot drop the two that did nothing',
            'Nothing at all',
          ],
          answer: 2,
          why: 'One change at a time is not pedantry. It is the difference between a result you can reuse and a prompt you are afraid to touch.',
        },
        {
          type: 'callout',
          title: 'Test with a small fixed set',
          text: 'Five to ten representative inputs, including two difficult ones, with notes on what a good answer looks like. Run every prompt change against the set. This is the lightweight version of the evaluation discipline in module 4, and it costs an afternoon.',
        },
      ],
    },
  ],
  quiz: {
    questions: [
      {
        id: 'm3q1',
        prompt: 'Which element do people most often omit, and which moves quality most?',
        options: [
          'A polite greeting',
          'An explicit statement of what makes the answer good, and what to avoid',
          'The model version',
          'The temperature setting',
        ],
        answer: 1,
        why: 'Stating the quality bar removes the decisions the model would otherwise make on your behalf, differently each run.',
      },
      {
        id: 'm3q2',
        prompt: 'You are choosing three examples for a few-shot prompt. What is the strongest selection?',
        options: [
          'Three clear, typical cases',
          'Three cases from the same customer',
          'One typical, one ambiguous, one that should be marked unclear',
          'The three shortest inputs, to save tokens',
        ],
        answer: 2,
        why: 'Examples teach boundaries. Easy cases alone leave the judgement calls unspecified.',
      },
      {
        id: 'm3q3',
        prompt: 'Why wrap a pasted document in clear delimiters?',
        options: [
          'It reduces token cost',
          'It separates your instructions from untrusted content, which may itself read like instructions',
          'It raises the context window limit',
          'It is required by most APIs',
        ],
        answer: 1,
        why: 'Delimiting marks the boundary between instruction and data — the first and cheapest defence against prompt injection.',
      },
      {
        id: 'm3q4',
        prompt: 'Extraction keeps inventing values for fields the source does not mention. Best first fix?',
        options: [
          'Raise the temperature',
          'Use a larger model',
          'Explicitly instruct it to return null or "Not stated" when the source is silent',
          'Shorten the document',
        ],
        answer: 2,
        why: 'Helpfulness tuning fills gaps unless you give an explicit escape hatch. That one line removes much of the fabrication.',
      },
    ],
  },
}
