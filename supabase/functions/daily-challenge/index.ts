import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChallengeWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  options: string[]; // 4 choices for multiple-choice quiz
  correctIndex: number;
}

interface DailyChallengeResponse {
  date: string;
  profileId: string;
  words: ChallengeWord[];
  alreadyCompleted: boolean;
  answersGiven: Record<string, boolean>;
}

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Pick `count` random elements from an array without repetition. */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build 4-choice options for a word:
 * - 1 correct definition (the real one)
 * - 3 distractors drawn from other words in the pool
 */
function buildOptions(
  correctDef: string,
  pool: Array<{ word: string; definition: string }>,
  correctWord: string,
): { options: string[]; correctIndex: number } {
  const distractors = pool
    .filter((w) => w.word !== correctWord)
    .map((w) => w.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const all = [correctDef, ...distractors].sort(() => Math.random() - 0.5);
  return {
    options: all,
    correctIndex: all.indexOf(correctDef),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get("profileId");
    const profileAge = parseInt(url.searchParams.get("age") ?? "8", 10);
    const today = todayISODate();

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── Check if today's challenge already exists ──────────────────────────────
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("profile_id", profileId)
      .eq("challenge_date", today)
      .maybeSingle();

    // Determine complexity range from age (complexity 1-10, age 2-12)
    const maxComplexity = Math.min(10, Math.max(1, Math.round(profileAge * 0.8)));
    const minComplexity = Math.max(1, maxComplexity - 3);

    // ── Fetch age-appropriate words from cached_words ─────────────────────────
    const { data: wordRows, error: wordError } = await supabase
      .from("cached_words")
      .select("id, word, meanings, complexity_level, min_age")
      .eq("is_age_appropriate", true)
      .lte("min_age", profileAge)
      .gte("complexity_level", minComplexity)
      .lte("complexity_level", maxComplexity)
      .limit(50);

    if (wordError) {
      throw new Error(`Failed to fetch words: ${wordError.message}`);
    }

    if (!wordRows || wordRows.length < 3) {
      // Fallback: fetch any age-appropriate words without complexity filter
      const { data: fallback, error: fallbackErr } = await supabase
        .from("cached_words")
        .select("id, word, meanings, complexity_level, min_age")
        .eq("is_age_appropriate", true)
        .lte("min_age", profileAge)
        .limit(50);

      if (fallbackErr || !fallback || fallback.length < 3) {
        return new Response(
          JSON.stringify({ error: "Not enough words in the database for a challenge" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      wordRows!.push(...fallback);
    }

    // ── Build the word pool (word + first definition) ─────────────────────────
    type WordRow = { word: string; meanings: unknown };
    const pool: Array<{ word: string; definition: string }> = (wordRows as WordRow[])
      .map((row) => {
        const meanings = Array.isArray(row.meanings)
          ? row.meanings
          : JSON.parse(typeof row.meanings === "string" ? row.meanings : "[]");
        const firstDef: string =
          meanings[0]?.definitions?.[0]?.definition ?? "";
        return { word: row.word as string, definition: firstDef };
      })
      .filter((w) => w.definition.length > 0);

    if (pool.length < 3) {
      return new Response(
        JSON.stringify({ error: "Not enough words with definitions for a challenge" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── If challenge already exists, reconstruct words deterministically ───────
    // We re-pick the same words that were stored in word_ids
    let selectedWordStrings: string[];

    if (existing) {
      selectedWordStrings = existing.word_ids as string[];
    } else {
      const picked = pickRandom(pool, 3);
      selectedWordStrings = picked.map((w) => w.word);

      // Store the challenge in Supabase
      const { error: insertErr } = await supabase.from("daily_challenges").insert({
        profile_id: profileId,
        challenge_date: today,
        word_ids: selectedWordStrings,
        answers_given: {},
        completed: false,
        badge_unlocked: false,
      });

      if (insertErr && insertErr.code !== "23505") {
        // 23505 = unique violation (already inserted by race condition) — safe to ignore
        console.error("Insert error:", insertErr);
      }
    }

    // ── Build ChallengeWord objects ───────────────────────────────────────────
    type PoolEntry = { word: string; definition: string };
    const poolMap = new Map<string, PoolEntry>(pool.map((w) => [w.word, w]));
    const challengeWords: ChallengeWord[] = selectedWordStrings
      .map((wordStr) => {
        const poolEntry = poolMap.get(wordStr);
        if (!poolEntry) return null;

        // Get part of speech from wordRows
        const wordRow = (wordRows as WordRow[]).find((r) => r.word === wordStr);
        const meanings = Array.isArray(wordRow?.meanings)
          ? wordRow!.meanings
          : JSON.parse(typeof wordRow?.meanings === "string" ? wordRow!.meanings : "[]");
        const partOfSpeech: string = (meanings[0] as { partOfSpeech?: string })?.partOfSpeech ?? "word";

        const { options, correctIndex } = buildOptions(poolEntry.definition, pool, wordStr);

        return {
          word: wordStr,
          definition: poolEntry.definition,
          partOfSpeech,
          options,
          correctIndex,
        } satisfies ChallengeWord;
      })
      .filter((w): w is ChallengeWord => w !== null);

    const answersGiven: Record<string, boolean> = existing?.answers_given ?? {};
    const completed: boolean = existing?.completed ?? false;

    const response: DailyChallengeResponse = {
      date: today,
      profileId,
      words: challengeWords,
      alreadyCompleted: completed,
      answersGiven,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("daily-challenge error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
