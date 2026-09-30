# Analytics (disabled by default)

The game contains a cookie-free GoatCounter hook in `extras.js`. It does nothing until a site code
is set in `config.js`:

```js
window.ANALYTICS_CONFIG = { goatcounter: "" };          // off
window.ANALYTICS_CONFIG = { goatcounter: "jtaczala-games" }; // on -> https://jtaczala-games.goatcounter.com
```

When enabled it loads `https://gc.zgo.at/count.js` and records:
- one page view per visit (path `/prad/`, `/power/`, `/strom/`, `/strom/demo/`),
- events `<game>-start` (a round starts) and `<game>-finish` (game-over screen).

GoatCounter sets no cookies and stores no IP address or personal data, so no cookie banner is
needed. One GoatCounter site can be shared by all games (they are separated by path/event name).

To enable: create a free account at https://www.goatcounter.com/signup with the code you chose,
put that code in `config.js` of each repo (and `strom/demo/config.js` if wanted), commit and push.
