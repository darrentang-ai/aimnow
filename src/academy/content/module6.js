// Module 6 — the part that decides whether any of the rest is allowed to run.
// Written as practice rather than principles: a list of values nobody can apply
// on a Tuesday afternoon is how AI policy fails.

export default {
  slug: 'responsible-adoption',
  title: 'Responsible Adoption at Work',
  summary:
    'Handling data and confidentiality, intellectual property and disclosure, bias and oversight, and how to roll generative AI out without either banning it or losing control of it.',
  lessons: [
    {
      slug: 'data-and-confidentiality',
      title: 'Data, confidentiality and privacy',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'The first question about any AI tool is not how good it is. It is where the text goes, who can read it, how long it is kept, and whether it trains anything. Those four answers differ between a consumer account and a business agreement with the same vendor.',
        },
        {
          type: 'steps',
          items: [
            'Know the tier. Consumer tiers may retain input and use it to improve models; business and enterprise agreements usually do not. The difference is contractual, and it is on you to check rather than assume.',
            'Classify before you paste. Public, internal, confidential, regulated. The last two need an approved tool and often a named approval.',
            'Minimise. Send the clause, not the whole contract. Redact names and identifiers the task does not need.',
            'Know where it is processed. Data residency and transfer rules bind you regardless of how convenient the tool is.',
            'Remember logs exist. Prompts and outputs are typically retained for abuse monitoring even where training is excluded.',
          ],
        },
        {
          type: 'check',
          id: 'm6l1-check',
          prompt: 'Which question actually settles whether a tool is safe for confidential material?',
          options: [
            'Is it from a well-known vendor?',
            'Does the website mention enterprise security?',
            'On the tier we are actually on, what do the terms say about retention and training?',
            'Is the data stored in the cloud?',
          ],
          answer: 2,
          why: 'The same vendor’s consumer and business tiers differ on exactly this point. The tier and its contract are the answer; the brand is not.',
        },
        {
          type: 'callout',
          title: 'The personal data trap',
          text: 'Pasting a customer list, a CV or a patient note into a general assistant is a processing activity like any other. Lawful basis, purpose limitation, retention and the rights of the person concerned all still apply — and "the AI did it" is not a defence anyone has had success with.',
        },
        {
          type: 'p',
          text: 'Shadow usage is the practical risk. If no approved tool exists, people use their own accounts on their own devices, and the organisation loses both the visibility and the contractual protection it was trying to preserve. Providing a sanctioned route is a security control, not a convenience.',
        },
      ],
    },
    {
      slug: 'ip-and-disclosure',
      title: 'Intellectual property and disclosure',
      minutes: 10,
      blocks: [
        { type: 'h', text: 'What goes in' },
        {
          type: 'list',
          items: [
            'Third-party confidential material — customer data, another company’s documents, licensed content — is usually covered by terms that say nothing about putting it through an AI vendor. Check the obligation you are under before you paste.',
            'Code under a restrictive licence deserves the same caution.',
          ],
        },
        { type: 'h', text: 'What comes out' },
        {
          type: 'list',
          items: [
            'Ownership of generated output varies by jurisdiction, and purely machine-generated work may not attract copyright in the way human-authored work does.',
            'Output can resemble training material, particularly for images, code and well-known text. Similarity checks matter when output is published.',
            'Some vendors offer indemnities for enterprise customers. They have conditions — read them before relying on one.',
          ],
        },
        {
          type: 'check',
          id: 'm6l2-check',
          prompt: 'A client’s NDA covers documents you want to run through an AI tool. What does that imply?',
          options: [
            'Nothing — the NDA predates AI tools',
            'It is fine if the tool does not train on your data',
            'Check what the NDA permits before pasting; a vendor’s terms do not override your obligation',
            'It is fine as long as you delete the chat afterwards',
          ],
          answer: 2,
          why: 'Sending third-party confidential material to a processor is a disclosure. Your obligation is to the client, and the tool’s terms have no bearing on it.',
        },
        { type: 'h', text: 'Disclosure' },
        {
          type: 'p',
          text: 'Expectations are tightening in contracts, in procurement questionnaires, in academic and clinical settings, and in regulation. The workable default: disclose when the reader would reasonably want to know, when a contract or policy requires it, and when AI involvement would change how the output is judged. Hidden use discovered later costs far more than disclosed use.',
        },
      ],
    },
    {
      slug: 'bias-and-oversight',
      title: 'Bias, fairness and human oversight',
      minutes: 11,
      blocks: [
        {
          type: 'p',
          text: 'Models learn patterns from human text, including the unflattering ones. Bias shows up as subtly different treatment of similar cases, differences in tone by name or dialect, uneven quality across languages, and defaults that assume one kind of person.',
        },
        { type: 'h', text: 'Testing for it, concretely' },
        {
          type: 'list',
          items: [
            'Build paired test cases that differ only in a protected characteristic, and compare the outputs.',
            'Check quality across the languages and dialects your users actually use, not just the dominant one.',
            'Watch for systematic omission — whose situations get summarised away.',
            'Keep the evaluation set representative of your real population rather than your easiest cases.',
          ],
        },
        { type: 'h', text: 'Oversight that means something' },
        {
          type: 'p',
          text: 'Real oversight needs three things: the reviewer must have the information and competence to disagree, the time to actually look, and the authority to reject without consequence. A reviewer who sees only a recommendation, has four seconds per item, and is measured on throughput is a rubber stamp with a job title.',
        },
        {
          type: 'table',
          head: ['Decision', 'Appropriate oversight'],
          rows: [
            ['Drafting internal copy', 'Author reviews before sending. Nothing more.'],
            ['Triaging a queue', 'Sampled audit, with an easy route to challenge a routing.'],
            ['Screening applicants or claims', 'Human decision, model as assistance only, with documented reasons and regular bias testing.'],
            ['Anything with a legal or safety effect', 'Named accountable person, full record, and a tested path to appeal.'],
          ],
        },
        {
          type: 'check',
          id: 'm6l3-check',
          prompt: 'What is the most concrete way to test a system for biased treatment?',
          options: [
            'Ask the model whether it is biased',
            'Run paired cases differing only in a protected characteristic and compare the outputs',
            'Read the vendor’s model card',
            'Raise the temperature and look for variation',
          ],
          answer: 1,
          why: 'Paired testing turns a principle into a measurement you can repeat after every prompt change and every model upgrade.',
        },
        {
          type: 'callout',
          title: 'Accountability does not move',
          text: 'The organisation that acts on an output is answerable for it. Every regime that has looked at this has landed in the same place: the tool is not a party, and responsibility stays with the people who deployed and used it.',
        },
      ],
    },
    {
      slug: 'rolling-it-out',
      title: 'Rolling it out without losing control',
      minutes: 17,
      blocks: [
        {
          type: 'p',
          text: 'Two failure modes dominate. Ban it, and usage moves to personal accounts where nothing is visible. Open it up with no guidance, and confidential material reaches places it should not while nobody can say whether any of it helped. The way through is narrow and unexciting.',
        },
        {
          type: 'steps',
          items: [
            'Provide an approved tool. Adoption without a sanctioned route is adoption you cannot see.',
            'Write a policy people can apply — one page, by data class, with named exceptions and a route to ask. Not a list of values.',
            'Train for judgement, not features. People need to recognise a bad fit and verify an answer; the buttons take ten minutes.',
            'Pick two or three use cases with a measurable before and after, and instrument them.',
            'Define the review step explicitly for each use case, and write down who is accountable.',
            'Review quarterly. Models change, and a decision made against last year’s model may no longer hold.',
          ],
        },
        { type: 'h', text: 'Measure the thing you cared about' },
        {
          type: 'p',
          text: 'Licences issued and prompts sent measure activity, not value. Track time to complete the task, rework and error rates, quality as judged by the people downstream, and cost per unit of work — against the honest baseline of the old process, including the errors it already made.',
        },
        {
          type: 'scenario',
          id: 'm6-scenario',
          title: 'Three situations, three months apart',
          instruction:
            'Pick what you would actually do. Each choice shows what tends to follow. There is a best call in each one, but the near-misses are the interesting part — most real decisions here are "defensible, but".',
          steps: [
            {
              id: 'sc1',
              situation:
                'A delivery lead messages you: “I need to tidy up the formatting on this customer list — 400 names, emails and order values. Can I just paste it into my personal AI account? I’ll delete the chat afterwards.”',
              options: [
                {
                  label: 'Yes — it is only formatting.',
                  rating: 'poor',
                  outcome:
                    'Consumer tiers may retain input and use it for training, and deleting a chat does not unwind that. You have also processed 400 people’s personal data through a service with no contract behind it.',
                },
                {
                  label: 'No. Refuse it.',
                  rating: 'partial',
                  outcome:
                    'Nothing leaks today. But the work still needs doing, and a refusal with no alternative is the most reliable way there is to create usage you cannot see.',
                },
                {
                  label: 'Point them at the approved tool, and strip the columns the task does not need.',
                  rating: 'best',
                  outcome:
                    'A sanctioned route plus data minimisation. Formatting needs the names, not the order values — and now it happens somewhere with terms behind it.',
                },
                {
                  label: 'Tell them to anonymise it first, then use whichever tool they like.',
                  rating: 'partial',
                  outcome:
                    'Minimisation is right; “whichever tool” is not. Order data re-identifies people easily, and you still have no idea where it went.',
                },
              ],
            },
            {
              id: 'sc2',
              situation:
                'A month on, the same lead has built a small assistant that drafts customer emails from order history. It is genuinely good. They want it switched on for the whole team on Monday.',
              options: [
                {
                  label: 'Switch it on — it works.',
                  rating: 'poor',
                  outcome:
                    'Works on whose examples? “It seems to work” is almost always built on a handful of favourable cases, and it meets real traffic in week one.',
                },
                {
                  label: 'Block it pending a full security review.',
                  rating: 'partial',
                  outcome:
                    'Proportionate for a payments system. Here it mostly teaches the team that building something useful gets punished — scale the gate to the consequence.',
                },
                {
                  label: 'Ask for 30 real examples graded against written criteria, and name who reviews a draft before it is sent.',
                  rating: 'best',
                  outcome:
                    'An eval set and a review step. Both are an afternoon of work, and together they turn an impression into something you can defend to a customer.',
                },
                {
                  label: 'Let it run for a week and see whether anyone complains.',
                  rating: 'poor',
                  outcome:
                    'Absence of complaints is not a measurement. The errors that reach customers are mostly the ones that never come back to you.',
                },
              ],
            },
            {
              id: 'sc3',
              situation:
                'It goes live with review. Three months later drafts are accepted almost unchanged, the reviewer is clearing 90 an hour, and nobody has rejected one in six weeks.',
              options: [
                {
                  label: 'Good — the system has matured.',
                  rating: 'poor',
                  outcome:
                    'Or the review has quietly stopped being review. Ninety an hour is forty seconds each, and six weeks without a single rejection measures the reviewer, not the model.',
                },
                {
                  label: 'Drop the review step; it is adding nothing.',
                  rating: 'poor',
                  outcome:
                    'The oversight is already thin. Removing it saves little and leaves nothing at all between a bad draft and a customer.',
                },
                {
                  label: 'Re-grade a sample against the original criteria, and check the reviewer has time and authority to reject.',
                  rating: 'best',
                  outcome:
                    'Automation complacency is the expected outcome here, not a surprise. Re-grading is what tells you whether quality held or attention slipped.',
                },
                {
                  label: 'Add a second reviewer.',
                  rating: 'partial',
                  outcome:
                    'More of a check that may already be hollow. Find out whether the first one is real before buying another.',
                },
              ],
            },
          ],
        },
        {
          type: 'check',
          id: 'm6l4-check',
          prompt: 'Six months in, usage is high and nobody can say whether anything improved. What was skipped?',
          options: [
            'Training',
            'Picking two or three use cases and capturing a measurable before and after',
            'Buying enough licences',
            'Publishing a values statement',
          ],
          answer: 1,
          why: 'Activity is easy to count and tells you nothing. The baseline has to be captured before the rollout — afterwards it can only be reconstructed from memory, flatteringly.',
        },
        {
          type: 'callout',
          title: 'Where this course ends',
          text: 'You now have the mechanism, the technique, the failure modes, the architecture and the governance. Everything after this is practice on a real task with a real quality bar — pick one, write down what good looks like, and measure it.',
        },
      ],
    },
  ],
  quiz: {
    questions: [
      {
        id: 'm6q1',
        prompt: 'What makes a one-page AI policy effective?',
        options: [
          'A statement of ethical principles',
          'Rules by data classification, with named exceptions and a clear route to ask',
          'A complete list of approved prompts',
          'A ban on all external AI tools',
        ],
        answer: 1,
        why: 'People need something applicable in the moment. Principles do not tell someone whether this document may be pasted into that tool.',
      },
      {
        id: 'm6q2',
        prompt: 'An organisation bans AI tools entirely. What is the most likely result?',
        options: [
          'Risk is eliminated',
          'Usage moves to personal accounts and devices, removing both visibility and contractual protection',
          'Productivity rises',
          'Vendors offer better terms',
        ],
        answer: 1,
        why: 'Shadow usage is the standard outcome, and it loses exactly the protections the ban intended to preserve.',
      },
      {
        id: 'm6q3',
        prompt: 'Which situation is human oversight in name only?',
        options: [
          'A reviewer who sees the source material and can reject without penalty',
          'A sampled audit with a challenge route',
          'A reviewer shown only a recommendation, given seconds per item, and measured on throughput',
          'An author editing their own AI-assisted draft',
        ],
        answer: 2,
        why: 'Meaningful oversight requires information, time and the authority to disagree. Remove any one and it is a rubber stamp.',
      },
      {
        id: 'm6q4',
        prompt: 'Which measure best indicates that an AI rollout is delivering value?',
        options: [
          'Number of licences issued',
          'Prompts sent per user per week',
          'Time to complete the task, rework rate and downstream quality against the old baseline',
          'Number of use cases proposed',
        ],
        answer: 2,
        why: 'Licences and prompt counts measure activity. Value shows up in time, rework and quality compared with the honest baseline.',
      },
    ],
  },
}
