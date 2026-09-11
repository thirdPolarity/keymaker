// Exact combinatorial checks, not a test or certification of physical entropy.
import assert from 'node:assert/strict';
import { GROUPED, SYMBOLS, randomCharacterGroups } from '../src/generator.ts';
import words from '../src/words.json' with { type:'json' };

function inclusionExclusion(sizes, length) {
 const total = sizes.reduce((sum,size)=>sum+size,0);
 let count = 0n;
 for(let mask=0;mask<(1<<sizes.length);mask++) {
  let excluded=0, parity=0;
  sizes.forEach((size,index)=>{if(mask & (1<<index)){excluded+=size;parity++;}});
  count += (parity%2 ? -1n : 1n) * BigInt(total-excluded)**BigInt(length);
 }
 return count;
}
function dynamicCount(sizes, length) {
 let states=Array(1<<sizes.length).fill(0n);states[0]=1n;
 for(let i=0;i<length;i++) {
  const next=Array(states.length).fill(0n);
  states.forEach((count,mask)=>sizes.forEach((size,index)=>{next[mask|(1<<index)]+=count*BigInt(size);}));
  states=next;
 }
 return states.at(-1);
}
assert.equal(inclusionExclusion([1,1],2),2n);
assert.equal(inclusionExclusion([2,1],2),4n);
assert.equal(GROUPED.length,31);assert.equal(new Set(GROUPED).size,31);
assert.equal(SYMBOLS.length,12);assert.equal(new Set(SYMBOLS).size,12);
let worstAcceptance=1, combinations=0;
for(const excludeSimilar of [false,true]) for(let mask=1;mask<16;mask++) {
 const settings={length:8,uppercase:!!(mask&1),lowercase:!!(mask&2),numbers:!!(mask&4),symbols:!!(mask&8),excludeSimilar};
 const groups=randomCharacterGroups(settings), sizes=groups.map(g=>g.length), pool=groups.join('');
 assert.equal(new Set(pool).size,pool.length);
 for(const length of [8,16,20,32,64]) {
  assert.equal(inclusionExclusion(sizes,length),dynamicCount(sizes,length));combinations++;
 }
 worstAcceptance=Math.min(worstAcceptance,Number(inclusionExclusion(sizes,8))/pool.length**8);
}
const defaults=randomCharacterGroups({length:20,uppercase:true,lowercase:true,numbers:true,symbols:true,excludeSimilar:true}).map(g=>g.length);
assert.deepEqual(defaults,[24,24,8,12]);
const cases=[
 ['Grouped 16',BigInt(GROUPED.length)**16n],['Grouped 20',BigInt(GROUPED.length)**20n],
 ['Random 16',inclusionExclusion(defaults,16)],['Random 20',inclusionExclusion(defaults,20)],
 ['Random 24',inclusionExclusion(defaults,24)],['Six words',BigInt(words.length)**6n],
 ['Six words + number + symbol',BigInt(words.length)**6n*90n*BigInt(SYMBOLS.length)]
].map(([mode,count])=>({mode,possibilities:count.toString(),bits:Math.log2(Number(count))}));
assert.ok((1-worstAcceptance)**256 < 2**-212);
console.log(JSON.stringify({verifiedCountComparisons:combinations,worstAcceptance,candidateFailureBound:(1-worstAcceptance)**256,cases},null,2));
