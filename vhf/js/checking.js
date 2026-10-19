/* Understanding what you said: cleans up speech-recognition text and checks each element of a call */
/* ---------- text normalisation for checking ---------- */
const NUMW={zero:0,oh:0,nought:0,one:1,two:2,three:3,tree:3,four:4,fower:4,five:5,fife:5,six:6,seven:7,eight:8,nine:9,niner:9,ten:10,eleven:11,twelve:12};
const NUMCTX={to:2,too:2,for:4,won:1,ate:8,free:3,o:0};
const FIX=[
  [/\b(may\s*day|made\s*a?\s*day|may\s*they|mae\s*day|m\s*aider|maide|mayde|meyday|mayda|maydays)\b/g,'mayday'],
  [/\bmayday\s+(re\s*lay|relate|really|relays|we\s*lay)\b/g,'mayday relay'],
  [/\b(pan|pam|pon|pen|pun|pang|ban|pain)\s*(pan|pam|pon|pen|pun|pang|pain)\b/g,'panpan'],
  [/\b(pampan|panpam|pampam)\b/g,'panpan'],
  [/\b(s[eé]curit[eé]y?|security|securities|securitay|securi\s*tay|secure\s*it(e|ay|a)y?|secure\s*a\s*tay|secure\s*e\s*tay|say\s*cure\s*(it|e|ee)\s*(tay|ay|a)?|see\s*cure\s*(e|ee|it)\s*(tay|ay|a)?|s\s*cure\s*e\s*tay)\b/g,'securite'],
  [/\b(this\s*is|these\s*is|this\s*his|dis\s*is|thiss|this\s*ease|this\s*iz|thisis|this\s*s)\b/g,'this is'],
  [/\b(ova|offer|ober|hover|clover|overs|oh\s*ver|over\s*over)\b/g,'over'],
  [/\b(outs|owt|ount)\b/g,'out'],
  [/\b(medical|medic\s*o|medica|mexico|medi\s*co|medicos)\b/g,'medico'],
  [/\b(r\s*c\s*c|rc\s*c|r\s*cc|our\s*c\s*c|our\s*cc|are\s*c\s*c|are\s*cc|are\s*see\s*see|our\s*see\s*see|arcc|arc\s*c|rcca|rccs|argc|rcs)\b/g,'rcc'],
  [/\b(hi\s*fa|high\s*fa|hai\s*fa|hey\s*fa|hay\s*fa|eye\s*fa|i\s*fa|hyfa|heifa|haiffa|high\s*far|hi\s*far|hi\s*fah|haif|haifas|hayfa|hifa|hyphen|hyphens|heifer|heifers|haifer|hi\s*fi|hifi|hi\s*fire|high\s*fire|high\s*fa|high\s*five|hi\s*five|hai\s*fah|khaifa|chaifa|haifah|haiifa|haifaa|haaifa)\b/g,'haifa'],
  [/\brcc\s+(if\s*a|if\s*ah|a\s*fa|fa|ifa|i\s*fa)\b/g,'rcc haifa'],
  [/\btango\s*(romeo|rome\s*o|romero|rodeo|romio)\b/g,'tangoromeo'],
  [/\bstand\s*-?\s*by(e)?\b/g,'standby'],
  [/\blook\s*-?\s*out\b/g,'lookout'],
  [/\b(seelonce|silence|see\s*lonce)\b/g,'seelonce'],
  [/\b(life\s*raft|liferaft|life\s*craft|life\s*graft|life\s*draft|lifecraft)\b/g,'life raft'],
  [/\b(sarts?|s\s*a\s*r\s*t|s\s*art|start|sard)\b/g,'sart'],
  [/\bstar\s*board\b/g,'starboard'],[/\bport\s*side\b/g,'port side'],
  [/\btake\s*over\b/g,'takeover'],
  [/°/g,' degrees '],
  [/\bdegree\b/g,'degrees'],[/\bminute\b/g,'minutes'],
];
function norm(t){
  t=' '+String(t).toLowerCase().replace(/[’']/g,'').replace(/-/g,' ').replace(/[^a-z0-9éè°\s]/g,' ')+' ';
  for(const [re,rep] of FIX) t=t.replace(re,rep);
  let toks=t.split(/\s+/).filter(Boolean).map(w=>(w in NUMW)?String(NUMW[w]):w);
  // ambiguous words ("to", "for", "won"...) become digits only next to other digits
  for(let pass=0;pass<4;pass++) toks=toks.map((w,i)=>(w in NUMCTX)&&(/^\d+$/.test(toks[i-1]||'')||/^\d+$/.test(toks[i+1]||''))?String(NUMCTX[w]):w);
  return toks.join(' ').trim();
}
function numbers(t){ // join runs of single digits: "3 2" -> 32
  const toks=t.split(' '); const out=[]; let run='';
  for(const w of toks){
    if(/^\d$/.test(w)){run+=w;continue}
    if(run){out.push(run);run=''}
    if(/^\d+$/.test(w)) out.push(w);
  }
  if(run) out.push(run);
  return out;
}
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[n]}
const sim=(a,b)=>1-lev(a,b)/Math.max(a.length,b.length);
// fuzzy count of a word/phrase: tolerates recogniser splitting/merging words and small misspellings
function fcount(t,target){
  const toks=t.split(' ').filter(Boolean), tgt=target.replace(/ /g,''), k=target.split(' ').length; let c=0;
  for(let i=0;i<toks.length;){let hit=0;
    for(const L of [k,k+1,k-1]){ if(L<1||i+L>toks.length) continue; const s=toks.slice(i,i+L).join('');
      if(s===tgt||(tgt.length>=5&&s.length>=3&&sim(s,tgt)>=0.72)){hit=L;break} }
    if(hit){c++;i+=hit}else i++}
  return c;
}
const count=(t,w)=>fcount(t,w);
// sound-alike key for short names (Pete ~ Peat ~ Peet)
function sdx(w){w=w.replace(/[^a-z]/g,'');if(!w)return '';const m={b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6};
  let k=w[0].toUpperCase(),last=m[w[0]]||0;for(const ch of w.slice(1)){const c=m[ch]||0;if(c&&c!==last)k+=c;if(ch!=='h'&&ch!=='w')last=c}return (k+'000').slice(0,4)}
const GENERIC=/\b(sailboat|sail boat|sailing yacht|motor yacht|yacht|sy|mv|my|vessel|boat|ship)\b/g;
// counts how often a vessel name was said; ignores "sailboat"/"yacht" and accepts sound-alikes
function nameCount(t,name){
  let core=norm(name).replace(GENERIC,' ').replace(/\s+/g,' ').trim(); if(!core) core=norm(name);
  const toks=t.split(' ').filter(Boolean), tgt=core.replace(/ /g,''), k=core.split(' ').length; let c=0;
  const ok=s=>s===tgt||(tgt.length>=5&&s.length>=3&&sim(s,tgt)>=0.72)||(s.length>=2&&Math.abs(s.length-tgt.length)<=2&&sdx(s)===sdx(tgt));
  for(let i=0;i<toks.length;){let hit=0;
    for(const L of [k,k+1,k-1]){ if(L<1||i+L>toks.length) continue; if(ok(toks.slice(i,i+L).join(''))){hit=L;break} }
    if(hit){c++;i+=hit}else i++}
  return c;
}
const has=(t,re)=>re.test(t);
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const nameRe=n=>norm(n);

/* ---------- check builders ---------- */
const C={
  word3:(w,label)=>({label:label||`${w.toUpperCase()} ×3`,hint:`Say ${w.toUpperCase()} three times at the start`,test:t=>count(t,w)>=3}),
  word1:(w,label,hint)=>({label:label||w.toUpperCase(),hint:hint||`Start with ${w.toUpperCase()}`,test:t=>count(t,w)>=1}),
  thisIs:()=>({label:'“This is”',hint:'Say THIS IS before your own name',test:t=>/\bthis is\b/.test(t)}),
  nameN:(n,k,who)=>({label:`${who||'Your vessel name'} ×${k}`,hint:`Say ${n} ${k===1?'once':k===2?'twice':'three times'}`,test:t=>nameCount(t,n)>=k}),
  mmsi:(m)=>({label:'MMSI',hint:`Say your MMSI ${m} after your name`,test:t=>{const runs=t.replace(/(\d)\s+(?=\d)/g,'$1').match(/\d+/g)||[];return runs.some(r=>{if(r.includes(m))return true;for(let i=0;i+m.length<=r.length+1;i++){const seg=r.slice(i,i+m.length);if(seg.length>=m.length-1&&lev(seg,m)<=1)return true}return false})}}),
  pos:(p)=>({label:'Position',hint:`Give the position: ${posShow(p)}`,test:t=>{const c=t.replace(/(\d)\s+(?=\d)/g,'$1');
    const lat=new RegExp(pad(p.la,2)+'\\s*(degrees?)?\\s*0?'+p.lam+'\\s*(minutes?)?\\s*(north|n)\\b');
    const lon=new RegExp('0?'+p.lo+'\\s*(degrees?)?\\s*0?'+p.lom+'\\s*(minutes?)?\\s*(east|e)\\b');
    return lat.test(c)&&lon.test(c)}}),
  any:(label,re,hint)=>({label,hint,test:t=>re.test(t)}),
  pob:(v)=>({label:'Persons on board',hint:`Say ${W[v]} persons on board`,test:t=>new RegExp('\\b'+v+'\\s+(persons?|people|pob|souls|crew)\\b').test(t)}),
  num:(label,v,hint)=>({label,hint,test:t=>numbers(t).map(Number).includes(v)}),
  endWith:(w,wrong)=>({label:`Ends with “${w.toUpperCase()}”`,hint:w==='out'?'This message expects no reply, so finish with OUT':'You expect a reply, so finish with OVER',test:t=>new RegExp('\\b'+w+'\\s*$').test(t)&&!(wrong&&new RegExp('\\b'+wrong+'\\s*$').test(t))}),
};
