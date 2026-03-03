Month 1: Vocabulary Mastery

1.1 Daily Word Challenge
What: Give kids a fun daily challenge to earn a streak badge by correctly using 3 new words in context.
AI Approach: Supabase Edge Function generates a daily challenge set from cached_words based on kid_profile difficulty level; progress stored in new daily_challenges table.
How it works:
  - Kid opens app and sees today's challenge card with 3 words to learn
  - For each word, kid answers a simple fill-in-the-blank or tap-the-meaning quiz
  - Completing all 3 unlocks a streak badge and updates their profile streak counter
Files: New supabase/functions/daily-challenge/index.ts, New app/(tabs)/challenge.tsx, New app/components/StreakBadge.tsx, update supabase/migrations/add_daily_challenges.sql, update app/(tabs)/_layout.tsx
Cost: $0
Impact: HIGH

1.2 Word Mastery Levels
What: Let kids visually see their progress on each word through Seen → Practiced → Mastered tiers.
AI Approach: New word_progress table in Supabase tracks attempt counts and correct responses per kid_profile per word; mastery logic runs in a lightweight service.
How it works:
  - Every quiz interaction writes a result row to word_progress
  - app/services/masteryService.ts computes current tier (Seen/Practiced/Mastered) from attempt history
  - Word cards in app/word/[id].tsx and favorites.tsx show a colored tier badge
Files: New app/services/masteryService.ts, New app/components/MasteryBadge.tsx, update app/word/[id].tsx, update app/(tabs)/favorites.tsx, update supabase/migrations/add_word_progress.sql
Cost: $0
Impact: HIGH

1.3 Parent Progress Report
What: Give parents a weekly summary email showing which words their child learned and how many challenges they completed.
AI Approach: Supabase scheduled Edge Function queries word_progress and daily_challenges per kid_profile and sends a formatted email via Resend's free tier.
How it works:
  - Every Sunday a cron-triggered Edge Function aggregates the week's learning data
  - A parent-friendly HTML email is generated listing mastered words, streak, and time spent
  - Parents can toggle the report on/off in app/(tabs)/settings.tsx
Files: New supabase/functions/weekly-report/index.ts, update app/(tabs)/settings.tsx, update supabase/migrations/add_report_prefs.sql
Cost: $0
Impact: MEDIUM

Month 2: Engagement & Personalization

2.1 Word Collections (Themed Packs)
What: Let kids and parents browse curated word packs by theme (Animals, Space, Sports) to direct learning around interests.
AI Approach: New word_collections and collection_words tables in Supabase; fetch-dictionary Edge Function extended to tag words by theme; a browsable pack gallery screen.
How it works:
  - Admin seeds themed collections in Supabase; each pack has a cover emoji and difficulty tag
  - New app/(tabs)/explore.tsx renders a grid of pack cards filterable by theme
  - Selecting a pack queues its words into the learn flow in app/(tabs)/learn.tsx
Files: New app/(tabs)/explore.tsx, New app/components/CollectionCard.tsx, New app/services/collectionsService.ts, update supabase/functions/fetch-dictionary/index.ts, update supabase/migrations/add_collections.sql, update app/(tabs)/_layout.tsx
Cost: $0
Impact: HIGH

2.2 Pronunciation Audio Playback
What: Let kids tap any word to hear it pronounced correctly, building phonics skills alongside vocabulary.
AI Approach: Supabase Edge Function calls a free TTS API (e.g. Web Speech API on device or Google Cloud TTS free tier) and caches the audio URL in cached_words to avoid repeat calls.
How it works:
  - app/word/[id].tsx shows a speaker icon button next to the word
  - On first tap, fetch-dictionary Edge Function is extended to fetch and cache an audio URL in cached_words
  - Subsequent taps play directly from the cached URL with no API call
Files: New app/components/PronounceButton.tsx, New app/services/audioService.ts, update app/word/[id].tsx, update supabase/functions/fetch-dictionary/index.ts, update supabase/migrations/add_audio_url_to_cached_words.sql
Cost: $0
Impact: HIGH

2.3 Multiple Kid Profiles
What: Allow a single parent account to manage up to 4 child profiles, each with their own words, progress, and difficulty setting.
AI Approach: kid_profiles table already exists; add parent_id foreign key and profile switcher UI so one login manages multiple children.
How it works:
  - Settings screen shows a "Manage Profiles" section listing existing kid_profiles tied to the account
  - Parent can add/edit/delete profiles; each profile stores name, avatar emoji, and difficulty
  - A profile switcher chip appears at the top of app/(tabs)/index.tsx to change active child
Files: New app/components/ProfileSwitcher.tsx, New app/components/ProfileCard.tsx, update app/(tabs)/settings.tsx, update app/(tabs)/index.tsx, update app/services/profileService.ts, update supabase/migrations/add_parent_id_to_kid_profiles.sql
Cost: $0
Impact: MEDIUM

Month 3: Social & Motivation

3.1 Achievement Badges Gallery
What: Reward kids with collectible badges for milestones like "First 10 Words", "7-Day Streak", and "Space Pack Complete".
AI Approach: New badges and kid_badges tables in Supabase; a badge-evaluator Edge Function runs after each session to check unlock conditions; a trophy room screen displays earned badges.
How it works:
  - badge-evaluator Edge Function checks milestone conditions against word_progress and daily_challenges after each session
  - Newly unlocked badges trigger a confetti animation on app/(tabs)/index.tsx
  - New app/(tabs)/trophies.tsx shows a grid of all badges, greyed-out until earned
Files: New supabase/functions/badge-evaluator/index.ts, New app/(tabs)/trophies.tsx, New app/components/BadgeCard.tsx, New app/services/badgesService.ts, update app/(tabs)/index.tsx, update app/(tabs)/_layout.tsx, update supabase/migrations/add_badges.sql
Cost: $0
Impact: HIGH

3.2 Word-of-the-Day Widget (Home Screen)
What: Surface a fresh word every morning so kids engage with the app even on days they don't open it for a full session.
AI Approach: Supabase Edge Function selects a daily word per kid_profile difficulty and exposes it via a public endpoint; Expo widget or deep-link notification delivers it to the home screen.
How it works:
  - A cron Edge Function selects and caches today's word per difficulty tier in Supabase at midnight
  - App uses Expo Notifications to send a morning push with the word and a fun emoji clue
  - Tapping the notification deep-links directly to app/word/[id].tsx for that word
Files: New supabase/functions/word-of-the-day/index.ts, New app/services/notificationService.ts, update app/(tabs)/settings.tsx (notification opt-in toggle), update app/word/[id].tsx
Cost: $0
Impact: HIGH

3.3 Custom Word Lists (Teacher/Parent Mode)
What: Let parents or teachers add their own vocabulary words (e.g. spelling test prep) so the app serves schoolwork, not just general learning.
AI Approach: New custom_words table in Supabase linked to kid_profiles; a simple add-word form in settings lets adults input word + definition; custom words appear in learn.tsx alongside dictionary words.
How it works:
  - Settings screen gains a "Custom Words" section with a form to add word, definition, and optional example sentence
  - custom_words rows are fetched by app/services/wordsService.ts and merged into the learn queue
  - Kid sees custom words indistinguishable from dictionary words; parent sees them tagged "Added by you"
Files: New app/components/AddWordForm.tsx, New app/services/customWordsService.ts, update app/(tabs)/settings.tsx, update app/(tabs)/learn.tsx, update supabase/migrations/add_custom_words.sql
Cost: $0
Impact: MEDIUM

