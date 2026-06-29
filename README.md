# nodejs-openhab-test-suite

A Node.js testing library for validating openHAB installations.
Mirrors the Python [openhab-test-suite](https://github.com/Michdo93/openhab-test-suite):
same class names, same method names.

Powered by [nodejs-openhab-rest-client](https://github.com/Michdo93/nodejs-openhab-rest-client).

## Classes

| Class | Description |
|---|---|
| `ItemTester` | Validates item types, sends commands, verifies state via SSE, auto-resets |
| `ThingTester` | Checks Thing status (ONLINE/OFFLINE/…), enables/disables Things |
| `RuleTester` | Runs rules, enables/disables, checks status |
| `ChannelTester` | Verifies item-channel links and orphaned links |
| `PersistenceTester` | Checks item registration and historical data |
| `SitemapTester` | Verifies sitemap existence and item references |

## Requirements

- Node.js ≥ 18
- `nodejs-openhab-rest-client` as peer dependency

## Installation

```bash
npm install nodejs-openhab-test-suite nodejs-openhab-rest-client
```

## Usage

```javascript
// ESM
import { OpenHABClient, Items, Things, Rules,
         Links, Persistence, Sitemaps, ItemEvents }
  from "nodejs-openhab-rest-client";
import { ItemTester, ThingTester, RuleTester,
         ChannelTester, PersistenceTester, SitemapTester }
  from "nodejs-openhab-test-suite";

const raw = new OpenHABClient("http://127.0.0.1:8080", "openhab", "habopen");
await raw.login();

// Attach API instances
raw._items       = new Items(raw);
raw._things      = new Things(raw);
raw._rules       = new Rules(raw);
raw._links       = new Links(raw);
raw._persistence = new Persistence(raw);
raw._sitemaps    = new Sitemaps(raw);
raw._itemEvents  = new ItemEvents(raw);

const items = new ItemTester(raw);
console.log(await items.testSwitch("MySwitch", "ON", "ON", 10)); // true

const things = new ThingTester(raw);
console.log(await things.isThingOnline("astro:sun:local")); // true

const rules = new RuleTester(raw);
await rules.enableRule("my-rule");
await rules.runRule("my-rule");
```

## Build

```bash
npm run build
```

Produces `dist/esm/`, `dist/cjs/`, `dist/types/`.

## Test

```bash
OPENHAB_URL=http://127.0.0.1:8080 OPENHAB_USER=openhab OPENHAB_PASS=habopen \
  npm test
```

## License

MIT
