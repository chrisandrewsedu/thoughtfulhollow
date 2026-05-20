#!/usr/bin/env node
/**
 * add-batch-1.mjs
 *
 * One-shot, idempotent script to add Easy + Medium tiers to themes 1-4
 * (0-based indices) in glossari.json. Content is authored by the controller
 * for the Glossari difficulty tiers feature.
 *
 * Themes touched:
 *   - themes[1] "Mind & Motive"
 *   - themes[2] "Force & Form"
 *   - themes[3] "Power & Pretence"
 *   - themes[4] "Loss & Lack"
 *
 * Idempotent: if themes[1].tiers.easy already exists, exit without rewriting.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '..', 'glossari.json');

const BATCH = {
  1: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'Having no thought; acting without considering consequences.',
          parts: ['un', 'think', 'ing'],
          pos: 'adj.',
          definition: 'Having no thought; acting without considering consequences.',
          etymology: '<em>un-</em> (not) + <em>think</em> + <em>-ing</em>',
          example: 'His <em>unthinking</em> remark hurt her feelings before he realized what he had said.',
          synonyms: 'thoughtless, impulsive, careless',
          antonyms: 'thoughtful, deliberate, mindful',
        },
        {
          type: 'synonym',
          clue: 'fantasizer, idler, woolgatherer',
          parts: ['day', 'dream', 'er'],
          pos: 'n.',
          definition: 'A person who indulges in idle or pleasant fantasies.',
          etymology: '<em>day</em> + <em>dream</em> + <em>-er</em> (one who)',
          example: "The teacher called on the <em>daydreamer</em> by the window, who hadn't heard a word.",
          synonyms: 'fantasizer, idler, woolgatherer',
          antonyms: 'realist, doer, pragmatist',
        },
        {
          type: 'antonym',
          clue: 'thoughtlessness, carelessness, rashness',
          parts: ['mind', 'ful', 'ness'],
          pos: 'n.',
          definition: 'The quality of paying full attention to the present moment.',
          etymology: '<em>mind</em> + <em>-ful</em> (full of) + <em>-ness</em>',
          example: 'Her <em>mindfulness</em> in handling the fragile heirloom impressed her grandmother.',
          synonyms: 'attentiveness, awareness, care',
          antonyms: 'thoughtlessness, carelessness, rashness',
        },
        {
          type: 'example',
          clue: 'The <em>____</em> investor refused to invest without proof of every claim.',
          parts: ['dis', 'trust', 'ful'],
          pos: 'adj.',
          definition: 'Unable or unwilling to trust; suspicious.',
          etymology: '<em>dis-</em> (not) + <em>trust</em> + <em>-ful</em>',
          example: 'The <em>distrustful</em> investor refused to invest without proof of every claim.',
          synonyms: 'suspicious, wary, doubtful',
          antonyms: 'trusting, confident, credulous',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: "The act of examining one's own thoughts and feelings.",
          parts: ['intro', 'spect', 'ion'],
          pos: 'n.',
          definition: "The act of examining one's own thoughts and feelings.",
          etymology: 'Latin <em>intro-</em> (within) + <em>spectare</em> (to look) + <em>-ion</em>',
          example: 'After the failed exam, he spent the evening in quiet <em>introspection</em>.',
          synonyms: 'self-examination, reflection, soul-searching',
          antonyms: 'thoughtlessness, distraction, oblivion',
        },
        {
          type: 'synonym',
          clue: 'unwilling, hesitant, disinclined',
          parts: ['re', 'luct', 'ant'],
          pos: 'adj.',
          definition: 'Unwilling and hesitant; disinclined to act.',
          etymology: 'Latin <em>re-</em> (against) + <em>luctari</em> (to struggle) + <em>-ant</em>',
          example: 'She gave a <em>reluctant</em> nod when asked to chair the committee.',
          synonyms: 'unwilling, hesitant, disinclined',
          antonyms: 'eager, willing, enthusiastic',
        },
        {
          type: 'antonym',
          clue: 'flexible, agreeable, yielding',
          parts: ['ob', 'stin', 'ate'],
          pos: 'adj.',
          definition: "Stubbornly refusing to change one's opinion or course of action.",
          etymology: 'Latin <em>ob-</em> (against) + <em>stare</em> (to stand) + <em>-ate</em>',
          example: 'The <em>obstinate</em> child folded her arms and refused to eat a single vegetable.',
          synonyms: 'stubborn, intransigent, headstrong',
          antonyms: 'flexible, agreeable, yielding',
        },
        {
          type: 'example',
          clue: 'Her <em>____</em> to volunteer for hard tasks impressed her supervisor.',
          parts: ['de', 'termin', 'ation'],
          pos: 'n.',
          definition: 'Firmness of purpose; resolute decision-making.',
          etymology: 'Latin <em>de-</em> (down, completely) + <em>terminus</em> (boundary) + <em>-ation</em>',
          example: 'Her <em>determination</em> to volunteer for hard tasks impressed her supervisor.',
          synonyms: 'resolve, tenacity, drive',
          antonyms: 'hesitation, irresolution, apathy',
        },
      ],
    },
  },
  2: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of making something stronger or firmer.',
          parts: ['strength', 'en', 'ing'],
          pos: 'n.',
          definition: 'The act or process of making something stronger or more firm.',
          etymology: '<em>strength</em> + <em>-en</em> (make) + <em>-ing</em>',
          example: 'The bridge needed <em>strengthening</em> before the heavy trucks could cross.',
          synonyms: 'fortification, reinforcement, hardening',
          antonyms: 'weakening, softening, undermining',
        },
        {
          type: 'synonym',
          clue: 'unyielding, stiff, rigid',
          parts: ['un', 'bend', 'ing'],
          pos: 'adj.',
          definition: 'Not bending or yielding; rigid in attitude or position.',
          etymology: '<em>un-</em> (not) + <em>bend</em> + <em>-ing</em>',
          example: "The judge's <em>unbending</em> rule meant the case was decided in minutes.",
          synonyms: 'unyielding, stiff, rigid',
          antonyms: 'flexible, accommodating, yielding',
        },
        {
          type: 'antonym',
          clue: 'flexible, bendy, fragile',
          parts: ['un', 'break', 'able'],
          pos: 'adj.',
          definition: 'Not able to be broken; extremely durable.',
          etymology: '<em>un-</em> (not) + <em>break</em> + <em>-able</em>',
          example: 'She bought an <em>unbreakable</em> case for the phone she kept dropping.',
          synonyms: 'indestructible, durable, sturdy',
          antonyms: 'fragile, breakable, delicate',
        },
        {
          type: 'example',
          clue: 'The careful <em>____</em> turned scraps of wood into a fine chair.',
          parts: ['work', 'man', 'ship'],
          pos: 'n.',
          definition: 'The degree of skill or care shown in making something.',
          etymology: '<em>work</em> + <em>man</em> + <em>-ship</em> (skill, quality)',
          example: 'The careful <em>workmanship</em> turned scraps of wood into a fine chair.',
          synonyms: 'craftsmanship, artistry, skill',
          antonyms: 'sloppiness, carelessness, shoddiness',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The act of making something plain by giving more detail.',
          parts: ['clari', 'fic', 'ation'],
          pos: 'n.',
          definition: 'The act of making something clearer or easier to understand.',
          etymology: 'Latin <em>clarus</em> (clear) + <em>facere</em> (to make) + <em>-ation</em>',
          example: 'The diplomat requested <em>clarification</em> on the wording of the treaty.',
          synonyms: 'explanation, elucidation, exposition',
          antonyms: 'confusion, obfuscation, muddling',
        },
        {
          type: 'synonym',
          clue: 'stubborn, immovable, firm',
          parts: ['in', 'flex', 'ible'],
          pos: 'adj.',
          definition: 'Unwilling to change or compromise; rigid.',
          etymology: 'Latin <em>in-</em> (not) + <em>flectere</em> (to bend) + <em>-ible</em>',
          example: 'The bureaucracy proved <em>inflexible</em>, refusing to make even one small exception.',
          synonyms: 'rigid, unyielding, intransigent',
          antonyms: 'flexible, adaptable, yielding',
        },
        {
          type: 'antonym',
          clue: 'yielding, pliant, agreeable',
          parts: ['ob', 'du', 'rate'],
          pos: 'adj.',
          definition: "Stubbornly refusing to change one's opinion or course of action.",
          etymology: 'Latin <em>ob-</em> (against) + <em>durus</em> (hard) + <em>-ate</em>',
          example: 'Despite hours of pleading, the <em>obdurate</em> landlord refused to lower the rent.',
          synonyms: 'stubborn, unyielding, intransigent',
          antonyms: 'yielding, pliant, agreeable',
        },
        {
          type: 'example',
          clue: "The mayor's public <em>____</em> of the new park's opening drew a crowd of hundreds.",
          parts: ['pro', 'clam', 'ation'],
          pos: 'n.',
          definition: 'An official public announcement.',
          etymology: 'Latin <em>pro-</em> (forth) + <em>clamare</em> (to cry out) + <em>-ation</em>',
          example: "The mayor's public <em>proclamation</em> of the new park's opening drew a crowd of hundreds.",
          synonyms: 'declaration, announcement, pronouncement',
          antonyms: 'concealment, silence, suppression',
        },
      ],
    },
  },
  3: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: "Going beyond what is fair or right; exceeding one's authority.",
          parts: ['over', 'reach', 'ing'],
          pos: 'adj.',
          definition: 'Going beyond what is appropriate, sensible, or allowed.',
          etymology: '<em>over-</em> (beyond) + <em>reach</em> + <em>-ing</em>',
          example: "The principal's <em>overreaching</em> new dress code drew protest from parents and students alike.",
          synonyms: 'presumptuous, overbearing, excessive',
          antonyms: 'restrained, modest, fair',
        },
        {
          type: 'synonym',
          clue: 'rude, impudent, insolent',
          parts: ['dis', 'respect', 'ful'],
          pos: 'adj.',
          definition: 'Showing a lack of respect or courtesy.',
          etymology: '<em>dis-</em> (not) + <em>respect</em> + <em>-ful</em>',
          example: 'His <em>disrespectful</em> tone during the meeting cost him the promotion.',
          synonyms: 'rude, impudent, insolent',
          antonyms: 'respectful, courteous, deferential',
        },
        {
          type: 'antonym',
          clue: 'loyal, devoted, true',
          parts: ['un', 'faith', 'ful'],
          pos: 'adj.',
          definition: "Not loyal or trustworthy; failing to keep one's word.",
          etymology: '<em>un-</em> (not) + <em>faith</em> + <em>-ful</em>',
          example: "The <em>unfaithful</em> steward sold his master's secrets for a bag of gold.",
          synonyms: 'disloyal, treacherous, false',
          antonyms: 'loyal, devoted, true',
        },
        {
          type: 'example',
          clue: "The peasants groaned under the king's <em>____</em>, which left them with nothing.",
          parts: ['self', 'ish', 'ness'],
          pos: 'n.',
          definition: "Concern only for one's own well-being, without regard for others.",
          etymology: '<em>self</em> + <em>-ish</em> (having the character of) + <em>-ness</em>',
          example: "The peasants groaned under the king's <em>selfishness</em>, which left them with nothing.",
          synonyms: 'greed, self-interest, egoism',
          antonyms: 'generosity, selflessness, altruism',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'Dishonest or fraudulent conduct, especially by those in power.',
          parts: ['cor', 'rupt', 'ion'],
          pos: 'n.',
          definition: 'Dishonest or fraudulent conduct by those in power, typically for personal gain.',
          etymology: 'Latin <em>cor-</em> (variant of <em>con-</em>, thoroughly) + <em>rumpere</em> (to break) + <em>-ion</em>',
          example: 'A long investigation finally exposed the <em>corruption</em> at the heart of city hall.',
          synonyms: 'graft, dishonesty, malfeasance',
          antonyms: 'integrity, honesty, probity',
        },
        {
          type: 'synonym',
          clue: 'excessively eager to please, fawning, servile',
          parts: ['sub', 'serv', 'ient'],
          pos: 'adj.',
          definition: 'Prepared to obey others unquestioningly; excessively willing to serve.',
          etymology: 'Latin <em>sub-</em> (under) + <em>servire</em> (to serve) + <em>-ient</em>',
          example: 'The minister grew weary of the <em>subservient</em> aides who agreed with his every word.',
          synonyms: 'obsequious, deferential, servile',
          antonyms: 'domineering, defiant, assertive',
        },
        {
          type: 'antonym',
          clue: 'sincere, genuine, candid',
          parts: ['pre', 'tens', 'ious'],
          pos: 'adj.',
          definition: 'Attempting to appear more important or impressive than one really is.',
          etymology: 'Latin <em>prae-</em> (before, in front of) + <em>tendere</em> (to stretch) + <em>-ious</em>',
          example: 'Her <em>pretentious</em> use of obscure French phrases impressed no one at the table.',
          synonyms: 'affected, showy, ostentatious',
          antonyms: 'sincere, genuine, candid',
        },
        {
          type: 'example',
          clue: "The aide's <em>____</em> nods to every comment annoyed everyone else in the room.",
          parts: ['def', 'er', 'ential'],
          pos: 'adj.',
          definition: 'Showing excessive respect or submission to authority.',
          etymology: 'Latin <em>de-</em> (down) + <em>ferre</em> (to bear, carry) + <em>-ential</em>',
          example: "The aide's <em>deferential</em> nods to every comment annoyed everyone else in the room.",
          synonyms: 'respectful, submissive, obsequious',
          antonyms: 'disrespectful, defiant, contemptuous',
        },
      ],
    },
  },
  4: {
    easy: {
      sets: [
        {
          type: 'definition',
          clue: 'The state of having no home.',
          parts: ['home', 'less', 'ness'],
          pos: 'n.',
          definition: 'The condition of having no place to live.',
          etymology: '<em>home</em> + <em>-less</em> (without) + <em>-ness</em>',
          example: 'The new shelter was built to ease <em>homelessness</em> in the harshest winter months.',
          synonyms: 'vagrancy, destitution, displacement',
          antonyms: 'shelter, housing, dwelling',
        },
        {
          type: 'synonym',
          clue: 'missing, gone, not to be found',
          parts: ['un', 'avail', 'able'],
          pos: 'adj.',
          definition: 'Not able to be obtained, used, or reached.',
          etymology: '<em>un-</em> (not) + <em>avail</em> (be of use) + <em>-able</em>',
          example: 'The book she needed was <em>unavailable</em> at every library in town.',
          synonyms: 'missing, gone, inaccessible',
          antonyms: 'available, present, accessible',
        },
        {
          type: 'antonym',
          clue: 'complete, done, accomplished',
          parts: ['un', 'finish', 'ed'],
          pos: 'adj.',
          definition: 'Not yet completed; left incomplete.',
          etymology: '<em>un-</em> (not) + <em>finish</em> + <em>-ed</em>',
          example: 'She left the painting <em>unfinished</em> when she ran out of canvas.',
          synonyms: 'incomplete, partial, undone',
          antonyms: 'complete, done, accomplished',
        },
        {
          type: 'example',
          clue: 'After weeks of looking, the search seemed <em>____</em>.',
          parts: ['over', 'whelm', 'ing'],
          pos: 'adj.',
          definition: 'Too great in amount or intensity to manage or resist.',
          etymology: '<em>over-</em> (too much) + <em>whelm</em> (cover, bury) + <em>-ing</em>',
          example: 'After weeks of looking, the search seemed <em>overwhelming</em>.',
          synonyms: 'crushing, daunting, immense',
          antonyms: 'manageable, slight, trivial',
        },
      ],
    },
    medium: {
      sets: [
        {
          type: 'definition',
          clue: 'The state of being without something basic that one needs.',
          parts: ['de', 'priv', 'ation'],
          pos: 'n.',
          definition: 'The lack or denial of something considered a necessity.',
          etymology: 'Latin <em>de-</em> (away) + <em>privare</em> (to deprive) + <em>-ation</em>',
          example: 'Months of sleep <em>deprivation</em> left her foggy and irritable.',
          synonyms: 'privation, want, lack',
          antonyms: 'abundance, fulfillment, plenty',
        },
        {
          type: 'synonym',
          clue: 'broke, penniless, impoverished',
          parts: ['de', 'sti', 'tute'],
          pos: 'adj.',
          definition: 'Extremely poor; lacking the basic means of subsistence.',
          etymology: 'Latin <em>de-</em> (away) + <em>statuere</em> (to set, place) + <em>-tute</em>',
          example: 'The war left thousands of families <em>destitute</em> and without shelter.',
          synonyms: 'impoverished, indigent, penniless',
          antonyms: 'wealthy, affluent, prosperous',
        },
        {
          type: 'antonym',
          clue: 'abundant, plentiful, ample',
          parts: ['in', 'suffic', 'ient'],
          pos: 'adj.',
          definition: 'Not enough to meet a need; lacking in quantity.',
          etymology: 'Latin <em>in-</em> (not) + <em>sufficere</em> (to suffice) + <em>-ient</em>',
          example: 'The harvest was <em>insufficient</em> to feed the village through the winter.',
          synonyms: 'inadequate, scant, deficient',
          antonyms: 'abundant, plentiful, ample',
        },
        {
          type: 'example',
          clue: 'The drought caused great <em>____</em> in the village.',
          parts: ['mal', 'nutri', 'tion'],
          pos: 'n.',
          definition: 'Lack of proper nutrition due to insufficient or improper food.',
          etymology: 'Latin <em>malus</em> (bad) + <em>nutrire</em> (to nourish) + <em>-tion</em>',
          example: 'The drought caused great <em>malnutrition</em> in the village.',
          synonyms: 'starvation, undernourishment, famine',
          antonyms: 'nourishment, satiety, well-fed',
        },
      ],
    },
  },
};

const raw = readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

// Idempotency check: if themes[1].tiers.easy already exists, exit gracefully.
if (data.themes?.[1]?.tiers?.easy) {
  console.log('themes[1].tiers.easy already present; nothing to do. Exiting.');
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
console.log(`Added ${blocksAdded} tier blocks across themes 1-4.`);
