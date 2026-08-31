/*!
 * Filmlos — pick a film by mood, not by title.
 * Vanilla JS, no build step, no dependencies.
 */
(function(){
  "use strict";

  var LISTS_INDEX = 'lists/index.json';

  // ---------- CSV parsing ----------
  function parseCSV(text){
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++){
      const c = text[i];
      if (inQuotes){
        if (c === '"'){
          if (text[i+1] === '"'){ field += '"'; i++; }
          else { inQuotes = false; }
        } else { field += c; }
      } else {
        if (c === '"'){ inQuotes = true; }
        else if (c === ','){ row.push(field); field=''; }
        else if (c === '\n' || c === '\r'){
          if (c === '\r' && text[i+1] === '\n') i++;
          row.push(field); field='';
          if (!(row.length===1 && row[0]==='')) rows.push(row);
          row=[];
        } else { field += c; }
      }
    }
    if (field.length>0 || row.length>0){ row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows){
    const header = rows[0].map(h=>h.trim().replace(/^\uFEFF/, ''));
    return rows.slice(1).filter(r=>r.length>1 || r[0]!=='').map(r=>{
      const obj = {};
      header.forEach((h,i)=> obj[h] = (r[i]!==undefined? r[i].trim() : ''));
      obj.year = parseInt(obj.year,10);
      obj.runtime_min = parseInt(obj.runtime_min,10);
      ['attention','weight','tension','action','humor'].forEach(k=> obj[k] = String(parseInt(obj[k],10)));
      return obj;
    });
  }

  // ---------- Derived buckets ----------
  function runtimeBucket(min){
    if (min < 90) return 'Short';
    if (min <= 120) return 'Medium';
    if (min <= 160) return 'Long';
    return 'Epic';
  }
  function decadeBucket(year){
    if (year < 1980) return 'Pre-1980';
    if (year < 1990) return '1980s';
    if (year < 2000) return '1990s';
    if (year < 2010) return '2000s';
    if (year < 2020) return '2010s';
    return '2020s';
  }
  function fmtRuntime(min){
    const h = Math.floor(min/60), m = min%60;
    if (h<=0) return m+' min';
    return h+'h'+(m>0? ' '+m+' min':'');
  }
  const MOOD_ICON = {'Positive':'☀️','Bittersweet':'🌗','Bleak':'🌑'};

  // ---------- Controlled vocabularies ----------
  // Filter chips come from these lists, not from the CSV. A value that is not
  // listed here never gets a chip, so the film simply never shows up for it.
  const GENRES = ['Drama','Comedy','Thriller','Action','Horror','Sci-Fi','Crime','Romance','Biopic','War','Western','Mystery','Fantasy','Animation','Musical','Adventure','Documentary','Family','Sports'];
  const SETTINGS = ['Modern','Historical','War','Future','Fantasy World'];
  const THEMES = ['Family','Friendship','Love & Relationships','Grief & Loss','Addiction','Mental Health','Coming-of-Age','Violence & Crime','War','Social Critique','Revenge','Identity','LGBTQ+','Art & Music','Power & Politics','Isolation & Loneliness','Survival'];

  const GROUPS = [
    {key:'runtime', label:'Runtime', type:'derived', compute:m=>runtimeBucket(m.runtime_min), options:[['Short','Short (<90 min)'],['Medium','Medium (90–120)'],['Long','Long (121–160)'],['Epic','Epic (>160)']]},
    {key:'attention', label:'Attention needed', type:'scale', field:'attention', options:[['1','Low'],['2','Medium'],['3','High']]},
    {key:'weight', label:'Emotional weight', type:'scale', field:'weight', options:[['1','Light'],['2','Medium'],['3','Heavy']]},
    {key:'tension', label:'Tension', type:'scale', field:'tension', options:[['1','Low'],['2','Medium'],['3','High']]},
    {key:'action', label:'Action', type:'scale', field:'action', options:[['1','Low'],['2','Medium'],['3','High']]},
    {key:'humor', label:'Humor', type:'scale', field:'humor', options:[['1','Low'],['2','Medium'],['3','High']]},
    {key:'ending', label:'Emotional ending', type:'exact', field:'ending', options:['Positive','Bittersweet','Bleak']},
    {key:'genre', label:'Genre', type:'tag', field:'genre', options:GENRES},
    {key:'setting', label:'Setting', type:'tag', field:'setting', options:SETTINGS},
    {key:'themes', label:'Themes', type:'tag', field:'themes', options:THEMES},
    {key:'decade', label:'Decade', type:'derived', compute:m=>decadeBucket(m.year), options:['Pre-1980','1980s','1990s','2000s','2010s','2020s']},
    {key:'style', label:'Indie – Mainstream', type:'exact', field:'style', options:['Indie','Mixed','Mainstream']},
    {key:'series', label:'Format', type:'exact', field:'series', options:[['No','Standalone'],['Yes','Series / saga']]},
  ];
  // Dynamic group: which of the loaded lists to draw from.
  // Only shown once more than one source is loaded.
  const SOURCE_GROUP = {key:'source', label:'Film list', type:'exact', field:'_source', options:[]};
  let loadedSourceOrder = [];
  function activeGroups(){
    return loadedSourceOrder.length > 1 ? GROUPS.concat([SOURCE_GROUP]) : GROUPS;
  }

  let MOVIES = [];
  const selected = {}; // group key -> Set of raw values
  GROUPS.concat([SOURCE_GROUP]).forEach(g=> selected[g.key] = new Set());

  // ---------- Matching ----------
  function movieMatches(m){
    for (const g of activeGroups()){
      const sel = selected[g.key];
      if (sel.size === 0) continue;
      if (g.type === 'tag'){
        const vals = (m[g.field]||'').split('|');
        if (!vals.some(v=>sel.has(v))) return false;
      } else if (g.type === 'derived'){
        if (!sel.has(g.compute(m))) return false;
      } else { // scale or exact
        if (!sel.has(m[g.field])) return false;
      }
    }
    return true;
  }

  function currentMatches(){
    return MOVIES.filter(movieMatches);
  }

  // ---------- Filter rendering ----------
  const filtersEl = document.getElementById('filters');
  function renderFilters(){
    filtersEl.innerHTML = '';
    activeGroups().forEach(g=>{
      const box = document.createElement('div');
      box.className = 'group';
      const h = document.createElement('h3');
      h.textContent = g.label;
      box.appendChild(h);
      const chips = document.createElement('div');
      chips.className = 'chips';
      const opts = g.options.map(o => Array.isArray(o) ? o : [o,o]);
      opts.forEach(([value,label])=>{
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = label;
        chip.dataset.group = g.key;
        chip.dataset.value = value;
        if (selected[g.key].has(value)) chip.classList.add('active');
        chip.addEventListener('click', ()=>{
          const sel = selected[g.key];
          if (sel.has(value)){ sel.delete(value); chip.classList.remove('active'); }
          else { sel.add(value); chip.classList.add('active'); }
          updateStatus();
        });
        chips.appendChild(chip);
      });
      box.appendChild(chips);
      filtersEl.appendChild(box);
    });
  }

  // ---------- Status bar ----------
  const dial = document.getElementById('dial');
  const dialNum = document.getElementById('dial-num');
  const countText = document.getElementById('count-text');
  const revealBtn = document.getElementById('reveal-btn');
  const randomBtn = document.getElementById('random-btn');

  function updateStatus(){
    const matches = currentMatches();
    const total = MOVIES.length;
    const pct = total ? Math.round(matches.length/total*100) : 0;
    dial.style.setProperty('--pct', pct);
    dialNum.textContent = matches.length;
    countText.textContent = matches.length + ' of ' + total + ' films';
    revealBtn.disabled = matches.length === 0;
    randomBtn.disabled = matches.length === 0;
  }

  // ---------- Reveal overlay ----------
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const grid = document.getElementById('results-grid');
  const emptyState = document.getElementById('empty-state');

  function escapeHTML(s){
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function ticketHTML(m){
    const genreTags = (m.genre||'').split('|').slice(0,3);
    let tags = genreTags.map(t=>'<span class="tag">'+escapeHTML(t)+'</span>').join('');
    if (loadedSourceOrder.length > 1){
      tags += '<span class="tag tag-source">'+escapeHTML(m._source)+'</span>';
    }
    return '<div class="ticket">'
      + '<div class="mood">'+ (MOOD_ICON[m.ending]||'') +'</div>'
      + '<h4>'+ escapeHTML(m.title) +'</h4>'
      + '<div class="meta">'+ m.year +' · '+ fmtRuntime(m.runtime_min) +' · '+ escapeHTML(m.style) +'</div>'
      + '<div class="tags">'+ tags +'</div>'
      + '</div>';
  }

  function closeOverlay(){
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function openOverlayWith(list, singleMode){
    grid.innerHTML = '';
    if (list.length === 0){
      grid.style.display='none';
      emptyState.style.display='block';
    } else {
      grid.style.display='grid';
      emptyState.style.display='none';
      grid.className = singleMode ? 'single' : '';
      list.forEach(m=> grid.insertAdjacentHTML('beforeend', ticketHTML(m)));
    }
    overlayTitle.textContent = singleMode ? 'How about this one?' : (list.length + ' match' + (list.length===1?'':'es'));
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  document.getElementById('close-overlay').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e=>{ if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && overlay.style.display === 'block') closeOverlay(); });

  revealBtn.addEventListener('click', ()=> openOverlayWith(currentMatches(), false));
  randomBtn.addEventListener('click', ()=>{
    const matches = currentMatches();
    if (!matches.length) return;
    openOverlayWith([matches[Math.floor(Math.random()*matches.length)]], true);
  });
  document.getElementById('reset-btn').addEventListener('click', ()=>{
    activeGroups().forEach(g=> selected[g.key].clear());
    document.querySelectorAll('.chip.active').forEach(c=>c.classList.remove('active'));
    updateStatus();
  });

  // ---------- Loading ----------
  const startEl = document.getElementById('start');
  const bundledEl = document.getElementById('bundled');
  const bundledListsEl = document.getElementById('bundled-lists');
  const loadBundledBtn = document.getElementById('load-bundled-btn');
  const offlineNote = document.getElementById('offline-note');
  const loader = document.getElementById('loader');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const loaderError = document.getElementById('loader-error');
  const statusbar = document.getElementById('statusbar');
  const reloadRow = document.getElementById('reload-row');
  const loadedInfo = document.getElementById('loaded-info');
  const addListBtn = document.getElementById('add-list-btn');
  const resetListsBtn = document.getElementById('reset-lists-btn');

  const REQUIRED = ['title','year','runtime_min','attention','weight','tension','action','humor','ending','genre','setting','themes','series','style'];

  function normTitle(t){
    return (t||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  }

  function labelFromFilename(name){
    const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g,' ').trim();
    return base.replace(/\w\S*/g, w => w.charAt(0).toUpperCase()+w.slice(1)) || name;
  }

  let dupTotal = 0;

  // Parses one CSV and merges it into MOVIES. Throws on a malformed file.
  function ingest(text, fallbackLabel, forcedLabel){
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('file is empty');
    const objs = rowsToObjects(rows);
    const missing = REQUIRED.filter(k=> !(k in objs[0]));
    if (missing.length) throw new Error('missing columns: '+missing.join(', '));

    const seen = new Set(MOVIES.map(m=>normTitle(m.title)));
    objs.forEach(o=>{
      const src = forcedLabel || ((o.source && o.source.trim()) ? o.source.trim() : fallbackLabel);
      o._source = src;
      const key = normTitle(o.title);
      if (seen.has(key)){ dupTotal++; return; }
      seen.add(key);
      if (!loadedSourceOrder.includes(src)) loadedSourceOrder.push(src);
      MOVIES.push(o);
    });
  }

  function showError(messages){
    loaderError.textContent = messages.join(' · ');
    loaderError.style.display = messages.length ? 'block' : 'none';
  }

  async function handleFiles(fileList){
    showError([]);
    const errors = [];
    for (const file of Array.from(fileList)){
      try{
        ingest(await file.text(), labelFromFilename(file.name));
      }catch(err){
        errors.push(file.name+': '+err.message);
      }
    }
    if (errors.length) showError(errors);
    if (MOVIES.length) applyLoaded();
  }

  function applyLoaded(){
    startEl.style.display = 'none';
    statusbar.style.display = 'block';
    filtersEl.style.display = 'block';
    reloadRow.style.display = 'flex';
    const countFor = s => MOVIES.filter(m=>m._source===s).length;
    SOURCE_GROUP.options = loadedSourceOrder.map(s => [s, s + ' (' + countFor(s) + ')']);
    const summary = loadedSourceOrder.map(s => s + ' (' + countFor(s) + ')').join(' · ');
    loadedInfo.textContent = summary + ' — ' + MOVIES.length + ' films total'
      + (dupTotal ? ', ' + dupTotal + ' duplicate' + (dupTotal===1?'':'s') + ' skipped' : '');
    renderFilters();
    updateStatus();
  }

  browseBtn.addEventListener('click', ()=> fileInput.click());
  addListBtn.addEventListener('click', ()=> fileInput.click());
  loader.addEventListener('click', e=>{ if (e.target===loader) fileInput.click(); });
  fileInput.addEventListener('change', ()=>{
    if (fileInput.files.length) handleFiles(fileInput.files);
    fileInput.value = ''; // lets the same file be picked again
  });

  ['dragover','dragenter'].forEach(evt=> loader.addEventListener(evt, e=>{ e.preventDefault(); loader.classList.add('drag'); }));
  ['dragleave','drop'].forEach(evt=> loader.addEventListener(evt, e=>{ e.preventDefault(); loader.classList.remove('drag'); }));
  loader.addEventListener('drop', e=>{
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });

  resetListsBtn.addEventListener('click', ()=>{
    MOVIES = [];
    loadedSourceOrder = [];
    dupTotal = 0;
    SOURCE_GROUP.options = [];
    GROUPS.concat([SOURCE_GROUP]).forEach(g=> selected[g.key].clear());
    startEl.style.display = 'block';
    statusbar.style.display = 'none';
    filtersEl.style.display = 'none';
    reloadRow.style.display = 'none';
    showError([]);
  });

  // ---------- Bundled lists ----------
  // Only reachable over http(s). Opened straight from disk (file://) the fetch
  // is blocked by the browser, and the file picker below stays the only route.
  async function initBundled(){
    let index;
    try{
      const res = await fetch(LISTS_INDEX, {cache:'no-cache'});
      if (!res.ok) throw new Error('HTTP '+res.status);
      index = await res.json();
      if (!index.lists || !index.lists.length) throw new Error('no lists in index');
    }catch(err){
      offlineNote.style.display = 'block';
      return;
    }
    renderBundled(index.lists);
  }

  function renderBundled(lists){
    bundledListsEl.innerHTML = '';
    lists.forEach((entry, i)=>{
      const card = document.createElement('label');
      card.className = 'list-card';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = entry.default !== false;
      cb.dataset.idx = String(i);
      if (cb.checked) card.classList.add('checked');
      cb.addEventListener('change', ()=>{
        card.classList.toggle('checked', cb.checked);
        loadBundledBtn.disabled = !bundledListsEl.querySelector('input:checked');
      });
      const body = document.createElement('div');
      const name = document.createElement('span');
      name.className = 'list-name';
      name.textContent = entry.name;
      if (entry.count){
        const c = document.createElement('span');
        c.className = 'list-count';
        c.textContent = '  ' + entry.count + ' films';
        name.appendChild(c);
      }
      const desc = document.createElement('span');
      desc.className = 'list-desc';
      desc.textContent = entry.description || '';
      body.appendChild(name);
      body.appendChild(desc);
      card.appendChild(cb);
      card.appendChild(body);
      bundledListsEl.appendChild(card);
    });
    loadBundledBtn.disabled = !bundledListsEl.querySelector('input:checked');
    loadBundledBtn.addEventListener('click', async ()=>{
      const picked = Array.from(bundledListsEl.querySelectorAll('input:checked'))
        .map(cb => lists[parseInt(cb.dataset.idx,10)]);
      loadBundledBtn.disabled = true;
      showError([]);
      const errors = [];
      for (const entry of picked){
        try{
          const res = await fetch('lists/'+entry.file, {cache:'no-cache'});
          if (!res.ok) throw new Error('HTTP '+res.status);
          ingest(await res.text(), labelFromFilename(entry.file), entry.name);
        }catch(err){
          errors.push(entry.file+': '+err.message);
        }
      }
      loadBundledBtn.disabled = false;
      if (errors.length) showError(errors);
      if (MOVIES.length) applyLoaded();
    });
    bundledEl.style.display = 'block';
  }

  initBundled();
})();
