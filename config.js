/* Online leaderboard config (Supabase). Leave empty to keep the leaderboard on this device only.
   See LEADERBOARD_SETUP.md. The anon key is public by design; security comes from RLS policies. */
window.LEADERBOARD_CONFIG = {
  supabaseUrl: "",   // e.g. "https://abcdefghijkl.supabase.co"
  supabaseKey: ""    // publishable key "sb_publishable_..." (or legacy anon key)
};
