# Analytics (GoatCounter – enabled)

The game counts visits with GoatCounter, cookie-free and anonymous. Site code in `config.js`:

```js
window.ANALYTICS_CONFIG = { goatcounter: "jtaczala-games" };  // on  -> https://jtaczala-games.goatcounter.com
window.ANALYTICS_CONFIG = { goatcounter: "" };                // off
```

`count.js` is self-hosted (unmodified copy of https://gc.zgo.at/count.js, ISC licence, in the repo root);
nothing is loaded from gc.zgo.at. The only external request is the hit sent to
`https://jtaczala-games.goatcounter.com/count`. It records:
- one page view per visit (path `/prad/`, `/power/`, `/strom/`),
- events `<game>-start` (a round starts) and `<game>-finish` (game-over screen).

GoatCounter sets no cookies, stores nothing in the browser and stores no IP address or personal data
(IP + user agent are only kept in memory for up to 8 hours to count unique visits), so no cookie banner is
needed. Legal basis given on the privacy pages: legitimate interest, Art. 6(1)(f) GDPR. The privacy pages (`/prad/prywatnosc/`, `/power/privacy/`, `/strom/personvern/`) describe this. To turn it off, set the code to `""` in `config.js`.
To update `count.js`, download the new version from https://gc.zgo.at/count.js.
