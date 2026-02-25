/**
 * Manually adds important kid words that the API didn't return.
 * Run: node scripts/patch-missing.js
 */
const fs = require('fs');
const path = require('path');
const SEED_PATH = path.join(__dirname, '../assets/data/seed-words.json');

const PATCHES = [
  { word:'giraffe', phonetic:'/dʒɪˈrɑːf/', pos:'noun', def:'The tallest animal on land, with a very long neck and orange-brown spots.', ex:'The giraffe stretched its long neck to eat leaves from the tall tree.', kn:'ಜಿರಾಫೆ', hi:'जिराफ़', age:2, lvl:2 },
  { word:'crocodile', phonetic:'/ˈkrɒkədaɪl/', pos:'noun', def:'A large reptile with sharp teeth that lives near rivers and swamps.', ex:'The crocodile lay still in the muddy water.', kn:'ಮೊಸಳೆ', hi:'मगरमच्छ', age:2, lvl:3 },
  { word:'hippo', phonetic:'/ˈhɪpəʊ/', pos:'noun', def:'A large heavy animal with thick skin that lives near rivers in Africa.', ex:'The hippo opened its huge mouth wide.', kn:'ನೀರಾನೆ', hi:'दरियाई घोड़ा', age:2, lvl:2 },
  { word:'cheetah', phonetic:'/ˈtʃiːtə/', pos:'noun', def:'The fastest land animal, with black spots on yellow fur.', ex:'The cheetah ran faster than any other animal.', kn:'ಚಿರತೆ', hi:'चीता', age:3, lvl:3 },
  { word:'gorilla', phonetic:'/ɡəˈrɪlə/', pos:'noun', def:'The largest type of ape, with black fur, that lives in African forests.', ex:'The gorilla beat its chest and roared.', kn:'ಗೊರಿಲ್ಲಾ', hi:'गोरिल्ला', age:3, lvl:3 },
  { word:'panda', phonetic:'/ˈpændə/', pos:'noun', def:'A large black-and-white bear from China that eats bamboo.', ex:'The panda chewed on a piece of bamboo.', kn:'ಪಾಂಡಾ', hi:'पांडा', age:2, lvl:2 },
  { word:'koala', phonetic:'/kəʊˈɑːlə/', pos:'noun', def:'A fluffy grey animal from Australia that lives in eucalyptus trees.', ex:'The koala slept in the fork of the tree.', kn:'ಕೋಆಲಾ', hi:'कोआला', age:2, lvl:2 },
  { word:'flamingo', phonetic:'/fləˈmɪŋɡəʊ/', pos:'noun', def:'A tall pink bird with long legs that stands in shallow water.', ex:'A flock of flamingos stood in the pink lake.', kn:'ಫ್ಲೆಮಿಂಗೋ', hi:'राजहंस', age:3, lvl:3 },
  { word:'ostrich', phonetic:'/ˈɒstrɪtʃ/', pos:'noun', def:'The largest bird in the world, with long legs. It cannot fly but can run very fast.', ex:'The ostrich ran across the open grassland.', kn:'ಉಷ್ಟ್ರಪಕ್ಷಿ', hi:'शुतुरमुर्ग', age:3, lvl:3 },
  { word:'whale', phonetic:'/weɪl/', pos:'noun', def:'The largest animal in the world, a mammal that lives in the ocean.', ex:'The blue whale swam slowly through the deep ocean.', kn:'ತಿಮಿಂಗಿಲ', hi:'व्हेल', age:2, lvl:2 },
  { word:'dolphin', phonetic:'/ˈdɒlfɪn/', pos:'noun', def:'A clever and friendly sea animal that breathes air and loves to jump.', ex:'The dolphin leaped high out of the water.', kn:'ಡಾಲ್ಫಿನ್', hi:'डॉल्फिन', age:2, lvl:2 },
  { word:'octopus', phonetic:'/ˈɒktəpəs/', pos:'noun', def:'A sea creature with eight long arms called tentacles.', ex:'The octopus used its tentacles to catch a crab.', kn:'ಆಕ್ಟೋಪಸ್', hi:'ऑक्टोपस', age:3, lvl:3 },
  { word:'crab', phonetic:'/kræb/', pos:'noun', def:'A sea creature with a hard shell, claws, and ten legs that walks sideways.', ex:'The crab scuttled sideways across the sand.', kn:'ಏಡಿ', hi:'केकड़ा', age:2, lvl:2 },
  { word:'seal', phonetic:'/siːl/', pos:'noun', def:'A smooth furry sea animal with flippers that can swim and clap.', ex:'The seal balanced a ball on its nose.', kn:'ಸೀಲ್', hi:'सील', age:2, lvl:2 },
  { word:'seahorse', phonetic:'/ˈsiːhɔːrs/', pos:'noun', def:'A tiny fish shaped like a horse that swims upright in the sea.', ex:'The seahorse wrapped its tail around the seaweed.', kn:'ಸಮುದ್ರ ಕುದುರೆ', hi:'समुद्री घोड़ा', age:3, lvl:3 },
  { word:'starfish', phonetic:'/ˈstɑːrfɪʃ/', pos:'noun', def:'A star-shaped sea animal with five arms that lives on the ocean floor.', ex:'She found a bright orange starfish on the beach.', kn:'ನಕ್ಷತ್ರ ಮೀನು', hi:'समुद्री तारा', age:2, lvl:2 },
  { word:'dragonfly', phonetic:'/ˈdræɡənflaɪ/', pos:'noun', def:'A large flying insect with long wings that hovers over water.', ex:'A blue dragonfly hovered above the pond.', kn:'ಜಲಹಸ್ತಿ ಕ್ರಿಮಿ', hi:'ड्रैगनफ्लाई', age:3, lvl:3 },
  { word:'grasshopper', phonetic:'/ˈɡrɑːshɒpər/', pos:'noun', def:'A green jumping insect that makes a chirping sound in fields and grass.', ex:'The grasshopper jumped from one blade of grass to another.', kn:'ಮಿಡತೆ', hi:'टिड्डा', age:3, lvl:3 },
  { word:'ladybug', phonetic:'/ˈleɪdibʌɡ/', pos:'noun', def:'A small round red beetle with black spots. Many people think it brings good luck.', ex:'A red ladybug landed on her finger.', kn:'ಲೇಡಿ ಬಗ್', hi:'सोनपंखी', age:2, lvl:3 },
  { word:'waterfall', phonetic:'/ˈwɔːtəfɔːl/', pos:'noun', def:'Water that falls from a high place like a cliff down to the ground below.', ex:'We heard the roar of the waterfall before we saw it.', kn:'ಜಲಪಾತ', hi:'झरना', age:3, lvl:3 },
  { word:'desert', phonetic:'/ˈdɛzərt/', pos:'noun', def:'A very dry, sandy area of land where it rarely rains and very few plants grow.', ex:'The camel walked for days through the hot desert.', kn:'ಮರುಭೂಮಿ', hi:'रेगिस्तान', age:3, lvl:3 },
  { word:'thunder', phonetic:'/ˈθʌndər/', pos:'noun', def:'The loud booming sound that comes after a flash of lightning during a storm.', ex:'The children covered their ears when they heard the loud thunder.', kn:'ಗುಡುಗು', hi:'गड़गड़ाहट', age:2, lvl:3 },
  { word:'lightning', phonetic:'/ˈlaɪtnɪŋ/', pos:'noun', def:'A bright flash of electricity in the sky during a storm.', ex:'We saw lightning flash across the dark sky.', kn:'ಮಿಂಚು', hi:'बिजली', age:3, lvl:3 },
  { word:'telescope', phonetic:'/ˈtɛlɪskəʊp/', pos:'noun', def:'An instrument you look through to see things that are very far away, like stars.', ex:'He used a telescope to look at the craters on the moon.', kn:'ದೂರದರ್ಶಕ', hi:'दूरबीन', age:4, lvl:4 },
  { word:'astronaut', phonetic:'/ˈæstrənɔːt/', pos:'noun', def:'A person who travels into outer space in a spacecraft.', ex:'The astronaut floated weightlessly inside the space station.', kn:'ಗಗನಯಾತ್ರಿ', hi:'अंतरिक्ष यात्री', age:4, lvl:4 },
  { word:'asteroid', phonetic:'/ˈæstərɔɪd/', pos:'noun', def:'A large rock that travels through space and orbits the sun.', ex:'Scientists tracked the asteroid as it passed near Earth.', kn:'ಕ್ಷುದ್ರಗ್ರಹ', hi:'क्षुद्रग्रह', age:5, lvl:5 },
  { word:'satellite', phonetic:'/ˈsætəlaɪt/', pos:'noun', def:'An object that travels around a planet. Moons are natural satellites; we also send machines into space to orbit Earth.', ex:'The satellite sends TV signals to homes around the world.', kn:'ಉಪಗ್ರಹ', hi:'उपग्रह', age:5, lvl:5 },
];

function makeEntry(p) {
  return {
    word: p.word,
    phonetic: p.phonetic,
    audio_url: '',
    meanings: [{ partOfSpeech: p.pos, definitions: [{ definition: p.def, example: p.ex, synonyms: [], antonyms: [] }] }],
    origin: '',
    kannada_translation: p.kn,
    hindi_translation: p.hi,
    is_age_appropriate: true,
    min_age: p.age,
    complexity_level: p.lvl,
    search_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const existing = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
const existingSet = new Set(existing.map(w => w.word.toLowerCase()));
let added = 0;
for (const p of PATCHES) {
  if (!existingSet.has(p.word)) {
    existing.push(makeEntry(p));
    added++;
  }
}
fs.writeFileSync(SEED_PATH, JSON.stringify(existing, null, 2));
console.log(`Added ${added} words. Total: ${existing.length}`);
