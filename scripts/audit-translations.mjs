/**
 * Audit translation quality across all language files.
 * Finds:
 * 1. Literal translations of "Impact Agent" (should be contextual like "skilled volunteer")
 * 2. Literal translations of branding terms
 * 3. English words left untranslated
 * 4. Known bad patterns per language
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dirname, "..", "app", "[lang]", "dictionaries");

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

const en = JSON.parse(readFileSync(join(dictDir, "en.json"), "utf8"));
const enFlat = collectFlat(en);

// Known bad literal translations per language
const badPatterns = {
  hi: [
    { pattern: /प्रभाव\s*एजेंट/gi, issue: "Literal 'Impact Agent'", fix: "कुशल स्वयंसेवक / प्रभाव कर्ता" },
    { pattern: /इम्पैक्ट\s*एजेंट/gi, issue: "Transliterated 'Impact Agent'", fix: "कुशल स्वयंसेवक" },
    { pattern: /प्रो\s*बोनो/gi, issue: "Transliterated 'Pro Bono'", fix: "निःशुल्क सेवा" },
    { pattern: /लो\s*बोनो/gi, issue: "Transliterated 'Low Bono'", fix: "रियायती सेवा" },
    { pattern: /वालंटियर/gi, issue: "Transliterated 'Volunteer'", fix: "स्वयंसेवक / सेवाकर्मी" },
    { pattern: /ऑपर्च्युनिटी/gi, issue: "Transliterated 'Opportunity'", fix: "अवसर / मौका" },
    { pattern: /ब्राउज/gi, issue: "Transliterated 'Browse'", fix: "देखें / खोजें" },
    { pattern: /डैशबोर्ड/gi, issue: "Check if 'Dashboard' should stay transliterated or use Hindi", fix: "Keep as-is (acceptable)" },
  ],
  pa: [
    { pattern: /ਪ੍ਰਭਾਵ\s*ਏਜੰਟ/gi, issue: "Literal 'Impact Agent'", fix: "ਹੁਨਰਮੰਦ ਸੇਵਾਦਾਰ" },
    { pattern: /ਇੰਪੈਕਟ\s*ਏਜੰਟ/gi, issue: "Transliterated 'Impact Agent'", fix: "ਹੁਨਰਮੰਦ ਸੇਵਾਦਾਰ" },
    { pattern: /ਪ੍ਰੋ\s*ਬੋਨੋ/gi, issue: "Transliterated 'Pro Bono'", fix: "ਮੁਫ਼ਤ ਸੇਵਾ" },
    { pattern: /ਲੋ\s*ਬੋਨੋ/gi, issue: "Transliterated 'Low Bono'", fix: "ਰਿਆਇਤੀ ਸੇਵਾ" },
    { pattern: /ਵਲੰਟੀਅਰ/gi, issue: "Transliterated 'Volunteer'", fix: "ਸੇਵਾਦਾਰ / ਰਜ਼ਾਕਾਰ" },
    { pattern: /ਅਰਜ਼ੀ\s*ਦਿਓ/gi, issue: "Check: 'Apply' phrasing", fix: "May be OK" },
  ],
  ur: [
    { pattern: /امپیکٹ\s*ایجنٹ/gi, issue: "Transliterated 'Impact Agent'", fix: "مہارتی رضاکار" },
    { pattern: /اثر\s*ایجنٹ/gi, issue: "Literal 'Impact Agent'", fix: "مہارتی رضاکار" },
    { pattern: /پرو\s*بونو/gi, issue: "Transliterated 'Pro Bono'", fix: "مفت خدمات" },
  ],
  fr: [
    { pattern: /agent\s*d['']impact/gi, issue: "Literal 'Impact Agent'", fix: "bénévole qualifié / volontaire engagé" },
    { pattern: /pro\s*bono/gi, issue: "English 'Pro Bono' left as-is", fix: "bénévolat / gratuit" },
    { pattern: /low\s*bono/gi, issue: "English 'Low Bono' left as-is", fix: "tarif réduit / solidaire" },
    { pattern: /impact\s*agent/gi, issue: "English 'Impact Agent' untranslated", fix: "bénévole qualifié" },
    { pattern: /browse/gi, issue: "English 'Browse' untranslated", fix: "parcourir / explorer" },
    { pattern: /dashboard/gi, issue: "Check: English 'Dashboard'", fix: "tableau de bord" },
  ],
  ta: [
    { pattern: /தாக்க\s*முகவர்/gi, issue: "Literal 'Impact Agent' (தாக்க=impact, முகவர்=agent)", fix: "திறமையான தொண்டர் / சேவையாளர்" },
    { pattern: /இம்பாக்ட்\s*ஏஜென்ட்/gi, issue: "Transliterated 'Impact Agent'", fix: "திறமையான தொண்டர்" },
    { pattern: /புரோ\s*போனோ/gi, issue: "Transliterated 'Pro Bono'", fix: "இலவச சேவை" },
    { pattern: /லோ\s*போனோ/gi, issue: "Transliterated 'Low Bono'", fix: "சலுகை சேவை" },
    { pattern: /சாத்தியம்/gi, issue: "Check: 'possible' vs 'impossible' context", fix: "Verify brand: Mission IM-possible = அசாத்தியம்" },
    { pattern: /வாலண்டியர்/gi, issue: "Transliterated 'Volunteer'", fix: "தொண்டர் / சேவையாளர்" },
  ],
};

// Check for English words/phrases left untranslated
const commonEnglishWords = [
  /\bImpact Agent\b/g,
  /\bPro Bono\b/g, 
  /\bLow Bono\b/g,
  /\bBrowse\b/g,
  /\bProfile\b/g,
  /\bSettings\b/g,
  /\bDashboard\b/g,
  /\bSign In\b/g,
  /\bSign Up\b/g,
  /\bSign Out\b/g,
  /\bUpgrade\b/g,
  /\bSubscription\b/g,
  /\bCoupon\b/g,
  /\bNewsletter\b/g,
];

console.log("=== TRANSLATION QUALITY AUDIT ===\n");

for (const lang of ["hi", "pa", "ur", "fr", "ta"]) {
  const dict = JSON.parse(readFileSync(join(dictDir, `${lang}.json`), "utf8"));
  const flat = collectFlat(dict);
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${lang.toUpperCase()} - ${lang === "hi" ? "Hindi" : lang === "pa" ? "Punjabi" : lang === "ur" ? "Urdu" : lang === "fr" ? "French" : "Tamil"}`);
  console.log(`${"=".repeat(60)}`);
  
  const issues = [];
  
  // Check bad patterns
  const patterns = badPatterns[lang] || [];
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== "string") continue;
    
    for (const bp of patterns) {
      if (bp.pattern.test(value)) {
        bp.pattern.lastIndex = 0; // Reset regex
        issues.push({
          key,
          value: value.substring(0, 80),
          issue: bp.issue,
          fix: bp.fix,
        });
      }
    }
    
    // Check for untranslated English (only for non-French since French shares many English words)
    if (lang !== "fr") {
      for (const re of commonEnglishWords) {
        re.lastIndex = 0;
        if (re.test(value)) {
          re.lastIndex = 0;
          const match = value.match(re);
          issues.push({
            key,
            value: value.substring(0, 80),
            issue: `Untranslated English: "${match[0]}"`,
            fix: `Translate "${match[0]}" to ${lang}`,
          });
        }
      }
    }
    
    // Check if value is identical to EN (exact same = not translated)
    if (enFlat[key] && value === enFlat[key] && value.length > 3 && !/^[0-9$%+\/\-:@.]+$/.test(value) && !value.includes("@") && !value.includes("http") && !value.includes("JustBeCause") && !value.includes("www.") && key !== "contact.address") {
      // Skip common shared values
      if (!["24/7", "100%", "Gmail", "you@example.com", "$2.4M+"].includes(value) && 
          !key.includes("Placeholder") && !key.includes("emailPlaceholder")) {
        issues.push({
          key,
          value: value.substring(0, 60),
          issue: "UNTRANSLATED - identical to English",
          fix: `Translate to ${lang}`,
        });
      }
    }
  }
  
  // Group issues by type
  const byType = {};
  for (const issue of issues) {
    if (!byType[issue.issue]) byType[issue.issue] = [];
    byType[issue.issue].push(issue);
  }
  
  console.log(`\nTotal issues found: ${issues.length}\n`);
  
  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n--- ${type} (${items.length} occurrences) ---`);
    console.log(`  Suggested fix: ${items[0].fix}`);
    for (const item of items.slice(0, 10)) {
      console.log(`  ${item.key}: "${item.value}"`);
    }
    if (items.length > 10) {
      console.log(`  ... and ${items.length - 10} more`);
    }
  }
}
