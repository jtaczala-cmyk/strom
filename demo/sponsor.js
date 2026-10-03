/*! Copyright (c) 2026 Jacek Mariusz Taczała. All rights reserved.
 *  Proprietary and not open source: no copying, modification, distribution or commercial use
 *  without prior written permission. Contact: https://github.com/jtaczala-cmyk/strom/issues. See LICENSE.
 *  Third-party open-source components keep their own licences, see THIRD-PARTY-NOTICES.md. */
/* ============================================================================
   STRØM – SPONSORDEMO · sponsor config
   Swap in a real sponsor by editing ONLY this object:
     name / short / tagline  – texts shown in splash, banners, tips, leaderboard
     colors                  – brand colors (hex)
     logoUrl                 – optional: path/URL to the sponsor's SVG/PNG logo
                               (e.g. "/strom/demo/sponsor-logo.svg"). If null,
                               a simple logo is generated from logoText + colors.
     isExample               – true shows the "Eksempelsponsor" label everywhere
   The current brand is FICTIONAL – no real company is implied.
   ========================================================================== */
window.SPONSOR = {
  name: "Eksempel Elektro AS",
  short: "EKSEMPEL ELEKTRO",
  tagline: "Din lokale elektrogrossist",
  logoText: "EE",
  logoUrl: null,
  isExample: true,
  exampleLabel: "Eksempelsponsor",
  demoBadge: "SPONSORDEMO",
  colors: {
    primary: "#ffc400",   // main brand color (backgrounds, logo)
    secondary: "#0a2a66", // dark brand color (text on primary, van)
    accent: "#39e1ff",    // glow / sparks
    text: "#ffffff"
  },
  kitName: "Sponsorverktøykasse",
  kitBonus: 250,
  tips: [
    "Bruk spenningstester etter NEK EN 61243 – og test den rett før og rett etter spenningskontrollen.",
    "Frakoble, sikre mot innkobling og kontroller spenningsløshet – før du tar i noe.",
    "Lås og merk på alle frakoblingssteder. Egen hengelås, egen nøkkel.",
    "Alltid minst to sikkerhetsbarrierer mellom deg og spenningen.",
    "Verneutstyr etter risikovurderingen – også mot lysbue.",
    "Ved strømulykke: bryt strømmen, ring 113, start HLR – og meld elulykken til DSB."
  ]
};
