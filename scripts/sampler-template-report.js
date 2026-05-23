'use strict';
// Authoring report (spec §9): run each template across a span of date
// seeds and report pass rate, solution-count distribution, and which
// rules most often over-constrain.
//   node scripts/sampler-template-report.js [days]   (default 365)
//   npm run sampler-report

const T = require('../sampler-next.templates.js');
const G = require('../sampler-next.generator.js');

const DAYS = parseInt(process.argv[2], 10) || 365;

function bar(n, max) { return '#'.repeat(Math.round((n / Math.max(max, 1)) * 32)); }

function reportTemplate(template) {
  console.log('\nTemplate: ' + template.id + '  (' + DAYS + ' day seeds from ' + G.LAUNCH_DATE + ')');

  let ok = 0;
  const failures = [];
  const countHist = {};
  for (let d = 0; d < DAYS; d++) {
    const dateStr = G.addDays(G.LAUNCH_DATE, d);
    const puzzle = G.generate(template, dateStr);
    if (puzzle) {
      ok++;
      const c = puzzle.analysis.count;
      countHist[c] = (countHist[c] || 0) + 1;
    } else {
      failures.push(dateStr);
    }
  }
  const pct = (100 * ok / DAYS).toFixed(1);
  console.log('  generated OK : ' + ok + ' / ' + DAYS + '  (' + pct + '%)');
  console.log('  failed       : ' + failures.length + ' / ' + DAYS);

  console.log('\n  Solution-count distribution (passing days):');
  const counts = Object.keys(countHist).map(Number).sort(function (a, b) { return a - b; });
  const maxBin = Math.max.apply(null, [0].concat(Object.values(countHist)));
  for (const c of counts) {
    console.log('    ' + String(c).padStart(2) + ' : ' + bar(countHist[c], maxBin) + ' ' + countHist[c]);
  }

  // Leave-one-out rule attribution on a sample of failing seeds: re-run
  // generation with each rule removed; a rule that unblocks the seed was
  // over-constraining for that seed.
  if (failures.length) {
    const sample = failures.slice(0, 12);
    console.log('\n  Rule attribution (leave-one-out on ' + sample.length + ' sampled failures):');
    const unblocks = {};
    for (const dateStr of sample) {
      for (const rk of template.ruleKeys) {
        const trimmed = Object.assign({}, template, {
          ruleKeys: template.ruleKeys.filter(function (k) { return k !== rk; }),
        });
        if (G.generate(trimmed, dateStr)) unblocks[rk] = (unblocks[rk] || 0) + 1;
      }
    }
    const ranked = Object.keys(unblocks).sort(function (a, b) { return unblocks[b] - unblocks[a]; });
    if (ranked.length === 0) {
      console.log('    (no single rule unblocks the sampled failures — likely under-constrained)');
    }
    for (const rk of ranked) {
      console.log('    ' + rk.padEnd(18) + ' rescued ' + unblocks[rk] + '/' + sample.length + ' sampled failures');
    }
  }
}

for (const t of T.TEMPLATES) reportTemplate(t);
console.log('');
