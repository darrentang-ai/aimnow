// Module 2 — mechanism, kept at the level a non-engineer can hold. Every
// behaviour the rest of the course asks people to work around (hallucination,
// context limits, variability, cost) is explained by something in here, so the
// lessons are written to be referred back to rather than read once.

export default {
  slug: 'how-models-work',
  title: 'How Large Language Models Work',
  summary:
    'Tokens, embeddings, prediction and attention, the three stages of training, and the handful of settings that change what you get back.',
  lessons: [
    {
      slug: 'tokens-and-embeddings',
      title: 'Tokens and embeddings',
      minutes: 15,
      blocks: [
        {
          type: 'p',
          text: 'A language model never sees your words. Before anything happens, your text is cut into tokens — chunks of roughly three to four characters in English — and each token is turned into a list of numbers.',
        },
        {
          type: 'example',
          title: 'Tokenisation, roughly',
          text: '"Generative AI is unremarkable" becomes something like [Gener][ative][ AI][ is][ un][remark][able]. Common words are one token; rare words, names and code split into several.',
        },
        {
          type: 'tokeniser',
          id: 'm2-tokeniser',
          title: 'Tokenise something',
          instruction:
            'Type your own text, or try one of these. Watch what happens to a surname, a product code and a long number compared with ordinary words.',
          initial: 'Generative AI is unremarkable.',
          presets: [
            { label: 'A word to count letters in', text: 'How many r letters are in strawberry?' },
            { label: 'Names and codes', text: 'Invoice INV-20450 for Przybylski Logistics Ltd, due 14/03/2026.' },
            { label: 'A number to add up', text: 'Add 18500 and 74000 and 1250000.' },
            { label: 'Spacing and layout', text: 'Line one.\n\n    Indented line two.' },
          ],
        },
        {
          type: 'p',
          text: 'This is not trivia. Tokens are the unit of pricing, the unit of the context window, and the reason some tasks are oddly hard. A model asked how many letter "r"s are in a word is working with chunks, not letters, which is why it can reason beautifully about a merger and miscount a word a child could spell.',
        },
        { type: 'h', text: 'Embeddings: meaning as position' },
        {
          type: 'p',
          text: 'Each token is mapped to a vector — a long list of numbers that places it in a space where related meanings sit near each other. "Invoice", "bill" and "receipt" land in the same neighbourhood; "invoice" and "trombone" do not. The model learned these positions from data; nobody wrote them.',
        },
        {
          type: 'key',
          items: [
            { term: 'Token', def: 'The chunk of text a model reads and writes. Billing, limits and speed are all measured in these.' },
            { term: 'Embedding', def: 'A numeric vector representing meaning. Similar meanings have similar vectors.' },
            { term: 'Vector search', def: 'Finding text by meaning rather than keyword, by comparing embeddings. The engine behind the retrieval you will meet in module 5.' },
          ],
        },
        {
          type: 'check',
          id: 'm2l1-check',
          prompt: 'Why is "summarise this 90-page contract" partly a question about tokens?',
          options: [
            'Tokens control the writing style',
            'The document, your instructions and the answer all compete for one budget measured in tokens',
            'Tokens determine the knowledge cutoff',
            'Long documents are tokenised differently from short ones',
          ],
          answer: 1,
          why: 'Ninety pages is on the order of 45,000 tokens. Everything in view shares one context budget — and the reply has to fit inside it too.',
        },
        {
          type: 'callout',
          title: 'Rule of thumb',
          text: 'Roughly 750 English words per 1,000 tokens. A 20-page document is in the region of 10,000 tokens. Useful for sizing both cost and whether something will fit at all.',
        },
      ],
    },
    {
      slug: 'prediction-and-attention',
      title: 'Prediction and attention',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'The core behaviour is startlingly simple: given everything so far, predict the next token. Then append it and do it again. A page of polished analysis is that loop running a few thousand times.',
        },
        {
          type: 'p',
          text: 'What makes the prediction good is the transformer architecture, and specifically attention. For each token it produces, the model weighs every token already in view and decides which ones matter. In "the contract the vendor signed last March expires next week, so it", attention is what connects "it" back to "the contract" rather than "the vendor" or "March".',
        },
        { type: 'h', text: 'Three consequences you will feel' },
        {
          type: 'list',
          items: [
            'It is not looking anything up. There is no database of facts inside, only statistical regularities. A plausible-sounding citation can be generated the same way a plausible-sounding sentence is — this is the root of hallucination.',
            'Output is sampled, not chosen. The model produces a probability distribution over next tokens and picks from it, so the same prompt can give different answers.',
            'Everything it "knows" about your task is in the text you gave it plus what it absorbed in training. It has no memory of yesterday unless something put yesterday back into the prompt.',
          ],
        },
        {
          type: 'check',
          id: 'm2l2-check',
          prompt:
            'A model answers confidently about your company’s refund policy, which it has never been shown. What happened?',
          options: [
            'It retrieved an outdated copy',
            'It predicted the text a refund policy usually contains',
            'It confused your company with a similarly named one',
            'Its context window overflowed',
          ],
          answer: 1,
          why: 'Nothing was retrieved, because there is nothing to retrieve from. A plausible policy is produced by exactly the machinery that produces a plausible sentence.',
        },
        {
          type: 'callout',
          title: 'A useful reframe',
          text: 'Do not ask "does the model know this?". Ask "is this in front of it right now?". Almost every quality problem in practice is a context problem wearing a knowledge problem’s clothes.',
        },
      ],
    },
    {
      slug: 'training-stages',
      title: 'The three stages of training',
      minutes: 12,
      blocks: [
        {
          type: 'p',
          text: 'A finished assistant is not one thing trained once. It is built in stages, and each stage explains a different part of its behaviour.',
        },
        {
          type: 'steps',
          items: [
            'Pretraining — the model reads an enormous amount of text and learns to predict the next token. This is where general language ability, world knowledge and most of the cost come from. It is also where the knowledge cutoff is set: nothing after the data was collected is in there.',
            'Supervised fine-tuning — the model is shown examples of good responses to instructions. This is what turns a text predictor into something that answers your question instead of continuing your sentence.',
            'Preference tuning (often RLHF) — humans compare pairs of responses and the model is trained toward the preferred ones. This shapes tone, helpfulness, refusals and the house style you recognise from a given assistant.',
          ],
        },
        {
          type: 'check',
          id: 'm2l3-check',
          prompt:
            'Two assistants built on the same underlying model behave very differently — one terse and formal, one chatty. Most likely cause?',
          options: [
            'They were pretrained on different data',
            'Different system prompts, on top of different preference tuning',
            'Different tokenisers',
            'One has a larger context window',
          ],
          answer: 1,
          why: 'Pretraining is the expensive shared part. Persona and house style come from tuning and from the system prompt — which is just text the product prepends.',
        },
        { type: 'h', text: 'And then, at the moment you use it' },
        {
          type: 'p',
          text: 'On top of all that sits the system prompt — instructions supplied by whoever built the product you are using, prepended to your conversation. It defines the persona, the rules and the things the assistant will not do. It is ordinary text, not training, which is why assistants built on the same model can behave quite differently.',
        },
        {
          type: 'table',
          head: ['If the behaviour is…', 'It most likely comes from…', 'And you change it by…'],
          rows: [
            ['Not knowing a 2026 event', 'Pretraining cutoff', 'Putting the information in the prompt, or retrieval'],
            ['Answering in a chatty tone', 'Preference tuning and system prompt', 'Asking for a different register, or editing the system prompt'],
            ['Refusing a legitimate request', 'Preference tuning and safety policy', 'Rephrasing with context and purpose; escalating to the vendor if persistent'],
            ['Not knowing your internal process', 'Never trained on it', 'Retrieval or putting the document in the prompt'],
          ],
        },
      ],
    },
    {
      slug: 'inference-controls',
      title: 'The settings that change your output',
      minutes: 10,
      blocks: [
        {
          type: 'p',
          text: 'Between you and the model sit a few controls. You will meet them in any API, and in the advanced panel of most tools.',
        },
        {
          type: 'key',
          items: [
            {
              term: 'Context window',
              def: 'The maximum number of tokens the model can have in view at once — your prompt, any attached documents, the conversation so far, and the answer it is writing. Everything competes for the same budget.',
            },
            {
              term: 'Temperature',
              def: 'How adventurously it samples. Low (0–0.3) for extraction, classification and anything you want repeatable. Higher (0.7–1.0) for brainstorming and copy. It does not make the model more accurate, only more or less varied.',
            },
            {
              term: 'Max output tokens',
              def: 'A cap on the length of the reply. Hitting it truncates mid-sentence, which is a common cause of "the model stopped working".',
            },
            {
              term: 'Stop sequences',
              def: 'Strings that end generation early. Useful when you want one record, not a helpful essay afterwards.',
            },
          ],
        },
        { type: 'h', text: 'Long context is not free attention' },
        {
          type: 'p',
          text: 'A large context window lets you paste a whole report, but material in the middle of a very long prompt tends to get weighted less than material at the start or the end. If a specific clause matters, say so and quote it, rather than trusting that it is in there somewhere.',
        },
        {
          type: 'check',
          id: 'm2l4-check',
          prompt: 'You paste in a long agreement and the model talks around a clause buried in the middle. Best fix?',
          options: [
            'Raise the temperature',
            'Quote the clause in your instruction and say why it matters',
            'Increase max output tokens',
            'Break the text into shorter paragraphs',
          ],
          answer: 1,
          why: 'Material in the middle of a long prompt is weighted less than material at either end. Do not trust that it is in there somewhere — put it in front of the model.',
        },
        {
          type: 'callout',
          title: 'Cost and latency in one line',
          text: 'You pay per token in and per token out, and you wait roughly in proportion to tokens out. Shorter prompts, smaller models and tighter output formats are the three levers, in that order of ease.',
        },
      ],
    },
  ],
  quiz: {
    questions: [
      {
        id: 'm2q1',
        prompt: 'Why can a capable model miscount the letters in a word?',
        options: [
          'It was never trained on spelling',
          'It reads text as tokens, not individual characters',
          'Counting is disabled for safety reasons',
          'The temperature setting is too high',
        ],
        answer: 1,
        why: 'Tokens are multi-character chunks. Character-level work cuts against the unit the model actually sees.',
      },
      {
        id: 'm2q2',
        prompt: 'A model invents a plausible but non-existent legal citation. Which property of the mechanism explains this best?',
        options: [
          'It retrieved the wrong record from its database',
          'It predicts likely text rather than looking facts up',
          'Its context window was exceeded',
          'Preference tuning rewarded dishonesty',
        ],
        answer: 1,
        why: 'There is no fact store inside. A plausible citation is generated by the same process as a plausible sentence.',
      },
      {
        id: 'm2q3',
        prompt: 'Which stage of training is responsible for a model knowing nothing about events after a certain date?',
        options: ['Pretraining', 'Supervised fine-tuning', 'Preference tuning', 'The system prompt'],
        answer: 0,
        why: 'Pretraining is where world knowledge is absorbed, and its data collection date is the knowledge cutoff.',
      },
      {
        id: 'm2q4',
        prompt: 'You need the same structured extraction from 2,000 documents, as consistently as possible. What temperature setting fits?',
        options: ['High, around 1.0', 'Low, near 0', 'It makes no difference to consistency', 'Temperature should match the number of documents'],
        answer: 1,
        why: 'Low temperature samples conservatively, which is what repeatable extraction needs. It does not improve accuracy, only consistency.',
      },
    ],
  },
}
