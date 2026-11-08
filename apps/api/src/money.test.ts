import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseRupeeToPaise } from "@spendwise/domain";

import { amountToJson, readAmount } from "./money.ts";

describe("workspace domain package", () => {
  it("parses a typed rupee amount to paise", () => {
    assert.deepEqual(parseRupeeToPaise("₹100.00"), { ok: true, paise: 10000 });
  });
});

describe("readAmount", () => {
  it("accepts a JSON integer of paise", () => {
    const parsed = JSON.parse('{"amount":120000}') as { amount: unknown };
    const result = readAmount(parsed.amount);
    assert.deepEqual(result, { ok: true, amount: 120000 });
    assert.equal(typeof parsed.amount, "number");
    assert.equal(JSON.stringify({ amount: amountToJson(120000) }), '{"amount":120000}');
  });

  it("refuses a rupee string and a number with a fractional part", () => {
    assert.equal(readAmount("1200.00").ok, false);
    assert.equal(readAmount(1200.01).ok, false);
    assert.equal(readAmount(120000.5).ok, false);
  });
});
