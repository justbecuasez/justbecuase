/**
 * Reconstruct dictionary JSON files using EN structure as template.
 * Handles:
 * 1. Invalid JSON (multiple concatenated objects)
 * 2. Flattened keys that should be nested
 * 3. Missing sections (fills with EN values as fallback)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, "..", "app", "[lang]", "dictionaries");

// Read EN as the authoritative structure template
const en = JSON.parse(readFileSync(join(dictDir, "en.json"), "utf8"));

function parseRawFile(filename) {
  const filePath = join(dictDir, filename);
  const raw = readFileSync(filePath, "utf8").trim();

  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log(`  Direct parse failed, attempting multi-object merge...`);
  }

  // Fix: Replace `}\n{` and `}\n  "key"` patterns to merge into single object
  // Use a line-by-line approach
  const lines = raw.split("\n");
  const fixed = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === "}") {
      // Look ahead: is this followed by `{` or `"key":` at the top level?
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") nextIdx++;

      if (nextIdx >= lines.length) {
        // End of file, keep the }
        fixed.push(lines[i]);
        i++;
        continue;
      }

      const nextTrimmed = lines[nextIdx].trim();

      if (nextTrimmed === "{" || nextTrimmed.match(/^\{$/)) {
        // } then { — merge: replace } with , and skip {
        // Ensure previous content line ends with comma
        let lastContentIdx = fixed.length - 1;
        while (lastContentIdx >= 0 && fixed[lastContentIdx].trim() === "") lastContentIdx--;
        if (lastContentIdx >= 0) {
          const lastLine = fixed[lastContentIdx].trimEnd();
          if (!lastLine.endsWith(",") && !lastLine.endsWith("{") && !lastLine.endsWith("[")) {
            fixed[lastContentIdx] = lastLine + ",";
          }
        }
        i = nextIdx + 1; // Skip both } and {
        continue;
      }

      if (nextTrimmed.startsWith('"') && nextTrimmed.includes(":")) {
        // } then "key": — bare section, replace } with ,
        let lastContentIdx = fixed.length - 1;
        while (lastContentIdx >= 0 && fixed[lastContentIdx].trim() === "") lastContentIdx--;
        if (lastContentIdx >= 0) {
          const lastLine = fixed[lastContentIdx].trimEnd();
          if (!lastLine.endsWith(",") && !lastLine.endsWith("{") && !lastLine.endsWith("[")) {
            fixed[lastContentIdx] = lastLine + ",";
          }
        }
        i++; // Skip just the }
        continue;
      }
    }

    fixed.push(lines[i]);
    i++;
  }

  let fixedStr = fixed.join("\n").trim();

  // Ensure wrapped in { }
  if (!fixedStr.startsWith("{")) fixedStr = "{\n" + fixedStr;
  if (!fixedStr.endsWith("}")) fixedStr += "\n}";

  try {
    return JSON.parse(fixedStr);
  } catch (e) {
    console.log(`  Merge fix failed: ${e.message.split("\n")[0]}`);
    // Try to show error location
    const posMatch = e.message.match(/position (\d+)/);
    if (posMatch) {
      const p = parseInt(posMatch[1]);
      const around = fixedStr.substring(Math.max(0, p - 80), p + 80);
      console.log(`  Around error: ...${around}...`);
    }
    // Save debug
    writeFileSync(filePath + ".debug", fixedStr, "utf8");
    console.log(`  Debug file saved to ${filename}.debug`);
    return null;
  }
}

function collectAllValues(obj, prefix = "") {
  const result = {};
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(result, collectAllValues(val, path));
    } else {
      result[path] = val;
    }
    // Also store the key without prefix for matching
    if (!prefix) {
      // Top-level key that should be a section
    }
  }
  return result;
}

function buildFromTemplate(enObj, translatedFlat, translatedNested) {
  const result = {};

  for (const key of Object.keys(enObj)) {
    const enVal = enObj[key];

    if (typeof enVal === "object" && enVal !== null && !Array.isArray(enVal)) {
      // This is a section - check if we have a nested version
      if (translatedNested[key] && typeof translatedNested[key] === "object") {
        // We have the section as an object, recurse
        result[key] = buildFromTemplate(enVal, collectAllValues(translatedNested[key]), translatedNested[key]);
      } else {
        // Section missing from translated, check flat keys
        result[key] = buildSectionFromFlat(key, enVal, translatedFlat);
      }
    } else if (Array.isArray(enVal)) {
      // Array value
      if (translatedNested[key] && Array.isArray(translatedNested[key])) {
        result[key] = translatedNested[key];
      } else {
        result[key] = enVal; // fallback to EN
      }
    } else {
      // Leaf value
      if (translatedNested.hasOwnProperty(key)) {
        result[key] = translatedNested[key];
      } else if (translatedFlat.hasOwnProperty(key)) {
        result[key] = translatedFlat[key];
      } else {
        result[key] = enVal; // fallback to EN
      }
    }
  }

  return result;
}

function buildSectionFromFlat(sectionName, enSection, flatValues) {
  const result = {};

  for (const key of Object.keys(enSection)) {
    const enVal = enSection[key];
    const flatKey = `${sectionName}.${key}`;

    if (typeof enVal === "object" && enVal !== null && !Array.isArray(enVal)) {
      result[key] = buildSectionFromFlat(flatKey, enVal, flatValues);
    } else {
      // Check flat values with full path, then just key name
      if (flatValues[flatKey]) {
        result[key] = flatValues[flatKey];
      } else if (flatValues[key] && typeof enVal === typeof flatValues[key]) {
        result[key] = flatValues[key];
      } else {
        result[key] = enVal; // fallback to EN
      }
    }
  }

  return result;
}

function countLeaves(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countLeaves(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function getLeafKeys(obj, prefix = "") {
  const keys = [];
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getLeafKeys(obj[key], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function processFile(filename) {
  console.log(`\n=== Processing ${filename} ===`);
  const filePath = join(dictDir, filename);

  if (!existsSync(filePath)) {
    console.log(`  File not found, skipping.`);
    return;
  }

  const parsed = parseRawFile(filename);
  if (!parsed) {
    console.log(`  FAILED to parse ${filename}. Manual fix needed.`);
    return;
  }

  // Collect flat values for remapping
  const flatValues = collectAllValues(parsed);
  console.log(`  Parsed: ${Object.keys(parsed).length} top-level keys, ${Object.keys(flatValues).length} total leaf values`);

  // Check if structure matches EN
  const enTopKeys = Object.keys(en);
  const parsedTopKeys = Object.keys(parsed);
  const correctSections = parsedTopKeys.filter(k => enTopKeys.includes(k) && typeof parsed[k] === "object" && !Array.isArray(parsed[k]));
  const flattenedKeys = parsedTopKeys.filter(k => !enTopKeys.includes(k) || typeof parsed[k] !== typeof en[k]);

  console.log(`  Correct sections: ${correctSections.join(", ")}`);
  if (flattenedKeys.length > 0) {
    console.log(`  Flattened/misplaced keys: ${flattenedKeys.length} (will remap)`);
  }

  // Rebuild using EN template
  const rebuilt = buildFromTemplate(en, flatValues, parsed);

  // Count translated vs fallback
  const enFlat = collectAllValues(en);
  const rebuiltFlat = collectAllValues(rebuilt);
  let translated = 0, fallback = 0;
  for (const key of Object.keys(enFlat)) {
    if (rebuiltFlat[key] && rebuiltFlat[key] !== enFlat[key]) {
      translated++;
    } else {
      fallback++;
    }
  }

  console.log(`  Rebuilt: ${countLeaves(rebuilt)} keys (${translated} translated, ${fallback} EN fallback)`);

  // Write
  writeFileSync(filePath, JSON.stringify(rebuilt, null, 2) + "\n", "utf8");
  console.log(`  Saved ${filename} ✓`);
}

// Process both files
processFile("ur.json");
processFile("pu.json");

// Final validation
console.log("\n=== Final Validation ===");
const enCount = countLeaves(en);
const enKeys = getLeafKeys(en);
console.log(`EN: ${enCount} keys (reference)`);

for (const file of ["hi.json", "ur.json", "pu.json"]) {
  try {
    const d = JSON.parse(readFileSync(join(dictDir, file), "utf8"));
    const dCount = countLeaves(d);
    const dKeys = getLeafKeys(d);
    const missing = enKeys.filter(k => !dKeys.includes(k));
    const extra = dKeys.filter(k => !enKeys.includes(k));
    const topKeys = Object.keys(d);
    const enTopKeys = Object.keys(en);
    const structMatch = topKeys.length === enTopKeys.length && topKeys.every(k => enTopKeys.includes(k));
    console.log(`${file}: ${dCount} keys | Structure: ${structMatch ? "✓" : "✗"} | Missing: ${missing.length} | Extra: ${extra.length}`);
  } catch (e) {
    console.log(`${file}: PARSE ERROR - ${e.message.split("\n")[0]}`);
  }
}
