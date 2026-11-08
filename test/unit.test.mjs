// Validators and module loading – no openHAB needed.  Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as suite from "../dist/esm/index.js";
const { ItemTester } = suite;

test("ES module and CommonJS export the same classes", () => {
  const cjs = createRequire(import.meta.url)("../dist/cjs/index.js");
  for (const name of ["ItemTester", "ThingTester", "RuleTester", "ChannelTester", "PersistenceTester", "SitemapTester"]) {
    assert.equal(typeof suite[name], "function", name);
    assert.equal(typeof cjs[name], "function", name);
  }
});

test("validators", () => {
  const T = ItemTester;
  assert.ok(T.isValidSwitchValue("on") && !T.isValidSwitchValue("HALB"));
  assert.ok(T.isValidDimmerValue("0") && T.isValidDimmerValue(0) && T.isValidDimmerValue("INCREASE"));
  assert.ok(!T.isValidDimmerValue("101") && !T.isValidDimmerValue("50abc") && !T.isValidDimmerValue(""));
  assert.ok(T.isValidRollershutterValue("DOWN") && T.isValidRollershutterValue(40) && !T.isValidRollershutterValue("-1"));
  assert.ok(T.isValidColorValue("240,100,80") && !T.isValidColorValue("361,0,0") && !T.isValidColorValue("1,,2"));
  assert.ok(T.isValidNumberValue("20.5 °C") && T.isValidNumberValue(0) && !T.isValidNumberValue("zwanzig"));
  assert.ok(T.isValidDateTimeValue("2024-01-15T08:30:00+0000") && !T.isValidDateTimeValue("15.01.2024"));
  assert.ok(T.isValidLocationValue("48.7758,9.1829,300") && !T.isValidLocationValue("91,0") && !T.isValidLocationValue("1,"));
  assert.ok(T.isValidImageValue("data:image/png;base64,AAA") && !T.isValidImageValue("bild.png"));
  assert.ok(T.isValidPlayerValue("play") && !T.isValidPlayerValue("STOP"));
  assert.equal(T._isValidSwitchValue, T.isValidSwitchValue);   // Python names
});

test("isValidStringValue", () => {
  assert.ok(ItemTester.isValidStringValue("Hallo") && ItemTester.isValidStringValue(""));
  assert.ok(!ItemTester.isValidStringValue(null));
});
