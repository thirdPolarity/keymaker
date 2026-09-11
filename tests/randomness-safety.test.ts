import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt, generateGrouped, generateRandom, generateMemorable } from '../src/generator.ts';
import words from '../src/words.json' with { type: 'json' };

const mixed = {length:8, uppercase:true, lowercase:true, numbers:true, symbols:true, excludeSimilar:true};
function withSource(fill: (array: Uint32Array) => Uint32Array, run: () => void) {
 const source = mock.method(globalThis.crypto, 'getRandomValues', fill);
 try { run(); } finally { source.mock.restore(); }
}
test('insecure browser contexts fail before reading randomness', () => {
 const original = Object.getOwnPropertyDescriptor(globalThis, 'isSecureContext');
 Object.defineProperty(globalThis, 'isSecureContext', {value:false, configurable:true});
 try { withSource(() => {throw new Error('source should not be read');}, () => assert.throws(() => randomInt(31), /secure context/i)); }
 finally { if (original) Object.defineProperty(globalThis, 'isSecureContext', original); else Reflect.deleteProperty(globalThis, 'isSecureContext'); }
});
test('pathological rejected integers terminate with no fallback value', () => {
 let reads = 0;
 withSource(array => { if (++reads > 256) throw new Error('test watchdog'); array[0] = 0xffffffff; return array; }, () => {
  assert.throws(() => randomInt(31), /random source.*sample/i);
  assert.equal(reads, 128);
 });
});
test('pathological category rejection terminates without returning an invalid password', () => {
 let reads = 0;
 withSource(array => { if (++reads > 4096) throw new Error('test watchdog'); array[0] = 0; return array; }, () => {
  assert.throws(() => generateRandom(mixed), /random source.*password/i);
  assert.equal(reads, 256 * mixed.length);
 });
});
test('range endpoints and accepted/rejected boundary behave exactly', () => {
 for (const n of [1,2,10,31,68,7776,2**31+1,2**32]) {
  const limit = Math.floor(2**32/n)*n;
  let samples = [limit-1];
  withSource(array => {array[0] = samples.shift()!; return array;}, () => assert.equal(randomInt(n), n-1));
  if (limit < 2**32) {
   samples=[limit,0];
   withSource(array => {array[0] = samples.shift()!;return array;}, () => assert.equal(randomInt(n),0));
   assert.equal(samples.length,0);
  }
 }
});
test('a failed candidate is discarded as a whole before an accepted candidate', () => {
 // The filtered alphabet is uppercase24 + lowercase24 + digits8 + symbols12.
 const samples=[...Array(8).fill(0), 0,24,48,56,0,24,48,56];
 withSource(array => {assert.ok(samples.length);array[0]=samples.shift()!;return array;}, () => assert.equal(generateRandom(mixed),'Aa2!Aa2!'));
 assert.equal(samples.length,0);
});
test('source failures propagate through all generators without Math.random fallback', () => {
 const fallback=mock.method(Math, 'random', () => {throw new Error('insecure fallback used');});
 try { withSource(() => {throw new Error('platform failure');}, () => {
  for (const generate of [() => generateGrouped(16), () => generateRandom(mixed), () => generateMemorable({words:6,separator:'-',addNumber:false,addSymbol:false})]) assert.throws(generate,/^Error: platform failure$/);
 }); } finally {fallback.mock.restore();}
});
test('bundled EFF list has 7776 unique prefix-free words for unambiguous encoding', () => {
 assert.equal(words.length,7776);assert.equal(new Set(words).size,7776);
 const sorted=[...words].sort();
 for(let i=1;i<sorted.length;i++) assert.ok(!sorted[i].startsWith(sorted[i-1]),`${sorted[i-1]} prefixes ${sorted[i]}`);
 for(const word of words) assert.match(word,/^[a-z]+(?:-[a-z]+)*$/);
});
