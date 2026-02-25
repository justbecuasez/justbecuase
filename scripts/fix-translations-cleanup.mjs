/**
 * Post-fix cleanup script:
 * 1. Fix French elision errors (qu'bénévole → que bénévole, d'bénévole → de bénévole)
 * 2. Revert Urdu mixed-language strings (EN fallback + partial Urdu insertions → original EN)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, '..', 'app', '[lang]', 'dictionaries');

// ─── Fix French Elision ─────────────────────────────────────────────────────

console.log('🇫🇷 Fixing French elision errors...');
const frPath = join(dictDir, 'fr.json');
const fr = JSON.parse(readFileSync(frPath, 'utf-8'));

const frElisionFixes = [
  // Apostrophe elision should only happen before vowels/h muet
  // "bénévole" starts with 'b' (consonant) → no elision
  ["qu'bénévole", "que bénévole"],
  ["qu'Bénévole", "que Bénévole"],
  ["d'bénévole", "de bénévole"],
  ["d'Bénévole", "de Bénévole"],
  ["d'bénévoles", "de bénévoles"],
  ["d'Bénévoles", "de Bénévoles"],
  ["l'bénévole", "le bénévole"],
  ["l'Bénévole", "le Bénévole"],
  // Also fix double adjective issue: "bénévoles qualifiés qualifiés"
  ["bénévoles qualifiés qualifiés", "bénévoles qualifiés"],
  ["bénévole qualifié qualifié", "bénévole qualifié"],
];

let frChanges = 0;

function fixFrenchValues(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') {
      let result = value;
      for (const [find, replace] of frElisionFixes) {
        if (result.includes(find)) {
          result = result.split(find).join(replace);
        }
      }
      if (result !== value) {
        obj[key] = result;
        frChanges++;
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') {
          let result = value[i];
          for (const [find, replace] of frElisionFixes) {
            if (result.includes(find)) {
              result = result.split(find).join(replace);
            }
          }
          if (result !== value[i]) {
            value[i] = result;
            frChanges++;
          }
        } else if (typeof value[i] === 'object' && value[i] !== null) {
          fixFrenchValues(value[i], `${currentPath}[${i}]`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      fixFrenchValues(value, currentPath);
    }
  }
}

fixFrenchValues(fr);
writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf-8');
console.log(`  ✅ Fixed ${frChanges} French elision errors`);

// ─── Fix Urdu Mixed-Language Strings ─────────────────────────────────────────

console.log('\n🇵🇰 Fixing Urdu mixed-language strings...');
const urPath = join(dictDir, 'ur.json');
const enPath = join(dictDir, 'en.json');
const ur = JSON.parse(readFileSync(urPath, 'utf-8'));
const en = JSON.parse(readFileSync(enPath, 'utf-8'));

let urReverted = 0;
let urKept = 0;

// Check if a string is mostly English (has Latin chars and minimal Urdu/Arabic script)
function isMostlyEnglish(str) {
  const latinChars = (str.match(/[a-zA-Z]/g) || []).length;
  // Urdu/Arabic Unicode ranges: \u0600-\u06FF, \u0750-\u077F, \uFB50-\uFDFF, \uFE70-\uFEFF
  const urduChars = (str.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  // If there are more Latin chars than Urdu chars, it's mixed/English
  return latinChars > urduChars;
}

function revertMixedUrdu(urObj, enObj, path = '') {
  for (const [key, value] of Object.entries(urObj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.includes('ماہر رضاکار')) {
      // Check if this is a mixed-language string (mostly English with Urdu insertion)
      if (isMostlyEnglish(value) && enObj && enObj[key] !== undefined) {
        // Revert to original English
        urObj[key] = enObj[key];
        urReverted++;
      } else {
        urKept++;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const enSub = (enObj && typeof enObj[key] === 'object') ? enObj[key] : {};
      revertMixedUrdu(value, enSub, currentPath);
    } else if (Array.isArray(value)) {
      const enArr = (enObj && Array.isArray(enObj[key])) ? enObj[key] : [];
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && value[i].includes('ماہر رضاکار')) {
          if (isMostlyEnglish(value[i]) && enArr[i] !== undefined) {
            value[i] = enArr[i];
            urReverted++;
          } else {
            urKept++;
          }
        }
      }
    }
  }
}

revertMixedUrdu(ur, en);
writeFileSync(urPath, JSON.stringify(ur, null, 2) + '\n', 'utf-8');
console.log(`  ✅ Reverted ${urReverted} mixed-language strings to English originals`);
console.log(`  ✅ Kept ${urKept} proper Urdu translations with ماہر رضاکار`);

console.log('\n✨ Cleanup complete!');
