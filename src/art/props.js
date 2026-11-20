// Đạo cụ vẽ tay: tre thần, hoa văn trống đồng, cờ, mặt trời...
import { TextureInfo, tile, vec2 } from 'littlejsengine';
import { PAL } from '../config.js';
import { shape, ell, stroke, drumSun, makeCanvas, seed, rnd, jit, grain, INK } from './ink.js';

/** Vẽ một cây tre (gốc ở (0,0), mọc lên) */
export function drawBamboo(ctx, h, w = 9, color = PAL.tre, leaves = true, lean = 0)
{
    const segs = Math.max(3, Math.round(h / 34));
    const segH = h / segs;
    for (let i = 0; i < segs; i++)
    {
        const y0 = -i * segH, y1 = -(i + 1) * segH + 2;
        const x0 = lean * -y0, x1 = lean * -y1;
        const ww = w * (1 - i / segs * .25);
        shape(ctx, [[x0 - ww / 2, y0], [x0 + ww / 2, y0], [x1 + ww / 2 * .95, y1], [x1 - ww / 2 * .95, y1]], color, { line: 2.2, sharp: true, jitter: .3, double: false });
        // ánh sáng trên thân
        stroke(ctx, [[x0 - ww * .2, y0 - 3], [x1 - ww * .2, y1 + 3]], 1.4, 'rgba(255,255,220,.35)', .2);
        // đốt tre
        stroke(ctx, [[x1 - ww * .65, y1 + 1], [x1 + ww * .65, y1]], 2.6, INK, .3);
        if (leaves && i > 0 && rnd() < .7)
        {
            const side = rnd() < .5 ? -1 : 1;
            stroke(ctx, [[x1, y1], [x1 + side * 10, y1 - 8], [x1 + side * 18, y1 - 10]], 1.6, INK, .4);
            for (let k = 0; k < 3; k++)
            {
                const lx = x1 + side * (10 + k * 5), ly = y1 - 8 - k * 2, a = side * (.5 + k * .3) + jit(.3);
                const L = 20 + rnd(8);
                const tip = [lx + Math.sin(a) * L * side * side, ly - Math.cos(a) * L * .4 + L * .3];
                shape(ctx, [[lx, ly], [(lx + tip[0]) / 2 + 3, (ly + tip[1]) / 2 - 4], tip, [(lx + tip[0]) / 2 - 2, (ly + tip[1]) / 2 + 3]],
                    k % 2 ? '#6E9A5E' : '#4F7A47', { line: 1.6, jitter: .4, double: false });
            }
        }
    }
}

/** Sprite tre thần: 3 biến thể */
export function bakeBambooSprites()
{
    const fw = 90, fh = 300, res = 2, n = 4;
    const c = makeCanvas(fw * res * n, fh * res);
    const ctx = c.getContext('2d');
    for (let i = 0; i < n; i++)
    {
        seed(500 + i);
        ctx.save();
        ctx.translate((i + .5) * fw * res, (fh - 6) * res);
        ctx.scale(res, res);
        const h = 200 + i * 25;
        drawBamboo(ctx, h, 13 - i, i % 2 ? '#5E8A55' : PAL.tre, true, jit(.05));
        // chồi nhọn trên đỉnh
        shape(ctx, [[-5, -h + 2], [0, -h - 18], [5, -h + 2]], '#7FB06A', { line: 2, sharp: true });
        ctx.restore();
    }
    grain(ctx, 0, 0, c.width, c.height, .4, 1.5);
    const tex = new TextureInfo(c, true, false, false);
    return {
        size: vec2(fw / 30, fh / 30), tiles: [...Array(n)].map((_, i) => tile(vec2(i, 0), vec2(fw * res, fh * res), tex)),
        footOffset: 6 / 30,
    };
}

/** Texture hoa văn mặt trời trống đồng (menu, hiệu ứng) */
export function bakeDrumSun(color = PAL.muc)
{
    const s = 768, c = makeCanvas(s, s), ctx = c.getContext('2d');
    seed(91);
    drumSun(ctx, s / 2, s / 2, s * .48, color, 1, 14);
    const tex = new TextureInfo(c, true, false, false);
    return tile(vec2(0), vec2(s), tex);
}

/** Texture chấm mềm (ánh sáng, bóng) */
export function bakeSoftDot()
{
    const s = 128, c = makeCanvas(s, s), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return tile(vec2(0), vec2(s), new TextureInfo(c, true, false, false));
}

/** Vết mực loang (dùng cho hiệu ứng trúng đòn) */
export function bakeInkSplat()
{
    const s = 160, n = 3, c = makeCanvas(s * n, s), ctx = c.getContext('2d');
    for (let i = 0; i < n; i++)
    {
        seed(700 + i);
        const cx = s * i + s / 2, cy = s / 2, pts = [];
        for (let k = 0; k < 14; k++)
        {
            const a = k / 14 * Math.PI * 2, r = (k % 2 ? 22 : 40) + rnd(18);
            pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
        }
        shape(ctx, pts, '#fff', { line: 0 });
        for (let k = 0; k < 7; k++) ell(ctx, cx + jit(65), cy + jit(65), rnd(3, 8), rnd(3, 8), '#fff', { line: 0 });
    }
    const tex = new TextureInfo(c, true, false, false);
    return [...Array(n)].map((_, i) => tile(vec2(i, 0), vec2(s), tex));
}

/** Ấn chương đỏ (con dấu) cho UI/logo */
export function drawSeal(ctx, x, y, s, text = 'GIÓNG')
{
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-.06);
    shape(ctx, [[-s, -s], [s, -s * 1.05], [s * 1.02, s], [-s * 1.03, s * .98]], PAL.son, { line: 0, jitter: s * .04, sharp: true });
    ctx.strokeStyle = PAL.giay; ctx.lineWidth = s * .08;
    ctx.strokeRect(-s * .8, -s * .8, s * 1.6, s * 1.6);
    ctx.fillStyle = PAL.giay; ctx.font = `bold ${s * .5}px 'Noto Serif', Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, s * .05, s * 1.5);
    ctx.restore();
}
