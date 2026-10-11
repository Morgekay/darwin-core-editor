(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var STORE = 'dwc-editor-v2';
  var HANDLES = {}; // id файла -> FileSystemFileHandle (только в памяти текущей сессии)

  // ---- справочник терминов ----
  var TERMS = {}, ORDER = [], LOWER = {};
  DWC_RAW.trim().split('\n').forEach(function (l) {
    var p = l.split('|'); if (p.length < 3) return;
    TERMS[p[0]] = { key: p[0], group: p[1], desc: p[2], ex: p[3] || '' };
    ORDER.push(p[0]); LOWER[p[0].toLowerCase()] = p[0];
  });
  var GROUP_ORDER = ['tax', 'occ', 'evt', 'loc', 'idn', 'rec', '_custom'];
  var GROUP_NAME = Object.assign({ _custom: 'Свои параметры' }, DWC_GROUPS);

  // ---- состояние ----
  var S = { files: [], active: null, custom: {}, prefix: 'OCC-' };
  function uid() { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
  function F() { return S.files.filter(function (f) { return f.id === S.active; })[0]; }
  function fileById(id) { return S.files.filter(function (f) { return f.id === id; })[0]; }
  function newFileObj(name, cols) {
    var f = { id: uid(), name: uniqueName(name), cols: cols || [], rows: [], linked: false, dirty: false };
    S.files.push(f); return f;
  }
  function uniqueName(n) {
    var base = n, i = 2; while (S.files.some(function (f) { return f.name === n; })) n = base + ' (' + (i++) + ')'; return n;
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.files) S = s;
      else {
        var o = JSON.parse(localStorage.getItem('dwc-editor-v1'));
        if (o && o.cols) { S.custom = o.custom || {}; S.prefix = o.prefix || 'OCC-'; var f = newFileObj('occurrences', o.cols); f.rows = o.rows || []; S.active = f.id; }
      }
    } catch (e) {}
    Object.keys(DWC_BUILTIN_CUSTOM).forEach(function (k) { if (!(k in S.custom)) S.custom[k] = DWC_BUILTIN_CUSTOM[k]; });
    if (!S.files.length) { var f0 = newFileObj('occurrences', []); S.active = f0.id; applyPreset(f0, 'Минимальный'); }
    if (!F()) S.active = S.files[0].id;
  }
  function isCustom(k) { return !TERMS[k]; }
  function descOf(k) { return TERMS[k] ? TERMS[k].desc : (S.custom[k] || 'Пользовательский параметр (не входит в Darwin Core).'); }
  function hasCol(f, k) { return f.cols.some(function (c) { return c.key === k; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var e = $('toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.display = 'none'; }, 3500); }

  // ---- справка ----
  function showHelp(k) {
    var t = TERMS[k];
    var html = '<b>' + esc(k) + '</b> ' + (t ? '<span class="ex">(Darwin Core · ' + esc(DWC_GROUPS[t.group]) + ')</span>' : '<span class="ex">(свой параметр)</span>');
    html += '<div>' + esc(descOf(k)) + '</div>';
    if (t && t.ex) html += '<div class="ex">Пример: ' + esc(t.ex) + '</div>';
    if (DWC_VOCAB[k]) html += '<div class="ex">Допустимые значения: ' + esc(DWC_VOCAB[k].join(', ')) + '</div>';
    $('help').innerHTML = html;
  }

  // ---- проверка значений ----
  var ISO = /^(n\/d|\d{4}(-\d{2}(-\d{2}(T[\d:+\-Z.]+)?)?)?(\/\d{4}(-\d{2}(-\d{2})?)?)?)$/;
  function bad(k, v) {
    v = String(v || '').trim();
    if (v === '' || v === 'n/d') return false;
    if (k === 'eventDate' || k === 'dateIdentified') return !ISO.test(v);
    var n = v.replace(',', '.');
    if (k === 'decimalLatitude') return !(isFinite(n) && Math.abs(+n) <= 90);
    if (k === 'decimalLongitude') return !(isFinite(n) && Math.abs(+n) <= 180);
    if (DWC_NUMERIC.indexOf(k) >= 0) return !isFinite(n);
    return false;
  }
  function nextId(f) {
    var max = 0, re = new RegExp('^' + S.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
    f.rows.forEach(function (r) { var m = re.exec(r.occurrenceID || ''); if (m) max = Math.max(max, +m[1]); });
    return S.prefix + String(max + 1).padStart(4, '0');
  }
  function defaults(f) {
    var r = {}; f.cols.forEach(function (c) { if (c.def) r[c.key] = c.def; });
    if (hasCol(f, 'occurrenceID')) r.occurrenceID = nextId(f);
    return r;
  }

  // ---- выбор файла ----
  function renderFileSel() {
    [$('fsel'), $('dTarget')].forEach(function (sel) {
      var cur = sel === $('fsel') ? S.active : sel.value;
      sel.innerHTML = '';
      S.files.forEach(function (f) { var o = document.createElement('option'); o.value = f.id; o.textContent = f.name + (f.dirty ? ' •' : ''); sel.appendChild(o); });
      sel.value = fileById(cur) ? cur : S.active;
    });
  }
  $('fsel').onchange = function () { S.active = $('fsel').value; save(); renderAll(); };
  function createFile(copyCols) {
    var n = prompt('Название нового файла (без расширения):', 'occurrences');
    if (!n) return null;
    var cols = [];
    var cur = F();
    if (copyCols && cur && confirm('Взять те же столбцы, что в файле «' + cur.name + '»?\n\nОК — те же, Отмена — минимальный набор.')) cols = JSON.parse(JSON.stringify(cur.cols));
    var f = newFileObj(n.replace(/[\\/:*?"<>|]/g, '_'), cols);
    if (!cols.length) applyPreset(f, 'Минимальный');
    S.active = f.id; save(); renderAll();
    return f;
  }
  $('bNewFile').onclick = function () { createFile(true); };
  $('bDelFile').onclick = function () {
    var f = F();
    if (!confirm('Убрать «' + f.name + '» из списка приложения? Файл на диске останется как есть.' + (f.dirty ? '\n\nВНИМАНИЕ: есть несохранённые изменения!' : ''))) return;
    S.files = S.files.filter(function (x) { return x !== f; }); delete HANDLES[f.id]; delH(f.id);
    if (!S.files.length) { var n = newFileObj('occurrences', []); applyPreset(n, 'Минимальный'); }
    S.active = S.files[0].id; save(); renderAll();
  };

  // ---- параметры / столбцы ----
  function applyPreset(f, name) {
    var keys = DWC_PRESETS[name]; if (!keys) return;
    keys.forEach(function (k) {
      if (!TERMS[k] && !(k in S.custom)) S.custom[k] = DWC_BUILTIN_CUSTOM[k] || 'Пользовательский параметр.';
      if (!hasCol(f, k)) f.cols.push({ key: k, def: '' });
    });
    var dflt = { kingdom: 'Fungi', phylum: 'Ascomycota', class: 'Laboulbeniomycetes', order: 'Laboulbeniales', taxonRank: 'species', basisOfRecord: 'PreservedSpecimen', geodeticDatum: 'WGS84' };
    if (name !== 'Минимальный') f.cols.forEach(function (c) { if (!c.def && dflt[c.key]) c.def = dflt[c.key]; });
  }
  function colHasData(f, k) { return f.rows.filter(function (r) { return r[k] && String(r[k]).trim() !== ''; }).length; }
  function toggleCol(k, on) {
    var f = F();
    if (!on) {
      var n = colHasData(f, k);
      if (n && !confirm('В столбце «' + k + '» есть данные (' + n + ' зап.). При сохранении в файл столбец исчезнет вместе с данными.\n(Если добавить столбец обратно в этой же сессии приложения, данные вернутся.)\n\nУбрать столбец?')) { renderAll(); return false; }
      f.cols = f.cols.filter(function (c) { return c.key !== k; });
    } else if (!hasCol(f, k)) f.cols.push({ key: k, def: '' });
    f.dirty = true; save(); renderAll(); return true;
  }
  function moveCol(from, to) {
    var f = F(); if (from === to || to < 0 || to >= f.cols.length) return;
    var c = f.cols.splice(from, 1)[0]; f.cols.splice(to, 0, c);
    f.dirty = true; save(); renderCols(); renderTable(); stat(); renderFileSel();
  }
  function renderGroups() {
    var f = F(), q = $('search').value.trim().toLowerCase(), box = $('groups'); box.innerHTML = '';
    GROUP_ORDER.forEach(function (g) {
      var list = g === '_custom' ? Object.keys(S.custom) : ORDER.filter(function (k) { return TERMS[k].group === g; });
      if (q) list = list.filter(function (k) { return (k + ' ' + descOf(k)).toLowerCase().indexOf(q) >= 0; });
      if (!list.length) return;
      var d = document.createElement('details'); d.className = 'group';
      d.open = !!q || g === 'tax' || g === 'occ' || g === '_custom';
      var sm = document.createElement('summary'); sm.textContent = GROUP_NAME[g] + ' (' + list.length + ')'; d.appendChild(sm);
      list.forEach(function (k) {
        var l = document.createElement('label'); l.className = 'field' + (isCustom(k) ? ' custom' : '');
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = hasCol(f, k);
        cb.onchange = function () { toggleCol(k, cb.checked); };
        var sp = document.createElement('span'); sp.textContent = k;
        l.appendChild(cb); l.appendChild(sp);
        if (isCustom(k)) {
          var x = document.createElement('button'); x.className = 'small'; x.textContent = '✕'; x.title = 'Удалить свой параметр из списка';
          x.onclick = function (e) {
            e.preventDefault();
            if (!confirm('Удалить свой параметр «' + k + '» и его столбцы во всех файлах?')) return;
            delete S.custom[k]; S.files.forEach(function (ff) { ff.cols = ff.cols.filter(function (c) { return c.key !== k; }); });
            save(); renderAll();
          };
          l.appendChild(x);
        }
        l.onmouseenter = function () { showHelp(k); };
        d.appendChild(l);
      });
      box.appendChild(d);
    });
  }
  function renderCols() {
    var f = F(), p = $('p2'); p.innerHTML = '';
    var hint = document.createElement('div'); hint.className = 'ex';
    hint.innerHTML = 'Столбцы файла «<b>' + esc(f.name) + '</b>». Порядок меняйте перетаскиванием за ⠿ или кнопками ↑ ↓ (то же — кнопками ◀ ▶ в заголовках таблицы). Поле под названием — значение по умолчанию для новых организмов.';
    p.appendChild(hint);
    var add = document.createElement('select'); add.style.cssText = 'width:100%;margin:8px 0';
    add.innerHTML = '<option value="">+ Добавить параметр в этот файл…</option>';
    ORDER.concat(Object.keys(S.custom)).forEach(function (k) {
      if (hasCol(f, k)) return;
      var o = document.createElement('option'); o.value = k; o.textContent = k + (TERMS[k] ? '  — ' + GROUP_NAME[TERMS[k].group] : '  (свой)'); o.title = descOf(k); add.appendChild(o);
    });
    add.onchange = function () { if (add.value) { var k = add.value; toggleCol(k, true); showHelp(k); } };
    p.appendChild(add);
    if (!f.cols.length) { var em = document.createElement('div'); em.className = 'empty'; em.textContent = 'Столбцы не выбраны'; p.appendChild(em); return; }
    var dragFrom = null;
    f.cols.forEach(function (c, i) {
      var r = document.createElement('div'); r.className = 'colrow'; r.draggable = true;
      r.ondragstart = function (e) { dragFrom = i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (x) {} r.style.opacity = .5; };
      r.ondragend = function () { r.style.opacity = 1; };
      r.ondragover = function (e) { e.preventDefault(); r.style.background = 'var(--soft)'; };
      r.ondragleave = function () { r.style.background = ''; };
      r.ondrop = function (e) { e.preventDefault(); r.style.background = ''; if (dragFrom !== null) moveCol(dragFrom, i); dragFrom = null; };
      var nm = document.createElement('div'); nm.className = 'nm'; nm.innerHTML = '<span style="cursor:grab;color:var(--muted)">⠿</span> ' + (i + 1) + '. ' + esc(c.key);
      nm.onmouseenter = function () { showHelp(c.key); };
      var bt = document.createElement('div');
      [['↑', -1], ['↓', 1]].forEach(function (a) {
        var b = document.createElement('button'); b.className = 'small'; b.textContent = a[0]; b.title = a[1] < 0 ? 'Выше' : 'Ниже';
        b.onclick = function () { moveCol(i, i + a[1]); }; bt.appendChild(b);
      });
      var rm = document.createElement('button'); rm.className = 'small'; rm.textContent = '✕'; rm.title = 'Убрать столбец из файла';
      rm.onclick = function () { toggleCol(c.key, false); };
      bt.appendChild(rm);
      var inp = document.createElement('input'); inp.type = 'text'; inp.value = c.def; inp.placeholder = 'по умолчанию';
      inp.oninput = function () { c.def = inp.value; save(); };
      var wrap = document.createElement('div'); wrap.style.gridColumn = '1 / 3'; wrap.appendChild(inp);
      r.appendChild(nm); r.appendChild(bt); r.appendChild(wrap); p.appendChild(r);
    });
  }
  $('cAdd').onclick = function () {
    var n = $('cName').value.trim(), d = $('cDesc').value.trim(), e = $('cErr'); e.textContent = '';
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(n)) { e.textContent = 'Название: латиница, цифры и «_», без пробелов (в стиле camelCase, как в Darwin Core).'; return; }
    if (LOWER[n.toLowerCase()]) { e.textContent = 'Такой параметр уже есть в Darwin Core (' + LOWER[n.toLowerCase()] + ') — выберите его из списка.'; return; }
    if (S.custom[n] !== undefined) { e.textContent = 'Свой параметр с таким названием уже существует.'; return; }
    if (!d) { e.textContent = 'Опишите, что означает параметр — описание попадёт на отдельный лист файла.'; return; }
    var f = F(); S.custom[n] = d; f.cols.push({ key: n, def: $('cDef').value }); f.dirty = true;
    $('cName').value = $('cDesc').value = $('cDef').value = ''; save(); renderAll();
  };

  // ---- таблица ----
  function renderTable(flashIdx) {
    var f = F(), w = $('tw');
    if (!f.cols.length) { w.innerHTML = '<div class="empty">Выберите параметры слева, чтобы получить столбцы.</div>'; return; }
    var t = document.createElement('table'), hr = t.createTHead().insertRow();
    var th0 = document.createElement('th'); th0.className = 'rn'; th0.textContent = '№'; hr.appendChild(th0);
    f.cols.forEach(function (c, ci) {
      var th = document.createElement('th'); th.title = descOf(c.key);
      var nm = document.createElement('span'); nm.textContent = c.key + ' '; th.appendChild(nm);
      [['◀', -1, 'Сдвинуть столбец влево'], ['▶', 1, 'Сдвинуть столбец вправо'], ['✕', 0, 'Убрать столбец из файла']].forEach(function (a) {
        var b = document.createElement('button'); b.className = 'small'; b.textContent = a[0]; b.title = a[2]; b.style.cssText = 'padding:0 4px;margin-left:2px;font-size:10px';
        if (a[1] === -1 && ci === 0 || a[1] === 1 && ci === f.cols.length - 1) b.disabled = true;
        b.onclick = function (e) { e.stopPropagation(); if (a[1]) moveCol(ci, ci + a[1]); else toggleCol(c.key, false); };
        th.appendChild(b);
      });
      th.onmouseenter = function () { showHelp(c.key); }; hr.appendChild(th);
    });
    hr.appendChild(document.createElement('th'));
    var tb = t.createTBody();
    f.rows.forEach(function (row, i) {
      var tr = tb.insertRow(); if (i === flashIdx) tr.className = 'flash';
      var n = tr.insertCell(); n.className = 'rn'; n.textContent = i + 1; n.title = 'Открыть запись в форме';
      n.onclick = function () { openForm(i); };
      f.cols.forEach(function (c) {
        var td = tr.insertCell(), inp = document.createElement('input'); inp.type = 'text'; inp.value = row[c.key] || '';
        if (DWC_VOCAB[c.key]) inp.setAttribute('list', 'dl-' + c.key);
        var b0 = bad(c.key, inp.value); inp.className = b0 ? 'bad' : ''; inp.title = b0 ? 'Неверный формат. ' + descOf(c.key) : '';
        inp.onfocus = function () { showHelp(c.key); };
        inp.oninput = function () {
          row[c.key] = inp.value; var b = bad(c.key, inp.value);
          inp.className = b ? 'bad' : ''; inp.title = b ? 'Неверный формат. ' + descOf(c.key) : ''; markDirty();
        };
        td.appendChild(inp);
      });
      var a = tr.insertCell(); a.style.whiteSpace = 'nowrap';
      var dup = document.createElement('button'); dup.className = 'small'; dup.textContent = '⧉'; dup.title = 'Дублировать строку';
      dup.onclick = function () { var c = JSON.parse(JSON.stringify(row)); if (hasCol(f, 'occurrenceID')) c.occurrenceID = nextId(f); f.rows.splice(i + 1, 0, c); markDirty(); renderTable(i + 1); };
      var del = document.createElement('button'); del.className = 'small'; del.textContent = '✕'; del.title = 'Удалить строку';
      del.onclick = function () { if (!confirm('Удалить строку ' + (i + 1) + '?')) return; f.rows.splice(i, 1); markDirty(); renderTable(); };
      a.appendChild(dup); a.appendChild(del);
    });
    w.innerHTML = ''; w.appendChild(t);
    if (!f.rows.length) { var e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Записей пока нет — нажмите «+ Добавить организм».'; w.appendChild(e); }
    if (flashIdx !== undefined) { var fr = t.querySelector('tr.flash'); if (fr) fr.scrollIntoView({ block: 'nearest' }); }
  }
  function markDirty() { var f = F(); f.dirty = true; save(); stat(); renderFileSel(); }
  function stat() {
    var f = F(), nb = 0;
    f.rows.forEach(function (r) { f.cols.forEach(function (c) { if (bad(c.key, r[c.key])) nb++; }); });
    $('stat').innerHTML = '«' + esc(f.name) + '»: записей ' + f.rows.length + ' · столбцов ' + f.cols.length + (nb ? ' · <span class="err">неверный формат: ' + nb + '</span>' : '');
    $('link').textContent = (f.linked ? '· связан с файлом на диске' : '· не связан с файлом на диске (при сохранении — скачивание)') + (f.dirty ? ' · есть несохранённые изменения' : '');
    $('autoWrap').hidden = !HANDLES[f.id];
  }
  function renderAll() { renderFileSel(); renderGroups(); renderCols(); renderTable(); stat(); }

  // ---- форма «Добавить организм» ----
  var dlg = $('dlg'), dVals = {}, dEdit = null; // dEdit = индекс редактируемой строки или null
  function targetFile() { return fileById($('dTarget').value) || F(); }
  function openForm(editIdx) {
    dEdit = typeof editIdx === 'number' ? editIdx : null;
    renderFileSel(); $('dTarget').value = S.active; $('dTarget').disabled = dEdit !== null;
    $('dNewFile').hidden = dEdit !== null; $('dNext').hidden = dEdit !== null; $('dKeepW').hidden = dEdit !== null;
    $('dOk').textContent = dEdit === null ? 'Добавить' : 'Сохранить изменения';
    $('dTitle').textContent = dEdit === null ? 'Новый организм' : 'Запись № ' + (dEdit + 1);
    dVals = dEdit === null ? defaults(F()) : Object.assign({}, F().rows[dEdit]);
    buildForm();
    if (!dlg.open) dlg.showModal();
    var fi = $('dBody').querySelector('input'); if (fi) fi.focus();
  }
  function buildForm() {
    var f = targetFile(), body = $('dBody'); body.innerHTML = '';
    if (!f.cols.length) { body.innerHTML = '<div class="empty">В этом файле нет столбцов. Выберите «+ параметр…» вверху.</div>'; fillAddField(f); return; }
    var by = {}; f.cols.forEach(function (c) { var g = TERMS[c.key] ? TERMS[c.key].group : '_custom'; (by[g] = by[g] || []).push(c); });
    GROUP_ORDER.forEach(function (g) {
      if (!by[g]) return;
      var h = document.createElement('h4'); h.textContent = GROUP_NAME[g]; body.appendChild(h);
      var grid = document.createElement('div'); grid.className = 'grid';
      by[g].forEach(function (c) {
        var d = document.createElement('div'); d.className = 'fld';
        var b = document.createElement('b'); b.textContent = c.key;
        var inp = document.createElement('input'); inp.type = 'text'; inp.dataset.k = c.key; inp.value = dVals[c.key] || '';
        if (DWC_VOCAB[c.key]) inp.setAttribute('list', 'dl-' + c.key);
        var ex = TERMS[c.key] && TERMS[c.key].ex; if (ex) inp.placeholder = ex;
        var sm = document.createElement('small'); sm.textContent = descOf(c.key);
        inp.oninput = function () { dVals[c.key] = inp.value; inp.className = bad(c.key, inp.value) ? 'bad' : ''; };
        inp.className = bad(c.key, inp.value) ? 'bad' : '';
        inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(dEdit === null ? 'next' : 'ok'); } };
        d.appendChild(b); d.appendChild(inp); d.appendChild(sm); grid.appendChild(d);
      });
      body.appendChild(grid);
    });
    fillAddField(f);
  }
  function fillAddField(f) {
    var sel = $('dAddField'); sel.innerHTML = '<option value="">+ параметр в этот файл…</option>';
    ORDER.concat(Object.keys(S.custom)).forEach(function (k) {
      if (hasCol(f, k)) return;
      var o = document.createElement('option'); o.value = k; o.textContent = k + (TERMS[k] ? '' : ' (свой)'); o.title = descOf(k); sel.appendChild(o);
    });
  }
  $('dAddField').onchange = function () {
    var k = $('dAddField').value; if (!k) return;
    var f = targetFile(); f.cols.push({ key: k, def: '' }); f.dirty = true; save();
    buildForm(); var ni = $('dBody').querySelector('input[data-k="' + k + '"]'); if (ni) ni.focus(); showHelp(k);
    if (f === F()) { renderGroups(); renderCols(); renderTable(); stat(); renderFileSel(); }
  };
  $('dTarget').onchange = function () {
    var f = targetFile(), d = defaults(f), keep = {};
    f.cols.forEach(function (c) { keep[c.key] = (dVals[c.key] !== undefined && dVals[c.key] !== '') ? dVals[c.key] : d[c.key]; });
    if (hasCol(f, 'occurrenceID') && (!dVals.occurrenceID || /^(OCC-)/.test(dVals.occurrenceID))) keep.occurrenceID = d.occurrenceID;
    dVals = keep; buildForm();
  };
  $('dNewFile').onclick = function () {
    var f = createFile(true); if (!f) return;
    renderFileSel(); $('dTarget').value = f.id; $('dTarget').onchange();
  };
  $('dCancel').onclick = function () { dlg.close(); };
  $('dOk').onclick = function () { commit('ok'); };
  $('dNext').onclick = function () { commit('next'); };

  function commit(mode) {
    var f = targetFile(), row = {}, any = false, nb = [];
    f.cols.forEach(function (c) {
      var v = (dVals[c.key] || '').trim(); if (v) { row[c.key] = v; if (c.key !== 'occurrenceID' && v !== c.def) any = true; }
      if (bad(c.key, v)) nb.push(c.key);
    });
    if (!any) { alert('Форма пуста — заполните хотя бы одно поле.'); return; }
    if (nb.length && !confirm('Неверный формат в полях: ' + nb.join(', ') + '.\nВсё равно сохранить?')) return;
    var idx;
    if (dEdit === null) { f.rows.push(row); idx = f.rows.length - 1; }
    else { f.rows[dEdit] = row; idx = dEdit; }
    f.dirty = true; S.active = f.id; save();
    var msg = (dEdit === null ? 'Добавлено' : 'Изменено') + ' в «' + f.name + '», запись № ' + (idx + 1);
    renderAll(); renderTable(idx);
    if (HANDLES[f.id] && $('autoW').checked) saveFile(f, true).then(function (ok) { if (ok) toast(msg + ' · записано в файл'); }); else toast(msg + (f.linked ? ' (не забудьте «Сохранить .xlsx»)' : ''));
    if (mode === 'next' && dEdit === null) {
      var keep = $('dKeep').checked, d = defaults(f);
      dVals = keep ? Object.assign({}, dVals, hasCol(f, 'occurrenceID') ? { occurrenceID: d.occurrenceID } : {}) : d;
      buildForm(); var fi = $('dBody').querySelector('input'); if (fi) fi.focus();
    } else dlg.close();
  }
  $('bOrg').onclick = function () { openForm(); };

  // ---- инструменты ----
  function dms() {
    var d = parseFloat($('dg').value), m = parseFloat($('mn').value) || 0, s = parseFloat($('sc').value) || 0, h = +$('hm').value;
    if (isNaN(d)) { $('dres').textContent = '—'; return null; }
    var v = Math.round(h * (Math.abs(d) + m / 60 + s / 3600) * (d < 0 ? -1 : 1) * 1e6) / 1e6; $('dres').textContent = String(v); return v;
  }
  ['dg', 'mn', 'sc', 'hm'].forEach(function (i) { $(i).oninput = dms; });
  $('dcopy').onclick = function () { var v = dms(); if (v !== null && navigator.clipboard) navigator.clipboard.writeText(String(v)); };
  $('idPrefix').oninput = function () { S.prefix = $('idPrefix').value; save(); };
  $('idFill').onclick = function () {
    var f = F(); if (!hasCol(f, 'occurrenceID')) { alert('Сначала включите параметр occurrenceID.'); return; }
    f.rows.forEach(function (r) { if (!r.occurrenceID) r.occurrenceID = nextId(f); }); markDirty(); renderTable();
  };
  ['t1', 't2', 't3'].forEach(function (t, i) {
    $(t).onclick = function () { ['t1', 't2', 't3'].forEach(function (x, j) { $(x).className = i === j ? 'on' : ''; $('p' + (j + 1)).hidden = i !== j; }); if (i === 1) renderCols(); };
  });
  $('bCols').onclick = function () { $('t2').click(); };
  $('search').oninput = renderGroups;
  var pre = $('preset');
  Object.keys(DWC_PRESETS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; pre.appendChild(o); });
  pre.onchange = function () { if (pre.value) { var f = F(); applyPreset(f, pre.value); f.dirty = true; pre.value = ''; save(); renderAll(); } };
  Object.keys(DWC_VOCAB).forEach(function (k) {
    var dl = document.createElement('datalist'); dl.id = 'dl-' + k;
    DWC_VOCAB[k].forEach(function (v) { var o = document.createElement('option'); o.value = v; dl.appendChild(o); });
    document.body.appendChild(dl);
  });

  // ---- IndexedDB для ссылок на файлы диска ----
  function idb() { return new Promise(function (res) { try { var r = indexedDB.open('dwc-handles', 1); r.onupgradeneeded = function () { r.result.createObjectStore('h'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
  function putH(id, h) { return idb().then(function (db) { if (db) db.transaction('h', 'readwrite').objectStore('h').put(h, id); }); }
  function delH(id) { return idb().then(function (db) { if (db) db.transaction('h', 'readwrite').objectStore('h').delete(id); }); }
  function getH(id) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(null); var q = db.transaction('h').objectStore('h').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }); }

  // ---- экспорт / сохранение ----
  function cellVal(k, v) {
    v = (v == null ? '' : String(v)).trim();
    if (v === '') return $('fillND').checked ? 'n/d' : '';
    if (DWC_NUMERIC.indexOf(k) >= 0 && /^-?\d+([.,]\d+)?$/.test(v)) return Number(v.replace(',', '.'));
    return v;
  }
  function buildWb(f) {
    var aoa = [f.cols.map(function (c) { return c.key; })];
    f.rows.forEach(function (r) { aoa.push(f.cols.map(function (c) { return cellVal(c.key, r[c.key]); })); });
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = f.cols.map(function (c, j) { var m = c.key.length; aoa.forEach(function (r) { m = Math.max(m, String(r[j]).length); }); return { wch: Math.min(m + 2, 50) }; });
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: f.cols.length - 1 } }) };
    var d = [['Столбец', 'Источник', 'Описание', 'Пример']];
    f.cols.forEach(function (c) { d.push([c.key, TERMS[c.key] ? 'Darwin Core' : 'Свой параметр', descOf(c.key), TERMS[c.key] ? TERMS[c.key].ex : '']); });
    var wf = XLSX.utils.aoa_to_sheet(d); wf['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 100 }, { wch: 40 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Occurrences_DwC'); XLSX.utils.book_append_sheet(wb, wf, 'Описание_полей');
    return wb;
  }
  async function writeHandle(h, f) {
    var p = await h.queryPermission({ mode: 'readwrite' });
    if (p !== 'granted') p = await h.requestPermission({ mode: 'readwrite' });
    if (p !== 'granted') throw new Error('нет разрешения на запись');
    var data = XLSX.write(buildWb(f), { type: 'array', bookType: 'xlsx' });
    var w = await h.createWritable(); await w.write(new Blob([data])); await w.close();
  }
  async function saveFile(f, quiet) {
    if (!f.cols.length) { alert('В файле нет столбцов.'); return false; }
    try {
      var h = HANDLES[f.id] || (f.linked ? await getH(f.id) : null);
      if (h) { HANDLES[f.id] = h; await writeHandle(h, f); }
      else if (window.showSaveFilePicker) {
        h = await showSaveFilePicker({ suggestedName: f.name + '.xlsx', types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
        HANDLES[f.id] = h; f.linked = true; putH(f.id, h); await writeHandle(h, f);
      } else { XLSX.writeFile(buildWb(f), f.name + '.xlsx'); }
    } catch (e) {
      if (e && e.name === 'AbortError') return false;
      if (!quiet || true) { if (confirm('Не удалось записать в файл на диске (' + e.message + ').\nСкачать копию через браузер?')) XLSX.writeFile(buildWb(f), f.name + '.xlsx'); else return false; }
    }
    f.dirty = false; save(); renderFileSel(); stat();
    if (!quiet) toast('Сохранено: «' + f.name + '.xlsx»');
    return true;
  }
  $('bSave').onclick = function () { saveFile(F(), false); };

  // ---- импорт ----
  function importBuf(buf, name, handle) {
    var wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    var a = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
    if (!a.length) { alert('Файл пуст.'); return; }
    var descs = {};
    wb.SheetNames.slice(1).forEach(function (n) {
      var fl = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' });
      var h0 = fl[0] ? String(fl[0][0]).toLowerCase() : '';
      if (h0.indexOf('столб') >= 0 || h0 === 'column') fl.slice(1).forEach(function (r) { if (r[0] && r[1] !== 'Darwin Core' && r[2]) descs[String(r[0])] = String(r[2]); });
    });
    var keys = a[0].map(function (h) { h = String(h).trim(); return LOWER[h.toLowerCase()] || h; }).filter(function (h) { return h; });
    keys.forEach(function (k) { if (!TERMS[k] && !(k in S.custom)) S.custom[k] = descs[k] || DWC_BUILTIN_CUSTOM[k] || 'Пользовательский параметр (описание не задано).'; });
    var f = newFileObj(name.replace(/\.[^.]+$/, ''), keys.map(function (k) { return { key: k, def: '' }; }));
    f.rows = a.slice(1).filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); }).map(function (r) {
      var o = {}; keys.forEach(function (k, j) { var v = r[j]; o[k] = v === undefined || v === null ? '' : String(v); }); return o;
    });
    if (handle) { HANDLES[f.id] = handle; f.linked = true; putH(f.id, handle); }
    S.active = f.id; save(); renderAll();
    toast('Открыт «' + f.name + '»: записей ' + f.rows.length + (handle ? ' · новые организмы можно писать прямо в этот файл' : ''));
  }
  $('bOpen').onclick = async function () {
    if (window.showOpenFilePicker) {
      try {
        var hs = await showOpenFilePicker({ types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
        var file = await hs[0].getFile(); importBuf(await file.arrayBuffer(), file.name, hs[0]);
      } catch (e) { if (e.name !== 'AbortError') alert('Не удалось открыть: ' + e.message); }
    } else $('file').click();
  };
  $('file').onchange = function () {
    var fl = $('file').files[0]; if (!fl) return;
    var rd = new FileReader();
    rd.onload = function () { try { importBuf(rd.result, fl.name, null); } catch (e) { alert('Не удалось прочитать файл: ' + e.message); } $('file').value = ''; };
    rd.readAsArrayBuffer(fl);
  };

  window.addEventListener('beforeunload', function (e) { if (S.files.some(function (f) { return f.dirty; })) { e.preventDefault(); e.returnValue = ''; } });
  load(); $('idPrefix').value = S.prefix || 'OCC-'; renderAll();
})();
