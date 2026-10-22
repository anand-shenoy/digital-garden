// Timetable logic. Times are minutes after midnight at Chelmsford.
const ARRIVE = 2.5, DWELL = 1.0, DEPART = 1.5, PASS = 0.8; // minutes
const pad = n => String(n).padStart(2, '0');
const hhmm = t => `${pad(Math.floor(t / 60) % 24)}:${pad(Math.floor(t % 60))}`;

export function dayType(date) {
  const d = date.getDay();
  return d === 0 ? 'sunday' : d === 6 ? 'saturday' : 'weekday';
}

export function nextDepartures(tt, date, n = 6) {
  const now = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  const out = [];
  for (let day = 0; day < 3 && out.length < n; day++) {
    const d = new Date(date); d.setDate(d.getDate() + day);
    const list = tt.services[dayType(d)] || [];
    for (const s of list) {
      if (!s.stops) continue;
      const mins = s.t + day * 1440 - now;
      if (mins < 0) continue;
      out.push({ time: hhmm(s.t), destination: s.to, platform: s.plat, minsToGo: Math.floor(mins) });
      if (out.length >= n) break;
    }
  }
  return out;
}

const ease = x => x * x * (3 - 2 * x);

export function trainState(svc, minsNow, track) {
  const fromCountry = svc.dir === 'london';          // london-bound trains enter at the north east end
  const enter = fromCountry ? track.length : 0, exit = fromCountry ? 0 : track.length, mid = track.stationS;
  const dt = minsNow - svc.t;
  if (!svc.stops) {
    if (Math.abs(dt) > PASS) return null;
    const f = (dt + PASS) / (2 * PASS);
    return { s: enter + (exit - enter) * f, phase: 'passing', dir: svc.dir };
  }
  if (dt < -(ARRIVE + DWELL) || dt > DEPART) return null;
  if (dt < -DWELL) {
    const f = ease((dt + ARRIVE + DWELL) / ARRIVE);   // slows smoothly into the platform
    return { s: enter + (mid - enter) * f, phase: 'arriving', dir: svc.dir };
  }
  if (dt <= 0) return { s: mid, phase: 'dwelling', dir: svc.dir };
  const f = dt / DEPART;
  return { s: mid + (exit - mid) * f * f, phase: 'departing', dir: svc.dir };
}

export function pointAt(track, s) {
  const p = track.p; let run = 0;
  s = Math.max(0, Math.min(s, track.length));
  for (let i = 0; i < p.length - 1; i++) {
    const [ax, az] = p[i], [bx, bz] = p[i + 1], seg = Math.hypot(bx - ax, bz - az);
    if (run + seg >= s || i === p.length - 2) {
      const t = seg ? (s - run) / seg : 0;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, angle: Math.atan2(bz - az, bx - ax) };
    }
    run += seg;
  }
  return { x: p[0][0], z: p[0][1], angle: 0 };
}

export function fmtWait(mins) {
  if (mins <= 0) return 'Due';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}
