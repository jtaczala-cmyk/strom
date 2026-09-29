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
  kitName: "Sponsor-verktøykasse",
  kitBonus: 250,
  tips: [
    "Bruk alltid spenningstester før du tar i noe – også når «den er sikkert frakoblet».",
    "Merk kursene i sikringsskapet. Framtidige deg sier takk.",
    "Riktig verktøy halverer jobben. Feil verktøy dobler den – og kaffepausen.",
    "Jordfeilbryter er billigere enn ambulanse.",
    "Sjekk at kabelen er dimensjonert for lasten – ikke for budsjettet.",
    "Lås og merk før du jobber. Alltid. Også på fredag kl. 15.25."
  ]
};
