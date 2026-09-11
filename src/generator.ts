import words from "./words.json" with { type: "json" };

export interface RandomSettings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}
export interface MemorableSettings {
  words: number;
  addNumber: boolean;
  addSymbol: boolean;
  separator: string;
}
export const SYMBOLS = "!@$%^&*_=+?-";
export const GROUPED = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32)
    throw new RangeError("Invalid random range.");
  if (globalThis.isSecureContext === false)
    throw new Error("Password generation requires a secure context (HTTPS or localhost).");
  const limit = Math.floor(2 ** 32 / max) * max;
  const value = new Uint32Array(1);
  // A draw is accepted with probability > 1/2 for every supported range.
  // Bound a broken source's runtime; never fall back to a weaker generator.
  for (let attempt = 0; attempt < 128; attempt++) {
    globalThis.crypto.getRandomValues(value);
    if (value[0] < limit) return value[0] % max;
  }
  throw new Error("Random source failed to produce an acceptable sample.");
}
function validateCount(value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`Choose a value from ${min} to ${max}.`);
}
function choose(pool: string) {
  return pool[randomInt(pool.length)];
}

export function generateGrouped(length: number): string {
  validateCount(length, 8, 32);
  return Array.from({ length }, () => choose(GROUPED))
    .join("")
    .match(/.{1,4}/g)!
    .join("-");
}
export function randomCharacterGroups(settings: RandomSettings): string[] {
  validateCount(settings.length, 8, 64);
  const groups = [
    settings.uppercase && "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    settings.lowercase && "abcdefghijklmnopqrstuvwxyz",
    settings.numbers && "0123456789",
    settings.symbols && SYMBOLS,
  ]
    .filter((group): group is string => !!group)
    .map((group) =>
      settings.excludeSimilar ? group.replace(/[Il1O0o]/g, "") : group,
    );
  if (!groups.length)
    throw new RangeError("Keep at least one character type selected.");
  return groups;
}
export function generateRandom(settings: RandomSettings): string {
  const groups = randomCharacterGroups(settings);
  const pool = groups.join("");
  // Rejection sampling keeps valid, category-complete strings equally likely.
  for (let attempt = 0; attempt < 256; attempt++) {
    const output = Array.from({ length: settings.length }, () => choose(pool)).join(
      "",
    );
    if (groups.every((group) => [...output].some((char) => group.includes(char))))
      return output;
  }
  throw new Error("Random source failed to produce a category-complete password.");
}
export function generateMemorable(settings: MemorableSettings): string {
  validateCount(settings.words, 3, 8);
  if (!["-", "_", ".", " ", ""].includes(settings.separator))
    throw new RangeError("Choose a supported separator.");
  const parts = Array.from(
    { length: settings.words },
    () => words[randomInt(words.length)],
  );
  if (settings.addNumber) parts.push(String(randomInt(90) + 10));
  if (settings.addSymbol) parts.push(choose(SYMBOLS));
  return parts.join(settings.separator);
}
