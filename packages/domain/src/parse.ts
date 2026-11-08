import type { ParseResult } from "./types.ts";

/**
 * Walk a typed rupee string to integer paise. Does not parse through a float.
 * "100.00" and "₹100.00" become 10000. A third decimal place is refused.
 */
export function parseRupeeToPaise(input: string): ParseResult {
  let i = 0;
  const s = input;

  const skip = (ch: string) => {
    while (i < s.length && s[i] === ch) i += 1;
  };

  skip(" ");
  if (s[i] === "₹") i += 1;
  skip(" ");

  let rupees = 0;
  let sawDigit = false;
  while (i < s.length) {
    const c = s[i];
    if (c === ",") {
      i += 1;
      continue;
    }
    if (c >= "0" && c <= "9") {
      sawDigit = true;
      rupees = rupees * 10 + (c.charCodeAt(0) - 48);
      i += 1;
      continue;
    }
    break;
  }

  let paise = 0;
  let decimals = 0;
  if (i < s.length && s[i] === ".") {
    i += 1;
    while (i < s.length && s[i] >= "0" && s[i] <= "9") {
      decimals += 1;
      if (decimals > 2) return { ok: false, reason: "invalid" };
      paise = paise * 10 + (s.charCodeAt(i) - 48);
      i += 1;
    }
    if (decimals === 0) return { ok: false, reason: "invalid" };
    if (decimals === 1) paise *= 10;
  }

  skip(" ");
  if (!sawDigit || i !== s.length) return { ok: false, reason: "invalid" };
  return { ok: true, paise: rupees * 100 + paise };
}

/** Format paise for a screen. 10000 becomes "100.00". */
export function formatPaise(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}${rupees}.${String(rest).padStart(2, "0")}`;
}
