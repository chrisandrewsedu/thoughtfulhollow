#!/usr/bin/env node
/**
 * add-batch-5.mjs
 *
 * One-shot, idempotent script to expand the Practice pool in glossari.json
 * from 1 puzzle per tier to 3 puzzles per tier.
 *
 * Practice puzzles appended (order matters — these are pushed onto the END
 * of each tier's existing array):
 *   - practice.easy:   Tidying Up, Pets
 *   - practice.medium: Sound, Movement
 *   - practice.hard:   Discord, Persuasion
 *
 * This is the FINAL v1 content batch. After this commit, v1 launch content
 * is complete: 16 themes x 3 tiers (48 daily puzzles) + 9 practice puzzles
 * = 57 total.
 *
 * Idempotent: if practice.easy.length is already >= 3, exit without rewriting.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '..', 'glossari.json');

const BATCH = {
  easy: [
    {
      name: 'Practice — Tidying Up',
      sets: [
        {
          type: 'definition',
          clue: 'The act of keeping a home in order.',
          parts: ['house', 'keep', 'ing'],
          pos: 'n.',
          definition: 'The management and care of a household.',
          etymology: '<em>house</em> + <em>keep</em> + <em>-ing</em>',
          example: 'Daily <em>housekeeping</em> kept the small apartment feeling spacious and calm.',
          synonyms: 'homemaking, cleaning, tidying',
          antonyms: 'neglect, disorder, mess',
        },
        {
          type: 'synonym',
          clue: 'neat, tidy, orderly',
          parts: ['un', 'clutter', 'ed'],
          pos: 'adj.',
          definition: 'Free from mess or excess; clean and orderly.',
          etymology: '<em>un-</em> (not) + <em>clutter</em> + <em>-ed</em>',
          example: 'Her <em>uncluttered</em> desk made it easy to focus on the task at hand.',
          synonyms: 'tidy, orderly, neat',
          antonyms: 'messy, cluttered, chaotic',
        },
        {
          type: 'antonym',
          clue: 'messy, cluttered, disordered',
          parts: ['re', 'arrang', 'ed'],
          pos: 'adj.',
          definition: 'Put into a new order or arrangement.',
          etymology: '<em>re-</em> (again) + <em>arrange</em> + <em>-ed</em>',
          example: 'The <em>rearranged</em> living room felt brand new without a single new purchase.',
          synonyms: 'reorganized, restructured, ordered',
          antonyms: 'messy, cluttered, jumbled',
        },
        {
          type: 'example',
          clue: "The room's <em>____</em> made it feel twice as large.",
          parts: ['de', 'clutter', 'ing'],
          pos: 'n.',
          definition: 'The act of removing unnecessary items to create space.',
          etymology: '<em>de-</em> (remove) + <em>clutter</em> + <em>-ing</em>',
          example: "The room's <em>decluttering</em> made it feel twice as large.",
          synonyms: 'tidying, clearing, simplifying',
          antonyms: 'cluttering, hoarding, accumulating',
        },
      ],
    },
    {
      name: 'Practice — Pets',
      sets: [
        {
          type: 'definition',
          clue: 'Not yet taught to behave or follow commands.',
          parts: ['un', 'train', 'ed'],
          pos: 'adj.',
          definition: 'Lacking the discipline or skill that comes from training.',
          etymology: '<em>un-</em> (not) + <em>train</em> + <em>-ed</em>',
          example: 'The <em>untrained</em> puppy bolted out the door the first chance it got.',
          synonyms: 'wild, undisciplined, raw',
          antonyms: 'trained, disciplined, schooled',
        },
        {
          type: 'synonym',
          clue: 'freed, loose, running wild',
          parts: ['un', 'leash', 'ed'],
          pos: 'adj.',
          definition: 'Set free from restraint; let loose.',
          etymology: '<em>un-</em> (not) + <em>leash</em> + <em>-ed</em>',
          example: 'Once <em>unleashed</em>, the husky sprinted in a wide circle around the field.',
          synonyms: 'freed, loose, released',
          antonyms: 'restrained, tied, leashed',
        },
        {
          type: 'antonym',
          clue: 'wild, untamed, fierce',
          parts: ['peace', 'ful', 'ness'],
          pos: 'n.',
          definition: 'A calm, quiet, and gentle state.',
          etymology: '<em>peace</em> + <em>-ful</em> (full of) + <em>-ness</em>',
          example: "The old dog's <em>peacefulness</em> made him the favorite of every visiting child.",
          synonyms: 'calm, serenity, tranquility',
          antonyms: 'wildness, ferocity, restlessness',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> puppy chewed every shoe in the house.',
          parts: ['mis', 'chiev', 'ous'],
          pos: 'adj.',
          definition: 'Playfully troublesome; causing minor harm in a fun-loving way.',
          etymology: '<em>mis-</em> (bad) + <em>chief</em> (head, end) + <em>-ous</em>',
          example: 'The <em>mischievous</em> puppy chewed every shoe in the house.',
          synonyms: 'playful, naughty, impish',
          antonyms: 'well-behaved, obedient, calm',
        },
      ],
    },
  ],
  medium: [
    {
      name: 'Practice — Sound',
      sets: [
        {
          type: 'definition',
          clue: 'The act of speaking words clearly and distinctly.',
          parts: ['e', 'nunci', 'ation'],
          pos: 'n.',
          definition: 'Clear and distinct pronunciation of words.',
          etymology: 'Latin <em>e-</em> (out) + <em>nuntiare</em> (to announce) + <em>-ation</em>',
          example: "The actor's careful <em>enunciation</em> carried every word to the back of the theater.",
          synonyms: 'pronunciation, articulation, diction',
          antonyms: 'mumbling, slurring, muttering',
        },
        {
          type: 'synonym',
          clue: 'loud, booming, echoing',
          parts: ['re', 'son', 'ant'],
          pos: 'adj.',
          definition: 'Deep, full, and reverberating in sound.',
          etymology: 'Latin <em>re-</em> (back) + <em>sonare</em> (to sound) + <em>-ant</em>',
          example: "The cellist's <em>resonant</em> low notes filled every corner of the hall.",
          synonyms: 'booming, sonorous, echoing',
          antonyms: 'thin, muffled, faint',
        },
        {
          type: 'antonym',
          clue: 'quiet, muffled, faint',
          parts: ['vo', 'ci', 'ferous'],
          pos: 'adj.',
          definition: 'Expressing oneself in vehement, loud, or forceful words.',
          etymology: 'Latin <em>vox, vocis</em> (voice) + <em>ferre</em> (to carry) + <em>-ous</em>',
          example: 'The <em>vociferous</em> protesters drowned out every speaker the mayor tried to introduce.',
          synonyms: 'loud, clamorous, strident',
          antonyms: 'quiet, hushed, faint',
        },
        {
          type: 'example',
          clue: "The audience's <em>____</em> filled the hall after the final note.",
          parts: ['ac', 'clam', 'ation'],
          pos: 'n.',
          definition: 'Loud and enthusiastic approval, typically by applause or shouting.',
          etymology: 'Latin <em>ac-</em> (toward) + <em>clamare</em> (to cry out) + <em>-ation</em>',
          example: "The audience's <em>acclamation</em> filled the hall after the final note.",
          synonyms: 'applause, ovation, cheering',
          antonyms: 'silence, booing, disapproval',
        },
      ],
    },
    {
      name: 'Practice — Movement',
      sets: [
        {
          type: 'definition',
          clue: 'The act of driving or pushing something forward.',
          parts: ['pro', 'pul', 'sion'],
          pos: 'n.',
          definition: 'The action of driving or pushing forward.',
          etymology: 'Latin <em>pro-</em> (forward) + <em>pellere</em> (to drive) + <em>-sion</em>',
          example: "The rocket's <em>propulsion</em> carried it past the atmosphere in minutes.",
          synonyms: 'drive, force, thrust',
          antonyms: 'drag, resistance, stasis',
        },
        {
          type: 'synonym',
          clue: 'fast, quick, swift',
          parts: ['ex', 'ped', 'itious'],
          pos: 'adj.',
          definition: 'Done with speed and efficiency.',
          etymology: 'Latin <em>ex-</em> (out) + <em>pes, pedis</em> (foot) + <em>-itious</em>',
          example: "The team's <em>expeditious</em> response saved the building from total loss.",
          synonyms: 'swift, prompt, speedy',
          antonyms: 'slow, sluggish, leisurely',
        },
        {
          type: 'antonym',
          clue: 'fast, swift, hurried',
          parts: ['de', 'lib', 'erate'],
          pos: 'adj.',
          definition: 'Done with careful consideration and at an unhurried pace.',
          etymology: 'Latin <em>de-</em> (down) + <em>libra</em> (scale, balance) + <em>-erate</em>',
          example: 'She gave a slow, <em>deliberate</em> nod and signed the contract without another word.',
          synonyms: 'measured, unhurried, considered',
          antonyms: 'hasty, impulsive, rushed',
        },
        {
          type: 'example',
          clue: "The train's <em>____</em> through the long tunnel was barely noticed.",
          parts: ['pro', 'gress', 'ion'],
          pos: 'n.',
          definition: 'The process of moving forward gradually.',
          etymology: 'Latin <em>pro-</em> (forward) + <em>gradi</em> (to step) + <em>-ion</em>',
          example: "The train's <em>progression</em> through the long tunnel was barely noticed.",
          synonyms: 'advance, movement, course',
          antonyms: 'retreat, regression, halt',
        },
      ],
    },
  ],
  hard: [
    {
      name: 'Practice — Discord',
      sets: [
        {
          type: 'definition',
          clue: 'A state of strong disagreement or conflict.',
          parts: ['dis', 'sen', 'sion'],
          pos: 'n.',
          definition: 'Disagreement that leads to discord, especially within a group.',
          etymology: 'Latin <em>dis-</em> (apart) + <em>sentire</em> (to feel) + <em>-sion</em>',
          example: 'Open <em>dissension</em> among the cabinet members forced the prime minister to call an early vote.',
          synonyms: 'discord, dispute, contention',
          antonyms: 'agreement, accord, consensus',
        },
        {
          type: 'synonym',
          clue: 'quarrelsome, contentious, hostile',
          parts: ['bel', 'lig', 'erent'],
          pos: 'adj.',
          definition: 'Hostile and aggressive; inclined to fight.',
          etymology: 'Latin <em>bellum</em> (war) + <em>gerere</em> (to wage) + <em>-ent</em>',
          example: 'The <em>belligerent</em> patron was asked to leave after threatening the bartender.',
          synonyms: 'combative, hostile, pugnacious',
          antonyms: 'peaceable, friendly, conciliatory',
        },
        {
          type: 'antonym',
          clue: 'agreeable, conciliatory, peaceful',
          parts: ['an', 'tag', 'onistic'],
          pos: 'adj.',
          definition: 'Showing or causing active hostility or opposition.',
          etymology: 'Greek <em>anti-</em> (against) + <em>agon</em> (contest) + <em>-onistic</em>',
          example: "The committee's <em>antagonistic</em> tone made compromise impossible from the first meeting.",
          synonyms: 'hostile, opposed, adversarial',
          antonyms: 'friendly, cooperative, harmonious',
        },
        {
          type: 'example',
          clue: 'The two factions reached a state of <em>____</em> after years of feud.',
          parts: ['re', 'concil', 'iation'],
          pos: 'n.',
          definition: 'The restoration of friendly relations.',
          etymology: 'Latin <em>re-</em> (again) + <em>conciliare</em> (to bring together) + <em>-iation</em>',
          example: 'The two factions reached a state of <em>reconciliation</em> after years of feud.',
          synonyms: 'rapprochement, reunion, settlement',
          antonyms: 'estrangement, schism, breach',
        },
      ],
    },
    {
      name: 'Practice — Persuasion',
      sets: [
        {
          type: 'definition',
          clue: 'To argue strongly against something; to protest forcefully.',
          parts: ['re', 'mon', 'strate'],
          pos: 'v.',
          definition: 'To make a forcefully reproachful protest.',
          etymology: 'Latin <em>re-</em> (again) + <em>monstrare</em> (to show) + <em>-ate</em>',
          example: 'The architects publicly <em>remonstrated</em> against the demolition of the historic library.',
          synonyms: 'protest, object, expostulate',
          antonyms: 'agree, accept, consent',
        },
        {
          type: 'synonym',
          clue: 'convincing, compelling, forceful',
          parts: ['per', 'sua', 'sive'],
          pos: 'adj.',
          definition: 'Able to convince others through argument or appeal.',
          etymology: 'Latin <em>per-</em> (thoroughly) + <em>suadere</em> (to advise) + <em>-sive</em>',
          example: 'Her <em>persuasive</em> closing remarks swung three undecided votes her way.',
          synonyms: 'compelling, convincing, cogent',
          antonyms: 'unconvincing, weak, feeble',
        },
        {
          type: 'antonym',
          clue: 'convincing, plausible, sound',
          parts: ['im', 'plaus', 'ible'],
          pos: 'adj.',
          definition: 'Not seeming reasonable or probable; failing to convince.',
          etymology: 'Latin <em>in-</em> (assimilated to <em>im-</em>, not) + <em>plaudere</em> (to applaud) + <em>-ible</em>',
          example: 'His <em>implausible</em> alibi collapsed under the first question from the prosecutor.',
          synonyms: 'unbelievable, unconvincing, far-fetched',
          antonyms: 'plausible, credible, believable',
        },
        {
          type: 'example',
          clue: "The lawyer's <em>____</em> swayed even the most skeptical jurors.",
          parts: ['de', 'clam', 'ation'],
          pos: 'n.',
          definition: 'A forceful and impassioned speech.',
          etymology: 'Latin <em>de-</em> (down, fully) + <em>clamare</em> (to cry out) + <em>-ation</em>',
          example: "The lawyer's <em>declamation</em> swayed even the most skeptical jurors.",
          synonyms: 'oration, address, speech',
          antonyms: 'silence, mumbling, restraint',
        },
      ],
    },
  ],
};

const raw = readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

if (!data.practice) {
  throw new Error('data.practice is missing');
}
for (const tier of ['easy', 'medium', 'hard']) {
  if (!Array.isArray(data.practice[tier])) {
    throw new Error(`data.practice.${tier} is not an array`);
  }
}

// Idempotency check: if practice.easy already has >= 3 puzzles, exit gracefully.
if (data.practice.easy.length >= 3) {
  console.log(
    `practice.easy already has ${data.practice.easy.length} puzzles; nothing to do. Exiting.`,
  );
  process.exit(0);
}

let puzzlesAdded = 0;
for (const tier of ['easy', 'medium', 'hard']) {
  const existingNames = new Set(data.practice[tier].map((p) => p.name));
  for (const puzzle of BATCH[tier]) {
    if (existingNames.has(puzzle.name)) {
      throw new Error(
        `practice.${tier} already contains a puzzle named "${puzzle.name}" — refusing to duplicate`,
      );
    }
    data.practice[tier].push(puzzle);
    puzzlesAdded += 1;
  }
}

writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(
  `Added ${puzzlesAdded} practice puzzles (2 per tier). ` +
    `practice.easy=${data.practice.easy.length}, ` +
    `practice.medium=${data.practice.medium.length}, ` +
    `practice.hard=${data.practice.hard.length}.`,
);
