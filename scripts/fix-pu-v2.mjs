/**
 * Extract ALL key-value pairs from a broken JSON file using regex,
 * then rebuild using EN template structure.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, "..", "app", "[lang]", "dictionaries");

const en = JSON.parse(readFileSync(join(dictDir, "en.json"), "utf8"));
const raw = readFileSync(join(dictDir, "pu.json"), "utf8");

console.log("=== Extracting values from pu.json ===");

// Strategy: Parse the file as if it were valid JSON but handling breaks.
// We'll use a state machine approach to extract section→key→value mappings.

function extractSections(text) {
  // First, try to make the text into valid JSON by fixing common issues
  let fixed = text;
  
  // Remove all standalone } and { that break the JSON into multiple objects
  // Strategy: rebuild from scratch using a tokenizer
  
  const sections = {};
  let currentSection = null;
  let currentSubsection = null;
  let currentSubSubsection = null;
  
  const lines = text.split("\n");
  let inArray = false;
  let arrayContent = [];
  let arrayKey = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and lone braces
    if (trimmed === "" || trimmed === "{" || trimmed === "}" || trimmed === "},") continue;
    
    // Check for array start
    if (inArray) {
      if (trimmed === "]" || trimmed === "],") {
        // End of array
        if (currentSubSubsection && currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
          sections[currentSection][currentSubsection][currentSubSubsection] = [...arrayContent];
        } else if (currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          sections[currentSection][currentSubsection] = [...arrayContent];
        } else if (currentSection) {
          sections[currentSection] = [...arrayContent];
        }
        inArray = false;
        arrayContent = [];
        continue;
      }
      // Array item - strip quotes and comma
      let val = trimmed;
      if (val.endsWith(",")) val = val.slice(0, -1);
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      arrayContent.push(val);
      continue;
    }
    
    // Match "key": "value" pattern
    const kvMatch = trimmed.match(/^"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      
      // Determine nesting level from indentation
      const indent = line.search(/\S/);
      
      if (indent <= 2) {
        // Top-level key = section name with string value (shouldn't happen normally)
        // This could be a sub-value that lost its section context
        // Try to assign to current section
        if (currentSubSubsection && currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
          if (typeof sections[currentSection][currentSubsection] !== 'object' || Array.isArray(sections[currentSection][currentSubsection])) {
            sections[currentSection][currentSubsection] = {};
          }
          sections[currentSection][currentSubsection][currentSubSubsection] = {};
          sections[currentSection][currentSubsection][currentSubSubsection][key] = value;
        } else if (currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (typeof sections[currentSection][currentSubsection] !== 'object') {
            sections[currentSection][currentSubsection] = {};
          }
          sections[currentSection][currentSubsection][key] = value;
        } else if (currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          sections[currentSection][key] = value;
        }
      } else if (indent <= 4) {
        // Inside a section  
        if (currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (typeof sections[currentSection][currentSubsection] !== 'object' || Array.isArray(sections[currentSection][currentSubsection])) {
            sections[currentSection][currentSubsection] = {};
          }
          sections[currentSection][currentSubsection][key] = value;
        } else if (currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          sections[currentSection][key] = value;
        }
      } else if (indent <= 6) {
        // Inside a subsection
        if (currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
          if (typeof sections[currentSection][currentSubsection] !== 'object') {
            sections[currentSection][currentSubsection] = {};
          }
          sections[currentSection][currentSubsection][key] = value;
        }
      } else {
        // Deep nesting
        if (currentSubSubsection && currentSubsection && currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
          if (!sections[currentSection][currentSubsection][currentSubSubsection]) sections[currentSection][currentSubsection][currentSubSubsection] = {};
          sections[currentSection][currentSubsection][currentSubSubsection][key] = value;
        }
      }
      continue;
    }
    
    // Match "key": { pattern (section/subsection start)
    const sectionMatch = trimmed.match(/^"([^"]+)"\s*:\s*\{\s*$/);
    if (sectionMatch) {
      const key = sectionMatch[1];
      const indent = line.search(/\S/);
      
      if (indent <= 2) {
        currentSection = key;
        currentSubsection = null;
        currentSubSubsection = null;
        if (!sections[currentSection]) sections[currentSection] = {};
      } else if (indent <= 4) {
        currentSubsection = key;
        currentSubSubsection = null;
        if (currentSection) {
          if (!sections[currentSection]) sections[currentSection] = {};
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
        }
      } else if (indent <= 6) {
        currentSubSubsection = key;
        if (currentSection && currentSubsection) {
          if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
          if (!sections[currentSection][currentSubsection][currentSubSubsection]) {
            sections[currentSection][currentSubsection][currentSubSubsection] = {};
          }
        }
      }
      continue;
    }
    
    // Match "key": [ pattern (array start)
    const arrayMatch = trimmed.match(/^"([^"]+)"\s*:\s*\[\s*$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const indent = line.search(/\S/);
      inArray = true;
      arrayContent = [];
      
      if (indent <= 4 && currentSection) {
        currentSubsection = key;
      } else if (indent <= 6 && currentSubsection) {
        // Sub-subsection array
      }
      arrayKey = key;
      
      // We'll save the array when we hit ]
      continue;
    }
    
    // Match "key": number pattern
    const numMatch = trimmed.match(/^"([^"]+)"\s*:\s*(\d+)\s*,?\s*$/);
    if (numMatch) {
      const [, key, value] = numMatch;
      if (currentSubsection && currentSection) {
        if (!sections[currentSection]) sections[currentSection] = {};
        if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
        sections[currentSection][currentSubsection][key] = parseInt(value);
      } else if (currentSection) {
        if (!sections[currentSection]) sections[currentSection] = {};
        sections[currentSection][key] = parseInt(value);
      }
      continue;
    }
    
    // Match "key": true/false pattern  
    const boolMatch = trimmed.match(/^"([^"]+)"\s*:\s*(true|false)\s*,?\s*$/);
    if (boolMatch) {
      const [, key, value] = boolMatch;
      if (currentSubsection && currentSection) {
        if (!sections[currentSection]) sections[currentSection] = {};
        if (!sections[currentSection][currentSubsection]) sections[currentSection][currentSubsection] = {};
        sections[currentSection][currentSubsection][key] = value === "true";
      } else if (currentSection) {
        if (!sections[currentSection]) sections[currentSection] = {};
        sections[currentSection][key] = value === "true";
      }
      continue;
    }
    
    // Closing braces with context
    if (trimmed === "}," || trimmed === "]," ) {
      const indent = line.search(/\S/);
      if (indent <= 6 && currentSubSubsection) currentSubSubsection = null;
      else if (indent <= 4 && currentSubsection) currentSubsection = null;
      continue;
    }
  }
  
  return sections;
}

const extracted = extractSections(raw);
console.log(`Extracted sections: ${Object.keys(extracted).join(", ")}`);
console.log(`Section counts:`);
for (const [key, val] of Object.entries(extracted)) {
  if (typeof val === "object" && !Array.isArray(val)) {
    const subkeys = Object.keys(val);
    console.log(`  ${key}: ${subkeys.length} sub-keys`);
  }
}

// Now rebuild using EN template
function rebuild(enTemplate, translated) {
  const result = {};
  for (const key of Object.keys(enTemplate)) {
    const enVal = enTemplate[key];
    const trVal = translated ? translated[key] : undefined;
    
    if (typeof enVal === "object" && enVal !== null && !Array.isArray(enVal)) {
      result[key] = rebuild(enVal, typeof trVal === "object" && !Array.isArray(trVal) ? trVal : undefined);
    } else if (Array.isArray(enVal)) {
      result[key] = (trVal && Array.isArray(trVal) && trVal.length > 0) ? trVal : enVal;
    } else {
      result[key] = (trVal !== undefined && trVal !== null) ? trVal : enVal;
    }
  }
  return result;
}

const rebuilt = rebuild(en, extracted);

function countLeaves(obj) {
  let c = 0;
  for (const k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) c += countLeaves(obj[k]);
    else c++;
  }
  return c;
}

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

const enFlat = collectFlat(en);
const rebuiltFlat = collectFlat(rebuilt);
let translated = 0, fallback = 0;
for (const key of Object.keys(enFlat)) {
  if (rebuiltFlat[key] && JSON.stringify(rebuiltFlat[key]) !== JSON.stringify(enFlat[key])) translated++;
  else fallback++;
}

console.log(`\nRebuilt: ${countLeaves(rebuilt)} keys (${translated} translated, ${fallback} EN fallback)`);

const outPath = join(dictDir, "pu.json");
writeFileSync(outPath, JSON.stringify(rebuilt, null, 2) + "\n", "utf8");

// Verify
try {
  const verify = JSON.parse(readFileSync(outPath, "utf8"));
  console.log(`Saved and verified pu.json ✓`);
  console.log(`Top-level keys: ${Object.keys(verify).join(", ")}`);
} catch(e) {
  console.log(`ERROR: ${e.message}`);
}
