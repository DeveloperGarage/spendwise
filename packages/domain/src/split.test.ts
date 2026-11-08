import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { split } from "./split.ts";

describe("split", () => {
  it("splits ₹100 three ways as 33.34, 33.33, 33.33 by member id", () => {
    const first = split(10000, { mode: "equal", memberIds: ["c", "a", "b"] });
    const second = split(10000, { mode: "equal", memberIds: ["b", "c", "a"] });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.deepEqual(first.lines, [
      { memberId: "a", amount: 3334 },
      { memberId: "b", amount: 3333 },
      { memberId: "c", amount: 3333 },
    ]);
    assert.deepEqual(first.lines, second.lines);
    assert.equal(
      first.lines.reduce((sum, line) => sum + line.amount, 0),
      10000,
    );
  });

  it("refuses an exact split that does not add up, with the gap", () => {
    const short = split(10000, {
      mode: "exact",
      amounts: [
        { memberId: "a", amount: 4000 },
        { memberId: "b", amount: 4000 },
      ],
    });
    assert.deepEqual(short, { ok: false, gap: -2000 });

    const over = split(10000, {
      mode: "exact",
      amounts: [
        { memberId: "a", amount: 6000 },
        { memberId: "b", amount: 5000 },
      ],
    });
    assert.deepEqual(over, { ok: false, gap: 1000 });
  });

  it("refuses percentages of 33.33 three times and accepts 50 and 50", () => {
    const almost = split(10000, {
      mode: "percentage",
      percentages: [
        { memberId: "a", hundredths: 3333 },
        { memberId: "b", hundredths: 3333 },
        { memberId: "c", hundredths: 3333 },
      ],
    });
    assert.deepEqual(almost, { ok: false, gap: -1 });

    const half = split(10000, {
      mode: "percentage",
      percentages: [
        { memberId: "a", hundredths: 5000 },
        { memberId: "b", hundredths: 5000 },
      ],
    });
    assert.equal(half.ok, true);
    if (!half.ok) return;
    assert.equal(
      half.lines.reduce((sum, line) => sum + line.amount, 0),
      10000,
    );
  });

  it("splits by shares with the leftover paisa on the largest remainder", () => {
    const result = split(10000, {
      mode: "shares",
      shares: [
        { memberId: "a", weight: 1 },
        { memberId: "b", weight: 1 },
        { memberId: "c", weight: 1 },
      ],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.lines, [
      { memberId: "a", amount: 3334 },
      { memberId: "b", amount: 3333 },
      { memberId: "c", amount: 3333 },
    ]);
  });
});
