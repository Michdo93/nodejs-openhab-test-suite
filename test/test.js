/**
 * Integration test for nodejs-openhab-test-suite.
 * Requires a running openHAB instance with the items defined below.
 *
 * Configure via environment variables:
 *   OPENHAB_URL  (default: http://127.0.0.1:8080)
 *   OPENHAB_USER (default: openhab)
 *   OPENHAB_PASS (default: habopen)
 *   OPENHAB_THING_UID       (default: astro:sun:local)
 *   OPENHAB_RULE_UID        (default: test_color-1)
 *   OPENHAB_PERSISTENCE_SVC (default: rrd4j)
 *   OPENHAB_SITEMAP         (default: default)
 */

import { OpenHABClient, Items, Things, Rules, Links, Persistence, Sitemaps, ItemEvents }
  from "nodejs-openhab-rest-client";
import { ItemTester, ThingTester, RuleTester,
         ChannelTester, PersistenceTester, SitemapTester }
  from "../src/index.js";

const URL       = process.env.OPENHAB_URL  ?? "http://127.0.0.1:8080";
const USER      = process.env.OPENHAB_USER ?? "openhab";
const PASS      = process.env.OPENHAB_PASS ?? "habopen";
const THING_UID = process.env.OPENHAB_THING_UID       ?? "astro:sun:local";
const RULE_UID  = process.env.OPENHAB_RULE_UID         ?? "test_color-1";
const PERS_SVC  = process.env.OPENHAB_PERSISTENCE_SVC  ?? "rrd4j";
const SITEMAP   = process.env.OPENHAB_SITEMAP           ?? "default";

let passed = 0, failed = 0;

function assert(name, val) {
  const ok = val === true || (typeof val !== "boolean" && val != null);
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  ok ? passed++ : failed++;
}

async function buildClientWithAPIs() {
  const raw = new OpenHABClient(URL, USER, PASS);
  await raw.login();
  // Attach API instances so testers can find them
  raw._items       = new Items(raw);
  raw._things      = new Things(raw);
  raw._rules       = new Rules(raw);
  raw._links       = new Links(raw);
  raw._persistence = new Persistence(raw);
  raw._sitemaps    = new Sitemaps(raw);
  raw._itemEvents  = new ItemEvents(raw);
  return raw;
}

// ── Static validator tests (no network) ─────────────────────────────────────
console.log("\n── ItemTester static validators ──");
assert("isValidSwitchValue ON",  ItemTester.isValidSwitchValue("ON"));
assert("isValidSwitchValue OFF", ItemTester.isValidSwitchValue("OFF"));
assert("isValidSwitchValue invalid", !ItemTester.isValidSwitchValue("TOGGLE"));
assert("isValidDimmerValue 50",   ItemTester.isValidDimmerValue("50"));
assert("isValidDimmerValue INCREASE", ItemTester.isValidDimmerValue("INCREASE"));
assert("isValidDimmerValue 101",  !ItemTester.isValidDimmerValue("101"));
assert("isValidColorValue H,S,B", ItemTester.isValidColorValue("240,100,100"));
assert("isValidColorValue bad",   !ItemTester.isValidColorValue("red"));
assert("isValidNumberValue 42",   ItemTester.isValidNumberValue("42"));
assert("isValidNumberValue unit", ItemTester.isValidNumberValue("20 °C"));
assert("isValidLocationValue",    ItemTester.isValidLocationValue("48.7758,9.1829"));
assert("isValidLocationValue bad",!ItemTester.isValidLocationValue("91,0"));
assert("isValidDateTimeValue",    ItemTester.isValidDateTimeValue("2024-01-15T08:30:00+0000"));

// ── Integration tests ────────────────────────────────────────────────────────
console.log("\n── Connecting to openHAB ──");
let client;
try {
  client = await buildClientWithAPIs();
  assert("login", client.isLoggedIn);
} catch (e) {
  console.error("Connection failed:", e.message);
  console.log(`\nResults: ${passed} passed, ${failed + 1} failed`);
  process.exit(1);
}

// ItemTester
console.log("\n── ItemTester ──");
const it = new ItemTester(client);
assert("doesItemExist(testSwitch)", await it.doesItemExist("testSwitch"));
assert("doesItemExist(nonexistent)", !(await it.doesItemExist("itemThatDoesNotExist99")));
assert("checkItemIsType Switch",     await it.checkItemIsType("testSwitch", "Switch"));
assert("checkItemIsType wrong",      !(await it.checkItemIsType("testSwitch", "Dimmer")));
assert("testSwitch ON",  await it.testSwitch("testSwitch", "ON",  "ON",  10));
assert("testSwitch OFF", await it.testSwitch("testSwitch", "OFF", "OFF", 10));

// ThingTester
console.log("\n── ThingTester ──");
const tt = new ThingTester(client);
const status = await tt.getThingStatus(THING_UID);
assert(`getThingStatus(${THING_UID})`, status !== null);
console.log(`  ℹ status = ${status}`);

// RuleTester
console.log("\n── RuleTester ──");
const rt = new RuleTester(client);
const rs = await rt.getRuleStatus(RULE_UID);
assert("getRuleStatus not empty", Object.keys(rs).length > 0);
assert("enableRule",  await rt.enableRule(RULE_UID));
assert("runRule",     await rt.runRule(RULE_UID));
assert("disableRule", await rt.disableRule(RULE_UID));
assert("isRuleDisabled", await rt.isRuleDisabled(RULE_UID));
await rt.enableRule(RULE_UID);

// ChannelTester
console.log("\n── ChannelTester ──");
const ct = new ChannelTester(client);
assert("hasOrphanedLinks runs", typeof await ct.hasOrphanedLinks() === "boolean");

// PersistenceTester
console.log("\n── PersistenceTester ──");
const pt = new PersistenceTester(client);
const persisted = await pt.isItemPersisted(PERS_SVC, "testSwitch");
console.log(`  ℹ isItemPersisted(${PERS_SVC}, testSwitch) = ${persisted}`);

// SitemapTester
console.log("\n── SitemapTester ──");
const st = new SitemapTester(client);
assert(`doesSitemapExist(${SITEMAP})`, await st.doesSitemapExist(SITEMAP));
assert("doesSitemapExist(fake)", !(await st.doesSitemapExist("sitemapThatDoesNotExist99")));

// Summary
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
