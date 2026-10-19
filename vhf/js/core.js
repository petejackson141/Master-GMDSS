/* Basic helpers, seeded random numbers, your vessel settings and how numbers are spoken on the radio */
const $=s=>document.querySelector(s);
let RNG=Math.random;
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=a=>a[Math.floor(RNG()*a.length)];
const ri=(a,b)=>a+Math.floor(RNG()*(b-a+1));

/* ---------- vessel settings ---------- */
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const vn=$('#vname'), vm=$('#mmsi');
if(store.get('c16.name')) vn.value=store.get('c16.name');
if(store.get('c16.mmsi')) vm.value=store.get('c16.mmsi');
vn.addEventListener('change',()=>store.set('c16.name',vn.value.trim()||'Sea Breeze'));
vm.addEventListener('change',()=>{vm.value=vm.value.replace(/\D/g,'').slice(0,9);store.set('c16.mmsi',vm.value)});
const me=()=>({name:(vn.value.trim()||'Sea Breeze'),mmsi:(vm.value.replace(/\D/g,'')||'428123456')});

/* ---------- spoken number helpers ---------- */
const D=['zero','one','two','three','four','five','six','seven','eight','nine'];
const spell=(s)=>String(s).split('').map(c=>/\d/.test(c)?D[+c]:c).join(' ');
const pad=(n,l)=>String(n).padStart(l,'0');
const W=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const cap=x=>x[0].toUpperCase()+x.slice(1);
const posText=p=>`${cap(spell(pad(p.la,2)))} degrees ${spell(pad(p.lam,2))} minutes north\n${cap(spell(pad(p.lo,3)))} degrees ${spell(pad(p.lom,2))} minutes east`;
const posShow=p=>`${pad(p.la,2)}°${pad(p.lam,2)}′N ${pad(p.lo,3)}°${pad(p.lom,2)}′E`;
const randPos=()=>({la:ri(31,33),lam:ri(0,59),lo:ri(33,34),lom:ri(0,59)});
const x3=n=>`${n}, ${n}, ${n}`;
const x2=n=>`${n}, ${n}`;
