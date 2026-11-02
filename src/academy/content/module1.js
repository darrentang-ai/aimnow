// Module 1 — orientation. No mechanism yet: someone who has only ever used a
// chat box needs a map of the territory before tokens and attention mean
// anything to them.

export default {
  slug: 'what-generative-ai-is',
  title: 'What Generative AI Actually Is',
  summary:
    'Where generative AI sits among the things already called AI, what the model landscape looks like, and how to tell a good use case from a bad one.',
  lessons: [
    {
      slug: 'from-automation-to-generation',
      title: 'From automation to generation',
      minutes: 10,
      blocks: [
        {
          type: 'p',
          text: 'Most software you have used automates a decision somebody already made. A payroll system applies rules written by an accountant. A spam filter sorts mail into two buckets a human defined. Even the machine learning in a fraud model is doing a sorting job: given this transaction, which of these labels fits?',
        },
        {
          type: 'p',
          text: 'Generative AI does something different in kind. Instead of choosing between options you supplied, it produces something that did not exist a moment ago — a paragraph, a table, a function, an image, a summary of a 90-page contract. The output is new, and nobody wrote a rule that determined it.',
        },
        {
          type: 'key',
          items: [
            {
              term: 'Discriminative model',
              def: 'Sorts or scores existing inputs. "Is this invoice fraudulent?" The output space is fixed in advance.',
            },
            {
              term: 'Generative model',
              def: 'Produces new content in the same shape as what it was trained on. "Write the dispute letter for this invoice." The output space is effectively unbounded.',
            },
            {
              term: 'Foundation model',
              def: 'A large model trained on broad data, intended to be adapted to many tasks rather than built for one. Most generative AI you will meet is a foundation model behind a product.',
            },
          ],
        },
        { type: 'h', text: 'Why this changes how you work' },
        {
          type: 'p',
          text: 'Traditional software is specified then built: you decide the behaviour, someone implements it, and it does exactly that forever. A generative model is capable on day one of tasks nobody specified, and it is also unreliable on tasks nobody tested. That inverts the usual order of work. Less time writing requirements; much more time checking output and deciding what "good enough" means.',
        },
        {
          type: 'list',
          items: [
            'The same model can draft an email and summarise a dataset — capability is general, quality is not.',
            'Two runs of the same prompt can differ. This is a design feature, not a bug, and it rules out use cases that need identical output every time.',
            'There is no error message when it is wrong. A confident, fluent, incorrect answer looks exactly like a correct one.',
          ],
        },
        {
          type: 'check',
          id: 'm1l1-check',
          prompt:
            'A colleague insists their rules-based invoice matcher "is generative AI, it uses machine learning". What is the actual distinction?',
          options: [
            'Generative models are larger',
            'A generative model produces new content; the matcher chooses among outcomes someone defined',
            'Generative models run in the cloud',
            'There is no meaningful distinction',
          ],
          answer: 1,
          why: 'The output space is the dividing line. A matcher picks from a fixed set of answers; a generative model writes something that did not exist before.',
        },
        {
          type: 'callout',
          title: 'The practical test',
          text: 'If you can write down the rule, write the rule. Generative AI earns its place where the rule is impossible to write down — tone, judgement, synthesis, open-ended language — and where a human can still check the result.',
        },
      ],
    },
    {
      slug: 'the-model-landscape',
      title: 'The model landscape',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'The field moves quickly, but the shape of it is stable. Models vary along a handful of axes, and knowing which axis a decision sits on is most of what you need to follow a vendor conversation.',
        },
        { type: 'h', text: 'Modality — what goes in and what comes out' },
        {
          type: 'table',
          head: ['Modality', 'Typical use', 'What to watch'],
          rows: [
            ['Text to text', 'Drafting, summarising, extraction, classification, code', 'The workhorse. Most business value is here.'],
            ['Image generation', 'Concepts, marketing visuals, mock-ups', 'Rights and provenance questions are sharpest here.'],
            ['Multimodal (image or document in, text out)', 'Reading scans, screenshots, charts, forms', 'Quality varies enormously by document quality.'],
            ['Speech', 'Transcription, voice interfaces, dubbing', 'Transcription is mature; synthesis raises consent issues.'],
            ['Video', 'Short clips, b-roll, animation', 'Newest and least predictable; treat as experimental.'],
          ],
        },
        { type: 'h', text: 'Size and the cost of intelligence' },
        {
          type: 'p',
          text: 'Providers ship families of models — a large one that reasons well and costs more, a mid-size one that handles most work, and a small fast one for high-volume simple tasks. Picking the biggest model for everything is the most common and most expensive beginner mistake. Routing each task to the smallest model that passes your quality bar is a real engineering discipline.',
        },
        { type: 'h', text: 'Open weights and hosted APIs' },
        {
          type: 'list',
          items: [
            'Hosted API — you send text to a provider and get text back. Fastest to start, no infrastructure, data leaves your network under the provider’s terms.',
            'Open-weights model — the parameters are published, so you can run it on your own or a cloud provider’s hardware. More control and sometimes lower unit cost at volume, but you own the operations, the evaluation and the upgrades.',
            'The choice is usually driven by data residency, regulation and volume, not by model quality alone.',
          ],
        },
        {
          type: 'check',
          id: 'm1l2-check',
          prompt:
            'You need to sort 40,000 support emails a day into five categories. Which choice is most defensible?',
          options: [
            'The largest model available, for accuracy',
            'The smallest model that clears your quality bar on a test set',
            'Whichever model the vendor recommends',
            'An open-weights model, always',
          ],
          answer: 1,
          why: 'High volume, simple task — this is exactly what the smaller models in a family are for. The test set is what turns "smallest" into "smallest that is good enough".',
        },
        {
          type: 'callout',
          title: 'Ask the version, not the brand',
          text: 'Model behaviour changes between versions, sometimes significantly. Any claim about what "the AI" can or cannot do has a shelf life. Record which model version your results came from, the way you would record the version of any other dependency.',
        },
      ],
    },
    {
      slug: 'how-genai-reaches-you',
      title: 'How it reaches you at work',
      minutes: 9,
      blocks: [
        {
          type: 'p',
          text: 'The same underlying model shows up in four quite different shapes, and they carry different levels of risk, effort and control. Confusing them is why "we already have AI" and "we need to build AI" can both be true in the same organisation.',
        },
        {
          type: 'steps',
          items: [
            'Chat assistants — a general box you type into. Broad, cheap to adopt, entirely dependent on the skill of the person using it. Nothing is governed unless you govern it.',
            'Embedded features — the summarise button in your email or ticketing tool. Narrow, no training needed, and the vendor has already made the privacy and prompt decisions for you.',
            'Copilots in a workflow — AI inside a specific process: drafting a case note, triaging a queue. The useful middle ground, usually built on your own data.',
            'Agents — a model given tools and permission to act in a loop: read a system, decide, write back. The highest leverage and the only one where a mistake acts on the world rather than just appearing on a screen.',
          ],
        },
        {
          type: 'check',
          id: 'm1l3-check',
          prompt: 'Your ticketing tool adds a "summarise this thread" button. Which shape is it, and what follows?',
          options: [
            'A chat assistant — the priority is training people to use it well',
            'An embedded feature — the vendor has already made the prompt and privacy decisions',
            'An agent — it needs approval gates before it acts',
            'A copilot — it needs connecting to your own data first',
          ],
          answer: 1,
          why: 'Embedded features are someone else’s choices shipped to you. The governance question is what their terms say, not what your prompt says.',
        },
        {
          type: 'p',
          text: 'Most organisations should expect to run all four at once. The governance question is not "do we allow AI" but "which of these four, for which data, with whose approval".',
        },
      ],
    },
    {
      slug: 'where-value-comes-from',
      title: 'Spotting a good use case',
      minutes: 16,
      blocks: [
        {
          type: 'p',
          text: 'Value does not come from adopting a model. It comes from pointing one at a task that has the right shape. The shape is recognisable, and you can assess it before writing a line of code.',
        },
        { type: 'h', text: 'Good-fit signals' },
        {
          type: 'list',
          items: [
            'The task is language-shaped: reading, writing, summarising, reformatting, extracting, explaining.',
            'It happens often enough that saved minutes add up, or rarely enough that nobody has built a proper tool for it.',
            'A competent human reviews the output anyway, as part of the existing process.',
            'Being roughly right is useful — a draft that saves 80% of the typing is still a win.',
          ],
        },
        { type: 'h', text: 'Poor-fit signals' },
        {
          type: 'list',
          items: [
            'The answer must be exactly reproducible or arithmetically exact. Use a database, a spreadsheet or a rules engine.',
            'A wrong answer reaches a customer, a regulator or a patient without a human in between.',
            'The knowledge needed is not in the model and not available to it — private, current, or in a system it cannot read.',
            'Nobody can say what a good answer looks like. If you cannot grade it, you cannot improve it.',
          ],
        },
        {
          type: 'table',
          head: ['Task', 'Fit', 'Why'],
          rows: [
            ['Summarise 40 support tickets into themes', 'Strong', 'Language-shaped, reviewed anyway, roughly right is useful.'],
            ['Calculate quarterly commission', 'Poor', 'Needs exact arithmetic and an audit trail.'],
            ['Draft a first-pass response to an RFP section', 'Strong', 'Human edits before it goes anywhere.'],
            ['Decide who gets a loan', 'Poor', 'Consequential, regulated, needs explainability the model cannot give.'],
            ['Extract dates and parties from 500 contracts', 'Strong, with checks', 'High volume, structured output, sample-verifiable.'],
          ],
        },
        {
          type: 'sorter',
          id: 'm1-sorter',
          title: 'Sort these by fit',
          instruction:
            'Eight tasks from one real week. Put each where it belongs. "Needs checks" means it works, but only with verification built into the process — which is a different decision from "yes".',
          options: ['Strong fit', 'Needs checks', 'Poor fit'],
          items: [
            {
              id: 's1',
              text: 'Turn a 40-minute client call transcript into a summary with action items, for the consultant who was on the call.',
              answer: 0,
              why: 'Language-shaped, read by someone who was there and would notice an invention, and useful even when only roughly right.',
            },
            {
              id: 's2',
              text: 'Work out which of 1,200 invoices are overdue, and by how much.',
              answer: 2,
              why: 'Exact arithmetic that has to reconcile and be auditable. A query does this correctly, identically, every time.',
            },
            {
              id: 's3',
              text: 'Extract the renewal date and notice period from 500 supplier contracts into a spreadsheet.',
              answer: 1,
              why: 'Genuinely valuable at this volume — but a wrong date is invisible once it is a cell in a spreadsheet. Ships with clause references and a sampled check, or not at all.',
            },
            {
              id: 's4',
              text: 'Write the final wording of a redundancy letter and send it.',
              answer: 2,
              why: 'Consequential, legally sensitive, and nothing between the output and the person receiving it.',
            },
            {
              id: 's5',
              text: 'Draft first-pass answers to the 60 questions in a security questionnaire, for review.',
              answer: 0,
              why: 'Repetitive writing against material you already hold, with review already in the process. The draft saves most of the typing.',
            },
            {
              id: 's6',
              text: 'Decide which job applicants go through to interview.',
              answer: 2,
              why: 'Consequential and regulated, and it needs an explanation of the decision that the model cannot actually give.',
            },
            {
              id: 's7',
              text: 'Classify 3,000 support tickets into eight existing categories.',
              answer: 1,
              why: 'Mechanically a strong fit, but someone will make decisions from the category counts — so the error rate has to be measured before anyone trusts them.',
            },
            {
              id: 's8',
              text: 'Explain a 30-page technical standard to a non-technical manager.',
              answer: 0,
              why: 'Synthesis and register, from a source the reader can open and check. Low cost to being roughly right.',
            },
          ],
        },
        {
          type: 'check',
          id: 'm1l4-check',
          prompt: 'Which of these is the strongest reason to reject a use case outright?',
          options: [
            'The output varies slightly between runs',
            'Nobody can say what a good answer would look like',
            'It would need a large context window',
            'The task only comes up twice a month',
          ],
          answer: 1,
          why: 'Variability and rarity are constraints you can design around. Ungradeability is a stop: you will never know whether it works, or be able to improve it.',
        },
        {
          type: 'callout',
          title: 'Carry this into module 2',
          text: 'Every "poor fit" above traces back to a property of how these models work — they predict rather than look up, and they produce plausible text rather than verified fact. That mechanism is next.',
        },
      ],
    },
  ],
  quiz: {
    questions: [
      {
        id: 'm1q1',
        prompt: 'What most clearly distinguishes a generative model from a discriminative one?',
        options: [
          'It runs in the cloud rather than on your own hardware',
          'It produces new content rather than choosing among predefined outputs',
          'It is trained on more data',
          'It does not require any human review',
        ],
        answer: 1,
        why: 'A discriminative model sorts or scores within a fixed output space. A generative model produces new output in the same shape as its training data.',
      },
      {
        id: 'm1q2',
        prompt: 'A team wants AI to compute monthly payroll totals. What is the right call?',
        options: [
          'Use the largest available model for accuracy',
          'Use a generative model but check a sample of results',
          'Use conventional software — the task needs exact, reproducible arithmetic',
          'Fine-tune a model on past payroll runs',
        ],
        answer: 2,
        why: 'Exact and reproducible calculation is a poor fit. If you can write the rule, write the rule.',
      },
      {
        id: 'm1q3',
        prompt: 'Which delivery shape carries the highest risk when the model gets something wrong?',
        options: [
          'A chat assistant',
          'A summarise button embedded in an email client',
          'An agent with permission to act in connected systems',
          'A copilot that drafts text for a human to edit',
        ],
        answer: 2,
        why: 'An agent acts on the world. The other three put output on a screen for a person to accept or reject.',
      },
      {
        id: 'm1q4',
        prompt: 'Why is defaulting every task to the largest available model a mistake?',
        options: [
          'Large models cannot handle simple tasks',
          'It wastes cost and latency on work a smaller model would pass your quality bar on',
          'Large models are always less accurate',
          'Providers do not allow it',
        ],
        answer: 1,
        why: 'Model families exist so you can route each task to the smallest model that clears your quality bar — that routing is where cost control lives.',
      },
    ],
  },
}
