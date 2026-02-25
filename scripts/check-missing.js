const w = require('../assets/data/seed-words.json');
console.log('Total:', w.length);
const s = new Set(w.map(x => x.word));
const check = ['strawberry','watermelon','pineapple','cherry','coconut','peach','pear','plum',
  'papaya','guava','kiwi','giraffe','zebra','crocodile','hippo','rhinoceros','cheetah',
  'gorilla','panda','penguin','kangaroo','koala','flamingo','ostrich','whale','dolphin',
  'shark','octopus','crab','jellyfish','seal','seahorse','starfish','dragonfly',
  'grasshopper','ladybug','firefly','bedroom','bathroom','kitchen','refrigerator',
  'waterfall','desert','thunder','lightning','volcano','glacier','motorcycle',
  'helicopter','submarine','ambulance','telescope','astronaut','asteroid','satellite'];
const missing = check.filter(t => !s.has(t));
console.log('Missing key words:', missing.join(', '));
