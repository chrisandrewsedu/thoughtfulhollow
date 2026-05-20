#!/usr/bin/env node
/**
 * add-batch-4.mjs
 *
 * One-shot, idempotent script to add Easy + Medium tiers to themes 13-15
 * (0-based indices) in glossari.json. Content is authored by the controller
 * for the Glossari difficulty tiers feature.
 *
 * Themes touched:
 *   - themes[13] "Generosity & Greed"
 *   - themes[14] "Memory & Forgetting"
 *   - themes[15] "Hospitality & Hostility"
 *
 * Final daily-puzzle content batch. After this commit, all 16 themes
 * have populated Easy, Medium, and Hard tiers.
 *
 * Idempotent: if themes[13].tiers.easy already exists, exit without rewriting.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '..', 'glossari.json');

const BATCH = {
  13: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'Fully committed; given with the whole heart.',
          parts: ['whole', 'heart', 'ed'],
          pos: 'adj.',
          definition: 'Showing full enthusiasm, commitment, or sincerity.',
          etymology: '<em>whole</em> + <em>heart</em> + <em>-ed</em>',
          example: 'The teacher gave her <em>wholehearted</em> support to every student who tried.',
          synonyms: 'earnest, unreserved, sincere',
          antonyms: 'halfhearted, reluctant, lukewarm',
        },
        {
          type: 'synonym',
          clue: 'stingy, miserly, greedy',
          parts: ['tight', 'fist', 'ed'],
          pos: 'adj.',
          definition: 'Unwilling to give or spend money; mean.',
          etymology: '<em>tight</em> + <em>fist</em> + <em>-ed</em>',
          example: 'The <em>tightfisted</em> uncle refused to chip in even a dollar for the family gift.',
          synonyms: 'stingy, miserly, parsimonious',
          antonyms: 'generous, openhanded, lavish',
        },
        {
          type: 'antonym',
          clue: 'giving, charitable, kind',
          parts: ['un', 'help', 'ful'],
          pos: 'adj.',
          definition: 'Not providing assistance or support.',
          etymology: '<em>un-</em> (not) + <em>help</em> + <em>-ful</em>',
          example: "The clerk's <em>unhelpful</em> shrug sent the lost tourist looking for someone else.",
          synonyms: 'unsupportive, indifferent, useless',
          antonyms: 'helpful, supportive, generous',
        },
        {
          type: 'example',
          clue: 'His <em>____</em> gift made the whole family weep with joy.',
          parts: ['over', 'flow', 'ing'],
          pos: 'adj.',
          definition: 'More than enough; abundant and spilling over.',
          etymology: '<em>over-</em> (too much) + <em>flow</em> + <em>-ing</em>',
          example: 'His <em>overflowing</em> gift made the whole family weep with joy.',
          synonyms: 'abundant, bountiful, copious',
          antonyms: 'meager, scant, sparse',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of giving freely and abundantly.',
          parts: ['gen', 'er', 'osity'],
          pos: 'n.',
          definition: 'Readiness to give more of something than is strictly necessary.',
          etymology: 'Latin <em>generosus</em> (noble, magnanimous) + <em>-er-</em> + <em>-osity</em>',
          example: 'The town remembered her <em>generosity</em> long after she had moved away.',
          synonyms: 'munificence, liberality, openhandedness',
          antonyms: 'stinginess, miserliness, greed',
        },
        {
          type: 'synonym',
          clue: 'greedy, grasping, ravenous',
          parts: ['vor', 'a', 'cious'],
          pos: 'adj.',
          definition: 'Wanting or devouring great quantities of something.',
          etymology: 'Latin <em>vorare</em> (to devour) + <em>-a-</em> + <em>-cious</em>',
          example: 'The <em>voracious</em> reader finished three novels in a single weekend.',
          synonyms: 'ravenous, insatiable, greedy',
          antonyms: 'restrained, moderate, satisfied',
        },
        {
          type: 'antonym',
          clue: 'stingy, miserly, ungiving',
          parts: ['bene', 'fic', 'ent'],
          pos: 'adj.',
          definition: 'Generous in giving help or doing good for others.',
          etymology: 'Latin <em>bene</em> (well) + <em>facere</em> (to do) + <em>-ent</em>',
          example: 'The <em>beneficent</em> patron funded scholarships for a generation of artists.',
          synonyms: 'generous, charitable, benevolent',
          antonyms: 'stingy, mean, miserly',
        },
        {
          type: 'example',
          clue: "The library's expansion was funded by a single <em>____</em> donor.",
          parts: ['phil', 'anthrop', 'ic'],
          pos: 'adj.',
          definition: 'Seeking to promote the welfare of others, especially by giving money to good causes.',
          etymology: 'Greek <em>philein</em> (to love) + <em>anthropos</em> (human) + <em>-ic</em>',
          example: "The library's expansion was funded by a single <em>philanthropic</em> donor.",
          synonyms: 'charitable, humanitarian, benevolent',
          antonyms: 'miserly, selfish, mercenary',
        },
      ],
    },
  },
  14: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of bringing something back to mind.',
          parts: ['re', 'call', 'ing'],
          pos: 'n.',
          definition: 'The action of remembering or being reminded of something.',
          etymology: '<em>re-</em> (back) + <em>call</em> + <em>-ing</em>',
          example: "The veteran's <em>recalling</em> of the old battle drew a hush from the audience.",
          synonyms: 'remembering, recollecting, reminiscing',
          antonyms: 'forgetting, overlooking, ignoring',
        },
        {
          type: 'synonym',
          clue: 'forgetful, distracted, absent-minded',
          parts: ['un', 'mind', 'ful'],
          pos: 'adj.',
          definition: 'Not aware of or paying attention to something.',
          etymology: '<em>un-</em> (not) + <em>mind</em> + <em>-ful</em>',
          example: 'The <em>unmindful</em> hiker left her water bottle at every rest stop.',
          synonyms: 'heedless, oblivious, inattentive',
          antonyms: 'mindful, attentive, aware',
        },
        {
          type: 'antonym',
          clue: 'forgotten, unknown, faded',
          parts: ['un', 'forgett', 'able'],
          pos: 'adj.',
          definition: 'Impossible to forget; deeply memorable.',
          etymology: '<em>un-</em> (not) + <em>forget</em> (with doubled consonant) + <em>-able</em>',
          example: 'The view from the summit at sunrise was <em>unforgettable</em>.',
          synonyms: 'memorable, indelible, lasting',
          antonyms: 'forgotten, unknown, faded',
        },
        {
          type: 'example',
          clue: 'Her <em>____</em> of the old neighborhood made everyone laugh and cry.',
          parts: ['story', 'tell', 'ing'],
          pos: 'n.',
          definition: 'The activity of telling or sharing stories.',
          etymology: '<em>story</em> + <em>tell</em> + <em>-ing</em>',
          example: 'Her <em>storytelling</em> of the old neighborhood made everyone laugh and cry.',
          synonyms: 'narration, recounting, recitation',
          antonyms: 'silence, withholding, omission',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of calling something to mind.',
          parts: ['re', 'coll', 'ection'],
          pos: 'n.',
          definition: 'The act or process of remembering something.',
          etymology: 'Latin <em>re-</em> (again) + <em>colligere</em> (to gather) + <em>-ection</em>',
          example: "His <em>recollection</em> of the accident matched the witness's testimony exactly.",
          synonyms: 'memory, remembrance, reminiscence',
          antonyms: 'forgetfulness, amnesia, oblivion',
        },
        {
          type: 'synonym',
          clue: 'memorable, unforgettable, lasting',
          parts: ['in', 'del', 'ible'],
          pos: 'adj.',
          definition: 'Unable to be removed, erased, or forgotten.',
          etymology: 'Latin <em>in-</em> (not) + <em>delere</em> (to destroy) + <em>-ible</em>',
          example: 'The artist signed every canvas with <em>indelible</em> ink.',
          synonyms: 'permanent, lasting, unforgettable',
          antonyms: 'erasable, fading, transient',
        },
        {
          type: 'antonym',
          clue: 'memorable, vivid, unforgettable',
          parts: ['un', 'memor', 'able'],
          pos: 'adj.',
          definition: 'Not worth remembering; lacking distinction.',
          etymology: '<em>un-</em> (not) + Latin <em>memor</em> (mindful) + <em>-able</em>',
          example: 'The film was so <em>unmemorable</em> that no one could recall the plot a week later.',
          synonyms: 'forgettable, undistinguished, ordinary',
          antonyms: 'memorable, striking, unforgettable',
        },
        {
          type: 'example',
          clue: 'The ceremony was held to <em>____</em> the founders of the school.',
          parts: ['ven', 'er', 'ate'],
          pos: 'v.',
          definition: 'To regard with great respect or reverence.',
          etymology: 'Latin <em>venerari</em> (to worship, honor) + <em>-er-</em> + <em>-ate</em>',
          example: 'The ceremony was held to <em>venerate</em> the founders of the school.',
          synonyms: 'honor, revere, respect',
          antonyms: 'scorn, disregard, disdain',
        },
      ],
    },
  },
  15: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of being simple and welcoming.',
          parts: ['home', 'li', 'ness'],
          pos: 'n.',
          definition: 'A warm, simple, and welcoming quality, like a cozy home.',
          etymology: '<em>home</em> + <em>-ly</em> + <em>-ness</em>',
          example: "The inn's <em>homeliness</em> made travelers feel like family from the moment they arrived.",
          synonyms: 'warmth, coziness, friendliness',
          antonyms: 'coldness, formality, unfriendliness',
        },
        {
          type: 'synonym',
          clue: 'warm, generous, welcoming',
          parts: ['big', 'heart', 'ed'],
          pos: 'adj.',
          definition: 'Kind, generous, and willing to give freely.',
          etymology: '<em>big</em> + <em>heart</em> + <em>-ed</em>',
          example: 'The <em>bighearted</em> coach paid for the new uniforms out of his own pocket.',
          synonyms: 'generous, warm, openhanded',
          antonyms: 'selfish, mean, coldhearted',
        },
        {
          type: 'antonym',
          clue: 'kind, hospitable, welcoming',
          parts: ['un', 'friend', 'ly'],
          pos: 'adj.',
          definition: 'Not friendly; cold or hostile in manner.',
          etymology: '<em>un-</em> (not) + <em>friend</em> + <em>-ly</em>',
          example: 'The new neighbors were <em>unfriendly</em> for the first month, then warmed up to the block.',
          synonyms: 'hostile, cold, distant',
          antonyms: 'friendly, warm, welcoming',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> stranger refused even a glass of water from the locals.',
          parts: ['stand', 'off', 'ish'],
          pos: 'adj.',
          definition: 'Distant and cold in manner; aloof.',
          etymology: '<em>stand</em> + <em>off</em> + <em>-ish</em>',
          example: 'The <em>standoffish</em> stranger refused even a glass of water from the locals.',
          synonyms: 'aloof, distant, unfriendly',
          antonyms: 'approachable, warm, friendly',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of being friendly and easy to get along with.',
          parts: ['con', 'viv', 'iality'],
          pos: 'n.',
          definition: 'The quality of being lively, friendly, and enjoyable in company.',
          etymology: 'Latin <em>con-</em> (together) + <em>vivere</em> (to live) + <em>-iality</em>',
          example: 'The <em>conviviality</em> of the dinner party kept everyone at the table until midnight.',
          synonyms: 'sociability, friendliness, cheerfulness',
          antonyms: 'aloofness, coldness, reserve',
        },
        {
          type: 'synonym',
          clue: 'warm, gracious, welcoming',
          parts: ['hos', 'pit', 'able'],
          pos: 'adj.',
          definition: 'Friendly and welcoming to strangers or guests.',
          etymology: 'Latin <em>hospes</em> (host, guest) + <em>-pit-</em> + <em>-able</em>',
          example: 'Their <em>hospitable</em> household welcomed travelers from every passing caravan.',
          synonyms: 'welcoming, gracious, accommodating',
          antonyms: 'inhospitable, unwelcoming, cold',
        },
        {
          type: 'antonym',
          clue: 'warm, friendly, welcoming',
          parts: ['con', 'front', 'ational'],
          pos: 'adj.',
          definition: 'Tending toward confrontation; aggressive in dispute.',
          etymology: 'Latin <em>con-</em> (against) + <em>frons</em> (forehead, front) + <em>-ational</em>',
          example: 'His <em>confrontational</em> style made every meeting tense and unproductive.',
          synonyms: 'combative, aggressive, hostile',
          antonyms: 'agreeable, conciliatory, peaceable',
        },
        {
          type: 'example',
          clue: "The host's <em>____</em> manner put every guest immediately at ease.",
          parts: ['bene', 'vol', 'ent'],
          pos: 'adj.',
          definition: 'Well-meaning and kindly disposed toward others.',
          etymology: 'Latin <em>bene</em> (well) + <em>velle</em> (to wish) + <em>-ent</em>',
          example: "The host's <em>benevolent</em> manner put every guest immediately at ease.",
          synonyms: 'kind, kindhearted, well-meaning',
          antonyms: 'malevolent, hostile, cruel',
        },
      ],
    },
  },
};

const raw = readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

// Idempotency check: if themes[13].tiers.easy already exists, exit gracefully.
if (data.themes?.[13]?.tiers?.easy) {
  console.log('themes[13].tiers.easy already present; nothing to do. Exiting.');
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
console.log(`Added ${blocksAdded} tier blocks across themes 13-15.`);
