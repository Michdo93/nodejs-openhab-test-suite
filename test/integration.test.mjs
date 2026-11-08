// Integration tests against openHAB with the exercise configuration of the book
// series "openHAB REST API" (items, astro thing, rule "restbuch-1", sitemap "restbuch",
// persistence "inmemory"). Skipped without OPENHAB_URL.
//   OPENHAB_URL=http://127.0.0.1:8080 OPENHAB_TOKEN=oh.xxx npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenHABClient, Items, Links } from "nodejs-openhab-rest-client";
import { ItemTester, ThingTester, RuleTester, ChannelTester, PersistenceTester, SitemapTester }
  from "../dist/esm/index.js";

const url = process.env.OPENHAB_URL;
const skip = url ? false : "OPENHAB_URL not set";
const client = url ? new OpenHABClient(url, process.env.OPENHAB_USER || null,
  process.env.OPENHAB_PASSWORD || null, process.env.OPENHAB_TOKEN || null) : null;
const SONNE = "astro:sun:zuhause";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BENOETIGT = {
  Wohnzimmer_Licht: "Switch", Wohnzimmer_Dimmer: "Dimmer", Wohnzimmer_Farblicht: "Color",
  Wohnzimmer_Temperatur: "Number:Temperature", Kueche_Rollladen: "Rollershutter",
  Flur_Haustuer: "Contact", Haus_Status: "String", gLichter: "Group",
};

test("items exist with their types", { skip }, async () => {
  const t = new ItemTester(client);
  for (const [name, typ] of Object.entries(BENOETIGT)) {
    assert.ok(await t.doesItemExist(name), name);
    assert.ok(await t.checkItemIsType(name, typ), `${name} ${typ}`);
  }
  assert.ok(await t.checkItemIsType("Wohnzimmer_Temperatur", "Number"));
  assert.ok(!await t.checkItemIsType("Wohnzimmer_Temperatur", "Number:Length"));
  assert.ok(!await t.doesItemExist("Gibt_es_nicht"));
  assert.ok(!await t.checkItemIsType("Gibt_es_nicht", "Switch"));
});

test("group", { skip }, async () => {
  const t = new ItemTester(client);
  assert.ok(await t.isGroupItem("gLichter"));
  assert.ok(await t.doesGroupContainMember("gLichter", "Wohnzimmer_Licht"));
  const namen = (await t.getGroupMembers("gLichter")).map(m => m.name);
  assert.ok(namen.includes("Wohnzimmer_Dimmer"));
});

test("item behaviour (command, update, restore)", { skip }, async () => {
  const t = new ItemTester(client);
  const items = new Items(client);
  const vorher = await items.getItemState("Wohnzimmer_Dimmer");
  assert.ok(await t.testSwitch("Wohnzimmer_Licht", "ON", "ON", 5));
  assert.ok(await t.testDimmer("Wohnzimmer_Dimmer", 40, "40", 5));
  assert.ok(await t.testColor("Wohnzimmer_Farblicht", "120,100,50", "120,100,50", 5));
  assert.ok(await t.testString("Haus_Status", "Test", "Test", 5));
  assert.ok(await t.testContact("Flur_Haustuer", "OPEN", "OPEN", 5));
  assert.ok(await t.testNumber("Wohnzimmer_Temperatur", "23 °C", ["23 °C", "23.0 °C"], 5));
  assert.equal(await items.getItemState("Wohnzimmer_Dimmer"), vorher, "state restored");
});

test("item behaviour: failures are reported as false", { skip }, async () => {
  const t = new ItemTester(client);
  assert.ok(!await t.testSwitch("Wohnzimmer_Licht", "HALB", "ON", 2));        // invalid value
  assert.ok(!await t.testSwitch("Wohnzimmer_Dimmer", "ON", "ON", 2));         // wrong type
  const start = Date.now();
  assert.ok(!await t.testDimmer("Wohnzimmer_Dimmer", "30", "31", 2));         // state not reached
  assert.ok(Date.now() - start >= 1900, "waits for the timeout");
});

test("things", { skip }, async () => {
  const t = new ThingTester(client);
  assert.ok(await t.isThingOnline(SONNE));
  assert.ok(await t.disableThing(SONNE));
  assert.ok(await t.isThingUninitialized(SONNE));
  assert.ok(await t.enableThing(SONNE));
  await sleep(2000);
  assert.ok(await t.isThingOnline(SONNE));
  assert.ok(!await t.enableThing("astro:sun:gibtsnicht"));
  assert.equal(await t.getThingStatus("astro:sun:gibtsnicht"), "UNKNOWN");
});

test("rules", { skip }, async () => {
  const t = new RuleTester(client);
  assert.ok(await t.isRuleIdle("restbuch-1"));
  assert.ok(await t.testRuleExecution("restbuch-1", "Haus_Status", "Nachtruhe"));
  assert.ok(await t.disableRule("restbuch-1"));
  assert.ok(await t.isRuleDisabled("restbuch-1"));
  assert.ok(!await t.runRule("restbuch-1"));
  assert.ok(await t.enableRule("restbuch-1"));
  assert.ok(await t.isRuleActive("restbuch-1"));
  assert.equal((await t.getRuleStatus("restbuch-1")).uid, "restbuch-1");
  assert.ok(!await t.isRuleActive("gibtsnicht"));
  assert.ok(!await t.enableRule("gibtsnicht"));
  assert.ok(!await t.runRule("gibtsnicht"));
  assert.deepEqual(await t.getRuleStatus("gibtsnicht"), {});
});

test("links", { skip }, async () => {
  const items = new Items(client), links = new Links(client), t = new ChannelTester(client);
  await items.addOrUpdateItem("Test_Hoehe", { type: "Number:Angle", name: "Test_Hoehe" });
  try {
    await links.linkItemToChannel("Test_Hoehe", `${SONNE}:position#elevation`, {});
    assert.ok(await t.isItemLinkedToChannel("Test_Hoehe", `${SONNE}:position#elevation`));
    assert.ok(await t.isItemLinkedToAnyChannel("Test_Hoehe"));
    assert.ok(!await t.isItemLinkedToAnyChannel("Wohnzimmer_Licht"));
    assert.ok(!await t.hasOrphanedLinks());
  } finally {
    await links.deleteAllLinks("Test_Hoehe");
    await items.deleteItem("Test_Hoehe");
  }
});

test("persistence", { skip }, async () => {
  await new Items(client).sendCommand("Wohnzimmer_Dimmer", "33");
  await sleep(1000);
  const t = new PersistenceTester(client);
  const jetzt = new Date();
  assert.ok(await t.isItemPersisted("inmemory", "Wohnzimmer_Dimmer"));
  assert.ok(await t.hasDataInRange("inmemory", "Wohnzimmer_Dimmer", new Date(jetzt - 60000), jetzt));
  assert.ok(!await t.hasDataInRange("inmemory", "Wohnzimmer_Dimmer", "2020-01-01T00:00:00.000Z", "2020-01-02T00:00:00.000Z"));
  assert.ok(await t.checkLastPersistedState("inmemory", "Wohnzimmer_Dimmer", "33"));
});

test("sitemaps", { skip }, async () => {
  const t = new SitemapTester(client);
  assert.ok(await t.doesSitemapExist("restbuch"));
  assert.ok(!await t.doesSitemapExist("gibtsnicht"));
  assert.ok(await t.doesSitemapContainItem("restbuch", "Werkstatt_Luefter"));
  assert.ok(!await t.doesSitemapContainItem("restbuch", "Gibt_es_nicht"));
});
