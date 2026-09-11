import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  randomInt,
  generateGrouped,
  generateRandom,
  generateMemorable,
} from "../src/generator.ts";

test("bounded random selection rejects the uneven upper tail", () => {
  const samples = [0xffffffff, 8];
  const fill = mock.method(
    globalThis.crypto,
    "getRandomValues",
    (array: Uint32Array) => {
      array[0] = samples.shift()!;
      return array;
    },
  );
  try {
    assert.equal(randomInt(10), 8);
    assert.equal(fill.mock.callCount(), 2);
  } finally {
    fill.mock.restore();
  }
});
test("invalid ranges fail rather than returning a broken credential", () => {
  for (const n of [0, -1, NaN, 1.5, 2 ** 32 + 1])
    assert.throws(() => randomInt(n), RangeError);
});
test("grouped passwords keep the requested character count and group by four", () => {
  for (const n of [8, 17, 20, 32]) {
    const v = generateGrouped(n);
    assert.equal(v.replaceAll("-", "").length, n);
    assert.match(v, /^[a-z2-9]{4}(?:-[a-z2-9]{1,4})+$/);
  }
  assert.throws(() => generateGrouped(100), RangeError);
});
test("random output includes every selected group without ambiguous characters", () => {
  for (let i = 0; i < 200; i++) {
    const v = generateRandom({
      length: 8,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: true,
    });
    assert.equal(v.length, 8);
    for (const re of [/[A-Z]/, /[a-z]/, /[2-9]/, /[!@$%^&*_=+?-]/])
      assert.match(v, re);
    assert.doesNotMatch(v, /[Il1O0o]/);
  }
});
test("one selected character group is respected and an empty selection is rejected", () => {
  const settings = {
    length: 64,
    uppercase: false,
    lowercase: false,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
  };
  assert.match(generateRandom(settings), /^\d{64}$/);
  assert.throws(
    () => generateRandom({ ...settings, numbers: false }),
    RangeError,
  );
});
test("passphrases honor word count, separator, numbers and symbols", () => {
  const v = generateMemorable({
    words: 5,
    addNumber: true,
    addSymbol: true,
    separator: "_",
  });
  assert.match(v, /^[a-z-]+(?:_[a-z-]+){4}_\d{2}_[!@$%^&*_=+?-]$/);
  assert.match(
    generateMemorable({
      words: 3,
      addNumber: false,
      addSymbol: false,
      separator: ".",
    }),
    /^[a-z-]+\.[a-z-]+\.[a-z-]+$/,
  );
  assert.throws(
    () =>
      generateMemorable({
        words: 0,
        addNumber: false,
        addSymbol: false,
        separator: "-",
      }),
    RangeError,
  );
});
