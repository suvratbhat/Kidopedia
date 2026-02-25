/**
 * Fetches kid-appropriate word definitions from the Free Dictionary API
 * and appends them to assets/data/seed-words.json in batches.
 * Run: node scripts/fetch-words.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SEED_PATH = path.join(__dirname, '../assets/data/seed-words.json');
const BATCH_SIZE = 10;
const DELAY_MS = 300; // be polite to the free API

// ── All target words (ages 2-12) ─────────────────────────────────────────────
const TARGET_WORDS = [
  // Fruits
  'grape','strawberry','watermelon','pineapple','cherry','lemon','coconut',
  'peach','pear','plum','papaya','guava','melon','lime','fig','kiwi',
  // Vegetables
  'carrot','potato','tomato','onion','spinach','broccoli','cucumber','corn',
  'pumpkin','bean','cabbage','garlic','ginger','lettuce','mushroom',
  'cauliflower','radish','celery','eggplant','zucchini',
  // Farm / pets
  'sheep','pig','chicken','goat','donkey','turtle','hamster','parrot',
  'camel','buffalo','peacock','pigeon',
  // Wild animals
  'giraffe','zebra','bear','wolf','fox','deer','crocodile','hippo',
  'rhinoceros','cheetah','gorilla','panda','penguin','kangaroo','koala',
  'leopard','jaguar','moose','flamingo','ostrich',
  // Sea animals
  'whale','dolphin','shark','octopus','crab','jellyfish','seal','seahorse',
  'starfish','lobster','shrimp','squid',
  // Birds
  'owl','eagle','crow','sparrow','swan','robin','hen','pelican','vulture',
  'kingfisher',
  // Insects
  'ant','spider','beetle','dragonfly','grasshopper','ladybug','mosquito',
  'moth','caterpillar','worm','firefly','cockroach',
  // Body parts
  'finger','thumb','toe','arm','leg','knee','elbow','shoulder','neck',
  'back','stomach','heart','brain','bone','skin','hair','chest','wrist',
  'ankle','lip','chin','tongue','cheek','forehead','eyebrow','palm','heel',
  // Family
  'uncle','aunt','cousin','son','daughter','husband','wife','nephew',
  'niece','twin','parent',
  // Home
  'bedroom','bathroom','kitchen','garden','stairs','bed','sofa','lamp',
  'mirror','clock','cup','plate','spoon','fork','knife','refrigerator',
  'stove','toilet','shower','wall','floor','ceiling','roof','shelf',
  'carpet','curtain','pillow','blanket','wardrobe','sink','garage',
  // Clothing
  'shirt','pants','dress','shoe','boot','hat','scarf','gloves','jacket',
  'coat','socks','skirt','belt','uniform','sweater','shorts','cap',
  'sandal','apron',
  // Food
  'butter','cheese','sugar','salt','soup','sandwich','pizza','pasta',
  'cereal','juice','tea','coffee','cake','cookie','chocolate','honey',
  'jam','meat','snack','salad','flour','sauce','curry','noodles','burger',
  // School
  'pen','paper','eraser','ruler','bag','desk','student','classroom',
  'library','homework','test','lesson','grade','alphabet','map','globe',
  'calculator','exam','notebook','chalk','crayon','scissors','glue',
  // Nature
  'leaf','root','branch','seed','plant','forest','lake','beach','island',
  'waterfall','desert','field','cave','valley','hill','soil','stone',
  'rock','mud','snow','thunder','lightning','storm','rainbow','spring',
  'summer','autumn','winter','fog','wave','cliff','pond','jungle',
  'volcano','sunset','sunrise','glacier','tide',
  // Transport
  'motorcycle','truck','helicopter','submarine','rocket','ambulance','bus',
  'taxi','scooter','ship','ferry','van','tram','jeep','skateboard',
  // Space
  'planet','mars','venus','jupiter','saturn','comet','meteor','galaxy',
  'universe','telescope','astronaut','orbit','gravity','asteroid','nebula',
  'satellite','constellation',
  // Weather
  'warm','cool','rainy','sunny','cloudy','windy','snowy','foggy','humid',
  'temperature','forecast','breeze','drizzle','hail','blizzard',
  // Emotions
  'angry','scared','surprised','excited','bored','tired','hungry',
  'thirsty','proud','shy','worried','calm','nervous','curious','lonely',
  'confused','grateful','jealous','embarrassed',
  // Verbs
  'sit','stand','open','close','push','pull','throw','catch','kick',
  'climb','fly','fall','wash','cook','build','cut','draw','paint','talk',
  'listen','ask','stop','come','give','take','make','find','hide','wait',
  'count','measure','study','explore','protect','remember','forget',
  'break','fix','carry','wear','wake','brush','show','tell','pick',
  'pour','fold','mix','bake','smile','wave','clap','whisper','shout',
  'explain','compare','choose','decide','plant',
  // Adjectives
  'tall','short','long','wide','narrow','heavy','rough','smooth','dirty',
  'new','old','young','right','wrong','easy','difficult','full','empty',
  'wet','dry','loud','quiet','bright','sour','salty','bitter','sharp',
  'round','flat','straight','thick','thin','rich','poor','safe',
  'dangerous','fresh','raw','deep','shallow','near','far','busy','free',
  // Science
  'atom','cell','energy','magnet','electricity','sound','mineral','metal',
  'gas','liquid','solid','experiment','microscope','photosynthesis',
  'ecosystem','habitat','earthquake','fossil','crystal','force','motion',
  'heat','pressure','biology','physics','chemistry','laboratory','oxygen',
  'evaporation','condensation',
  // Math
  'add','subtract','multiply','divide','equal','half','quarter','fraction',
  'pattern','measure','count','zero','angle','rectangle','cube','weight',
  'length','area','graph','percent','equation','average','odd','even',
  'sum','product','digit',
  // Places
  'hospital','park','museum','zoo','farm','city','town','village','market',
  'restaurant','shop','stadium','theater','airport','station','office',
  'bank','hotel','church','mosque','temple','bridge','road','street',
  'palace','castle','lighthouse','pharmacy','factory','playground',
  // Professions
  'doctor','nurse','engineer','farmer','cook','pilot','driver','artist',
  'musician','scientist','police','firefighter','soldier','lawyer',
  'dentist','carpenter','builder','painter','writer','actor','chef',
  'tailor','judge','president','king','queen','prince','princess',
  'professor','librarian','gardener','plumber','electrician',
  // Technology
  'computer','phone','television','camera','radio','internet','robot',
  'machine','keyboard','screen','battery','tablet','microphone','speaker',
  'motor','engine','switch','network','software','hardware','digital',
  // Sports
  'football','cricket','basketball','tennis','swimming','cycling',
  'gymnastics','boxing','badminton','volleyball','hockey','baseball',
  'golf','karate','yoga','archery','skating','surfing','skiing','rowing',
  'marathon','tournament','champion','trophy','medal','referee',
  // Health
  'sick','medicine','exercise','vitamin','germs','fever','cough',
  'bandage','allergy','rest','pain','injury','vaccination','nutrition',
  'diet','hygiene','pulse','surgery',
  // Advanced (age 8-12)
  'adventure','ancient','appreciate','atmosphere','balance','celebrate',
  'communicate','community','compare','connect','courage','create',
  'democracy','discover','diversity','education','emotion','environment',
  'explore','freedom','generate','history','imagine','important',
  'independent','information','investigate','knowledge','language',
  'leadership','literature','molecule','navigate','observe','organize',
  'patience','perspective','population','research','respect',
  'responsibility','solution','support','tradition','understand',
  'valuable','vocabulary','wisdom','culture','believe','achieve',
  'challenge','improve','develop','collaborate','innovation','cooperation',
  'civilization','constitution','justice','equality','liberty','citizen',
  'government','evolution','adaptation','biodiversity','mathematics',
  'geography','economy','debate','hypothesis','evidence','conclusion',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'kidopedia-seed-fetcher/1.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); } catch { resolve(null); }
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function apiToSeedWord(word, apiData) {
  if (!apiData || !Array.isArray(apiData) || !apiData[0]) return null;
  const entry = apiData[0];
  const meanings = (entry.meanings || []).slice(0, 2).map(m => ({
    partOfSpeech: m.partOfSpeech || 'noun',
    definitions: (m.definitions || []).slice(0, 2).map(d => ({
      definition: d.definition || '',
      example: d.example || '',
      synonyms: (d.synonyms || []).slice(0, 3),
      antonyms: (d.antonyms || []).slice(0, 3),
    })),
  }));
  if (!meanings.length) return null;

  const phonetics = entry.phonetics || [];
  const phonetic = entry.phonetic ||
    (phonetics.find(p => p.text) || {}).text || '';

  return {
    word: word.toLowerCase(),
    phonetic,
    audio_url: (phonetics.find(p => p.audio) || {}).audio || '',
    meanings,
    origin: entry.origin || '',
    kannada_translation: '',
    hindi_translation: '',
    is_age_appropriate: true,
    min_age: 2,
    complexity_level: 3,
    search_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const existing = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const existingSet = new Set(existing.map(w => w.word.toLowerCase()));

  const toFetch = TARGET_WORDS.filter(w => !existingSet.has(w.toLowerCase()));
  console.log(`Existing: ${existing.length} | To fetch: ${toFetch.length}`);

  const results = [...existing];
  let fetched = 0, skipped = 0;

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(toFetch.length/BATCH_SIZE)}: `);

    const promises = batch.map(word =>
      fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(data => ({ word, data }))
    );
    const batchResults = await Promise.all(promises);

    for (const { word, data } of batchResults) {
      const entry = apiToSeedWord(word, data);
      if (entry) {
        results.push(entry);
        fetched++;
        process.stdout.write('.');
      } else {
        skipped++;
        process.stdout.write('x');
      }
    }
    console.log();

    if (i + BATCH_SIZE < toFetch.length) await sleep(DELAY_MS);

    // Save after every batch so progress isn't lost
    fs.writeFileSync(SEED_PATH, JSON.stringify(results, null, 2));
  }

  console.log(`\nDone! Total: ${results.length} (fetched: ${fetched}, skipped: ${skipped})`);
}

main().catch(console.error);
