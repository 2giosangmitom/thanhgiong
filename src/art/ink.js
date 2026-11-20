// "Bút mực" vẽ tay: các hàm Canvas2D tạo nét run, mảng màu phẳng và vân giấy dó
import { RandomGenerator } from 'littlejsengine';
import { PAL } from '../config.js';

export const INK = PAL.muc;
const R = new RandomGenerator(7);
export const seed = s => { R.seed = (s | 0) * 7919 + 13; };
export const rnd = (a = 1, b = 0) => R.float(a, b);
export const jit = (a = 1) => R.float(-a, a);

/** Đường cong mượt đi qua các điểm (dùng trung điểm làm điểm neo) */
function tracePath(ctx, pts, closed)
{
    const n = pts.length;
    if (n < 2) return;
    if (!closed)
    {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n - 1; i++)
        {
            const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
            ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
        return;
    }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(pts[n - 1], pts[0]);
    ctx.moveTo(start[0], start[1]);
    for (let i = 0; i < n; i++)
    {
        const m = mid(pts[i], pts[(i + 1) % n]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.closePath();
}

/** Làm run các điểm như nét tay */
const wobble = (pts, a) => pts.map(p => [p[0] + jit(a), p[1] + jit(a)]);

/**
 * Mảng màu có viền mực vẽ tay
 * opts: line (độ dày viền), ink, closed, jitter, sharp (đa giác góc cạnh), alpha
 */
export function shape(ctx, pts, fill, opts = {})
{
    const { line = 3, ink = INK, closed = true, jitter = .8, sharp = false, double = true } = opts;
    const p = wobble(pts, jitter);
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    if (sharp)
    {
        ctx.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
        closed && ctx.closePath();
    }
    else tracePath(ctx, p, closed);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line > 0)
    {
        ctx.strokeStyle = ink; ctx.lineWidth = line; ctx.stroke();
        if (double)
        {
            // nét thứ hai lệch nhẹ, mảnh hơn: cảm giác bút lông
            const q = wobble(pts, jitter * 1.6);
            ctx.beginPath();
            sharp ? (ctx.moveTo(q[0][0], q[0][1]), q.slice(1).forEach(v => ctx.lineTo(v[0], v[1])), closed && ctx.closePath())
                  : tracePath(ctx, q, closed);
            ctx.globalAlpha = .35; ctx.lineWidth = line * .55; ctx.stroke();
        }
    }
    ctx.restore();
}

/** Ellipse run tay */
export function ell(ctx, x, y, rx, ry, fill, opts = {})
{
    const n = opts.sides || 18, rot = opts.rot || 0, pts = [];
    const wob = opts.wob ?? .05;
    for (let i = 0; i < n; i++)
    {
        const a = i / n * Math.PI * 2, k = 1 + jit(wob);
        const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
        pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    shape(ctx, pts, fill, opts);
}

/** Nét mực mở (chi tiết, lông mày, vân) */
export function stroke(ctx, pts, width = 2, color = INK, jitter = .6, alpha = 1)
{
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
    ctx.beginPath(); tracePath(ctx, wobble(pts, jitter), false); ctx.stroke();
    ctx.restore();
}

/** Chi (tay/chân) dạng ống: viền mực + lõi màu, hơi cong */
export function limb(ctx, ax, ay, bx, by, w, fill, line = 3, bend = 0)
{
    const mx = (ax + bx) / 2 + (by - ay) * bend * .15 + jit(.6), my = (ay + by) / 2 - (bx - ax) * bend * .15 + jit(.6);
    const path = () => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); };
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = INK; ctx.lineWidth = w + line * 2; ctx.stroke();
    path(); ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
}

/** Toạ độ đầu mút của một đoạn theo góc (0 = chỉ xuống, + = xoay về phía trước) */
export const seg = (x, y, angle, len) => [x + Math.sin(angle) * len, y + Math.cos(angle) * len];

/** Vân giấy / nét gạch bóng chỉ phủ lên phần đã vẽ (source-atop) */
export function grain(ctx, x, y, w, h, amount = 1, s = 1)
{
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const n = (w * h / 90 * amount) | 0;
    for (let i = n; i--;)
    {
        const px = x + rnd(w), py = y + rnd(h);
        ctx.fillStyle = R.bool() ? 'rgba(53,44,42,.08)' : 'rgba(255,245,220,.10)';
        ctx.fillRect(px, py, rnd(1, 3) * s, rnd(1, 2) * s);
    }
    // vài nét gạch chéo như mực khô
    ctx.strokeStyle = 'rgba(53,44,42,.06)'; ctx.lineWidth = 1 * s;
    for (let i = n / 18; i-- > 0;)
    {
        const px = x + rnd(w), py = y + rnd(h), l = rnd(4, 10) * s;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + l, py - l * .6); ctx.stroke();
    }
    ctx.restore();
}

/** Bóng đổ mảng (shading) phía sau khối: tô một nửa đậm hơn bằng source-atop */
export function shade(ctx, x, y, w, h, color = 'rgba(53,44,42,.18)', angle = -.5)
{
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = color; ctx.fillRect(-w, 0, w * 2, h * 2);
    ctx.restore();
}

/** Nền giấy dó */
export function paper(ctx, w, h, base = PAL.giay, s = 1)
{
    ctx.save();
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    // loang màu
    for (let i = 40; i--;)
    {
        const g = ctx.createRadialGradient(rnd(w), rnd(h), 0, rnd(w), rnd(h), rnd(60, 220) * s);
        g.addColorStop(0, R.bool() ? 'rgba(214,166,93,.10)' : 'rgba(255,250,235,.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // sợi giấy
    ctx.strokeStyle = 'rgba(120,90,60,.10)'; ctx.lineWidth = .8 * s;
    for (let i = (w * h / 2500) | 0; i--;)
    {
        const x = rnd(w), y = rnd(h), a = rnd(Math.PI * 2), l = rnd(4, 18) * s;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(a) * l * .5 + jit(3), y + Math.sin(a) * l * .5 + jit(3), x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
    }
    ctx.restore();
    grain(ctx, 0, 0, w, h, .6, s);
}

/** Hoa văn mặt trời trống đồng: vòng tròn đồng tâm + tia sáng */
export function drumSun(ctx, x, y, r, color = INK, alpha = 1, rays = 14)
{
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // ngôi sao trung tâm
    ctx.beginPath();
    for (let i = 0; i < rays * 2; i++)
    {
        const a = i / (rays * 2) * Math.PI * 2, rr = i % 2 ? r * .12 : r * .3;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    // vành tròn đồng tâm
    const rings = [.36, .42, .58, .64, .82, .9, 1];
    for (const k of rings)
    {
        ctx.lineWidth = r * (k > .95 ? .03 : .018);
        ctx.beginPath(); ctx.arc(x, y, r * k, 0, Math.PI * 2); ctx.stroke();
    }
    // vành hoạ tiết: chim lạc cách điệu (hình thoi xếp vòng) và chấm tròn
    for (let i = 0; i < 18; i++)
    {
        const a = i / 18 * Math.PI * 2;
        const cx = x + Math.cos(a) * r * .73, cy = y + Math.sin(a) * r * .73;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(-r * .06, 0); ctx.quadraticCurveTo(0, -r * .05, r * .07, -r * .015);
        ctx.lineTo(r * .03, r * .02); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    for (let i = 0; i < 36; i++)
    {
        const a = i / 36 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .018, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + Math.cos(a + .08) * r * .95, y + Math.sin(a + .08) * r * .95, r * .014, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

/** Tạo canvas tạm */
export function makeCanvas(w, h)
{
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    return c;
}
