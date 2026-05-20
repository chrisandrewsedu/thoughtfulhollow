// scripts/migrate-glossari-json.mjs
// One-shot migration: glossari.json flat array → { themes, practice }.
// Run once: `node scripts/migrate-glossari-json.mjs`.
// Committed for posterity / repeatability.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(here, '..', 'glossari.json');

const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));

if (!Array.isArray(raw)) {
  if (raw && raw.themes && raw.practice) {
    console.log('glossari.json already in new shape; nothing to do.');
    process.exit(0);
  }
  throw new Error('Unexpected glossari.json shape: expected top-level array.');
}

// Validate each existing puzzle has exactly 4 sets and each set has 3 parts.
for (const [i, p] of raw.entries()) {
  if (!p.name) throw new Error(`Puzzle ${i} missing name`);
  if (!Array.isArray(p.sets) || p.sets.length !== 4) {
    throw new Error(`Puzzle ${i} (${p.name}) does not have exactly 4 sets`);
  }
  for (const [si, s] of p.sets.entries()) {
    if (!Array.isArray(s.parts) || s.parts.length !== 3) {
      throw new Error(`Puzzle ${i} (${p.name}) set ${si} parts.length !== 3`);
    }
  }
}

// Seed Easy + Medium variants for theme #1 only ("Fault & Faithlessness"),
// so end-to-end tier flow is testable before bulk content authoring (Task 13).
const seededEasyTheme1 = {
  sets: [
    {
      type: 'definition',
      clue: 'Not honest; tending to mislead or trick.',
      parts: ['un', 'truth', 'ful'],
      pos: 'adj.',
      definition: 'Not honest; tending to mislead or trick.',
      etymology: '<em>un-</em> (not) + <em>truth</em> + <em>-ful</em> (full of)',
      example: 'The <em>untruthful</em> witness changed her story three times.',
      synonyms: 'dishonest, deceitful, lying',
      antonyms: 'honest, truthful, candid'
    },
    {
      type: 'synonym',
      clue: 'deceptive, dishonest, two-faced',
      parts: ['mis', 'lead', 'ing'],
      pos: 'adj.',
      definition: 'Giving a wrong idea or false impression.',
      etymology: '<em>mis-</em> (wrongly) + <em>lead</em> + <em>-ing</em>',
      example: 'The label was <em>misleading</em> — the cereal had far more sugar than it claimed.',
      synonyms: 'deceptive, confusing, false',
      antonyms: 'clear, honest, accurate'
    },
    {
      type: 'antonym',
      clue: 'loyal, dependable, faithful',
      parts: ['un', 'reli', 'able'],
      pos: 'adj.',
      definition: 'Not able to be trusted or depended on.',
      etymology: '<em>un-</em> (not) + <em>rely</em> + <em>-able</em> (capable of)',
      example: 'The old car was too <em>unreliable</em> for long trips.',
      synonyms: 'untrustworthy, undependable, flaky',
      antonyms: 'reliable, trustworthy, dependable'
    },
    {
      type: 'example',
      clue: 'The thief gave a <em>____</em> excuse the guard immediately doubted.',
      parts: ['dis', 'hon', 'est'],
      pos: 'adj.',
      definition: 'Not telling the truth; willing to lie or cheat.',
      etymology: '<em>dis-</em> (not) + <em>honest</em>',
      example: 'The thief gave a <em>dishonest</em> excuse the guard immediately doubted.',
      synonyms: 'untruthful, deceitful, lying',
      antonyms: 'honest, truthful, sincere'
    }
  ]
};

const seededMediumTheme1 = {
  sets: [
    {
      type: 'definition',
      clue: 'Acting against one\'s faith or loyalty; betraying trust.',
      parts: ['be', 'tray', 'al'],
      pos: 'n.',
      definition: 'The act of being disloyal to a person, country, or cause.',
      etymology: '<em>be-</em> (thoroughly) + Old French <em>trair</em> (to hand over) + <em>-al</em>',
      example: 'His <em>betrayal</em> of the team\'s strategy cost them the match.',
      synonyms: 'treachery, disloyalty, double-cross',
      antonyms: 'loyalty, allegiance, fidelity'
    },
    {
      type: 'synonym',
      clue: 'two-faced, double-dealing',
      parts: ['du', 'plic', 'itous'],
      pos: 'adj.',
      definition: 'Deceitful; saying one thing while meaning another.',
      etymology: 'Latin <em>duplex</em> (twofold) + <em>-itous</em>',
      example: 'The <em>duplicitous</em> diplomat agreed in public and undermined the treaty in private.',
      synonyms: 'two-faced, deceitful, treacherous',
      antonyms: 'straightforward, sincere, candid'
    },
    {
      type: 'antonym',
      clue: 'loyal, honorable, principled',
      parts: ['un', 'scru', 'pulous'],
      pos: 'adj.',
      definition: 'Without moral principles; willing to do wrong for gain.',
      etymology: '<em>un-</em> (not) + Latin <em>scrupulus</em> (small sharp stone, scruple) + <em>-ous</em>',
      example: 'The <em>unscrupulous</em> banker hid losses from his clients for years.',
      synonyms: 'dishonorable, unethical, unprincipled',
      antonyms: 'principled, honorable, scrupulous'
    },
    {
      type: 'example',
      clue: 'The <em>____</em> spy passed his country\'s secrets to a foreign agent.',
      parts: ['trai', 'tor', 'ous'],
      pos: 'adj.',
      definition: 'Behaving as a traitor; disloyal to one\'s country or cause.',
      etymology: 'Old French <em>traitre</em> (traitor) + <em>-ous</em>',
      example: 'The <em>traitorous</em> spy passed his country\'s secrets to a foreign agent.',
      synonyms: 'treasonous, disloyal, faithless',
      antonyms: 'loyal, faithful, patriotic'
    }
  ]
};

// Seed one practice puzzle per tier — minimum to test Practice mode end-to-end.
// (Full pool of 3 per tier is authored in Task 13.)
const seededPracticeEasy = [
  {
    name: 'Practice — Helpers',
    sets: [
      {
        type: 'definition',
        clue: 'Putting others\' needs before your own; not selfish.',
        parts: ['un', 'self', 'ish'],
        pos: 'adj.',
        definition: 'Putting others\' needs before your own; not selfish.',
        etymology: '<em>un-</em> (not) + <em>self</em> + <em>-ish</em> (having the character of)',
        example: 'Her <em>unselfish</em> decision to share gave everyone a turn.',
        synonyms: 'generous, considerate, altruistic',
        antonyms: 'selfish, self-centered, greedy'
      },
      {
        type: 'synonym', clue: 'kind, caring, considerate',
        parts: ['thought', 'ful', 'ness'], pos: 'n.',
        definition: 'The quality of caring about others\' feelings or needs.',
        etymology: '<em>thought</em> + <em>-ful</em> + <em>-ness</em>',
        example: 'Her <em>thoughtfulness</em> showed in every small gesture.',
        synonyms: 'kindness, consideration, care',
        antonyms: 'thoughtlessness, indifference, neglect'
      },
      {
        type: 'antonym', clue: 'cruel, harsh, hostile',
        parts: ['friend', 'li', 'ness'], pos: 'n.',
        definition: 'The quality of being kind and pleasant to others.',
        etymology: '<em>friend</em> + <em>-ly</em> + <em>-ness</em>',
        example: 'The town was known for the <em>friendliness</em> of its people.',
        synonyms: 'warmth, kindness, amiability',
        antonyms: 'hostility, coldness, unfriendliness'
      },
      {
        type: 'example', clue: 'She gave a <em>____</em> reply to every question, no matter how rude.',
        parts: ['re', 'spect', 'ful'], pos: 'adj.',
        definition: 'Showing politeness and consideration for others.',
        etymology: '<em>re-</em> (back) + Latin <em>spectus</em> (looked at) + <em>-ful</em>',
        example: 'She gave a <em>respectful</em> reply to every question, no matter how rude.',
        synonyms: 'polite, courteous, civil',
        antonyms: 'rude, disrespectful, impertinent'
      }
    ]
  }
];

const seededPracticeMedium = [
  {
    name: 'Practice — Vision',
    sets: [
      {
        type: 'definition',
        clue: 'Foretelling future events; like a prophet.',
        parts: ['pro', 'phet', 'ic'],
        pos: 'adj.',
        definition: 'Accurately predicting or foretelling future events.',
        etymology: 'Greek <em>pro-</em> (before) + <em>phētēs</em> (one who speaks) + <em>-ic</em>',
        example: 'Her warning about the storm proved <em>prophetic</em> — it struck within the hour.',
        synonyms: 'predictive, foretelling, oracular',
        antonyms: 'mundane, ignorant, blind'
      },
      {
        type: 'synonym',
        clue: 'foreknowing, anticipatory, far-sighted',
        parts: ['pre', 'sci', 'ent'],
        pos: 'adj.',
        definition: 'Having or showing knowledge of events before they take place.',
        etymology: 'Latin <em>prae-</em> (before) + <em>scire</em> (to know) + <em>-ent</em>',
        example: 'His <em>prescient</em> warning saved the expedition from disaster.',
        synonyms: 'foreknowing, anticipatory, far-sighted',
        antonyms: 'unaware, oblivious, shortsighted'
      },
      {
        type: 'antonym', clue: 'blind, unaware, ignorant',
        parts: ['per', 'cept', 'ive'], pos: 'adj.',
        definition: 'Quick to notice or understand things.',
        etymology: 'Latin <em>per-</em> (through) + <em>capere</em> (to take) + <em>-ive</em>',
        example: 'A <em>perceptive</em> reader will catch the joke on first read.',
        synonyms: 'astute, observant, discerning',
        antonyms: 'oblivious, dull, unobservant'
      },
      {
        type: 'example', clue: 'The <em>____</em> general spotted the ambush before his scouts did.',
        parts: ['vi', 'gil', 'ant'], pos: 'adj.',
        definition: 'Keeping careful watch for possible danger.',
        etymology: 'Latin <em>vigil</em> (awake) + <em>-ant</em>',
        example: 'The <em>vigilant</em> general spotted the ambush before his scouts did.',
        synonyms: 'watchful, alert, attentive',
        antonyms: 'careless, inattentive, lax'
      }
    ]
  }
];

const seededPracticeHard = [
  {
    name: 'Practice — Concord',
    sets: [
      {
        type: 'definition', clue: 'Tending toward harmony or peaceful agreement.',
        parts: ['con', 'cili', 'atory'], pos: 'adj.',
        definition: 'Intended to placate or reconcile; meant to win goodwill.',
        etymology: 'Latin <em>conciliare</em> (to unite) + <em>-atory</em>',
        example: 'Her <em>conciliatory</em> tone defused the standoff in the boardroom.',
        synonyms: 'placating, peacemaking, mollifying',
        antonyms: 'antagonistic, hostile, provocative'
      },
      {
        type: 'synonym', clue: 'agreement, harmony, concord',
        parts: ['ac', 'cord', 'ance'], pos: 'n.',
        definition: 'A state of agreement or conformity.',
        etymology: 'Old French <em>acorder</em> (to agree) + <em>-ance</em>',
        example: 'The judgment was rendered in <em>accordance</em> with established precedent.',
        synonyms: 'conformity, agreement, harmony',
        antonyms: 'discord, conflict, disagreement'
      },
      {
        type: 'antonym', clue: 'discordant, quarrelsome, contentious',
        parts: ['har', 'moni', 'ous'], pos: 'adj.',
        definition: 'Free from conflict; pleasingly consistent.',
        etymology: 'Greek <em>harmonia</em> (joining, agreement) + <em>-ous</em>',
        example: 'The choir produced a <em>harmonious</em> blend few ensembles could match.',
        synonyms: 'concordant, peaceful, melodious',
        antonyms: 'discordant, jarring, contentious'
      },
      {
        type: 'example', clue: 'After hours of negotiation, the two factions reached a <em>____</em> settlement.',
        parts: ['con', 'sens', 'ual'], pos: 'adj.',
        definition: 'Reached by general agreement of those involved.',
        etymology: 'Latin <em>consensus</em> (agreement) + <em>-ual</em>',
        example: 'After hours of negotiation, the two factions reached a <em>consensual</em> settlement.',
        synonyms: 'agreed-upon, mutual, concordant',
        antonyms: 'unilateral, imposed, contested'
      }
    ]
  }
];

const migrated = {
  themes: raw.map((p, i) => {
    const tiers = { hard: { sets: p.sets } };
    if (i === 0) {
      tiers.easy = seededEasyTheme1;
      tiers.medium = seededMediumTheme1;
    }
    return { name: p.name, tiers };
  }),
  practice: {
    easy: seededPracticeEasy,
    medium: seededPracticeMedium,
    hard: seededPracticeHard
  }
};

writeFileSync(jsonPath, JSON.stringify(migrated, null, 2) + '\n');
console.log(`Migrated ${raw.length} themes; seeded easy+medium for theme 0 and 1 practice puzzle per tier.`);
