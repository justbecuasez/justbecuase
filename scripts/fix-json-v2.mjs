import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, "..", "app", "[lang]", "dictionaries");

function fixDictJson(filename) {
  const filePath = join(dictDir, filename);
  let raw = readFileSync(filePath, "utf8");

  // Check if already valid
  try {
    const parsed = JSON.parse(raw);
    // Also check structure: all top-level values should be objects (not bare strings)
    const badKeys = Object.keys(parsed).filter(k => typeof parsed[k] === "string");
    if (badKeys.length === 0) {
      console.log(`${filename}: Already valid JSON with correct structure`);
      return;
    }
    console.log(`${filename}: Valid JSON but has ${badKeys.length} flat string keys (should be nested). Needs restructuring.`);
  } catch (e) {
    console.log(`${filename}: Invalid JSON - ${e.message.split("\n")[0]}`);
  }

  // Strategy: Fix the raw text to make it a single valid JSON object
  // Common issues:
  // 1. Multiple separate `{...}` objects concatenated
  // 2. Bare `"key": {...}` sections not wrapped in outer braces
  // 3. Missing commas between sections

  // Step 1: Normalize - remove any BOM, trim
  raw = raw.replace(/^\uFEFF/, "").trim();

  // Step 2: Fix the text by replacing `}\n{` with `,` and handling bare sections
  // Also handle `}\n  "key"` patterns (bare section after a closing brace)

  // Replace pattern: `}` at end of one object, followed by `{` starting another, or bare `"key"`
  // We need to be careful to only do this at depth 0

  let lines = raw.split("\n");
  let result = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    
    // Check if current line is a lone `}` that closes the root object
    // and the next non-empty line starts a new section
    if (trimmed === "}" && i < lines.length - 1) {
      // Look ahead for the next non-empty line
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") nextIdx++;
      
      if (nextIdx < lines.length) {
        const nextTrimmed = lines[nextIdx].trim();
        
        if (nextTrimmed === "{") {
          // Pattern: }\n{  — two separate objects, merge them
          // Don't push the `}`, don't push the `{`, add a comma
          // But we need to add comma to the previous content line
          // Find the last non-empty result line and ensure it has a comma
          let lastIdx = result.length - 1;
          while (lastIdx >= 0 && result[lastIdx].trim() === "") lastIdx--;
          if (lastIdx >= 0) {
            let lastLine = result[lastIdx].trimEnd();
            if (!lastLine.endsWith(",") && !lastLine.endsWith("{") && !lastLine.endsWith("[")) {
              result[lastIdx] = lastLine + ",";
            }
          }
          i = nextIdx + 1; // Skip both } and {
          continue;
        } else if (nextTrimmed.startsWith('"') && !nextTrimmed.startsWith('"}')) {
          // Pattern: }\n  "key": {  — bare section after closing brace
          // This means the `}` is closing a previous standalone section
          // Don't push the `}`, add comma to previous line
          let lastIdx = result.length - 1;
          while (lastIdx >= 0 && result[lastIdx].trim() === "") lastIdx--;
          if (lastIdx >= 0) {
            let lastLine = result[lastIdx].trimEnd();
            if (!lastLine.endsWith(",") && !lastLine.endsWith("{") && !lastLine.endsWith("[")) {
              result[lastIdx] = lastLine + ",";
            }
          }
          i++; // Skip just the }
          continue;
        }
      }
    }
    
    result.push(lines[i]);
    i++;
  }

  let fixed = result.join("\n").trim();

  // Ensure it starts with { and ends with }
  if (!fixed.startsWith("{")) {
    fixed = "{\n" + fixed;
  }
  if (!fixed.endsWith("}")) {
    fixed = fixed + "\n}";
  }

  // Try to parse
  try {
    const parsed = JSON.parse(fixed);
    const topKeys = Object.keys(parsed);
    const badKeys = topKeys.filter(k => typeof parsed[k] === "string");
    
    if (badKeys.length > 0) {
      console.log(`  WARNING: Still has ${badKeys.length} flat string keys: ${badKeys.slice(0, 5).join(", ")}...`);
    }
    
    // Re-format nicely
    writeFileSync(filePath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    console.log(`  FIXED! Top-level sections: ${topKeys.join(", ")}`);
    return parsed;
  } catch (e) {
    console.log(`  Auto-fix failed: ${e.message}`);
    // Save the attempted fix for debugging
    writeFileSync(filePath + ".debug", fixed, "utf8");
    console.log(`  Saved debug version to ${filename}.debug`);
    
    // Try to find the exact position of error
    const pos = e.message.match(/position (\d+)/);
    if (pos) {
      const p = parseInt(pos[1]);
      const context = fixed.substring(Math.max(0, p - 100), p + 100);
      const before = fixed.substring(Math.max(0, p - 30), p);
      const after = fixed.substring(p, p + 30);
      console.log(`  Error context: ...${before}>>HERE>>${after}...`);
    }
    return null;
  }
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

console.log("=== Fixing dictionary JSON files ===\n");

const ur = fixDictJson("ur.json");
console.log();
const pu = fixDictJson("pu.json");

console.log("\n=== Key parity check ===\n");
const en = JSON.parse(readFileSync(join(dictDir, "en.json"), "utf8"));
const enKeys = getLeafKeys(en);
const enCount = countLeaves(en);
console.log(`EN: ${enCount} keys (reference)`);

for (const [name, dict] of [["UR", ur], ["PU", pu]]) {
  if (!dict) {
    try {
      const d = JSON.parse(readFileSync(join(dictDir, name.toLowerCase() + ".json"), "utf8"));
      const dKeys = getLeafKeys(d);
      const missing = enKeys.filter(k => !dKeys.includes(k));
      const extra = dKeys.filter(k => !enKeys.includes(k));
      console.log(`${name}: ${countLeaves(d)} keys | Missing: ${missing.length} | Extra: ${extra.length}`);
      if (missing.length > 0 && missing.length <= 20) {
        console.log(`  Missing: ${missing.join(", ")}`);
      } else if (missing.length > 20) {
        console.log(`  Missing first 10: ${missing.slice(0, 10).join(", ")}...`);
        // Group by top-level section
        const sections = {};
        missing.forEach(k => {
          const sec = k.split(".")[0];
          sections[sec] = (sections[sec] || 0) + 1;
        });
        console.log(`  Missing by section: ${Object.entries(sections).map(([s,c]) => `${s}(${c})`).join(", ")}`);
      }
    } catch(e) {
      console.log(`${name}: Cannot parse - ${e.message.split("\n")[0]}`);
    }
    continue;
  }
  const dKeys = getLeafKeys(dict);
  const missing = enKeys.filter(k => !dKeys.includes(k));
  const extra = dKeys.filter(k => !enKeys.includes(k));
  console.log(`${name}: ${countLeaves(dict)} keys | Missing: ${missing.length} | Extra: ${extra.length}`);
  if (missing.length > 0) {
    const sections = {};
    missing.forEach(k => {
      const sec = k.split(".")[0];
      sections[sec] = (sections[sec] || 0) + 1;
    });
    console.log(`  Missing by section: ${Object.entries(sections).map(([s,c]) => `${s}(${c})`).join(", ")}`);
  }
}
