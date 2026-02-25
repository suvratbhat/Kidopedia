/**
 * Fetches Hindi and Kannada translations for words missing them.
 * Uses MyMemory free translation API (no key needed, ~1000/day limit).
 * Run: node scripts/fetch-translations.js
 * Safe to re-run — skips words that already have translations.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SEED_PATH = path.join(__dirname, '../assets/data/seed-words.json');
const DELAY_MS = 200;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchTranslation(word, targetLang) {
  return new Promise(resolve => {
    const q = encodeURIComponent(word);
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${targetLang}`;
    https.get(url, { headers: { 'User-Agent': 'kidopedia/1.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const t = json?.responseData?.translatedText || '';
          // Reject if it returned the same word back or an error marker
          if (!t || t.toLowerCase() === word.toLowerCase() || t.includes('MYMEMORY')) {
            resolve('');
          } else {
            resolve(t.trim());
          }
        } catch { resolve(''); }
      });
    }).on('error', () => resolve(''));
  });
}

async function main() {
  const words = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const needsTranslation = words.filter(w =>
    !w.kannada_translation || !w.hindi_translation
  );
  console.log(`Words needing translation: ${needsTranslation.length}`);

  let done = 0;
  for (const entry of needsTranslation) {
    process.stdout.write(`[${++done}/${needsTranslation.length}] ${entry.word}: `);

    if (!entry.hindi_translation) {
      const hi = await fetchTranslation(entry.word, 'hi');
      entry.hindi_translation = hi;
      process.stdout.write(`hi="${hi}" `);
      await sleep(DELAY_MS);
    }
    if (!entry.kannada_translation) {
      const kn = await fetchTranslation(entry.word, 'kn');
      entry.kannada_translation = kn;
      process.stdout.write(`kn="${kn}"`);
      await sleep(DELAY_MS);
    }
    console.log();

    // Save every 20 words so progress is not lost
    if (done % 20 === 0) {
      fs.writeFileSync(SEED_PATH, JSON.stringify(words, null, 2));
      console.log('  [saved checkpoint]');
    }
  }

  fs.writeFileSync(SEED_PATH, JSON.stringify(words, null, 2));
  const withKn = words.filter(w => w.kannada_translation).length;
  const withHi = words.filter(w => w.hindi_translation).length;
  console.log(`\nDone! Kannada: ${withKn}/${words.length}  Hindi: ${withHi}/${words.length}`);
}

main().catch(console.error);
