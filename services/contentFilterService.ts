const INAPPROPRIATE_WORDS = [
  'sex', 'sexy', 'porn', 'xxx', 'nude', 'naked', 'dick', 'cock', 'pussy', 'vagina', 'penis',
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 'crap', 'piss', 'slut', 'whore',
  'drug', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'alcohol', 'beer', 'wine', 'vodka',
  'kill', 'murder', 'suicide', 'death', 'die', 'gun', 'weapon', 'bomb', 'terrorist',
  'rape', 'abuse', 'violence', 'blood', 'gore', 'horror',
];

const ADULT_CONTENT_PATTERNS = [
  /\b(sex|sexual|sexually)\b/i,
  /\b(porn|pornography|pornographic)\b/i,
  /\b(nude|naked|nudity)\b/i,
  /\b(erotic|erotica)\b/i,
  /\b(adult\s+content|mature\s+content)\b/i,
  /\b(explicit|nsfw)\b/i,
  /\b(genitals?|genitalia)\b/i,
  /\b(intercourse|copulation)\b/i,
  /\b(masturbat(e|ion|ing))\b/i,
  /\b(orgasm|climax)\b/i,
  /\b(fetish|kink)\b/i,
];

const VIOLENCE_PATTERNS = [
  /\b(kill(ing|ed)?|murder(ed|ing)?|assassination)\b/i,
  /\b(suicide|suicidal)\b/i,
  /\b(weapon|gun|rifle|pistol|firearm)\b/i,
  /\b(bomb|explosive|grenade)\b/i,
  /\b(terrorist|terrorism)\b/i,
  /\b(torture|torturing|tortured)\b/i,
  /\b(gore|gory|bloody)\b/i,
];

const DRUG_PATTERNS = [
  /\b(drug|narcotic|substance\s+abuse)\b/i,
  /\b(cocaine|heroin|methamphetamine|ecstasy)\b/i,
  /\b(marijuana|cannabis|weed|pot)\b/i,
  /\b(alcohol|alcoholic|intoxicated|drunk)\b/i,
  /\b(smoking|cigarette|tobacco)\b/i,
  /\b(injection|needle|syringe)\b/i,
];

const AGE_APPROPRIATE_CATEGORIES = {
  '2-5': {
    maxComplexity: 3,
    allowedCategories: ['animals', 'colors', 'shapes', 'food', 'family', 'toys', 'body parts (basic)', 'nature'],
    blockedWords: [...INAPPROPRIATE_WORDS],
  },
  '6-8': {
    maxComplexity: 5,
    allowedCategories: ['animals', 'colors', 'shapes', 'food', 'family', 'school', 'sports', 'nature', 'science (basic)'],
    blockedWords: [...INAPPROPRIATE_WORDS],
  },
  '9-12': {
    maxComplexity: 7,
    allowedCategories: ['all except adult content'],
    blockedWords: [...INAPPROPRIATE_WORDS],
  },
  '13+': {
    maxComplexity: 10,
    allowedCategories: ['all'],
    blockedWords: [...INAPPROPRIATE_WORDS.slice(0, 20)],
  },
};

export interface ContentFilterResult {
  isAppropriate: boolean;
  reason?: string;
  severity?: 'high' | 'medium' | 'low';
}

export const contentFilterService = {
  isWordAppropriate(word: string, age: number): ContentFilterResult {
    const normalizedWord = word.toLowerCase().trim();

    if (normalizedWord.length < 2) {
      return {
        isAppropriate: false,
        reason: 'Word too short',
        severity: 'low',
      };
    }

    const ageGroup = this.getAgeGroup(age);
    const blockedWords = AGE_APPROPRIATE_CATEGORIES[ageGroup].blockedWords;

    if (blockedWords.includes(normalizedWord)) {
      return {
        isAppropriate: false,
        reason: 'Inappropriate word for age group',
        severity: 'high',
      };
    }

    for (const pattern of ADULT_CONTENT_PATTERNS) {
      if (pattern.test(normalizedWord)) {
        return {
          isAppropriate: false,
          reason: 'Adult content detected',
          severity: 'high',
        };
      }
    }

    for (const pattern of VIOLENCE_PATTERNS) {
      if (pattern.test(normalizedWord)) {
        return {
          isAppropriate: false,
          reason: 'Violent content detected',
          severity: 'high',
        };
      }
    }

    for (const pattern of DRUG_PATTERNS) {
      if (pattern.test(normalizedWord)) {
        return {
          isAppropriate: false,
          reason: 'Drug-related content detected',
          severity: 'high',
        };
      }
    }

    return { isAppropriate: true };
  },

  filterDefinition(definition: string, age: number): ContentFilterResult {
    const normalizedDef = definition.toLowerCase();

    for (const pattern of ADULT_CONTENT_PATTERNS) {
      if (pattern.test(normalizedDef)) {
        return {
          isAppropriate: false,
          reason: 'Adult content in definition',
          severity: 'high',
        };
      }
    }

    for (const pattern of VIOLENCE_PATTERNS) {
      if (pattern.test(normalizedDef)) {
        return {
          isAppropriate: false,
          reason: 'Violent content in definition',
          severity: 'high',
        };
      }
    }

    for (const pattern of DRUG_PATTERNS) {
      if (pattern.test(normalizedDef)) {
        return {
          isAppropriate: false,
          reason: 'Drug-related content in definition',
          severity: 'high',
        };
      }
    }

    const ageGroup = this.getAgeGroup(age);
    const blockedWords = AGE_APPROPRIATE_CATEGORIES[ageGroup].blockedWords;

    for (const word of blockedWords) {
      if (normalizedDef.includes(word)) {
        return {
          isAppropriate: false,
          reason: 'Inappropriate content in definition',
          severity: 'medium',
        };
      }
    }

    return { isAppropriate: true };
  },

  filterExample(example: string, age: number): ContentFilterResult {
    return this.filterDefinition(example, age);
  },

  getAgeGroup(age: number): keyof typeof AGE_APPROPRIATE_CATEGORIES {
    if (age >= 2 && age <= 5) return '2-5';
    if (age >= 6 && age <= 8) return '6-8';
    if (age >= 9 && age <= 12) return '9-12';
    return '13+';
  },

  getMaxComplexityForAge(age: number): number {
    const ageGroup = this.getAgeGroup(age);
    return AGE_APPROPRIATE_CATEGORIES[ageGroup].maxComplexity;
  },

  sanitizeSearchQuery(query: string, age: number): { sanitized: string; isBlocked: boolean } {
    const normalizedQuery = query.trim();

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return { sanitized: '', isBlocked: true };
    }

    const words = normalizedQuery.split(/\s+/);
    const filteredWords: string[] = [];
    let hasBlockedContent = false;

    for (const word of words) {
      const filterResult = this.isWordAppropriate(word, age);
      if (filterResult.isAppropriate) {
        filteredWords.push(word);
      } else if (filterResult.severity === 'high') {
        hasBlockedContent = true;
      }
    }

    return {
      sanitized: filteredWords.join(' '),
      isBlocked: hasBlockedContent || filteredWords.length === 0,
    };
  },

  filterDictionaryEntry(entry: any, age: number): any | null {
    const wordCheck = this.isWordAppropriate(entry.word, age);
    if (!wordCheck.isAppropriate) {
      return null;
    }

    if (entry.definition) {
      const defCheck = this.filterDefinition(entry.definition, age);
      if (!defCheck.isAppropriate) {
        return null;
      }
    }

    if (entry.example_sentence) {
      const exampleCheck = this.filterExample(entry.example_sentence, age);
      if (!exampleCheck.isAppropriate) {
        entry.example_sentence = null;
      }
    }

    return entry;
  },

  getBlockedMessage(age: number): string {
    if (age <= 8) {
      return "Oops! That word isn't in our kid-friendly dictionary. Try searching for something else!";
    } else {
      return "This word may not be appropriate for your age. Please try a different word.";
    }
  },

  filterMeanings(meanings: any[], age: number): any[] {
    return meanings.map(meaning => {
      const filteredDefinitions = meaning.definitions
        .map((def: any) => {
          const defCheck = this.filterDefinition(def.definition, age);
          if (!defCheck.isAppropriate) {
            return null;
          }

          if (def.example) {
            const exampleCheck = this.filterExample(def.example, age);
            if (!exampleCheck.isAppropriate) {
              def = { ...def, example: '' };
            }
          }

          if (def.synonyms && def.synonyms.length > 0) {
            def.synonyms = def.synonyms.filter((syn: string) =>
              this.isWordAppropriate(syn, age).isAppropriate
            );
          }

          if (def.antonyms && def.antonyms.length > 0) {
            def.antonyms = def.antonyms.filter((ant: string) =>
              this.isWordAppropriate(ant, age).isAppropriate
            );
          }

          return def;
        })
        .filter((def: any) => def !== null);

      return {
        ...meaning,
        definitions: filteredDefinitions
      };
    }).filter(meaning => meaning.definitions.length > 0);
  },
};
