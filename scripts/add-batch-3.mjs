#!/usr/bin/env node
/**
 * add-batch-3.mjs
 *
 * One-shot, idempotent script to add Easy + Medium tiers to themes 9-12
 * (0-based indices) in glossari.json. Content is authored by the controller
 * for the Glossari difficulty tiers feature.
 *
 * Themes touched:
 *   - themes[9]  "Truth & Doubt"
 *   - themes[10] "Sloth & Diligence"
 *   - themes[11] "Beginning & Origin"
 *   - themes[12] "Wandering & Wayfaring"
 *
 * Idempotent: if themes[9].tiers.easy already exists, exit without rewriting.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '..', 'glossari.json');

const BATCH = {
  9: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of being true and honest in what one says.',
          parts: ['truth', 'ful', 'ness'],
          pos: 'n.',
          definition: 'The quality of telling the truth; honesty in speech.',
          etymology: '<em>truth</em> + <em>-ful</em> (full of) + <em>-ness</em>',
          example: 'His <em>truthfulness</em> on the witness stand left the jury with no doubts.',
          synonyms: 'honesty, candor, veracity',
          antonyms: 'dishonesty, deceit, falsehood',
        },
        {
          type: 'synonym',
          clue: 'doubtful, suspicious, unsure',
          parts: ['dis', 'believ', 'ing'],
          pos: 'adj.',
          definition: 'Refusing to accept that something is true.',
          etymology: '<em>dis-</em> (not) + <em>believe</em> + <em>-ing</em>',
          example: 'She gave him a <em>disbelieving</em> stare when he claimed he had run the marathon.',
          synonyms: 'doubtful, skeptical, incredulous',
          antonyms: 'trusting, believing, accepting',
        },
        {
          type: 'antonym',
          clue: 'honest, true, sincere',
          parts: ['un', 'trust', 'worthy'],
          pos: 'adj.',
          definition: 'Not able to be relied on as honest or truthful.',
          etymology: '<em>un-</em> (not) + <em>trust</em> + <em>worthy</em> (deserving)',
          example: 'After he leaked the secret, his coworkers found him <em>untrustworthy</em>.',
          synonyms: 'unreliable, dishonest, treacherous',
          antonyms: 'honest, true, sincere',
        },
        {
          type: 'example',
          clue: 'Her <em>____</em> claims made the lawyers suspicious.',
          parts: ['over', 'stat', 'ed'],
          pos: 'adj.',
          definition: 'Exaggerated; presented as greater than the reality.',
          etymology: '<em>over-</em> (too much) + <em>state</em> + <em>-ed</em>',
          example: 'Her <em>overstated</em> claims made the lawyers suspicious.',
          synonyms: 'exaggerated, inflated, embellished',
          antonyms: 'understated, modest, factual',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of deliberately misleading someone.',
          parts: ['de', 'cept', 'ion'],
          pos: 'n.',
          definition: 'The act of causing someone to accept as true what is false.',
          etymology: 'Latin <em>de-</em> (away) + <em>capere</em> (to take, seize) + <em>-ion</em>',
          example: "The magician's <em>deception</em> fooled even those who had watched the trick a dozen times.",
          synonyms: 'trickery, falsehood, fraud',
          antonyms: 'honesty, candor, truthfulness',
        },
        {
          type: 'synonym',
          clue: 'doubting, questioning, mistrusting',
          parts: ['skept', 'ic', 'al'],
          pos: 'adj.',
          definition: 'Not easily convinced; having doubts or reservations.',
          etymology: 'Greek <em>skeptesthai</em> (to consider, examine) + <em>-ic</em> + <em>-al</em>',
          example: "She remained <em>skeptical</em> of the politician's promises until she saw real results.",
          synonyms: 'doubtful, mistrustful, dubious',
          antonyms: 'credulous, gullible, trusting',
        },
        {
          type: 'antonym',
          clue: 'honest, candid, sincere',
          parts: ['mend', 'ac', 'ious'],
          pos: 'adj.',
          definition: 'Not telling the truth; lying.',
          etymology: 'Latin <em>mendax</em> (lying) + <em>-ac-</em> + <em>-ious</em>',
          example: 'The <em>mendacious</em> account given by the suspect fell apart under cross-examination.',
          synonyms: 'untruthful, deceitful, dishonest',
          antonyms: 'honest, candid, sincere',
        },
        {
          type: 'example',
          clue: "Her <em>____</em> raised serious questions about the company's reports.",
          parts: ['dis', 'crep', 'ancy'],
          pos: 'n.',
          definition: 'A difference between two things that should be the same.',
          etymology: 'Latin <em>dis-</em> (apart) + <em>crepare</em> (to creak, rattle) + <em>-ancy</em>',
          example: "Her <em>discrepancy</em> raised serious questions about the company's reports.",
          synonyms: 'inconsistency, mismatch, divergence',
          antonyms: 'agreement, consistency, conformity',
        },
      ],
    },
  },
  10: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of never getting tired; great energy.',
          parts: ['tire', 'less', 'ness'],
          pos: 'n.',
          definition: 'The quality of being able to work or continue without becoming tired.',
          etymology: '<em>tire</em> + <em>-less</em> (without) + <em>-ness</em>',
          example: "The volunteer's <em>tirelessness</em> kept the shelter running through three consecutive storms.",
          synonyms: 'stamina, perseverance, endurance',
          antonyms: 'weariness, lethargy, exhaustion',
        },
        {
          type: 'synonym',
          clue: 'hardworking, diligent, busy',
          parts: ['hard', 'work', 'ing'],
          pos: 'adj.',
          definition: "Putting in great effort and dedication to one's work.",
          etymology: '<em>hard</em> + <em>work</em> + <em>-ing</em>',
          example: 'Her <em>hardworking</em> reputation earned her the chance to lead the new project.',
          synonyms: 'diligent, industrious, dedicated',
          antonyms: 'lazy, idle, slothful',
        },
        {
          type: 'antonym',
          clue: 'active, energetic, lively',
          parts: ['list', 'less', 'ness'],
          pos: 'n.',
          definition: 'A state of lacking energy or enthusiasm.',
          etymology: '<em>list</em> (Old English desire) + <em>-less</em> (without) + <em>-ness</em>',
          example: 'A week of fever left her in a state of <em>listlessness</em> that worried her parents.',
          synonyms: 'lethargy, apathy, torpor',
          antonyms: 'energy, vigor, liveliness',
        },
        {
          type: 'example',
          clue: 'His <em>____</em> approach to chores left every job half-done.',
          parts: ['half', 'heart', 'ed'],
          pos: 'adj.',
          definition: 'Done without enthusiasm or commitment.',
          etymology: '<em>half</em> + <em>heart</em> + <em>-ed</em>',
          example: 'His <em>halfhearted</em> approach to chores left every job half-done.',
          synonyms: 'uncommitted, lukewarm, indifferent',
          antonyms: 'wholehearted, enthusiastic, committed',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of holding firm despite obstacles.',
          parts: ['ten', 'ac', 'ity'],
          pos: 'n.',
          definition: 'The quality of being determined and persistent.',
          etymology: 'Latin <em>tenere</em> (to hold) + <em>-ac-</em> + <em>-ity</em>',
          example: "The mountaineer's <em>tenacity</em> brought her to the summit despite the brutal winds.",
          synonyms: 'perseverance, persistence, determination',
          antonyms: 'irresolution, weakness, surrender',
        },
        {
          type: 'synonym',
          clue: 'hardworking, diligent, persistent',
          parts: ['in', 'dust', 'rious'],
          pos: 'adj.',
          definition: 'Hardworking, dedicated, and persistent in effort.',
          etymology: 'Latin <em>industria</em> (diligence) + <em>-rious</em>',
          example: 'The <em>industrious</em> beavers reshaped the entire stream within a single season.',
          synonyms: 'diligent, assiduous, hardworking',
          antonyms: 'lazy, idle, slothful',
        },
        {
          type: 'antonym',
          clue: 'energetic, active, vigorous',
          parts: ['apath', 'et', 'ic'],
          pos: 'adj.',
          definition: 'Showing or feeling no interest, enthusiasm, or concern.',
          etymology: 'Greek <em>apatheia</em> (without feeling) + <em>-et-</em> + <em>-ic</em>',
          example: 'The teacher worried that her once-eager students had grown <em>apathetic</em> about science.',
          synonyms: 'indifferent, unconcerned, listless',
          antonyms: 'passionate, enthusiastic, engaged',
        },
        {
          type: 'example',
          clue: "The author's <em>____</em> brought the long book to a close after years of work.",
          parts: ['dedic', 'a', 'tion'],
          pos: 'n.',
          definition: 'Commitment to a task or purpose.',
          etymology: 'Latin <em>dedicare</em> (to devote) + <em>-a-</em> + <em>-tion</em>',
          example: "The author's <em>dedication</em> brought the long book to a close after years of work.",
          synonyms: 'commitment, devotion, persistence',
          antonyms: 'indifference, neglect, apathy',
        },
      ],
    },
  },
  11: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of beginning again after a stop.',
          parts: ['re', 'start', 'ing'],
          pos: 'n.',
          definition: 'The act of starting something again after stopping.',
          etymology: '<em>re-</em> (again) + <em>start</em> + <em>-ing</em>',
          example: 'After the power outage, the long <em>restarting</em> of every computer in the lab took an hour.',
          synonyms: 'rebooting, resumption, renewal',
          antonyms: 'stopping, ending, halting',
        },
        {
          type: 'synonym',
          clue: 'first, earliest, one-of-a-kind',
          parts: ['un', 'match', 'ed'],
          pos: 'adj.',
          definition: 'Without equal; unparalleled.',
          etymology: '<em>un-</em> (not) + <em>match</em> + <em>-ed</em>',
          example: "The chef's <em>unmatched</em> skill with pastry drew customers from across the city.",
          synonyms: 'unequaled, peerless, unique',
          antonyms: 'ordinary, common, equaled',
        },
        {
          type: 'antonym',
          clue: 'ending, final, last',
          parts: ['re', 'birth', 'ing'],
          pos: 'n.',
          definition: 'The act of being born again or starting fresh.',
          etymology: '<em>re-</em> (again) + <em>birth</em> + <em>-ing</em>',
          example: 'The festival celebrated the <em>rebirthing</em> of the forest after the long winter.',
          synonyms: 'renewal, revival, regeneration',
          antonyms: 'ending, death, conclusion',
        },
        {
          type: 'example',
          clue: "Last summer's <em>____</em> garden produced more vegetables than anyone expected.",
          parts: ['un', 'tend', 'ed'],
          pos: 'adj.',
          definition: 'Not looked after or cared for.',
          etymology: '<em>un-</em> (not) + <em>tend</em> (look after) + <em>-ed</em>',
          example: "Last summer's <em>untended</em> garden produced more vegetables than anyone expected.",
          synonyms: 'neglected, uncared-for, wild',
          antonyms: 'cultivated, cared-for, tended',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The very first stages of something.',
          parts: ['in', 'iti', 'ation'],
          pos: 'n.',
          definition: 'The act of beginning or being formally accepted into something new.',
          etymology: 'Latin <em>in-</em> (into) + <em>ire</em> (to go) + <em>-ation</em>',
          example: 'The new recruits arrived early for the formal <em>initiation</em> into the brotherhood.',
          synonyms: 'beginning, commencement, induction',
          antonyms: 'conclusion, ending, expulsion',
        },
        {
          type: 'synonym',
          clue: 'early, first, original',
          parts: ['pri', 'mev', 'al'],
          pos: 'adj.',
          definition: 'Belonging to the earliest ages of the world; ancient.',
          etymology: 'Latin <em>primus</em> (first) + <em>aevum</em> (age) + <em>-al</em>',
          example: 'The hikers felt as if they had stepped into a <em>primeval</em> forest untouched by humans.',
          synonyms: 'ancient, prehistoric, primordial',
          antonyms: 'modern, recent, contemporary',
        },
        {
          type: 'antonym',
          clue: 'ancient, original, earliest',
          parts: ['con', 'temp', 'orary'],
          pos: 'adj.',
          definition: 'Belonging to or occurring in the present time.',
          etymology: 'Latin <em>con-</em> (with) + <em>tempus</em> (time) + <em>-orary</em>',
          example: "The museum's east wing displays <em>contemporary</em> art from artists still working today.",
          synonyms: 'modern, current, present-day',
          antonyms: 'ancient, antique, primeval',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> chapters of the book set up the entire story.',
          parts: ['pre', 'lim', 'inary'],
          pos: 'adj.',
          definition: 'Coming before something more important; introductory.',
          etymology: 'Latin <em>prae-</em> (before) + <em>limen</em> (threshold) + <em>-inary</em>',
          example: 'The <em>preliminary</em> chapters of the book set up the entire story.',
          synonyms: 'introductory, opening, initial',
          antonyms: 'concluding, final, ending',
        },
      ],
    },
  },
  12: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: "Traveling on foot while carrying one's gear.",
          parts: ['back', 'pack', 'ing'],
          pos: 'n.',
          definition: "The activity of hiking and camping while carrying gear on one's back.",
          etymology: '<em>back</em> + <em>pack</em> + <em>-ing</em>',
          example: 'She spent the summer <em>backpacking</em> through the national parks of the western states.',
          synonyms: 'trekking, hiking, traveling',
          antonyms: 'staying put, settling, resting',
        },
        {
          type: 'synonym',
          clue: 'lost, drifting, aimless',
          parts: ['un', 'guid', 'ed'],
          pos: 'adj.',
          definition: 'Without a guide or clear direction.',
          etymology: '<em>un-</em> (not) + <em>guide</em> + <em>-ed</em>',
          example: 'The <em>unguided</em> hikers spent two extra hours finding their way back to the trailhead.',
          synonyms: 'directionless, wandering, adrift',
          antonyms: 'guided, directed, led',
        },
        {
          type: 'antonym',
          clue: 'moving, traveling, restless',
          parts: ['un', 'mov', 'ing'],
          pos: 'adj.',
          definition: 'Not moving; remaining in one place.',
          etymology: '<em>un-</em> (not) + <em>move</em> + <em>-ing</em>',
          example: "The deer stood <em>unmoving</em> in the clearing, sensing the hunter's approach.",
          synonyms: 'still, motionless, stationary',
          antonyms: 'moving, traveling, restless',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> in the corner had stories from every continent.',
          parts: ['globe', 'trot', 'ter'],
          pos: 'n.',
          definition: 'A person who travels frequently to many parts of the world.',
          etymology: '<em>globe</em> + <em>trot</em> + <em>-ter</em> (one who)',
          example: 'The <em>globetrotter</em> in the corner had stories from every continent.',
          synonyms: 'traveler, wanderer, voyager',
          antonyms: 'homebody, stay-at-home, native',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of traveling for pleasure or learning.',
          parts: ['ex', 'cur', 'sion'],
          pos: 'n.',
          definition: 'A short journey or trip, especially for pleasure or learning.',
          etymology: 'Latin <em>ex-</em> (out) + <em>currere</em> (to run) + <em>-sion</em>',
          example: 'The biology class spent the day on an <em>excursion</em> to the tidal pools.',
          synonyms: 'outing, expedition, jaunt',
          antonyms: 'stay, residence, encampment',
        },
        {
          type: 'synonym',
          clue: 'homeless, drifting, vagrant',
          parts: ['tran', 'si', 'ent'],
          pos: 'adj.',
          definition: 'Lasting only a short time; passing through without settling.',
          etymology: 'Latin <em>trans-</em> (across) + <em>ire</em> (to go) + <em>-ent</em>',
          example: 'The hotel was filled with <em>transient</em> guests, none staying more than a night.',
          synonyms: 'passing, fleeting, temporary',
          antonyms: 'permanent, settled, rooted',
        },
        {
          type: 'antonym',
          clue: 'settled, rooted, stationary',
          parts: ['mi', 'grat', 'ory'],
          pos: 'adj.',
          definition: 'Moving from one place to another at regular intervals.',
          etymology: 'Latin <em>migrare</em> (to move) + <em>-grat-</em> + <em>-ory</em>',
          example: 'The <em>migratory</em> birds passed through the valley every October on their way south.',
          synonyms: 'roaming, traveling, nomadic',
          antonyms: 'settled, rooted, stationary',
        },
        {
          type: 'example',
          clue: 'Her years as a <em>____</em> shaped her view of the world.',
          parts: ['ex', 'pat', 'riate'],
          pos: 'n.',
          definition: 'A person who lives outside their native country.',
          etymology: 'Latin <em>ex-</em> (out of) + <em>patria</em> (native country) + <em>-riate</em>',
          example: 'Her years as an <em>expatriate</em> shaped her view of the world.',
          synonyms: 'emigrant, exile, migrant',
          antonyms: 'native, citizen, local',
        },
      ],
    },
  },
};

const raw = readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

// Idempotency check: if themes[9].tiers.easy already exists, exit gracefully.
if (data.themes?.[9]?.tiers?.easy) {
  console.log('themes[9].tiers.easy already present; nothing to do. Exiting.');
  process.exit(0);
}

let blocksAdded = 0;
for (const idxStr of Object.keys(BATCH)) {
  const idx = Number(idxStr);
  const theme = data.themes[idx];
  if (!theme) {
    throw new Error(`themes[${idx}] not found`);
  }
  if (!theme.tiers) {
    throw new Error(`themes[${idx}].tiers missing`);
  }
  for (const tier of ['easy', 'medium']) {
    if (theme.tiers[tier]) {
      throw new Error(`themes[${idx}].tiers.${tier} already exists — refusing to overwrite`);
    }
    theme.tiers[tier] = BATCH[idx][tier];
    blocksAdded += 1;
  }
}

writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Added ${blocksAdded} tier blocks across themes 9-12.`);
