import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPaise, parseRupeeToPaise } from "./parse.ts";

describe("parseRupeeToPaise", () => {
  it("turns ₹100.00 into 10000 paise", () => {
    assert.deepEqual(parseRupeeToPaise("₹100.00"), { ok: true, paise: 10000 });
  });

  it("accepts 100 and 100.0 as the same amount", () => {
    assert.deepEqual(parseRupeeToPaise("100"), { ok: true, paise: 10000 });
    assert.deepEqual(parseRupeeToPaise("100.0"), { ok: true, paise: 10000 });
  });

  it("refuses a third decimal place", () => {
    assert.deepEqual(parseRupeeToPaise("₹100.001"), { ok: false, reason: "invalid" });
  });

  it("does not parse through a binary float", () => {
    assert.deepEqual(parseRupeeToPaise("4.35"), { ok: true, paise: 435 });
    assert.deepEqual(parseRupeeToPaise("1.15"), { ok: true, paise: 115 });
  });
});

describe("formatPaise", () => {
  it("formats hundredths back to two decimal rupees", () => {
    assert.equal(formatPaise(10000), "100.00");
    assert.equal(formatPaise(3334), "33.34");
    assert.equal(formatPaise(-40000), "-400.00");
  });
});
