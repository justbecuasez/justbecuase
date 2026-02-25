/**
 * Comprehensive translation quality fix script
 * Fixes literal/transliterated terms across all language files:
 * 1. "Impact Agent" → natural native terms in each language
 * 2. Tamil hero.possible brand fix
 * 3. Hindi "Browse" transliteration fix
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, '..', 'app', '[lang]', 'dictionaries');

// ─── Replacement Definitions ────────────────────────────────────────────────

const languageFixes = {
  hi: {
    file: 'hi.json',
    label: 'Hindi',
    // Ordered: longest match first to avoid partial replacements
    stringReplacements: [
      // Impact Agent transliteration (इम्पैक्ट एजेंट) → प्रभाव कर्ता (impact maker)
      // Plural oblique first
      ["इम्पैक्ट एजेंटों", "प्रभाव कर्ताओं"],
      ["इम्पैक्ट एजेंट", "प्रभाव कर्ता"],
      // Browse verb phrase → View/Explore
      ["ब्राउज़ करें", "देखें"],
    ],
    keyOverrides: {}
  },

  pa: {
    file: 'pa.json',
    label: 'Punjabi',
    stringReplacements: [
      // Literal "prabhaav ejant" forms - plural first
      ["ਪ੍ਰਭਾਵ ਏਜੰਟਾਂ", "ਪ੍ਰਭਾਵ ਕਰਤਿਆਂ"],
      ["ਪ੍ਰਭਾਵ ਏਜੰਟ", "ਪ੍ਰਭਾਵ ਕਰਤਾ"],
      // Transliterated "impact ejant" forms - plural first
      ["ਇੰਪੈਕਟ ਏਜੰਟਾਂ", "ਪ੍ਰਭਾਵ ਕਰਤਿਆਂ"],
      ["ਇੰਪੈਕਟ ਏਜੰਟ", "ਪ੍ਰਭਾਵ ਕਰਤਾ"],
    ],
    keyOverrides: {}
  },

  fr: {
    file: 'fr.json',
    label: 'French',
    stringReplacements: [
      // French literal "agent d'impact" → "bénévole qualifié" (qualified volunteer)
      // Plural before singular, both case variants
      ["agents d'impact", "bénévoles qualifiés"],
      ["Agents d'impact", "Bénévoles qualifiés"],
      ["agent d'impact", "bénévole qualifié"],
      ["Agent d'impact", "Bénévole qualifié"],
    ],
    keyOverrides: {}
  },

  ta: {
    file: 'ta.json',
    label: 'Tamil',
    stringReplacements: [
      // Tamil agglutinative case forms - longest suffix first
      // "தாக்க ஏஜெண்டு..." → "தாக்க நிபுணர்..."
      ["தாக்க ஏஜெண்டுகளிடமிருந்து", "தாக்க நிபுணர்களிடமிருந்து"],  // from (ablative)
      ["தாக்க ஏஜெண்டுகளுக்கு", "தாக்க நிபுணர்களுக்கு"],            // for (dative)
      ["தாக்க ஏஜெண்டுகளுடன்", "தாக்க நிபுணர்களுடன்"],              // with (comitative)
      ["தாக்க ஏஜெண்டுகளையும்", "தாக்க நிபுணர்களையும்"],            // also+obj
      ["தாக்க ஏஜெண்டுகளை", "தாக்க நிபுணர்களை"],                    // obj (accusative pl.)
      ["தாக்க ஏஜெண்டுகள்", "தாக்க நிபுணர்கள்"],                    // plural
      ["தாக்க ஏஜெண்டாக", "தாக்க நிபுணராக"],                        // as (essive)
      ["தாக்க ஏஜெண்டை", "தாக்க நிபுணரை"],                          // obj (accusative sg.)
      ["தாக்க ஏஜெண்ட்", "தாக்க நிபுணர்"],                          // singular base
    ],
    keyOverrides: {
      // Brand fix: "Mission POSSIBLE" → "அசாத்தியம்" (extraordinary/impossible)
      // The brand concept is "making the impossible possible"
      "hero.possible": "அசாத்தியம்"
    }
  },

  ur: {
    file: 'ur.json',
    label: 'Urdu',
    stringReplacements: [
      // English "Impact Agent(s)" left untranslated → ماہر رضاکار (skilled volunteer)
      ["Impact Agents", "ماہر رضاکار"],
      ["Impact Agent", "ماہر رضاکار"],
      ["impact agents", "ماہر رضاکار"],
      ["impact agent", "ماہر رضاکار"],
    ],
    keyOverrides: {}
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function applyStringReplacements(value, replacements) {
  let result = value;
  let changeCount = 0;
  for (const [find, replace] of replacements) {
    if (result.includes(find)) {
      const before = result;
      // Replace ALL occurrences
      result = result.split(find).join(replace);
      if (result !== before) changeCount++;
    }
  }
  return { result, changeCount };
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return false;
    current = current[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  if (lastKey in current) {
    const old = current[lastKey];
    current[lastKey] = value;
    return old !== value;
  }
  return false;
}

function walkAndReplace(obj, replacements, path = '', changes = []) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') {
      const { result, changeCount } = applyStringReplacements(value, replacements);
      if (changeCount > 0) {
        changes.push({ key: currentPath, old: value, new: result });
        obj[key] = result;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      walkAndReplace(value, replacements, currentPath, changes);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') {
          const { result, changeCount } = applyStringReplacements(value[i], replacements);
          if (changeCount > 0) {
            changes.push({ key: `${currentPath}[${i}]`, old: value[i], new: result });
            value[i] = result;
          }
        } else if (typeof value[i] === 'object' && value[i] !== null) {
          walkAndReplace(value[i], replacements, `${currentPath}[${i}]`, changes);
        }
      }
    }
  }
  return changes;
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('🌍 Translation Quality Fix Script');
console.log('='.repeat(60));

let totalChanges = 0;

for (const [lang, config] of Object.entries(languageFixes)) {
  const filePath = join(dictDir, config.file);
  console.log(`\n📝 ${config.label} (${config.file})`);
  console.log('-'.repeat(40));

  let dict;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    dict = JSON.parse(raw);
  } catch (err) {
    console.log(`  ❌ Error reading file: ${err.message}`);
    continue;
  }

  // Apply string replacements across all values
  const changes = walkAndReplace(dict, config.stringReplacements);

  // Apply key-specific overrides
  let keyOverrideCount = 0;
  for (const [keyPath, newValue] of Object.entries(config.keyOverrides)) {
    const changed = setNestedValue(dict, keyPath, newValue);
    if (changed) {
      console.log(`  🔑 Key override: ${keyPath} → "${newValue}"`);
      keyOverrideCount++;
    }
  }

  // Report changes
  if (changes.length > 0) {
    // Group by replacement type for summary
    const replacementCounts = {};
    for (const change of changes) {
      for (const [find, replace] of config.stringReplacements) {
        if (change.old.includes(find)) {
          const label = `"${find}" → "${replace}"`;
          replacementCounts[label] = (replacementCounts[label] || 0) + 1;
          break;
        }
      }
    }
    for (const [label, count] of Object.entries(replacementCounts)) {
      console.log(`  ✅ ${label}: ${count} values fixed`);
    }

    // Show first 5 examples
    console.log(`  📋 Examples (showing ${Math.min(5, changes.length)} of ${changes.length}):`);
    for (const change of changes.slice(0, 5)) {
      const oldShort = change.old.length > 50 ? change.old.substring(0, 50) + '...' : change.old;
      const newShort = change.new.length > 50 ? change.new.substring(0, 50) + '...' : change.new;
      console.log(`     ${change.key}:`);
      console.log(`       - "${oldShort}"`);
      console.log(`       + "${newShort}"`);
    }
  }

  const totalLangChanges = changes.length + keyOverrideCount;
  console.log(`  📊 Total: ${totalLangChanges} values updated`);
  totalChanges += totalLangChanges;

  // Write back
  if (totalLangChanges > 0) {
    writeFileSync(filePath, JSON.stringify(dict, null, 2) + '\n', 'utf-8');
    console.log(`  💾 Saved: ${config.file}`);
  } else {
    console.log(`  ℹ️  No changes needed`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`🎯 Total changes across all languages: ${totalChanges}`);
console.log('Done!');
