/*
 * Tiny, dependency-free Markdown renderer used by the blog and the admin preview.
 * Everything is HTML-escaped first, so raw HTML in a post is shown as text (safe by design).
 * Supports: # headings, paragraphs, **bold**, *italic*, ~~strike~~, `code`, ``` fenced code ```,
 * [links](url), ![images](url), - / * / 1. lists, > quotes, --- rules, | simple | tables |.
 */
(function (global) {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    u = u.trim();
    // allow http(s), mailto, site-relative, anchors, and plain relative paths; block javascript:, data:, etc.
    if (/^[a-z][a-z0-9+.\-]*:/i.test(u) && !/^(https?:|mailto:)/i.test(u)) return '#';
    return u;
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
  }

  function inline(text) {
    var codes = [];
    text = text.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    text = esc(text);
    var toks = [];
    function tok(html) { toks.push(html); return '\u0001' + (toks.length - 1) + '\u0001'; }
    function emph(t) {
      return t
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
        .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    }
    // images
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
      return tok('<img src="' + safeUrl(url) + '" alt="' + alt + '" loading="lazy">');
    });
    // links
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      var u = safeUrl(url);
      var ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : '';
      return tok('<a href="' + u + '"' + ext + '>' + emph(label) + '</a>');
    });
    // bare urls
    text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function (_, pre, url) {
      return pre + tok('<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>');
    });
    text = emph(text);
    text = text.replace(/\u0001(\d+)\u0001/g, function (_, i) { return toks[+i]; });
    text = text.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + esc(codes[+i]) + '</code>';
    });
    return text;
  }

  function render(src) {
    var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var i = 0;
    var para = [];

    function flushPara() {
      if (!para.length) return;
      var html = para.map(function (l, idx) {
        var br = / {2,}$/.test(l) && idx < para.length - 1 ? '<br>' : '';
        return inline(l.trim()) + br;
      }).join(' ');
      out.push('<p>' + html + '</p>');
      para = [];
    }

    while (i < lines.length) {
      var line = lines[i];

      // fenced code
      var fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
      if (fence) {
        flushPara();
        var buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        var lang = fence[1] ? ' class="lang-' + esc(fence[1]) + '"' : '';
        out.push('<pre><code' + lang + '>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      // blank
      if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

      // heading
      var h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) {
        flushPara();
        var lvl = Math.min(6, h[1].length + 1); // a post's "# " becomes <h2> (the page title is the <h1>)
        var body = inline(h[2]);
        out.push('<h' + lvl + ' id="' + slugify(body) + '">' + body + '</h' + lvl + '>');
        i++;
        continue;
      }

      // horizontal rule
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); out.push('<hr>'); i++; continue; }

      // blockquote
      if (/^\s*>/.test(line)) {
        flushPara();
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + render(q.join('\n')) + '</blockquote>');
        continue;
      }

      // table: header row + separator row
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
        flushPara();
        var cells = function (l) { return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return inline(c.trim()); }); };
        var head = cells(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push('<div class="table-wrap"><table><thead><tr>' + head.map(function (c) { return '<th>' + c + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>');
        continue;
      }

      // lists
      var ul = /^\s*[-*+]\s+/, ol = /^\s*\d+[.)]\s+/;
      if (ul.test(line) || ol.test(line)) {
        flushPara();
        var ordered = ol.test(line);
        var re = ordered ? ol : ul;
        var items = [];
        while (i < lines.length && (re.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          if (re.test(lines[i])) items.push(lines[i].replace(re, ''));
          else items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
        var tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + '>' + items.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') + '</' + tag + '>');
        continue;
      }

      para.push(line);
      i++;
    }
    flushPara();
    return out.join('\n');
  }

  function plain(src) {
    return String(src || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function readingMinutes(src) {
    var words = plain(src).split(' ').filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }

  global.MD = { render: render, plain: plain, readingMinutes: readingMinutes, slugify: slugify, esc: esc };
})(window);
