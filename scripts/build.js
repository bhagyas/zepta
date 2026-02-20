#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'));
fs.copyFileSync(path.join(root, 'zepta.js'), path.join(dist, 'zepta.js'));

console.log('Built main.js and zepta.js into ./dist');
