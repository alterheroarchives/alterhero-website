/* meta.js — builds window.THUMB_META from assets/theahrchivesmetaos.csv at load time.
   The explorer (and the market panel) read:
       window.THUMB_META = { "<tokenID>": { t:[[traitType, traitValue], ...] }, ... }
   Trait columns come straight from the CSV header: every "attributes[X]" column plus the
   bare "Fire" column (which the sidebar calls "Aura"). Empty cells are skipped.
   Images fall back to thumbs/<id>.jpg since the CSV carries no image hash. */
(function(){
  "use strict";

  function parseCSV(str){
    var rows=[], row=[], cur="", q=false, i, ch;
    for(i=0;i<str.length;i++){ ch=str.charAt(i);
      if(q){
        if(ch==='"'){ if(str.charAt(i+1)==='"'){ cur+='"'; i++; } else q=false; }
        else cur+=ch;
      } else if(ch==='"'){ q=true; }
      else if(ch===','){ row.push(cur); cur=""; }
      else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=""; }
      else if(ch==='\r'){ /* skip */ }
      else cur+=ch;
    }
    if(cur!=="" || row.length){ row.push(cur); rows.push(row); }
    return rows;
  }

  try{
    var xhr=new XMLHttpRequest();
    xhr.open("GET","assets/theahrchivesmetaos.csv",false);   // synchronous: THUMB_META must be ready before explorer runs
    xhr.send(null);
    var text=xhr.responseText||"";
    var rows=parseCSV(text);
    if(rows.length<2){ window.__noMeta=true; return; }

    var header=rows[0], idIdx=-1, cols=[], c, h, m;
    for(c=0;c<header.length;c++){
      h=(header[c]||"").trim();
      if(h==="tokenID"){ idIdx=c; continue; }
      m=/^attributes\[(.+)\]$/.exec(h);
      if(m){ cols.push({ i:c, type:m[1] }); }
      else if(h==="Fire"){ cols.push({ i:c, type:"Aura" }); }   // CSV labels this column "Fire"; UI shows "Aura"
    }
    if(idIdx<0) idIdx=0;

    var META={}, r, row, id, t, j, v;
    for(r=1;r<rows.length;r++){
      row=rows[r]; if(!row || !row.length) continue;
      id=(row[idIdx]||"").trim(); if(!id) continue;
      t=[];
      for(j=0;j<cols.length;j++){
        v=(row[cols[j].i]||"").trim();
        if(v) t.push([ cols[j].type, v ]);
      }
      META[id]={ t:t };
    }
    window.THUMB_META=META;
  }catch(e){
    window.__noMeta=true;
  }
})();
