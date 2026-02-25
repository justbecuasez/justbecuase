import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, "..", "app", "[lang]", "dictionaries");

function fixJsonFile(filename) {
  const filePath = join(dictDir, filename);
  const raw = readFileSync(filePath, "utf8");

  // Try parsing as-is first
  try {
    JSON.parse(raw);
    console.log(`${filename}: Already valid JSON`);
    return;
  } catch (e) {
    console.log(`${filename}: Invalid JSON, attempting fix...`);
  }

  // The issue: file has multiple JSON objects concatenated like:
  // { "section1": {...} }
  // { "section2": {...} }
  // We need to merge them into one object.

  // Strategy: find all top-level `}` followed by `{` and merge them
  // Replace `}\n{` or `}\n\n{` patterns with `,` to merge objects
  let fixed = raw;

  // Remove trailing whitespace/newlines between objects
  // Pattern: closing } on its own line, then opening { or "key" on next line
  // We need to handle: } \n { "key": ...  => replace } { with , removing braces
  
  // Split into separate JSON objects
  const objects = [];
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(raw.substring(start, i + 1));
        start = -1;
      }
    }
  }

  console.log(`  Found ${objects.length} separate JSON object(s)`);

  if (objects.length <= 1) {
    console.log(`  Cannot auto-fix. Manual review needed.`);
    return;
  }

  // Parse each object and merge
  const merged = {};
  for (let idx = 0; idx < objects.length; idx++) {
    try {
      const obj = JSON.parse(objects[idx]);
      for (const key of Object.keys(obj)) {
        if (merged[key]) {
          console.log(`  WARNING: Duplicate top-level key "${key}" in object ${idx + 1}, overwriting.`);
        }
        merged[key] = obj[key];
      }
    } catch (e) {
      console.log(`  ERROR parsing object ${idx + 1}: ${e.message}`);
      // Try to show where the error is
      const snippet = objects[idx].substring(0, 200);
      console.log(`  Starts with: ${snippet}...`);
      return;
    }
  }

  // Write merged JSON
  const output = JSON.stringify(merged, null, 2);
  writeFileSync(filePath, output + "\n", "utf8");
  
  // Verify
  try {
    JSON.parse(readFileSync(filePath, "utf8"));
    console.log(`  FIXED! Merged ${objects.length} objects into 1. Keys: ${Object.keys(merged).join(", ")}`);
  } catch (e) {
    console.log(`  ERROR: Fix failed - ${e.message}`);
  }
}

// Also check the EN reference for key comparison
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

// Fix both files
console.log("=== Fixing dictionary JSON files ===\n");
fixJsonFile("ur.json");
console.log();
fixJsonFile("pu.json");

// Now count keys and compare with EN
console.log("\n=== Key count comparison ===\n");
const en = JSON.parse(readFileSync(join(dictDir, "en.json"), "utf8"));
const hi = JSON.parse(readFileSync(join(dictDir, "hi.json"), "utf8"));

const enCount = countLeaves(en);
const hiCount = countLeaves(hi);
console.log(`EN: ${enCount} keys`);
console.log(`HI: ${hiCount} keys`);

try {
  const ur = JSON.parse(readFileSync(join(dictDir, "ur.json"), "utf8"));
  const urCount = countLeaves(ur);
  console.log(`UR: ${urCount} keys`);
  
  // Find missing keys
  const enKeys = getLeafKeys(en);
  const urKeys = getLeafKeys(ur);
  const missingInUr = enKeys.filter(k => !urKeys.includes(k));
  const extraInUr = urKeys.filter(k => !enKeys.includes(k));
  
  if (missingInUr.length > 0) {
    console.log(`\nUR missing ${missingInUr.length} keys from EN:`);
    missingInUr.forEach(k => console.log(`  - ${k}`));
  }
  if (extraInUr.length > 0) {
    console.log(`\nUR has ${extraInUr.length} extra keys not in EN:`);
    extraInUr.forEach(k => console.log(`  + ${k}`));
  }
  if (missingInUr.length === 0 && extraInUr.length === 0) {
    console.log(`UR: Perfect parity with EN!`);
  }
} catch(e) {
  console.log(`UR: Could not parse - ${e.message}`);
}

try {
  const pu = JSON.parse(readFileSync(join(dictDir, "pu.json"), "utf8"));
  const puCount = countLeaves(pu);
  console.log(`PU: ${puCount} keys`);
  
  const enKeys = getLeafKeys(en);
  const puKeys = getLeafKeys(pu);
  const missingInPu = enKeys.filter(k => !puKeys.includes(k));
  const extraInPu = puKeys.filter(k => !enKeys.includes(k));
  
  if (missingInPu.length > 0) {
    console.log(`\nPU missing ${missingInPu.length} keys from EN:`);
    missingInPu.forEach(k => console.log(`  - ${k}`));
  }
  if (extraInPu.length > 0) {
    console.log(`\nPU has ${extraInPu.length} extra keys not in EN:`);
    extraInPu.forEach(k => console.log(`  + ${k}`));
  }
  if (missingInPu.length === 0 && extraInPu.length === 0) {
    console.log(`PU: Perfect parity with EN!`);
  }
} catch(e) {
  console.log(`PU: Could not parse - ${e.message}`);
}
