/**
 * Brute-force fix for pu.json: 
 * Read line by line, track brace depth, fix breaks at depth 0.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "app", "[lang]", "dictionaries", "pu.json");
const enPath = join(__dirname, "..", "app", "[lang]", "dictionaries", "en.json");

const raw = readFileSync(filePath, "utf8");
const lines = raw.split("\n");

console.log(`Original: ${lines.length} lines`);

// Track brace depth and find all break points
let depth = 0;
const breaks = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  if (depth === 0 && i < lines.length - 1) {
    // Found a break point - depth returned to 0 before end of file
    const nextNonEmpty = lines.slice(i + 1).findIndex(l => l.trim().length > 0);
    const nextLine = nextNonEmpty >= 0 ? lines[i + 1 + nextNonEmpty].trim() : "";
    breaks.push({ line: i + 1, nextLine: nextLine.substring(0, 60) });
  }
}

console.log(`Found ${breaks.length} break point(s) at depth 0:`);
breaks.forEach(b => console.log(`  Line ${b.line}: next = "${b.nextLine}"`));

// Rebuild: when depth hits 0 and there's more content, merge
const output = [];
depth = 0;
let skipNextOpen = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Count braces on this line
  let lineDepthChange = 0;
  let inString = false;
  let escape = false;
  for (const ch of line) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{") lineDepthChange++;
      else if (ch === "}") lineDepthChange--;
    }
  }
  
  const newDepth = depth + lineDepthChange;
  
  if (skipNextOpen) {
    // We're expecting a `{` line to skip (opening brace of next object)
    if (trimmed === "{") {
      skipNextOpen = false;
      depth = newDepth;
      continue; // Skip this line
    } else if (trimmed === "") {
      output.push(line); // Keep blank lines
      continue;
    } else if (trimmed.startsWith('"')) {
      // It's a bare section (no opening {), that's fine
      skipNextOpen = false;
      // Don't skip, fall through to push this line
    }
  }
  
  if (newDepth === 0 && i < lines.length - 1) {
    // Depth will hit 0 - this is a break point
    // Check if there's more content after this
    const hasMore = lines.slice(i + 1).some(l => l.trim().length > 0);
    if (hasMore && trimmed === "}") {
      // This is a closing `}` at depth 0 that should become a `,`
      // Don't push this line. Instead, ensure previous line has comma
      let lastIdx = output.length - 1;
      while (lastIdx >= 0 && output[lastIdx].trim() === "") lastIdx--;
      if (lastIdx >= 0) {
        const lastLine = output[lastIdx].trimEnd();
        if (!lastLine.endsWith(",") && !lastLine.endsWith("{") && !lastLine.endsWith("[")) {
          output[lastIdx] = lastLine + ",";
        }
      }
      skipNextOpen = true; // Skip the next `{` if there is one
      depth = newDepth;
      continue;
    }
  }
  
  output.push(line);
  depth = newDepth;
}

let fixed = output.join("\n").trim();

// Ensure proper wrapping
if (!fixed.startsWith("{")) fixed = "{\n" + fixed;
if (!fixed.endsWith("}")) fixed += "\n}";

// Try parse
try {
  const parsed = JSON.parse(fixed);
  console.log(`\nFixed! Top-level keys: ${Object.keys(parsed).join(", ")}`);
  
  // Now reconstruct using EN template
  const en = JSON.parse(readFileSync(enPath, "utf8"));
  
  function collectFlat(obj, prefix = "") {
    const result = {};
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, collectFlat(obj[key], path));
      } else {
        result[path] = obj[key];
      }
    }
    return result;
  }
  
  function rebuild(enTemplate, translated) {
    const result = {};
    for (const key of Object.keys(enTemplate)) {
      const enVal = enTemplate[key];
      if (typeof enVal === "object" && enVal !== null && !Array.isArray(enVal)) {
        if (translated[key] && typeof translated[key] === "object" && !Array.isArray(translated[key])) {
          result[key] = rebuild(enVal, translated[key]);
        } else {
          result[key] = rebuild(enVal, {}); // fallback
        }
      } else if (Array.isArray(enVal)) {
        result[key] = (translated[key] && Array.isArray(translated[key])) ? translated[key] : enVal;
      } else {
        result[key] = translated.hasOwnProperty(key) ? translated[key] : enVal;
      }
    }
    return result;
  }
  
  const rebuilt = rebuild(en, parsed);
  
  function countLeaves(obj) {
    let c = 0;
    for (const k in obj) {
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) c += countLeaves(obj[k]);
      else c++;
    }
    return c;
  }
  
  const enFlat = collectFlat(en);
  const rebuiltFlat = collectFlat(rebuilt);
  let translated = 0, fallback = 0;
  for (const key of Object.keys(enFlat)) {
    if (rebuiltFlat[key] && rebuiltFlat[key] !== enFlat[key]) translated++;
    else fallback++;
  }
  
  console.log(`Rebuilt: ${countLeaves(rebuilt)} keys (${translated} translated, ${fallback} EN fallback)`);
  
  writeFileSync(filePath, JSON.stringify(rebuilt, null, 2) + "\n", "utf8");
  console.log(`Saved pu.json ✓`);
  
  // Verify
  JSON.parse(readFileSync(filePath, "utf8"));
  console.log("Validation: PASS ✓");
  
} catch(e) {
  console.log(`\nFix failed: ${e.message}`);
  writeFileSync(filePath + ".debug2", fixed, "utf8");
  console.log("Saved debug2 file");
  
  // Find error position
  const posMatch = e.message.match(/position (\d+)/);
  if (posMatch) {
    const p = parseInt(posMatch[1]);
    console.log(`Error at position ${p}:`);
    console.log(`  Before: "${fixed.substring(Math.max(0, p - 60), p)}"`);
    console.log(`  After:  "${fixed.substring(p, p + 60)}"`);
  }
}
