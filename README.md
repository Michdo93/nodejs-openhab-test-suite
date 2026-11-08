# nodejs-openhab-test-suite

Tests for openHAB items, things, rules, links, persistence and sitemaps – in Node.js, for test runners, CI pipelines, cron jobs and pre-flight checks before a service starts. For the browser there is a separate library, [js-openhab-test-suite](https://github.com/Michdo93/js-openhab-test-suite).

It mirrors [openhab-test-suite](https://github.com/Michdo93/openhab-test-suite) (Python): **same classes, same methods, same parameters.** It is built on [nodejs-openhab-rest-client](https://github.com/Michdo93/nodejs-openhab-rest-client) ≥ 2.0.0. Every check and test method resolves to `true` or `false`.

## Installation

Node.js 18 or newer. Install the client library (peer dependency) and the test suite:

```sh
npm install github:Michdo93/nodejs-openhab-rest-client github:Michdo93/nodejs-openhab-test-suite
```

ES module and CommonJS are both supported, TypeScript declarations are included.

## Example

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenHABClient } from "nodejs-openhab-rest-client";
import { ItemTester, ThingTester, RuleTester } from "nodejs-openhab-test-suite";
// CommonJS: const { ItemTester } = require("nodejs-openhab-test-suite");

const client = new OpenHABClient(process.env.OPENHAB_URL, null, null, process.env.OPENHAB_TOKEN);

test("living room", async () => {
  const items = new ItemTester(client);
  assert.ok(await items.checkItemIsType("Wohnzimmer_Temperatur", "Number:Temperature"));
  assert.ok(await items.testSwitch("Wohnzimmer_Licht", "ON", "ON", 5));
  assert.ok(await new ThingTester(client).isThingOnline("astro:sun:zuhause"));
  assert.ok(await new RuleTester(client).testRuleExecution("restbuch-1", "Haus_Status", "Nachtruhe"));
});
```

Run it with `node --test`. The `test…` methods of `ItemTester` open an event stream, send the command (an update for Contact and Location), wait up to `timeout` seconds for the expected state and restore the previous state afterwards. `expectedState` may also be an array of accepted states, e.g. `["23 °C", "23.0 °C"]`. Diagnostics go to `console.log` / `console.error`, as the Python version prints them.

## Reference

### ItemTester

| Method | Returns `true` if … |
|---|---|
| `doesItemExist(itemName)` | the item exists |
| `checkItemIsType(itemName, itemType)` | the item has the type – base type (`"Number"`) or with dimension (`"Number:Temperature"`) |
| `checkItemHasState(itemName, state)` | the item currently has the state |
| `isGroupItem(itemName)` | the item is a group |
| `getGroupMembers(groupName)` | *(returns the member list)* |
| `doesGroupContainMember(groupName, memberName)` | the group contains the member |
| `checkGroupMemberState(groupName, memberName, expectedState)` | the member has the state |
| `testSwitch / testDimmer / testColor / testRollershutter / testNumber / testString / testPlayer / testDateTime / testImage (itemName, command, expectedState = null, timeout = 10)` | the command leads to the expected state |
| `testContact(itemName, update = null, expectedState = null, timeout = 10)`, `testLocation(itemName, update, …)` | the update leads to the expected state |
| `ItemTester.isValidSwitchValue(v)` … `isValidImageValue(v)` | static validators (also as `_isValid…`, the Python names) |

### ThingTester

`getThingStatus(thingUID)` (returns the status or `"UNKNOWN"`), `isThingStatus(thingUID, status)`, `isThingOnline`, `isThingOffline`, `isThingPending`, `isThingUnknown`, `isThingUninitialized`, `isThingError`, `enableThing`, `disableThing`

### RuleTester

`runRule(ruleUID, contextData = null)`, `enableRule`, `disableRule`, `testRuleExecution(ruleUID, expectedItem, expectedValue, waitSeconds = 2)`, `isRuleActive`, `isRuleDisabled`, `isRuleRunning`, `isRuleIdle`, `getRuleStatus` (returns `{ status, statusDetail, editable, name, uid }` or `{}`)

### ChannelTester

`isItemLinkedToChannel(itemName, channelUID)`, `getLinksForItem(itemName)` (returns the links), `isItemLinkedToAnyChannel(itemName)`, `hasOrphanedLinks()`

### PersistenceTester

`isItemPersisted(serviceID, itemName)`, `hasDataInRange(serviceID, itemName, startTime, endTime)` (ISO strings or `Date`), `checkLastPersistedState(serviceID, itemName, expectedState)`

### SitemapTester

`doesSitemapExist(sitemapName)`, `doesSitemapContainItem(sitemapName, itemName)`

## Upgrading from 1.x

- Requires nodejs-openhab-rest-client ≥ 2.0.0 (results as `{ error }` instead of exceptions).
- Testers take the client directly: `new ItemTester(client)`. The 1.x workaround with `client._lib` is gone.
- Unknown things and rules now give `false` (1.x reported `true` for `enableThing`, `enableRule`, `runRule` and `isRuleActive` with an unknown UID).
- `checkItemIsType` accepts types with dimension (`"Number:Temperature"`), validators accept the number 0, `hasDataInRange` really filters by time, and a test waits for devices that confirm late.

## Development

```sh
npm run build   # dist/esm, dist/cjs, dist/types from src/index.js
npm test        # unit tests; integration tests run when OPENHAB_URL and OPENHAB_TOKEN are set
```

The integration tests expect the exercise configuration of the book series "openHAB REST API" (items, astro thing, rule `restbuch-1`, sitemap `restbuch`, persistence `inmemory`).

## License

MIT – see [LICENSE](LICENSE).
