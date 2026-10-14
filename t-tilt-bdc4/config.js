/*! Copyright (c) 2026 Stop60. All rights reserved.
 *  Proprietary and not open source: no copying, modification, distribution or commercial use
 *  without prior written permission. Contact: kontakt (at) stop60.no. See LICENSE.
 *  Third-party open-source components keep their own licences, see THIRD-PARTY-NOTICES.md. */
/* Online leaderboard config (Supabase, EU region). Empty values = leaderboard on this device only.
   See LEADERBOARD_SETUP.md. The anon key is public by design; security comes from RLS policies. */
window.LEADERBOARD_CONFIG = {
  supabaseUrl: "https://oqvqvpvlmmyxivqpaifl.supabase.co",   // e.g. "https://abcdefghijkl.supabase.co"
  supabaseKey: "sb_publishable_qnC7OiwBa1HV7H9oBk4I9A_KUUHTOFG"    // publishable key "sb_publishable_..." (or legacy anon key)
};

/* Cookie-free analytics (GoatCounter). Disabled while empty. To enable, put your GoatCounter
   site code here, e.g. "jtaczala-games" for https://jtaczala-games.goatcounter.com  (see ANALYTICS.md). */
window.ANALYTICS_CONFIG = { goatcounter: "jtaczala-games" };
