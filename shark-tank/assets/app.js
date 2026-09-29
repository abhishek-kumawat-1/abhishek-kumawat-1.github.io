/* Into the Tank — Shark Tank India pitch insights (unofficial). No dependencies. */
(function () {
  'use strict';
  var ALL = window.PITCHES || [];
  var SEASONS = unique(ALL.map(function (r) { return r.s; })).sort();
  var state = { season: 'all', q: '', outcome: 'All', shark: 'All', sort: { key: 's', dir: 'asc' }, limit: 60, valView: 'cuts' };

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function unique(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function money(lakh) {
    if (lakh == null) return '—';
    if (lakh >= 100) { var cr = lakh / 100; return '₹' + (cr >= 100 ? Math.round(cr).toLocaleString('en-IN') : +cr.toFixed(cr >= 10 ? 1 : 2)) + ' Cr'; }
    if (lakh < 1) return '₹' + Math.round(lakh * 100000).toLocaleString('en-IN');
    return '₹' + +lakh.toFixed(1) + ' L';
  }
  function pct(v) { return v == null ? '—' : (+v.toFixed(2)) + '%'; }
  function inSeason(r) { return state.season === 'all' || r.s === state.season; }
  function rows() { return ALL.filter(inSeason); }
  function committed(r) { return (r.dealAmt || 0) + (r.debt || 0); }
  function kept(r) { return r.deal && r.askVal && r.dealVal ? r.dealVal / r.askVal : null; }
  function seasonLabel() { return state.season === 'all' ? 'Seasons 1–5' : 'Season ' + state.season; }

  // ---------- tooltip ----------
  var tip = $('tip');
  function bindTips(root) {
    root.querySelectorAll('[data-tip]').forEach(function (el) {
      function show(e) {
        tip.innerHTML = el.getAttribute('data-tip');
        tip.hidden = false;
        var r = el.getBoundingClientRect();
        var x = (e && e.clientX) || r.left + r.width / 2, y = (e && e.clientY) || r.top;
        var w = tip.offsetWidth, h = tip.offsetHeight;
        tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
        tip.style.top = (y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';
      }
      el.addEventListener('mousemove', show);
      el.addEventListener('focus', function () { show(); });
      el.addEventListener('mouseleave', function () { tip.hidden = true; });
      el.addEventListener('blur', function () { tip.hidden = true; });
    });
  }

  // ---------- season tabs ----------
  function renderTabs() {
    var opts = [{ v: 'all', l: 'All seasons' }].concat(SEASONS.map(function (s) { return { v: s, l: 'Season ' + s }; }));
    $('seasonTabs').innerHTML = opts.map(function (o) {
      return '<button type="button" data-s="' + o.v + '" aria-pressed="' + (state.season === o.v) + '">' + o.l + '</button>';
    }).join('');
    $('seasonTabs').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        var v = b.getAttribute('data-s');
        state.season = v === 'all' ? 'all' : +v;
        state.shark = 'All'; state.limit = 60;
        renderAll();
      };
    });
  }

  // ---------- KPIs ----------
  function renderKpis() {
    var r = rows(), d = r.filter(function (x) { return x.deal; });
    var ks = d.map(kept).filter(function (v) { return v != null; });
    var m = median(ks);
    var eq = d.reduce(function (a, x) { return a + (x.dealAmt || 0); }, 0);
    var debt = d.reduce(function (a, x) { return a + (x.debt || 0); }, 0);
    var eps = unique(r.map(function (x) { return x.s + '-' + x.ep; })).length;
    var k = [
      { b: r.length, c: '', l: 'Pitches', s: seasonLabel() + ' · ' + eps + ' episodes' },
      { b: d.length, c: 't', l: 'Deals closed', s: Math.round(d.length / r.length * 100) + '% of pitches' },
      { b: money(eq + debt), c: '', l: 'Committed on air', s: money(eq) + ' equity + ' + money(debt) + ' debt' },
      { b: m == null ? '—' : '−' + Math.round((1 - m) * 100) + '%', c: 'c', l: 'Median valuation cut', s: 'valuation at the deal vs. the ask' },
      { b: unique([].concat.apply([], d.map(function (x) { return x.sharks; }))).length, c: '', l: 'Sharks who invested', s: 'including guest sharks' }
    ];
    $('kpis').innerHTML = k.map(function (x) {
      return '<div class="kpi"><b class="' + x.c + '">' + x.b + '</b><span>' + x.l + '</span><small>' + x.s + '</small></div>';
    }).join('');
  }

  // ---------- season comparison ----------
  function renderCompare() {
    var stats = SEASONS.map(function (s) {
      var r = ALL.filter(function (x) { return x.s === s; }), d = r.filter(function (x) { return x.deal; });
      return {
        s: s, rate: d.length / r.length * 100, deals: d.length, n: r.length,
        money: d.reduce(function (a, x) { return a + committed(x); }, 0),
        kept: (median(d.map(kept).filter(function (v) { return v != null; })) || 0) * 100
      };
    });
    var maxMoney = Math.max.apply(null, stats.map(function (x) { return x.money; }));
    function card(title, key, fmt, max, cls) {
      return '<div class="panel pad cmp"><h4>' + title + '</h4>' + stats.map(function (x) {
        var active = state.season === x.s ? ' active' : '';
        var t = '<b>Season ' + x.s + '</b>' + x.deals + ' deals from ' + x.n + ' pitches · ' + money(x.money) + ' committed · founders kept ' + Math.round(x.kept) + '% of the asked valuation (median)';
        return '<div class="cmp-row' + active + '" tabindex="0" data-tip="' + esc(t) + '"><span class="lab">S' + x.s + '</span><div class="hbar ' + (cls || '') + '"><i style="width:' + (x[key] / max * 100) + '%"></i></div><span class="val">' + fmt(x) + '</span></div>';
      }).join('') + '</div>';
    }
    $('compare').innerHTML =
      card('Deal rate', 'rate', function (x) { return Math.round(x.rate) + '%'; }, 100) +
      card('Money committed', 'money', function (x) { return money(x.money); }, maxMoney) +
      card('Valuation kept (median)', 'kept', function (x) { return Math.round(x.kept) + '%'; }, 100, 'coral');
    bindTips($('compare'));
  }

  // ---------- sharks ----------
  function renderSharks() {
    var d = rows().filter(function (x) { return x.deal; });
    var map = {};
    d.forEach(function (x) {
      var n = x.sharks.length || 1;
      x.sharks.forEach(function (s) {
        var m = map[s] || (map[s] = { name: s, deals: 0, money: 0, solo: 0, seasons: {} });
        m.deals++; m.money += committed(x) / n; if (x.sharks.length === 1) m.solo++; m.seasons[x.s] = 1;
      });
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.deals - a.deals || b.money - a.money; });
    var max = list.length ? list[0].deals : 1;
    $('sharks').querySelector('tbody').innerHTML = list.map(function (s) {
      var seasons = Object.keys(s.seasons).map(function (x) { return 'S' + x; }).join(' ');
      var t = '<b>' + esc(s.name) + '</b>' + s.deals + ' deals · about ' + money(s.money) + ' committed · ' + s.solo + ' solo';
      return '<tr tabindex="0" data-tip="' + esc(t) + '"><td>' + esc(s.name) + '</td><td><div class="barcell"><div class="hbar"><i style="width:' + (s.deals / max * 100) + '%"></i></div><b>' + s.deals + '</b></div></td><td class="num">' + money(s.money) + '</td><td class="num">' + s.solo + '</td><td class="num" style="font-size:13px;color:var(--muted)">' + seasons + '</td></tr>';
    }).join('');
    bindTips($('sharks'));
  }

  // ---------- column charts ----------
  function columns(el, items) {
    var max = Math.max.apply(null, items.map(function (i) { return i.h; })) || 1;
    el.innerHTML = items.map(function (i) {
      return '<div class="col" tabindex="0" data-tip="' + esc(i.tip) + '"><b>' + i.label + '</b><i class="' + (i.low ? 'low' : '') + '" style="height:' + (i.h / max * 82) + '%"></i></div>';
    }).join('');
    var labels = document.createElement('div');
    labels.className = 'col-labels';
    labels.innerHTML = items.map(function (i) { return '<div>' + i.name + '<small>' + i.sub + '</small></div>'; }).join('');
    var old = el.nextElementSibling; if (old && old.classList.contains('col-labels')) old.remove();
    el.after(labels);
    bindTips(el);
  }
  function renderAsk() {
    var bands = [
      { name: '< ₹5 Cr', lo: 0, hi: 500 }, { name: '₹5–20 Cr', lo: 500, hi: 2000 }, { name: '₹20–50 Cr', lo: 2000, hi: 5000 },
      { name: '₹50–100 Cr', lo: 5000, hi: 10000 }, { name: '₹100 Cr+', lo: 10000, hi: Infinity }
    ];
    var r = rows().filter(function (x) { return x.askVal != null; });
    columns($('askBands'), bands.map(function (b) {
      var inB = r.filter(function (x) { return x.askVal >= b.lo && x.askVal < b.hi; });
      var d = inB.filter(function (x) { return x.deal; }).length;
      var rate = inB.length ? Math.round(d / inB.length * 100) : 0;
      return { name: b.name, sub: d + '/' + inB.length + ' closed', label: rate + '%', h: Math.max(rate, 1), low: rate < 40, tip: '<b>' + b.name + ' asks</b>' + d + ' of ' + inB.length + ' pitches closed a deal' };
    }));
  }
  function renderPack() {
    var d = rows().filter(function (x) { return x.deal && x.sharks.length; });
    var groups = [1, 2, 3, 4, 5].map(function (n) {
      var c = d.filter(function (x) { return n < 5 ? x.sharks.length === n : x.sharks.length >= 5; }).length;
      var name = n === 1 ? 'Solo' : n === 5 ? '5+' : n + ' sharks';
      return { name: name, sub: Math.round(c / (d.length || 1) * 100) + '%', label: c, h: c, tip: '<b>' + name + '</b>' + c + ' deals' };
    });
    columns($('pack'), groups);
  }

  // ---------- valuation ----------
  function renderVal() {
    var d = rows().filter(function (x) { return kept(x) != null; });
    var m = median(d.map(kept));
    var askM = median(d.map(function (x) { return x.askVal; }));
    var dealM = median(d.map(function (x) { return x.dealVal; }));
    var above = d.filter(function (x) { return kept(x) > 1.001; }).length;
    $('valStat').innerHTML = '<div class="big">' + (m == null ? '—' : '−' + Math.round((1 - m) * 100) + '%') + '</div>' +
      '<p>Median cut from asked to agreed valuation, across <strong>' + d.length + '</strong> deals with comparable terms.</p>' +
      '<p>Median ask: <strong>' + money(askM) + '</strong><br>Median deal: <strong>' + money(dealM) + '</strong></p>' +
      '<p><strong>' + above + '</strong> deal' + (above === 1 ? '' : 's') + ' closed above the ask.</p>';
    var sorted = d.slice().sort(function (a, b) { return state.valView === 'cuts' ? kept(a) - kept(b) : Math.abs(1 - kept(a)) - Math.abs(1 - kept(b)); });
    $('valRows').innerHTML = sorted.slice(0, 10).map(function (x) {
      var k = Math.round(kept(x) * 100);
      var t = '<b>' + esc(x.brand) + ' (S' + x.s + ')</b>Asked ' + money(x.askAmt) + ' for ' + pct(x.askEq) + ' → got ' + money(x.dealAmt) + ' for ' + pct(x.dealEq);
      return '<div class="vrow" tabindex="0" data-tip="' + esc(t) + '"><div class="b">' + esc(x.brand) + '<small>S' + x.s + ' · ' + esc(x.sharks.join(', ')) + '</small></div>' +
        '<div class="hbar coral"><i style="width:' + Math.min(k, 100) + '%"></i></div>' +
        '<div class="v"><span>' + money(x.askVal) + ' →</span> ' + money(x.dealVal) + ' <em>(' + k + '%)</em></div></div>';
    }).join('');
    bindTips($('valRows'));
  }
  $('valTabs').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () {
      state.valView = b.getAttribute('data-v');
      $('valTabs').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
      renderVal();
    };
  });

  // ---------- episodes ----------
  function renderEpisodes() {
    var r = rows();
    var keys = unique(r.map(function (x) { return x.s + '-' + (x.ep == null ? '?' : x.ep); }));
    var multi = state.season === 'all';
    $('episodes').innerHTML = keys.map(function (k) {
      var ps = r.filter(function (x) { return x.s + '-' + (x.ep == null ? '?' : x.ep) === k; });
      var p = k.split('-');
      var dots = ps.slice().sort(function (a, b) { return b.deal - a.deal; }).map(function (x) { return '<i class="dot ' + (x.deal ? 'on' : 'off') + '"></i>'; }).join('');
      var t = '<b>Season ' + p[0] + ', episode ' + p[1] + '</b>' + ps.map(function (x) { return (x.deal ? '✓ ' : '✗ ') + esc(x.brand); }).join('<br>');
      return '<button type="button" class="ep" data-tip="' + esc(t) + '"><span class="stack">' + dots + '</span><small>' + (multi ? 'S' + p[0] + '·' : 'E') + p[1] + '</small></button>';
    }).join('');
    $('episodes').style.gridTemplateColumns = multi ? 'repeat(auto-fill,minmax(44px,1fr))' : '';
    bindTips($('episodes'));
  }

  // ---------- pitch log ----------
  function renderChips() {
    $('outcome').innerHTML = ['All', 'Deal', 'No deal'].map(function (o) {
      return '<button type="button" aria-pressed="' + (state.outcome === o) + '">' + o + '</button>';
    }).join('');
    $('outcome').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.outcome = b.textContent; state.limit = 60; renderChips(); renderLog(); };
    });
    var counts = {};
    rows().forEach(function (x) { x.sharks.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; }); });
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    $('sharkChips').innerHTML = ['All'].concat(names).map(function (n) {
      return '<button type="button" aria-pressed="' + (state.shark === n) + '">' + esc(n) + '</button>';
    }).join('');
    $('sharkChips').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { state.shark = b.textContent; state.limit = 60; renderChips(); renderLog(); };
    });
  }
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return rows().filter(function (x) {
      if (state.outcome === 'Deal' && !x.deal) return false;
      if (state.outcome === 'No deal' && x.deal) return false;
      if (state.shark !== 'All' && x.sharks.indexOf(state.shark) < 0) return false;
      if (q && (x.brand + ' ' + x.idea).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) {
      var k = state.sort.key, dir = state.sort.dir === 'asc' ? 1 : -1;
      var va = a[k], vb = b[k];
      if (k === 's') { va = a.s * 1000 + a.no; vb = b.s * 1000 + b.no; }
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * dir;
    });
  }
  function renderLog() {
    var f = filtered();
    $('count').innerHTML = 'Showing <b>' + Math.min(f.length, state.limit) + '</b> of ' + f.length + ' matching · ' + seasonLabel();
    var body = $('logTable').querySelector('tbody');
    if (!f.length) { body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">No pitches match these filters.</td></tr>'; }
    else body.innerHTML = f.slice(0, state.limit).map(function (x) {
      var ask = '<span class="mono">' + money(x.askAmt) + ' · ' + pct(x.askEq) + '</span><span class="note">val. ' + money(x.askVal) + '</span>';
      var deal = x.deal
        ? '<span class="tag"><i class="dot on"></i>' + money(x.dealAmt) + (x.debt ? ' + ' + money(x.debt) + ' debt' : '') + ' · ' + pct(x.dealEq) + '</span>'
        : '<span class="tag no"><i class="dot off"></i>No deal</span>';
      if (x.note) deal += '<span class="note">' + esc(x.note) + '</span>';
      return '<tr><td class="mono">S' + x.s + '</td><td class="mono">' + (x.ep == null ? '—' : 'E' + x.ep) + '</td><td class="brand">' + esc(x.brand) + '</td><td class="idea">' + esc(x.idea) + '</td><td class="num">' + ask + '</td><td>' + deal + '</td><td class="num mono" style="color:var(--coral-ink)">' + (x.deal ? money(x.dealVal) : '—') + '</td><td class="sh">' + esc(x.sharks.join(', ') || '—') + '</td></tr>';
    }).join('');
    $('more').parentElement.hidden = f.length <= state.limit;
    $('logTable').querySelectorAll('th button').forEach(function (b) {
      b.setAttribute('data-dir', b.getAttribute('data-sort') === state.sort.key ? state.sort.dir : '');
    });
  }
  $('q').addEventListener('input', function (e) { state.q = e.target.value; state.limit = 60; renderLog(); });
  $('more').onclick = function () { state.limit += 60; renderLog(); };
  $('logTable').querySelectorAll('th button').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-sort');
      state.sort = { key: k, dir: state.sort.key === k && state.sort.dir === 'asc' ? 'desc' : 'asc' };
      renderLog();
    };
  });

  function renderAll() {
    renderTabs(); renderKpis(); renderCompare(); renderSharks(); renderAsk(); renderPack(); renderVal(); renderEpisodes(); renderChips(); renderLog();
  }
  if (!ALL.length) {
    document.querySelector('main').innerHTML = '<p style="padding:48px 0">Data failed to load. Run <code>python3 scripts/build_data.py</code> to create data/pitches.js.</p>';
  } else renderAll();
})();
