import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Fetch all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from("badges")
      .select("*");
    
    if (badgesError) throw badgesError;

    // 2. Fetch earned badges
    const { data: earnedBadges, error: earnedError } = await supabase
      .from("kid_badges")
      .select("badge_id")
      .eq("profile_id", profileId);
    
    if (earnedError) throw earnedError;
    const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id));

    // 3. Fetch progress data
    // Words learned: count words with at least one correct answer
    const { count: wordsLearnedCount, error: countError } = await supabase
      .from("word_progress")
      .select("*", { count: 'exact', head: true })
      .eq("profile_id", profileId)
      .gt("correct_count", 0);

    if (countError) throw countError;

    // Streak data: fetch recent completed daily challenges
    const { data: recentChallenges, error: streakError } = await supabase
      .from("daily_challenges")
      .select("challenge_date, completed")
      .eq("profile_id", profileId)
      .eq("completed", true)
      .order("challenge_date", { ascending: false })
      .limit(30);

    if (streakError) throw streakError;

    let currentStreak = 0;
    if (recentChallenges.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let checkDate = today;
      let found = true;
      let firstCheck = true;

      while (found) {
        const challenge = recentChallenges.find(c => c.challenge_date === checkDate);
        if (challenge) {
          currentStreak++;
          const nextCheckDate = new Date(checkDate);
          nextCheckDate.setDate(nextCheckDate.getDate() - 1);
          checkDate = nextCheckDate.toISOString().split('T')[0];
          firstCheck = false;
        } else {
          if (firstCheck && checkDate === today) {
            checkDate = yesterday;
            firstCheck = false;
          } else {
            found = false;
          }
        }
      }
    }

    // 4. Evaluate each badge
    const newlyUnlocked = [];
    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const cond = badge.unlock_condition;
      let unlocked = false;

      if (cond.type === 'words_learned') {
        if ((wordsLearnedCount || 0) >= cond.count) {
          unlocked = true;
        }
      } else if (cond.type === 'streak') {
        if (currentStreak >= cond.days) {
          unlocked = true;
        }
      } else if (cond.type === 'pack_completion') {
        // Pack completion logic could be added here
        // For now, let's assume it's not unlocked unless we have a pack_progress table
      }

      if (unlocked) {
        newlyUnlocked.push(badge);
      }
    }

    // 5. Insert newly unlocked badges
    if (newlyUnlocked.length > 0) {
      const { error: insertError } = await supabase
        .from("kid_badges")
        .insert(
          newlyUnlocked.map(b => ({
            profile_id: profileId,
            badge_id: b.id
          }))
        );
      
      if (insertError) {
        console.error("Error inserting newly unlocked badges:", insertError);
        // If we hit a race condition/unique constraint, we can ignore it or just continue
      }
    }

    return new Response(
      JSON.stringify({ newlyUnlocked }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("badge-evaluator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
