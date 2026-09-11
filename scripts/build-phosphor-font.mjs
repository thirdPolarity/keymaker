// Derived from the user-supplied preview (11).html font builder.
// Large optical size: 44-unit grid pitch, 27-unit squares.
// Small optical size: fewer, larger 44-unit squares; no raster glyphs.
import { writeFileSync } from "node:fs";
 const LETTERS = {" ":"0,0,0,0,0,0,0","A":"14,17,17,31,17,17,17","B":"30,17,17,30,17,17,30","C":"15,16,16,16,16,16,15","D":"30,17,17,17,17,17,30","E":"31,16,16,30,16,16,31","F":"31,16,16,30,16,16,16","G":"15,16,16,23,17,17,15","H":"17,17,17,31,17,17,17","I":"14,4,4,4,4,4,14","J":"7,2,2,2,2,18,12","K":"17,18,20,24,20,18,17","L":"16,16,16,16,16,16,31","M":"17,27,21,21,17,17,17","N":"17,25,25,21,19,19,17","O":"14,17,17,17,17,17,14","P":"30,17,17,30,16,16,16","Q":"14,17,17,17,21,18,13","R":"30,17,17,30,20,18,17","S":"15,16,16,14,1,1,30","T":"31,4,4,4,4,4,4","U":"17,17,17,17,17,17,14","V":"17,17,17,17,17,10,4","W":"17,17,17,21,21,27,17","X":"17,17,10,4,10,17,17","Y":"17,17,10,4,4,4,4","Z":"31,1,2,4,8,16,31","a":"0,0,14,1,15,17,15","b":"16,16,22,25,17,17,30","c":"0,0,15,16,16,16,15","d":"1,1,13,19,17,17,15","e":"0,0,14,17,31,16,15","f":"6,9,8,28,8,8,8","g":"0,0,15,17,17,17,15,1,14","h":"16,16,22,25,17,17,17","i":"4,0,12,4,4,4,14","j":"2,0,6,2,2,2,2,18,12","k":"16,16,18,20,24,20,18","l":"12,4,4,4,4,4,14","m":"0,0,26,21,21,21,21","n":"0,0,22,25,17,17,17","o":"0,0,14,17,17,17,14","p":"0,0,30,17,17,17,30,16,16","q":"0,0,15,17,17,17,15,1,1","r":"0,0,23,24,16,16,16","s":"0,0,15,16,14,1,30","t":"8,8,30,8,8,9,6","u":"0,0,17,17,17,19,13","v":"0,0,17,17,17,10,4","w":"0,0,17,17,21,21,10","x":"0,0,17,10,4,10,17","y":"0,0,17,17,17,17,15,1,14","z":"0,0,31,2,4,8,31","0":"14,17,19,21,25,17,14","1":"4,12,4,4,4,4,14","2":"14,17,1,2,4,8,31","3":"30,1,1,14,1,1,30","4":"2,6,10,18,31,2,2","5":"31,16,16,30,1,1,30","6":"14,16,16,30,17,17,14","7":"31,1,2,4,4,4,4","8":"14,17,17,14,17,17,14","9":"14,17,17,15,1,1,14","!":"4,4,4,4,4,0,4","\"":"10,10,10,0,0,0,0","#":"10,10,31,10,31,10,10","$":"4,15,20,14,5,30,4","%":"25,26,2,4,8,11,19","&":"12,18,20,8,21,18,13","'":"4,4,8,0,0,0,0","(":"2,4,8,8,8,4,2",")":"8,4,2,2,2,4,8","*":"0,21,14,31,14,21,0","+":"0,4,4,31,4,4,0",",":"0,0,0,0,0,4,4,8","-":"0,0,0,31,0,0,0",".":"0,0,0,0,0,0,4","/":"1,1,2,4,8,16,16",":":"0,0,4,0,4,0,0",";":"0,0,4,0,4,4,8","<":"2,4,8,16,8,4,2","=":"0,0,31,0,31,0,0",">":"8,4,2,1,2,4,8","?":"14,17,1,2,4,0,4","@":"14,17,23,21,23,16,15","[":"14,8,8,8,8,8,14","\\":"16,16,8,4,2,1,1","]":"14,2,2,2,2,2,14","^":"4,10,17,0,0,0,0","_":"0,0,0,0,0,0,31","`":"8,4,2,0,0,0,0","{":"3,4,4,8,4,4,3","|":"4,4,4,4,4,4,4","}":"24,4,4,2,4,4,24","~":"0,0,9,22,0,0,0"};
 class Bytes {
  constructor() { this.data = []; }
  u8(n) { this.data.push(n & 255); return this; }
  u16(n) { return this.u8(n >>> 8).u8(n); }
  u32(n) { return this.u16(n >>> 16).u16(n); }
  raw(a) { for (const v of a) this.data.push(v); return this; }
  text(s) { for (const ch of s) this.u8(ch.charCodeAt(0)); return this; }
  zeros(n) { for (let i=0; i<n; i++) this.u8(0); return this; }
  pad() { while (this.data.length % 4) this.u8(0); return this; }
  get length() { return this.data.length; }
  get bytes() { return new Uint8Array(this.data); }
 }
 function checksum(bytes) {
  let total = 0;
  for (let i=0; i<bytes.length; i+=4) {
   total = (total + (((bytes[i] || 0) << 24) | ((bytes[i+1] || 0) << 16) | ((bytes[i+2] || 0) << 8) | (bytes[i+3] || 0))) >>> 0;
  }
  return total;
 }
 function makeTypeface(small = false) {
  const glyphs = new Bytes(), locations = new Bytes(), metrics = new Bytes();
  let maxContours = 0, maxPoints = 0;
  const characters = ['?', ...Array.from({length:95}, (_,i) => String.fromCharCode(i+32))];
  for (const ch of characters) {
   locations.u32(glyphs.length);
   const points = [], ends = [];
   const rows = LETTERS[ch].split(',').map(Number);
   rows.forEach((row,r) => {
    for (let c=0; c<5; c++) if (row & (1 << (4-c))) {
     // Preserve the alphabet while changing cell density for the optical size.
     for (let sy=0; sy<(small ? 2 : 3); sy++) for (let sx=0; sx<(small ? 1 : 2); sx++) {
      const x = 16 + c*88 + (small ? 22 : sx*44);
      const y = (6-r)*132 + (small ? sy*66 + 16 : sy*44 + 4);
      const side = small ? 44 : 27;
      points.push([x,y], [x,y+side], [x+side,y+side], [x+side,y]);
      ends.push(points.length-1);
     }
    }
   });
   const xs=points.map(p=>p[0]), ys=points.map(p=>p[1]);
   const xMin=points.length ? Math.min(...xs) : 0, xMax=points.length ? Math.max(...xs) : 0;
   const yMin=points.length ? Math.min(...ys) : 0, yMax=points.length ? Math.max(...ys) : 0;
   metrics.u16(520).u16(xMin);
   glyphs.u16(ends.length).u16(xMin).u16(yMin).u16(xMax).u16(yMax);
   ends.forEach(e=>glyphs.u16(e));
   glyphs.u16(0); // No bytecode instructions. These are resolution-independent outlines.
   points.forEach(()=>glyphs.u8(1)); // On-curve points, full signed deltas.
   let last=0; points.forEach(p=>{glyphs.u16(p[0]-last);last=p[0];});
   last=0; points.forEach(p=>{glyphs.u16(p[1]-last);last=p[1];});
   glyphs.pad();
   maxContours=Math.max(maxContours,ends.length); maxPoints=Math.max(maxPoints,points.length);
  }
  locations.u32(glyphs.length);
  const head=new Bytes().u32(0x00010000).u32(0x00010000).u32(0).u32(0x5F0F3CF5).u16(3).u16(1000)
   .zeros(16).u16(0).u16(-280).u16(460).u16(940).u16(0).u16(8).u16(2).u16(1).u16(0);
  const hhea=new Bytes().u32(0x00010000).u16(960).u16(-300).u16(0).u16(540).u16(0).u16(60).u16(460)
   .u16(1).u16(0).u16(0).zeros(8).u16(0).u16(characters.length);
  const maxp=new Bytes().u32(0x00010000).u16(characters.length).u16(maxPoints).u16(maxContours)
   .u16(0).u16(0).u16(2).zeros(16);
  const os2=new Bytes().u16(0).u16(540).u16(400).u16(5).u16(0)
   .u16(650).u16(650).u16(0).u16(140).u16(650).u16(650).u16(0).u16(480)
   .u16(50).u16(260).u16(0).raw([2,11,5,9,0,0,0,0,0,0])
   .u32(1).zeros(12).text('PHSR').u16(0x40).u16(32).u16(126)
   .u16(960).u16(-300).u16(0).u16(960).u16(300);
  const sub=new Bytes().u16(4).u16(32).u16(0).u16(4).u16(4).u16(1).u16(0)
   .u16(126).u16(65535).u16(0).u16(32).u16(65535).u16(-31).u16(1).u16(0).u16(0);
  const cmap=new Bytes().u16(0).u16(1).u16(3).u16(1).u32(12).raw(sub.data);
  const strings=new Bytes(), records=new Bytes();
  const family=small ? 'Keymaker Phosphor Small' : 'Keymaker Phosphor';
  const names={1:family,2:'Regular',3:small ? 'Phosphor-Small-1.0' : 'Phosphor-Matrix-1.0',4:family,5:'Version 1.0',6:small ? 'KeymakerPhosphorSmall-Regular' : 'KeymakerPhosphor-Regular'};
  for (const [id,value] of Object.entries(names)) {
   const offset=strings.length; for (const ch of value) strings.u16(ch.charCodeAt(0));
   records.u16(3).u16(1).u16(0x0409).u16(Number(id)).u16(strings.length-offset).u16(offset);
  }
  const name=new Bytes().u16(0).u16(6).u16(78).raw(records.data).raw(strings.data);
  const post=new Bytes().u32(0x00030000).u32(0).u16(-100).u16(45).u32(1).zeros(16);
  const tables={'OS/2':os2,cmap,glyf:glyphs,head,hhea,hmtx:metrics,loca:locations,maxp,name,post};
  const tags=Object.keys(tables).sort(), count=tags.length, power=2**Math.floor(Math.log2(count));
  const out=new Bytes().u32(0x00010000).u16(count).u16(power*16).u16(Math.log2(power)).u16(count*16-power*16);
  let offset=12+count*16, headOffset=0;
  for (const tag of tags) {
   const table=tables[tag];
   out.text(tag).u32(checksum(table.bytes)).u32(offset).u32(table.length);
   if (tag==='head') headOffset=offset;
   offset+=Math.ceil(table.length/4)*4;
  }
  for (const tag of tags) out.raw(tables[tag].data).pad();
  const bytes=out.bytes;
  new DataView(bytes.buffer).setUint32(headOffset+8,(0xB1B0AFBA-checksum(bytes))>>>0,false);
  return bytes.buffer;
 }

writeFileSync(new URL("../public/fonts/phosphor-matrix.ttf",import.meta.url),new Uint8Array(makeTypeface()));

writeFileSync(new URL("../public/fonts/phosphor-small.ttf",import.meta.url),new Uint8Array(makeTypeface(true)));
