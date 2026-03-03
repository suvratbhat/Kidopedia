import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const today = todayISODate();

    // Check if we already have words for today
    const { data: existing } = await supabase
      .from("daily_words")
      .select("complexity_level")
      .eq("display_date", today);

    const existingLevels = new Set(existing?.map((e) => e.complexity_level) || []);
    const results = [];

    // We generate words for complexity levels 1 to 10
    for (let level = 1; level <= 10; level++) {
      if (existingLevels.has(level)) {
        continue;
      }

      // Pick a random word for this complexity level
      // We also try to pick words that haven't been picked as daily words recently
      const { data: candidates, error: candidateError } = await supabase
        .from("cached_words")
        .select("id, word")
        .eq("complexity_level", level)
        .eq("is_age_appropriate", true)
        .order("search_count", { ascending: false }) // Prioritize popular-ish words but still randomish
        .limit(100);

      if (candidateError || !candidates || candidates.length === 0) {
        console.warn(`No words found for complexity level ${level}`);
        continue;
      }

      // Pick one randomly from the candidates
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const selectedWord = candidates[randomIndex];

      const { data: inserted, error: insertError } = await supabase
        .from("daily_words")
        .insert({
          word_id: selectedWord.id,
          complexity_level: level,
          display_date: today,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Concurrent insert, ignore
          continue;
        }
        console.error(`Error inserting daily word for level ${level}:`, insertError);
      } else {
        results.push(inserted);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Daily words processed",
        date: today,
        newly_inserted: results.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("word-of-the-day error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
