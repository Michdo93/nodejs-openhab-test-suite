#!/usr/bin/env node
/**
 * Zero-dependency build script.
 * Reads src/index.js and produces:
 *   dist/esm/index.js     – ES Module
 *   dist/cjs/index.js     – CommonJS
 *   dist/types/index.d.ts – TypeScript declarations
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC       = join(__dirname, "src", "index.js");
const src       = readFileSync(SRC, "utf8");

// Collect exported class names
const names = [...src.matchAll(/^export class (\w+)/gm)].map(m => m[1]);

// ESM — copy as-is
mkdirSync(join(__dirname, "dist", "esm"), { recursive: true });
writeFileSync(join(__dirname, "dist", "esm", "index.js"), src);
writeFileSync(join(__dirname, "dist", "esm", "package.json"), JSON.stringify({ type: "module" }));
console.log(`✓ ESM   → dist/esm/index.js  (${names.length} exports)`);

// CJS — strip export keywords, append module.exports
const cjs = src.replace(/^export class /gm, "class ") +
  `\n\nmodule.exports = {\n${names.map(n => `  ${n},`).join("\n")}\n};\n`;
mkdirSync(join(__dirname, "dist", "cjs"), { recursive: true });
writeFileSync(join(__dirname, "dist", "cjs", "index.js"), cjs);
writeFileSync(join(__dirname, "dist", "cjs", "package.json"), JSON.stringify({ type: "commonjs" }));
console.log("✓ CJS   → dist/cjs/index.js");

// TypeScript declarations
const dts = `// Auto-generated type declarations for nodejs-openhab-test-suite

export declare class ItemTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  static isValidSwitchValue(v: string | null): boolean;
  static isValidContactValue(v: string | null): boolean;
  static isValidDimmerValue(v: string | null): boolean;
  static isValidRollershutterValue(v: string | null): boolean;
  static isValidColorValue(v: string | null): boolean;
  static isValidPlayerValue(v: string | null): boolean;
  static isValidNumberValue(v: unknown): boolean;
  static isValidDateTimeValue(v: string | null): boolean;
  static isValidLocationValue(v: string | null): boolean;
  static isValidImageValue(v: string | null): boolean;
  doesItemExist(itemName: string): Promise<boolean>;
  checkItemIsType(itemName: string, itemType: string): Promise<boolean>;
  checkItemHasState(itemName: string, expected: string): Promise<boolean>;
  isGroupItem(itemName: string): Promise<boolean>;
  getGroupMembers(groupName: string): Promise<object[]>;
  doesGroupContainMember(groupName: string, memberName: string): Promise<boolean>;
  checkGroupMemberState(groupName: string, memberName: string, expectedState: string): Promise<boolean>;
  testSwitch(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testContact(itemName: string, update?: string | null, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testColor(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testDimmer(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testRollershutter(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testNumber(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testPlayer(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testDateTime(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testLocation(itemName: string, update: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testImage(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
  testString(itemName: string, command: string, expectedState?: string | null, timeoutSec?: number): Promise<boolean>;
}

export declare class ThingTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  getThingStatus(thingUID: string): Promise<string>;
  isThingStatus(thingUID: string, status: string): Promise<boolean>;
  isThingOnline(thingUID: string): Promise<boolean>;
  isThingOffline(thingUID: string): Promise<boolean>;
  isThingPending(thingUID: string): Promise<boolean>;
  isThingUnknown(thingUID: string): Promise<boolean>;
  isThingUninitialized(thingUID: string): Promise<boolean>;
  isThingError(thingUID: string): Promise<boolean>;
  enableThing(thingUID: string): Promise<boolean>;
  disableThing(thingUID: string): Promise<boolean>;
}

export declare class RuleTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  getRuleStatus(ruleUID: string): Promise<Record<string, unknown>>;
  isRuleActive(ruleUID: string): Promise<boolean>;
  isRuleDisabled(ruleUID: string): Promise<boolean>;
  isRuleRunning(ruleUID: string): Promise<boolean>;
  isRuleIdle(ruleUID: string): Promise<boolean>;
  enableRule(ruleUID: string): Promise<boolean>;
  disableRule(ruleUID: string): Promise<boolean>;
  runRule(ruleUID: string, contextData?: object | null): Promise<boolean>;
  testRuleExecution(ruleUID: string, expectedItem: string, expectedValue: string): Promise<boolean>;
}

export declare class ChannelTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  isItemLinkedToChannel(itemName: string, channelUID: string): Promise<boolean>;
  getLinksForItem(itemName: string): Promise<object[]>;
  isItemLinkedToAnyChannel(itemName: string): Promise<boolean>;
  hasOrphanedLinks(): Promise<boolean>;
}

export declare class PersistenceTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  isItemPersisted(serviceId: string, itemName: string): Promise<boolean>;
  hasDataInRange(serviceId: string, itemName: string, startTime: string, endTime: string): Promise<boolean>;
  checkLastPersistedState(serviceId: string, itemName: string, expectedState: string): Promise<boolean>;
}

export declare class SitemapTester {
  constructor(client: import("nodejs-openhab-rest-client").OpenHABClient);
  doesSitemapExist(sitemapName: string): Promise<boolean>;
  doesSitemapContainItem(sitemapName: string, itemName: string): Promise<boolean>;
}
`;

mkdirSync(join(__dirname, "dist", "types"), { recursive: true });
writeFileSync(join(__dirname, "dist", "types", "index.d.ts"), dts);
console.log("✓ Types → dist/types/index.d.ts");
console.log("\n✅ Build complete.");
