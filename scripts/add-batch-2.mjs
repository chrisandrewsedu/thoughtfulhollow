#!/usr/bin/env node
/**
 * add-batch-2.mjs
 *
 * One-shot, idempotent script to add Easy + Medium tiers to themes 5-8
 * (0-based indices) in glossari.json. Content is authored by the controller
 * for the Glossari difficulty tiers feature.
 *
 * Themes touched:
 *   - themes[5] "Judgment & Wit"
 *   - themes[6] "Time & Change"
 *   - themes[7] "Speech & Silence"
 *   - themes[8] "Light & Shadow"
 *
 * Idempotent: if themes[5].tiers.easy already exists, exit without rewriting.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '..', 'glossari.json');

const BATCH = {
  5: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of thinking before acting; being mindful of risks.',
          parts: ['care', 'ful', 'ness'],
          pos: 'n.',
          definition: 'The quality of giving close attention; deliberate caution.',
          etymology: '<em>care</em> + <em>-ful</em> (full of) + <em>-ness</em>',
          example: "The chemist's <em>carefulness</em> with the bunsen burner kept the lab incident-free for years.",
          synonyms: 'caution, prudence, attentiveness',
          antonyms: 'recklessness, carelessness, rashness',
        },
        {
          type: 'synonym',
          clue: 'wise, smart, sensible',
          parts: ['clear', 'head', 'ed'],
          pos: 'adj.',
          definition: 'Thinking sensibly; not confused or misled.',
          etymology: '<em>clear</em> + <em>head</em> + <em>-ed</em>',
          example: 'Even in the panic of the storm, the captain stayed <em>clearheaded</em> and guided the ship to safety.',
          synonyms: 'wise, smart, sensible',
          antonyms: 'muddled, confused, foggy',
        },
        {
          type: 'antonym',
          clue: 'dull, blunt, blurry',
          parts: ['in', 'sight', 'ful'],
          pos: 'adj.',
          definition: 'Showing a clear and deep understanding of a person or situation.',
          etymology: '<em>in-</em> (into) + <em>sight</em> + <em>-ful</em>',
          example: 'Her <em>insightful</em> comment in the meeting changed how everyone saw the problem.',
          synonyms: 'perceptive, sharp, penetrating',
          antonyms: 'dull, blunt, blurry',
        },
        {
          type: 'example',
          clue: 'His <em>____</em> answers in the interview won him the job.',
          parts: ['know', 'ledge', 'able'],
          pos: 'adj.',
          definition: 'Possessing or showing a deep understanding of a subject.',
          etymology: '<em>know</em> + <em>-ledge</em> (act of) + <em>-able</em>',
          example: 'His <em>knowledgeable</em> answers in the interview won him the job.',
          synonyms: 'informed, learned, well-read',
          antonyms: 'ignorant, uninformed, clueless',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The ability to judge well or perceive subtle differences.',
          parts: ['dis', 'cern', 'ment'],
          pos: 'n.',
          definition: 'Good judgment; the ability to perceive things clearly or wisely.',
          etymology: 'Latin <em>dis-</em> (apart) + <em>cernere</em> (to sift, distinguish) + <em>-ment</em>',
          example: "The art collector's <em>discernment</em> saved her from many overpriced fakes.",
          synonyms: 'judgment, acumen, insight',
          antonyms: 'obtuseness, indiscrimination, dullness',
        },
        {
          type: 'synonym',
          clue: 'clever, shrewd, perceptive',
          parts: ['per', 'spic', 'acious'],
          pos: 'adj.',
          definition: 'Having or showing keen mental perception and understanding.',
          etymology: 'Latin <em>per-</em> (through) + <em>specere</em> (to look) + <em>-acious</em>',
          example: 'A <em>perspicacious</em> reader noticed the inconsistency in the alibi on the second page.',
          synonyms: 'shrewd, astute, sharp-eyed',
          antonyms: 'obtuse, dull-witted, unobservant',
        },
        {
          type: 'antonym',
          clue: 'muddled, confused, foolish',
          parts: ['lu', 'cid', 'ity'],
          pos: 'n.',
          definition: 'Clarity of thought or expression; the quality of being easily understood.',
          etymology: 'Latin <em>lux, lucis</em> (light) + <em>-cid</em> + <em>-ity</em>',
          example: "After his long illness, the patient's brief moments of <em>lucidity</em> were a comfort to the family.",
          synonyms: 'clarity, intelligibility, coherence',
          antonyms: 'muddledness, confusion, obscurity',
        },
        {
          type: 'example',
          clue: 'Her <em>____</em> of the evidence revealed a pattern no one else had seen.',
          parts: ['ana', 'ly', 'sis'],
          pos: 'n.',
          definition: 'Detailed examination of the elements or structure of something.',
          etymology: 'Greek <em>ana-</em> (up, throughout) + <em>lyein</em> (to loosen) + <em>-sis</em>',
          example: 'Her <em>analysis</em> of the evidence revealed a pattern no one else had seen.',
          synonyms: 'examination, study, scrutiny',
          antonyms: 'synthesis, conflation, generalization',
        },
      ],
    },
  },
  6: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of making something new again.',
          parts: ['re', 'new', 'al'],
          pos: 'n.',
          definition: 'The act of resuming or making something new or strong again.',
          etymology: '<em>re-</em> (again) + <em>new</em> + <em>-al</em>',
          example: "The library's <em>renewal</em> of its membership program drew in dozens of new readers.",
          synonyms: 'revival, refresh, restart',
          antonyms: 'expiration, cessation, lapse',
        },
        {
          type: 'synonym',
          clue: 'old, dated, obsolete',
          parts: ['out', 'dat', 'ed'],
          pos: 'adj.',
          definition: 'No longer in use or current; out of fashion.',
          etymology: '<em>out</em> + <em>date</em> + <em>-ed</em>',
          example: 'Her <em>outdated</em> textbook still described the planet count as nine.',
          synonyms: 'old, dated, obsolete',
          antonyms: 'current, modern, up-to-date',
        },
        {
          type: 'antonym',
          clue: 'speedy, fast, rapid',
          parts: ['un', 'hurr', 'ied'],
          pos: 'adj.',
          definition: 'Acting without haste; calm and unhurried.',
          etymology: '<em>un-</em> (not) + <em>hurry</em> + <em>-ied</em>',
          example: 'She walked with an <em>unhurried</em> pace, stopping to admire every shop window.',
          synonyms: 'leisurely, relaxed, easygoing',
          antonyms: 'speedy, fast, rushed',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> seasons of the year remind us that nothing stays the same.',
          parts: ['ever', 'chang', 'ing'],
          pos: 'adj.',
          definition: 'Constantly changing; never staying the same.',
          etymology: '<em>ever</em> + <em>change</em> + <em>-ing</em>',
          example: 'The <em>everchanging</em> seasons of the year remind us that nothing stays the same.',
          synonyms: 'shifting, fluctuating, mutable',
          antonyms: 'constant, fixed, unchanging',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The quality of being changeable or inconstant.',
          parts: ['mut', 'a', 'bility'],
          pos: 'n.',
          definition: 'The quality of being subject to change.',
          etymology: 'Latin <em>mutare</em> (to change) + <em>-a-</em> + <em>-bility</em>',
          example: 'The <em>mutability</em> of fashion makes it costly to dress for trends.',
          synonyms: 'changeability, variability, fickleness',
          antonyms: 'constancy, stability, permanence',
        },
        {
          type: 'synonym',
          clue: 'lasting, enduring, permanent',
          parts: ['per', 'enn', 'ial'],
          pos: 'adj.',
          definition: 'Lasting for an indefinitely long time; enduring.',
          etymology: 'Latin <em>per-</em> (through) + <em>annus</em> (year) + <em>-ial</em>',
          example: "The senator's <em>perennial</em> promise to lower taxes resurfaced every campaign season.",
          synonyms: 'enduring, lasting, abiding',
          antonyms: 'transient, fleeting, ephemeral',
        },
        {
          type: 'antonym',
          clue: 'permanent, lasting, enduring',
          parts: ['mom', 'ent', 'ary'],
          pos: 'adj.',
          definition: 'Lasting for only a very short time.',
          etymology: 'Latin <em>momentum</em> (movement, instant) + <em>-ent</em> + <em>-ary</em>',
          example: 'A <em>momentary</em> hesitation cost the runner the gold medal.',
          synonyms: 'brief, fleeting, short-lived',
          antonyms: 'permanent, lasting, enduring',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> reforms transformed every school in the district.',
          parts: ['pro', 'gress', 'ive'],
          pos: 'adj.',
          definition: 'Favoring or showing improvement or change; advancing.',
          etymology: 'Latin <em>pro-</em> (forward) + <em>gradi</em> (to step) + <em>-ive</em>',
          example: 'The <em>progressive</em> reforms transformed every school in the district.',
          synonyms: 'advancing, forward-looking, reformist',
          antonyms: 'regressive, reactionary, backward',
        },
      ],
    },
  },
  7: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of saying or expressing something again.',
          parts: ['re', 'state', 'ment'],
          pos: 'n.',
          definition: 'The act of expressing something a second time, usually for clarity.',
          etymology: '<em>re-</em> (again) + <em>state</em> + <em>-ment</em>',
          example: "The professor's <em>restatement</em> of the rule finally made the students understand it.",
          synonyms: 'repetition, rewording, paraphrase',
          antonyms: 'omission, silence, withholding',
        },
        {
          type: 'synonym',
          clue: 'chatty, talkative, gabby',
          parts: ['loud', 'mouth', 'ed'],
          pos: 'adj.',
          definition: 'Tending to talk too loudly or too much, often without thought.',
          etymology: '<em>loud</em> + <em>mouth</em> + <em>-ed</em>',
          example: 'His <em>loudmouthed</em> uncle dominated every family dinner with stories no one wanted to hear.',
          synonyms: 'brash, garrulous, blustering',
          antonyms: 'quiet, soft-spoken, reserved',
        },
        {
          type: 'antonym',
          clue: 'loud, noisy, vocal',
          parts: ['sound', 'less', 'ness'],
          pos: 'n.',
          definition: 'The state of being completely without sound.',
          etymology: '<em>sound</em> + <em>-less</em> (without) + <em>-ness</em>',
          example: 'The <em>soundlessness</em> of the snowy field made her own footsteps feel loud.',
          synonyms: 'silence, stillness, quiet',
          antonyms: 'loudness, noise, clamor',
        },
        {
          type: 'example',
          clue: "Her <em>____</em> answer made it clear she didn't want to discuss it.",
          parts: ['non', 'verb', 'al'],
          pos: 'adj.',
          definition: 'Not using words; communicated through gesture or expression.',
          etymology: '<em>non-</em> (not) + Latin <em>verbum</em> (word) + <em>-al</em>',
          example: "Her <em>nonverbal</em> answer made it clear she didn't want to discuss it.",
          synonyms: 'wordless, unspoken, silent',
          antonyms: 'spoken, verbal, articulated',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'Unnecessary repetition or excess of words.',
          parts: ['re', 'dund', 'ancy'],
          pos: 'n.',
          definition: 'Wordy excess; the use of more words than necessary.',
          etymology: 'Latin <em>re-</em> (again) + <em>undare</em> (to surge, overflow) + <em>-ancy</em>',
          example: 'The editor circled every <em>redundancy</em> in the manuscript with a red pen.',
          synonyms: 'wordiness, verbosity, prolixity',
          antonyms: 'brevity, conciseness, terseness',
        },
        {
          type: 'synonym',
          clue: 'concise, brief, terse',
          parts: ['con', 'cise', 'ness'],
          pos: 'n.',
          definition: 'The quality of expressing much in few words.',
          etymology: 'Latin <em>con-</em> (together) + <em>caedere</em> (to cut) + <em>-ness</em>',
          example: "She admired the poet's <em>conciseness</em> — every word carried weight.",
          synonyms: 'brevity, succinctness, economy',
          antonyms: 'verbosity, wordiness, prolixity',
        },
        {
          type: 'antonym',
          clue: 'talkative, voluble, garrulous',
          parts: ['re', 'tic', 'ent'],
          pos: 'adj.',
          definition: "Reluctant to speak about one's thoughts or feelings.",
          etymology: 'Latin <em>re-</em> (intensifier) + <em>tacere</em> (to be silent) + <em>-ent</em>',
          example: 'The normally chatty witness grew <em>reticent</em> when asked about the night of the crime.',
          synonyms: 'reserved, taciturn, tight-lipped',
          antonyms: 'talkative, voluble, garrulous',
        },
        {
          type: 'example',
          clue: "The witness's <em>____</em> answers gave the jury no clear picture.",
          parts: ['am', 'big', 'uous'],
          pos: 'adj.',
          definition: 'Open to more than one interpretation; unclear or vague.',
          etymology: 'Latin <em>ambi-</em> (both) + <em>agere</em> (to drive) + <em>-uous</em>',
          example: "The witness's <em>ambiguous</em> answers gave the jury no clear picture.",
          synonyms: 'unclear, equivocal, vague',
          antonyms: 'clear, unambiguous, definite',
        },
      ],
    },
  },
  8: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of making something brighter.',
          parts: ['light', 'en', 'ing'],
          pos: 'n.',
          definition: 'The act or process of making something less dark.',
          etymology: '<em>light</em> + <em>-en</em> (make) + <em>-ing</em>',
          example: 'A slow <em>lightening</em> in the eastern sky meant dawn was near.',
          synonyms: 'brightening, illumination, dawning',
          antonyms: 'darkening, dimming, shading',
        },
        {
          type: 'synonym',
          clue: 'dim, dusky, shadowy',
          parts: ['over', 'shadow', 'ed'],
          pos: 'adj.',
          definition: 'Made less visible or important by something larger or brighter.',
          etymology: '<em>over-</em> (covering) + <em>shadow</em> + <em>-ed</em>',
          example: 'The small candle was <em>overshadowed</em> by the bright chandelier above it.',
          synonyms: 'darkened, eclipsed, dimmed',
          antonyms: 'highlighted, illuminated, prominent',
        },
        {
          type: 'antonym',
          clue: 'dark, gloomy, shadowy',
          parts: ['un', 'cloud', 'ed'],
          pos: 'adj.',
          definition: 'Not blocked by clouds; clear and bright.',
          etymology: '<em>un-</em> (not) + <em>cloud</em> + <em>-ed</em>',
          example: 'The hikers reached the summit under an <em>unclouded</em> blue sky.',
          synonyms: 'clear, bright, sunny',
          antonyms: 'overcast, dark, gloomy',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> garden bloomed under the cloudless sky.',
          parts: ['sun', 'drench', 'ed'],
          pos: 'adj.',
          definition: 'Soaked or saturated with bright sunlight.',
          etymology: '<em>sun</em> + <em>drench</em> + <em>-ed</em>',
          example: 'The <em>sundrenched</em> garden bloomed under the cloudless sky.',
          synonyms: 'sunlit, bright, radiant',
          antonyms: 'shaded, dim, gloomy',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'To brighten with light or make clear.',
          parts: ['il', 'lumin', 'ate'],
          pos: 'v.',
          definition: 'To light up; to make something visible or clear.',
          etymology: 'Latin <em>in-</em> (assimilated to <em>il-</em>, into) + <em>lumen</em> (light) + <em>-ate</em>',
          example: 'Tall lamps were installed to <em>illuminate</em> the path through the garden after dark.',
          synonyms: 'brighten, light up, enlighten',
          antonyms: 'darken, obscure, shade',
        },
        {
          type: 'synonym',
          clue: 'shining, glowing, bright',
          parts: ['re', 'splend', 'ent'],
          pos: 'adj.',
          definition: 'Shining brilliantly; full of splendor.',
          etymology: 'Latin <em>re-</em> (intensifier) + <em>splendere</em> (to shine) + <em>-ent</em>',
          example: 'The queen appeared at the ball <em>resplendent</em> in a gown of woven gold.',
          synonyms: 'radiant, dazzling, brilliant',
          antonyms: 'dim, drab, dull',
        },
        {
          type: 'antonym',
          clue: 'bright, clear, transparent',
          parts: ['ne', 'bul', 'ous'],
          pos: 'adj.',
          definition: 'Cloudy, hazy, or vague; lacking definite form.',
          etymology: 'Latin <em>nebula</em> (cloud) + <em>-ous</em>',
          example: 'His <em>nebulous</em> plan for the company impressed nobody on the board.',
          synonyms: 'vague, hazy, unclear',
          antonyms: 'clear, distinct, defined',
        },
        {
          type: 'example',
          clue: "The detective's <em>____</em> on the case impressed the jury.",
          parts: ['re', 'flect', 'ion'],
          pos: 'n.',
          definition: 'Careful thought or consideration; also, the throwing back of light or an image.',
          etymology: 'Latin <em>re-</em> (back) + <em>flectere</em> (to bend) + <em>-ion</em>',
          example: "The detective's <em>reflection</em> on the case impressed the jury.",
          synonyms: 'consideration, contemplation, thought',
          antonyms: 'impulse, thoughtlessness, oblivion',
        },
      ],
    },
  },
};

const raw = readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

// Idempotency check: if themes[5].tiers.easy already exists, exit gracefully.
if (data.themes?.[5]?.tiers?.easy) {
  console.log('themes[5].tiers.easy already present; nothing to do. Exiting.');
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
console.log(`Added ${blocksAdded} tier blocks across themes 5-8.`);
