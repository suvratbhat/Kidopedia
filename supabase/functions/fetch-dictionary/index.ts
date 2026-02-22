import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  origin?: string;
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
    }>;
  };
}

async function translateWord(word: string, partOfSpeech: string, definition: string, targetLang: string): Promise<string> {
  try {
    console.log(`🔄 Translating "${word}" (${partOfSpeech}) to ${targetLang}...`);

    const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
    if (!apiKey) {
      console.error("❌ GOOGLE_TRANSLATE_API_KEY not configured");
      return "";
    }

    const contextText = `${word} (${partOfSpeech}): ${definition}`;

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: [word, contextText],
        source: "en",
        target: targetLang,
        format: "text"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Translate API error (${response.status}):`, errorText);
      return "";
    }

    const data: GoogleTranslateResponse = await response.json();

    const wordTranslation = data.data.translations[0]?.translatedText || "";
    const contextTranslation = data.data.translations[1]?.translatedText || "";

    console.log(`✅ Word translation to ${targetLang}: "${wordTranslation}"`);
    console.log(`📝 Context translation to ${targetLang}: "${contextTranslation}"`);

    return wordTranslation;
  } catch (error) {
    console.error(`❌ Translation error for ${targetLang}:`, error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const word = url.searchParams.get("word");

    // Debug endpoint to check API key status
    if (url.pathname.includes("/debug")) {
      const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
      return new Response(
        JSON.stringify({
          apiKeyConfigured: !!apiKey,
          apiKeyLength: apiKey ? apiKey.length : 0,
          apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + "..." : "not set",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!word) {
      return new Response(
        JSON.stringify({ error: "Word parameter is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "Word not found", word }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw new Error(`Dictionary API error: ${response.status}`);
    }

    const data: DictionaryEntry[] = await response.json();

    console.log(`📝 Starting translations for word: "${word}"`);

    const firstEntry = data[0];
    const firstMeaning = firstEntry.meanings[0];
    const partOfSpeech = firstMeaning?.partOfSpeech || "word";
    const firstDefinition = firstMeaning?.definitions[0]?.definition || "";

    const kannadaTranslation = await translateWord(word, partOfSpeech, firstDefinition, "kn");
    const hindiTranslation = await translateWord(word, partOfSpeech, firstDefinition, "hi");

    console.log(`📊 Translation results - Kannada: "${kannadaTranslation}", Hindi: "${hindiTranslation}"`);

    const processedData = data.map(entry => ({
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics.find(p => p.text)?.text || "",
      audioUrl: entry.phonetics.find(p => p.audio)?.audio || "",
      meanings: entry.meanings.map(meaning => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.map(def => ({
          definition: def.definition,
          example: def.example || "",
          synonyms: def.synonyms || [],
          antonyms: def.antonyms || [],
        })),
      })),
      origin: entry.origin || "",
      kannadaTranslation,
      hindiTranslation,
    }));

    return new Response(
      JSON.stringify(processedData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching dictionary data:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
