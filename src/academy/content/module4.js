// Module 4 — the limits, and what to do about each one. Deliberately placed
// before the architecture module: retrieval and tool use in module 5 only make
// sense as answers to the failure modes described here.

export default {
  slug: 'limits-and-quality',
  title: 'Limits, Failure Modes and Quality',
  summary:
    'Why models fabricate, what they genuinely cannot do, how to review output properly, and how to decide whether a use case is good enough to ship.',
  lessons: [
    {
      slug: 'hallucination-and-grounding',
      title: 'Hallucination, and what reduces it',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'A hallucination is output that is fluent, confident and false. It is not a glitch to be patched; it falls directly out of the mechanism in module 2. A model that produces likely-looking text will produce likely-looking references, numbers and quotations with exactly the same machinery.',
        },
        { type: 'h', text: 'Where it bites hardest' },
        {
          type: 'list',
          items: [
            'Specific references — citations, case numbers, clause numbers, URLs, standards.',
            'Numbers, especially ones that should be derived from the source.',
            'Niche or internal subject matter the training data barely covers.',
            'Any question whose honest answer is "that is not stated anywhere here".',
          ],
        },
        { type: 'h', text: 'What actually reduces it' },
        {
          type: 'table',
          head: ['Lever', 'Effect'],
          rows: [
            ['Put the source in the prompt', 'Largest single improvement. It can read rather than recall.'],
            ['Require quotes or clause references', 'Makes a fabrication visible and checkable instead of invisible.'],
            ['Give an explicit "not stated" option', 'Removes the pressure to fill a gap.'],
            ['Lower temperature', 'Modest help on consistency; does not make false things true.'],
            ['Ask it to check its own answer', 'Sometimes catches arithmetic and contradiction; never treat as verification.'],
            ['A human who knows the domain', 'Still the control that matters for anything consequential.'],
          ],
        },
        {
          type: 'check',
          id: 'm4l1-check',
          prompt: 'Which of these is the weakest control against fabrication?',
          options: [
            'Supplying the source document in the prompt',
            'Requiring a quoted clause reference for each point',
            'Asking the model how confident it is',
            'A reviewer who knows the subject',
          ],
          answer: 2,
          why: 'Self-reported confidence is generated text like everything else. It tracks fluency, not truth — a fabricated citation comes with the same assurance as a real one.',
        },
        {
          type: 'callout',
          title: 'Grounding is the word to remember',
          text: 'A grounded answer is one tied to supplied source material that a reader can check. Ungrounded output is the model’s impression of what is probably true. Most production systems are, at heart, machinery for grounding.',
        },
      ],
    },
    {
      slug: 'knowledge-and-reasoning-limits',
      title: 'Knowledge cutoffs and reasoning limits',
      minutes: 11,
      blocks: [
        { type: 'h', text: 'What it cannot know' },
        {
          type: 'list',
          items: [
            'Anything after its training cutoff — including that a newer version of itself exists.',
            'Anything private: your systems, your pricing, last week’s decision, this customer’s history.',
            'Anything in a file it was not given, however confidently it discusses the topic.',
            'What it does not know. Self-reported confidence is itself generated text, not a measurement.',
          ],
        },
        { type: 'h', text: 'What it is weak at even with the information' },
        {
          type: 'list',
          items: [
            'Exact arithmetic over many values. Have it produce the formula or the query; let a calculator calculate.',
            'Strict counting, ordering and character-level work — a token-level consequence, not a reasoning one.',
            'Very long chains of dependent logic, where one early slip quietly propagates.',
            'Knowing which of two conflicting sources in its context is authoritative, unless you tell it.',
          ],
        },
        {
          type: 'check',
          id: 'm4l2-check',
          prompt: 'Which step should be handed to ordinary software, even inside an AI-powered feature?',
          options: [
            'Rewriting a paragraph in plain English',
            'Summing 200 line items',
            'Judging which of three emails sounds most urgent',
            'Drafting a reply',
          ],
          answer: 1,
          why: 'Have the model produce the formula or the query, and let a calculator calculate. Exact arithmetic over many values is the classic thing to route away.',
        },
        {
          type: 'callout',
          title: 'Variability is a design constraint',
          text: 'Two identical requests can produce different output. If a process requires that the same input always yields the same result — a regulatory calculation, a price — that process needs deterministic software, or a cached and approved answer, not a model call.',
        },
      ],
    },
    {
      slug: 'reviewing-output',
      title: 'Reviewing output properly',
      minutes: 15,
      blocks: [
        {
          type: 'p',
          text: 'Fluent text invites skimming, and skimming is how errors ship. Review has to be deliberate, and it has to be proportionate to the consequence.',
        },
        {
          type: 'steps',
          items: [
            'Check the claims that carry weight: names, dates, figures, citations, commitments. Against the source, not against your memory of it.',
            'Look for what is missing. Omission is harder to spot than error and often matters more — the risk nobody mentioned.',
            'Ask whether it answered your actual question or a nearby easier one.',
            'Read for unearned confidence: assertions with no basis in anything you supplied.',
            'Decide explicitly whether to accept, edit or redo. "Mostly fine" is where bad output gets through.',
          ],
        },
        {
          type: 'check',
          id: 'm4l3-check',
          prompt: 'Which review failure is hardest to catch by reading the output carefully?',
          options: [
            'A wrong date',
            'A clumsy sentence',
            'A material point that was left out',
            'An invented citation',
          ],
          answer: 2,
          why: 'Errors are on the page. Omissions are not — which is why review means checking against the source, not reading the summary attentively.',
        },
        {
          type: 'table',
          head: ['Consequence of an error', 'Proportionate review'],
          rows: [
            ['Internal note, easily corrected', 'Skim; spot-check figures.'],
            ['Goes to a customer', 'Full read by someone competent to write it themselves.'],
            ['Regulatory, financial or clinical', 'Full verification against sources, recorded, with named accountability.'],
            ['High volume, individually low stakes', 'Sample a fixed percentage, track the error rate over time.'],
          ],
        },
        {
          type: 'spotter',
          id: 'm4-spotter',
          title: 'Spot what the source does not support',
          instruction:
            'Below is a contract extract and an AI-written summary of it. Flag every claim the extract does not support. Leaving a supported claim alone counts in your favour — over-flagging is its own failure mode.',
          sourceTitle: 'Source — extract from the Meridian Logistics service agreement',
          source: [
            '3.1  This Agreement commences on 1 March 2025 and continues for an initial term of 24 months.',
            '3.2  Either party may terminate for convenience on 90 days’ written notice, such notice not to be served before the first anniversary of commencement.',
            '4.1  Fees are £18,500 per quarter, invoiced in advance.',
            '4.3  Fees may be increased once in any 12-month period, by no more than CPI.',
            '7.2  The Supplier shall maintain professional indemnity insurance of not less than £5,000,000.',
          ],
          summaryTitle: 'AI summary — flag the unsupported claims',
          claims: [
            {
              id: 'c1',
              text: 'The agreement runs for an initial term of 24 months from 1 March 2025.',
              supported: true,
              note: 'Clause 3.1, stated directly.',
            },
            {
              id: 'c2',
              text: 'Either party may terminate on 90 days’ notice, but no such notice may be served in the first year.',
              supported: true,
              note: 'Clause 3.2, and it carries both halves rather than just the notice period.',
            },
            {
              id: 'c3',
              text: 'Fees are fixed at £74,000 per year for the initial term.',
              supported: false,
              note: 'The arithmetic happens to be right, and the claim is still wrong: clause 4.3 allows a CPI increase once a year, so nothing is fixed. A derived number carries a confidence the source never gave it.',
            },
            {
              id: 'c4',
              text: 'Fee increases are capped at CPI and limited to once in any 12-month period.',
              supported: true,
              note: 'Clause 4.3.',
            },
            {
              id: 'c5',
              text: 'The agreement renews automatically for successive 12-month terms unless notice is given.',
              supported: false,
              note: 'The extract says nothing about renewal. This is the dangerous kind of invention — plausible, commercially significant, and exactly what most contracts do say.',
            },
            {
              id: 'c6',
              text: 'The Supplier must maintain professional indemnity cover of at least £5,000,000.',
              supported: true,
              note: 'Clause 7.2, including the "not less than".',
            },
            {
              id: 'c7',
              text: 'Either party may terminate immediately for material breach.',
              supported: false,
              note: 'A standard clause, and absent here. The contract may well contain one — but a summary must not assert what it was not given.',
            },
            {
              id: 'c8',
              text: 'Meridian has consistently met its service obligations to date.',
              supported: false,
              note: 'Not a contractual term and nowhere in the source. Fluent prose invites a summary to add reassuring context it has no basis for.',
            },
          ],
        },
        {
          type: 'callout',
          title: 'Automation complacency',
          text: 'Reviewers get worse the longer a system has been good. Build the check into the process — a required field, a second pair of eyes, a sampled audit — rather than relying on sustained individual vigilance.',
        },
      ],
    },
    {
      slug: 'measuring-a-use-case',
      title: 'Deciding whether it is good enough',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: '"It seems to work" is the most expensive sentence in AI adoption. It is usually based on a handful of favourable examples, and it collapses the first week of real traffic. The alternative is small and unglamorous: an evaluation set.',
        },
        {
          type: 'steps',
          items: [
            'Collect 20–50 real inputs that reflect the actual mix, including the awkward ones you are tempted to leave out.',
            'Write down what a good output is for each — not a perfect answer, the acceptance criteria. Must cite the clause; must not invent dates; must stay under 300 words.',
            'Run the system and grade against those criteria. Two people grading the same ten items will disagree, and that disagreement is worth having early.',
            'Record the score, the model and the prompt version together.',
            'Re-run it after every prompt change, every model upgrade and every data change. This is the only way to tell improvement from drift.',
          ],
        },
        { type: 'h', text: 'Pick a threshold before you look' },
        {
          type: 'p',
          text: 'Decide the bar in advance and tie it to the consequence of being wrong. 85% acceptable with a human reviewing every item can be an easy yes. 95% with nobody checking can be an easy no. The number alone means nothing without the review design beside it.',
        },
        {
          type: 'check',
          id: 'm4l4-check',
          prompt: 'Your eval set scores 88%. What is still missing before that justifies shipping?',
          options: [
            'A larger model',
            'The review design — what happens to the other 12%',
            'A second eval set',
            'A lower temperature',
          ],
          answer: 1,
          why: '88% with a competent reviewer on every item can be an easy yes. The same 88% with nobody checking is a different proposition entirely. The number alone decides nothing.',
        },
        {
          type: 'callout',
          title: 'Measure against the status quo',
          text: 'The comparison is not "is the model perfect". It is "is this better than the current process, including its errors, its cost and its waiting time" — and the current process is rarely as good as people remember.',
        },
      ],
    },
  ],
  quiz: {
    questions: [
      {
        id: 'm4q1',
        prompt: 'Which single change most reduces fabrication when answering questions about a document?',
        options: [
          'Lowering the temperature to 0',
          'Supplying the document in the prompt and requiring quoted references',
          'Asking the model whether it is sure',
          'Using a longer prompt',
        ],
        answer: 1,
        why: 'Grounding the answer in supplied source, with checkable references, is the strongest lever. Self-reported confidence is just more generated text.',
      },
      {
        id: 'm4q2',
        prompt: 'A process must return an identical result for an identical input every time. What follows?',
        options: [
          'Use temperature 0 and accept the small variation',
          'That requirement is a poor fit for a model call — use deterministic software or an approved cached answer',
          'Use the largest model available',
          'Run it three times and take the majority answer',
        ],
        answer: 1,
        why: 'Sampling makes exact reproducibility something a model cannot guarantee; low temperature reduces variation without removing it.',
      },
      {
        id: 'm4q3',
        prompt: 'What is the most under-appreciated failure to look for when reviewing a summary?',
        options: [
          'Spelling mistakes',
          'Sentences that are too long',
          'Omission — a material point the summary left out',
          'British versus American spelling',
        ],
        answer: 2,
        why: 'Errors are visible on the page; omissions are not, and the risk nobody mentioned is often the one that matters.',
      },
      {
        id: 'm4q4',
        prompt: 'What makes an evaluation score meaningful?',
        options: [
          'That it exceeds 90%',
          'That it was produced by a larger model',
          'That it is paired with written acceptance criteria, a recorded model and prompt version, and the review design around it',
          'That it was measured on the examples used to write the prompt',
        ],
        answer: 2,
        why: 'A number is only interpretable alongside what was graded, against which version, and what human checking sits beside it.',
      },
    ],
  },
}
