export type AmountOk = { ok: true; amount: number };
export type AmountErr = { ok: false; field: string };

/**
 * JSON money is an integer of paise. Strings and fractional numbers are refused
 * so Node never stores a binary float as rupees.
 */
export function readAmount(value: unknown, field = "amount"): AmountOk | AmountErr {
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isFinite(value)) {
    return { ok: false, field };
  }
  return { ok: true, amount: value };
}

export function amountToJson(paise: number): number {
  if (!Number.isInteger(paise)) {
    throw new TypeError("amountToJson requires integer paise");
  }
  return paise;
}
