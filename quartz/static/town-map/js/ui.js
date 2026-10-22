import { fmtWait } from './timetable.js';
const $ = id => document.getElementById(id);
const fmt = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export function createUI(layers) {
  const hour = $('hour'), out = $('hourOut'), key = $('key'), info = $('info'), board = $('board'), wrap = $('boardWrap'), tab = $('boardTab');
  // On phones the board slides in from the right edge; the tab opens and closes it.
  tab.addEventListener('click', () => { const open = wrap.classList.toggle('open'); tab.setAttribute('aria-expanded', String(open)); });
  let hourFn = () => {}, toggleFn = () => {};
  hour.addEventListener('input', () => { out.textContent = fmt(+hour.value); hourFn(+hour.value); });
  for (const { id, label } of layers) {
    const b = document.createElement('button');
    b.textContent = label; b.setAttribute('aria-pressed', 'true');
    b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); toggleFn(id, on); };
    key.appendChild(b);
  }
  const text = s => { const n = document.createElement('span'); n.textContent = s; return n; };
  return {
    hour: () => +hour.value,
    onHour(fn) { hourFn = fn; },
    onLayerToggle(fn) { toggleFn = fn; },
    showInfo(title, lines, link, swatches) {
      info.replaceChildren();
      const h = document.createElement('h2'); h.textContent = title; info.appendChild(h);
      if (swatches) { // a colour key, e.g. the walking rings
        const row = document.createElement('div'); row.className = 'swatches';
        for (const { colour, label } of swatches) {
          const item = document.createElement('span'), sw = document.createElement('i');
          sw.style.background = colour; item.append(sw, label); row.appendChild(item);
        }
        info.appendChild(row);
      }
      for (const l of lines) { const p = document.createElement('p'); p.textContent = l; info.appendChild(p); }
      if (link) { const p = document.createElement('p'); const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Source'; p.appendChild(a); info.appendChild(p); }
      info.style.display = 'block';
    },
    hideInfo() { info.style.display = 'none'; },
    setBoard(rows, label) {
      if (!rows) { wrap.style.display = 'none'; return; }
      board.replaceChildren();
      const h = document.createElement('h2'); h.append(text('Chelmsford departures'), text(label)); board.appendChild(h);
      const t = document.createElement('table');
      for (const r of rows) {
        const tr = document.createElement('tr');
        for (const c of [r.time, r.destination, r.platform ? `P${r.platform}` : '', fmtWait(r.minsToGo)]) {
          const td = document.createElement('td'); td.textContent = c; tr.appendChild(td);
        }
        t.appendChild(tr);
      }
      board.appendChild(t);
      wrap.style.display = 'block';
    },
  };
}
