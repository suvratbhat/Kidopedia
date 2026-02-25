/**
 * Fixes known-bad translations from the MyMemory API.
 * Run: node scripts/fix-translations.js
 */
const fs = require('fs');
const path = require('path');
const SEED_PATH = path.join(__dirname, '../assets/data/seed-words.json');

// word -> [correct_hindi, correct_kannada]
// empty string = keep existing value
const FIXES = {
  // Fruits
  plum:         ['बेर', 'ಪ್ಲಮ್'],
  guava:        ['अमरूद', 'ಸೀಬೆ'],
  lime:         ['नींबू', 'ಲಿಂಬೆ'],
  fig:          ['अंजीर', 'ಅಂಜೂರ'],
  kiwi:         ['कीवी', 'ಕಿವಿ'],
  // Vegetables
  potato:       ['आलू', 'ಆಲೂಗಡ್ಡೆ'],
  tomato:       ['टमाटर', 'ಟೊಮೇಟೊ'],
  onion:        ['प्याज', 'ಈರುಳ್ಳಿ'],
  spinach:      ['पालक', 'ಪಾಲಕ'],
  lettuce:      ['सलाद पत्ता', 'ಲೆಟ್ಟಿಸ್'],
  ginger:       ['अदरक', 'ಶುಂಠಿ'],
  // Animals
  zebra:        ['ज़ेबरा', 'ಝೀಬ್ರಾ'],
  firefly:      ['जुगनू', 'ಮಿಂಚುಹುಳ'],
  // Family
  aunt:         ['चाची / मौसी', 'ಚಿಕ್ಕಮ್ಮ'],
  cousin:       ['चचेरा भाई', 'ಸೋದರಸಂಬಂಧಿ'],
  son:          ['बेटा', 'ಮಗ'],
  daughter:     ['बेटी', 'ಮಗಳು'],
  husband:      ['पति', 'ಗಂಡ'],
  wife:         ['पत्नी', 'ಹೆಂಡತಿ'],
  nephew:       ['भतीजा', 'ಸೋದರಳಿಯ'],
  niece:        ['भतीजी', 'ಸೋದರ ಸೊಸೆ'],
  // Home
  bedroom:      ['शयनकक्ष', 'ಮಲಗುವ ಕೋಣೆ'],
  bathroom:     ['स्नानघर', 'ಸ್ನಾನಗೃಹ'],
  kitchen:      ['रसोई', 'ಅಡಿಗೆ ಕೋಣೆ'],
  mirror:       ['आईना', 'ಕನ್ನಡಿ'],
  cup:          ['प्याला', 'ಕಪ್'],
  bed:          ['बिस्तर', 'ಹಾಸಿಗೆ'],
  toilet:       ['शौचालय', 'ಶೌಚಾಲಯ'],
  blanket:      ['कंबल', 'ಕಂಬಳಿ'],
  sink:         ['सिंक', 'ಸಿಂಕ್'],
  fork:         ['काँटा', 'ಮೂರು ತಲೆ ಮಿಂಚು'],
  noodles:      ['नूडल्स', 'ನೂಡಲ್ಸ್'],
  // Nature
  valley:       ['घाटी', 'ಕಣಿವೆ'],
  pond:         ['तालाब', 'ಕೊಳ'],
  village:      ['गाँव', 'ಹಳ್ಳಿ'],
  // Space
  universe:     ['ब्रह्माण्ड', 'ವಿಶ್ವ'],
  // Weather
  windy:        ['तेज हवा', 'ಗಾಳಿ ಬೀಸುತ್ತಿದೆ'],
  drizzle:      ['फुहार', 'ತುಂತುರು ಮಳೆ'],
  hail:         ['ओला', 'ಆಲಿಕಲ್ಲು ಮಳೆ'],
  // Emotions
  scared:       ['डरा हुआ', 'ಹೆದರಿದ'],
  bored:        ['ऊबा हुआ', 'ಬೇಸರ'],
  hungry:       ['भूखा', 'ಹಸಿದ'],
  proud:        ['गर्वित', 'ಹೆಮ್ಮೆ'],
  excited:      ['उत्साहित', 'ಉತ್ಸಾಹಿತ'],
  lonely:       ['अकेला', 'ಒಂಟಿ'],
  nervous:      ['घबराया हुआ', 'ಆತಂಕಿತ'],
  // Verbs
  sit:          ['बैठना', 'ಕೂರು'],
  stand:        ['खड़े होना', 'ನಿಲ್ಲು'],
  open:         ['खोलना', 'ತೆರೆ'],
  push:         ['धकेलना', 'ತಳ್ಳು'],
  pull:         ['खींचना', 'ಎಳೆ'],
  throw:        ['फेंकना', 'ಎಸೆ'],
  catch:        ['पकड़ना', 'ಹಿಡಿ'],
  kick:         ['लात मारना', 'ಒದೆ'],
  fly:          ['उड़ना', 'ಹಾರು'],
  wash:         ['धोना', 'ತೊಳೆ'],
  talk:         ['बात करना', 'ಮಾತಾಡು'],
  wait:         ['इंतजार करना', 'ನಿರೀಕ್ಷಿಸು'],
  count:        ['गिनना', 'ಎಣಿಸು'],
  study:        ['पढ़ना', 'ಅಭ್ಯಾಸ ಮಾಡು'],
  protect:      ['सुरक्षित करना', 'ರಕ್ಷಿಸು'],
  remember:     ['याद करना', 'ನೆನಪಿಟ್ಟುಕೊ'],
  forget:       ['भूलना', 'ಮರೆ'],
  break:        ['तोड़ना', 'ಒಡೆ'],
  fix:          ['ठीक करना', 'ಸರಿಪಡಿಸು'],
  carry:        ['ले जाना', 'ಒಯ್ಯು'],
  smile:        ['मुस्कुराना', 'ನಗು'],
  clap:         ['तालियाँ बजाना', 'ಚಪ್ಪಾಳೆ ತಟ್ಟು'],
  tell:         ['बताना', 'ಹೇಳು'],
  fold:         ['मोड़ना', 'ಮಡಚು'],
  choose:       ['चुनना', 'ಆರಿಸು'],
  cut:          ['काटना', 'ಕತ್ತರಿಸು'],
  stop:         ['रुकना', 'ನಿಲ್ಲಿಸು'],
  come:         ['आना', 'ಬಾ'],
  give:         ['देना', 'ಕೊಡು'],
  take:         ['लेना', 'ತೆಗೆದುಕೊ'],
  find:         ['ढूंढना', 'ಹುಡುಕು'],
  // Adjectives
  full:         ['भरा हुआ', 'ತುಂಬಿದ'],
  round:        ['गोल', 'ದುಂಡಗೆ'],
  thick:        ['मोटा', 'ದಪ್ಪ'],
  rich:         ['अमीर', 'ಶ್ರೀಮಂತ'],
  near:         ['पास', 'ಹತ್ತಿರ'],
  wet:          ['गीला', 'ಒದ್ದೆ'],
  difficult:    ['मुश्किल', 'ಕಷ್ಟ'],
  // Science
  solid:        ['ठोस', 'ಘನ'],
  // Places
  city:         ['शहर', 'ನಗರ'],
  town:         ['नगर', 'ಪಟ್ಟಣ'],
  market:       ['बाज़ार', 'ಮಾರುಕಟ್ಟೆ'],
  hospital:     ['अस्पताल', 'ಆಸ್ಪತ್ರೆ'],
  park:         ['उद्यान', 'ಉದ್ಯಾನ'],
  castle:       ['महल', 'ಕೋಟೆ'],
  pharmacy:     ['दवाखाना', 'ಔಷಧಿ ಅಂಗಡಿ'],
  factory:      ['कारखाना', 'ಕಾರ್ಖಾನೆ'],
  station:      ['स्टेशन', 'ನಿಲ್ದಾಣ'],
  judge:        ['न्यायाधीश', 'ನ್ಯಾಯಾಧೀಶ'],
  // Professions
  king:         ['राजा', 'ರಾಜ'],
  queen:        ['रानी', 'ರಾಣಿ'],
  prince:       ['राजकुमार', 'ರಾಜಕುಮಾರ'],
  princess:     ['राजकुमारी', 'ರಾಜಕುಮಾರಿ'],
  carpenter:    ['बढ़ई', 'ಬಡಗಿ'],
  tailor:       ['दर्जी', 'ದರ್ಜಿ'],
  police:       ['पुलिस', 'ಪೊಲೀಸ್'],
  soldier:      ['सैनिक', 'ಸೈನಿಕ'],
  electrician:  ['इलेक्ट्रीशियन', 'ವಿದ್ಯುತ್ ತಜ್ಞ'],
  // Technology
  phone:        ['फ़ोन', 'ದೂರವಾಣಿ'],
  camera:       ['कैमरा', 'ಕ್ಯಾಮೆರಾ'],
  battery:      ['बैटरी', 'ಬ್ಯಾಟರಿ'],
  machine:      ['मशीन', 'ಯಂತ್ರ'],
  speaker:      ['लाउडस्पीकर', 'ಸ್ಪೀಕರ್'],
  hardware:     ['हार्डवेयर', 'ಯಂತ್ರಾಂಶ'],
  digital:      ['डिजिटल', 'ಡಿಜಿಟಲ್'],
  // Sports
  cricket:      ['क्रिकेट', 'ಕ್ರಿಕೆಟ್'],
  swimming:     ['तैराकी', 'ಈಜು'],
  volleyball:   ['वॉलीबॉल', 'ವಾಲಿಬಾಲ್'],
  yoga:         ['योग', 'ಯೋಗ'],
  marathon:     ['मैराथन', 'ಮ್ಯಾರಥಾನ್'],
  // Health
  pain:         ['दर्द', 'ನೋವು'],
  // Other
  liberty:      ['स्वतंत्रता', 'ಸ್ವಾತಂತ್ರ್ಯ'],
  scooter:      ['स्कूटर', 'ಸ್ಕೂಟರ್'],
  bus:          ['बस', 'ಬಸ್'],
  even:         ['सम', 'ಸಮ'],
  sum:          ['योग', 'ಮೊತ್ತ'],
  physics:      ['भौतिकी', 'ಭೌತಶಾಸ್ತ್ರ'],
};

const words = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
let fixed = 0;
for (const entry of words) {
  const fix = FIXES[entry.word.toLowerCase()];
  if (fix) {
    const [hi, kn] = fix;
    if (hi) entry.hindi_translation = hi;
    if (kn) entry.kannada_translation = kn;
    fixed++;
  }
}
fs.writeFileSync(SEED_PATH, JSON.stringify(words, null, 2));
console.log(`Fixed ${fixed} translations. Total words: ${words.length}`);
