"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), ".vercel", "output");

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let stat;
    try {
      stat = fs.lstatSync(full);
    } catch {
      continue;
    }
    visit(full, stat);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      walk(full, visit);
    }
  }
}

function flattenJunctions() {
  let changed = true;
  while (changed) {
    changed = false;
    const jobs = [];
    walk(root, (full, stat) => {
      if (stat.isSymbolicLink()) jobs.push(full);
    });
    for (const full of jobs) {
      let target;
      try {
        target = fs.realpathSync(full);
      } catch {
        continue;
      }
      if (!fs.existsSync(target) || path.resolve(target) === path.resolve(full)) {
        continue;
      }
      const targetStat = fs.statSync(target);
      fs.rmSync(full, { recursive: true, force: true });
      if (targetStat.isDirectory()) {
        fs.cpSync(target, full, { recursive: true, dereference: true });
      } else {
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.copyFileSync(target, full);
      }
      changed = true;
    }
  }
}

function flattenHardlinks() {
  walk(root, (full, stat) => {
    if (!stat.isFile() || stat.nlink <= 1) return;
    const buf = fs.readFileSync(full);
    fs.rmSync(full);
    fs.writeFileSync(full, buf);
  });
}

flattenJunctions();
flattenHardlinks();
console.log("flattened .vercel/output");
