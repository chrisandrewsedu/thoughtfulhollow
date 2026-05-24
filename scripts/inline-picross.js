#!/usr/bin/env node
'use strict';
// Inlines sampler-picross.{engine,solver,generator,templates}.js into both
// sampler-picross.html and sampler-picross-author.html. Each module is wrapped
// in an IIFE so its top-level `const` declarations don't collide across blocks.
//
// Usage: node scripts/inline-picross.js

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wrap = (name) => '<script>\n(function(){\n'
  + fs.readFileSync(path.join(root, 'sampler-picross.' + name + '.js'), 'utf8')
  + '\n})();\n</script>';

// Inject the JSON library as a window-global so the browser-side templates
// wrapper has something to read. Must run BEFORE the templates module.
const libraryScript = () => {
  const json = fs.readFileSync(path.join(root, 'sampler-picross.templates.json'), 'utf8');
  return '<script>window.__PICROSS_LIBRARY__ = ' + json + ';</script>';
};

function inlineInto(file, modules) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf8');

  // Strategy: drop any existing <script>...</script> blocks that contain
  // 'PicrossEngine ' / 'PicrossSolver' / etc. as exports, then re-insert fresh
  // blocks right before the first remaining inline <script> (which is the
  // page's own boot script).

  // Find an anchor: the first <script> tag after </head> that contains
  // 'function boot' (the page-specific boot).
  const headEnd = html.indexOf('</head>');
  const bodyStart = html.indexOf('<body>', headEnd);
  const bootIdx = html.indexOf('function boot', bodyStart);
  if (bootIdx < 0) throw new Error('no boot script found in ' + file);
  const bootScriptStart = html.lastIndexOf('<script>', bootIdx);

  // Find the first script tag in body that is *not* the boot script — those
  // are existing inlined modules we want to replace.
  let firstScriptIdx = html.indexOf('<script>', bodyStart);
  // Inject the library JSON as a global before the templates module (only
  // for pages that include the templates module).
  const needsLibrary = modules.includes('templates');
  const moduleBlock = (needsLibrary ? libraryScript() + '\n' : '')
    + modules.map(wrap).join('\n');

  if (firstScriptIdx === bootScriptStart) {
    const before = html.slice(0, bootScriptStart);
    const after  = html.slice(bootScriptStart);
    html = before + moduleBlock + '\n' + after;
  } else {
    const before = html.slice(0, firstScriptIdx);
    const after  = html.slice(bootScriptStart);
    html = before + moduleBlock + '\n' + after;
  }

  fs.writeFileSync(fp, html);
  console.log('  ' + file + ' (' + html.length + ' bytes)');
}

console.log('Inlining picross modules into:');
inlineInto('sampler-picross.html',        ['engine', 'solver', 'generator', 'templates']);
inlineInto('sampler-picross-author.html', ['engine', 'solver', 'generator']);
inlineInto('sampler-picross-admin.html',  ['engine']);
// Archive uses the embedded library directly (no live server fetch), so it
// needs both the engine and the inlined templates JSON.
inlineInto('sampler-picross-archive.html', ['engine', 'templates']);
