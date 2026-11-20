// Nền nhiều lớp (ParallaxLayer) vẽ tay bằng Canvas2D cho menu, màn 1 và màn 2
import { ParallaxLayer, vec2, WHITE, Color } from 'littlejsengine';
import { PX, PAL } from '../config.js';
import { shape, ell, stroke, seed, rnd, jit, grain, paper, drumSun, INK } from './ink.js';
import { drawBamboo } from './props.js';
import { clawEmblem } from './soldier.js';

const TAU = Math.PI * 2;

/**
 * Tạo một lớp parallax: vẽ bằng toạ độ pixel thiết kế, gốc trên-trái ảnh
 * @param {object} o  w,h: kích thước (đơn vị thế giới); y: tâm theo trục y thế giới;
 *   parallax: mức bám theo camera (0 = gắn với thế giới, 1 = gắn với màn hình, âm = tiền cảnh);
 *   order: renderOrder; res: độ phân giải; wrap: lặp ngang; draw(ctx, W, H)
 */
export function makeLayer(o)
{
    const res = o.res || 1.6, W = o.w * PX, H = o.h * PX;
    const layer = new ParallaxLayer(vec2(o.x || 0, o.y), vec2(o.w, o.h), vec2(o.parallax, o.parallaxY || 0), o.order,
        (ctx, size) =>
        {
            ctx.save();
            ctx.scale(size.x / W, size.y / H);
            seed(o.seed || 1);
            o.draw(ctx, W, H);
            ctx.restore();
        }, vec2(Math.round(W * res), Math.round(H * res)));
    layer.wrapX = !!o.wrap;
    layer.castShadow = false;
    if (o.color) layer.color = o.color.copy();
    return layer;
}

/** Vị trí thế giới của một điểm (px thiết kế trong ảnh) trên lớp parallax, theo camera hiện tại */
export function layerPoint(layer, px, py)
{
    const p = layer.getDrawPositions()[0] || layer.pos, s = layer.getDrawSize();
    return vec2(p.x - s.x / 2 + px / PX, p.y + s.y / 2 - py / PX);
}

// ------------------------------------------------------------ các nét vẽ dùng chung
function gradient(ctx, W, H, stops)
{
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([t, c]) => g.addColorStop(t, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/** Đường đồi lặp liền mạch (tần số nguyên) */
function ridge(W, baseY, amp, waves, phase = 0)
{
    const pts = [];
    for (let x = 0; x <= W; x += 12)
    {
        let y = 0;
        waves.forEach(([k, a], i) => { y += a * Math.sin(TAU * k * x / W + phase + i * 1.7); });
        pts.push([x, baseY - amp * y]);
    }
    return pts;
}

function hills(ctx, W, H, baseY, amp, waves, fill, phase, line = 3)
{
    const r = ridge(W, baseY, amp, waves, phase);
    shape(ctx, [[-20, H + 20], ...r.map(([x, y]) => [x, y]), [W + 20, H + 20]], fill, { line, jitter: 1.2, sharp: false });
    return r;
}

function sun(ctx, x, y, r, fill, glow)
{
    const g = ctx.createRadialGradient(x, y, r * .5, x, y, r * 3);
    g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    ell(ctx, x, y, r, r, fill, { line: 3, sides: 28, wob: .015 });
}

function cloud(ctx, x, y, s, fill = 'rgba(255,248,230,.85)')
{
    const pts = [];
    for (let i = 0; i < 9; i++)
    {
        const t = i / 8;
        pts.push([x + (t - .5) * 160 * s, y - Math.sin(t * Math.PI) * (28 + rnd(16)) * s]);
    }
    pts.push([x + 90 * s, y + 6 * s], [x - 90 * s, y + 6 * s]);
    shape(ctx, pts, fill, { line: 2, jitter: 1.5, ink: 'rgba(53,44,42,.6)' });
    stroke(ctx, [[x - 50 * s, y - 2 * s], [x + 30 * s, y - 4 * s]], 1.5, 'rgba(53,44,42,.3)', 1);
}

function bird(ctx, x, y, s)
{
    stroke(ctx, [[x - 8 * s, y - 3 * s], [x - 3 * s, y - 5 * s], [x, y], [x + 3 * s, y - 5 * s], [x + 8 * s, y - 3 * s]], 1.8 * s, INK, .3, .8);
}

function smoke(ctx, x, y, h, alpha = .35)
{
    for (let i = 0; i < 10; i++)
    {
        const t = i / 10;
        const cx = x + Math.sin(t * 5) * 14 + t * 40, cy = y - t * h, r = 12 + t * 34;
        ctx.save(); ctx.globalAlpha = alpha * (1 - t * .6);
        ell(ctx, cx, cy, r, r * .8, '#7B7068', { line: 0 });
        ctx.restore();
    }
}

function grassLine(ctx, W, y, color = '#4F6B3E', n = 140, h = 14)
{
    for (let i = 0; i < n; i++)
    {
        const x = rnd(W), hh = h * rnd(.5, 1.2);
        stroke(ctx, [[x, y + 2], [x + jit(4), y - hh * .6], [x + jit(6), y - hh]], 2, color, .3, .9);
    }
}

function rock(ctx, x, y, w, h, fill = '#7C7A72')
{
    shape(ctx, [[x - w / 2, y], [x - w * .42, y - h * .6], [x - w * .1, y - h], [x + w * .3, y - h * .85], [x + w / 2, y - h * .3], [x + w * .45, y]], fill, { line: 3, jitter: 1.2 });
    stroke(ctx, [[x - w * .1, y - h * .85], [x, y - h * .3]], 1.6, 'rgba(53,44,42,.5)', .8);
    ctx.save(); ctx.globalAlpha = .18;
    shape(ctx, [[x + w * .05, y - h * .9], [x + w * .3, y - h * .8], [x + w * .45, y], [x + w * .1, y]], INK, { line: 0 });
    ctx.restore();
}

/** Cờ quân xâm lược (hư cấu) */
export function enemyFlag(ctx, x, baseY, h, torn = false, wave = 0)
{
    stroke(ctx, [[x, baseY], [x + jit(2), baseY - h]], 3.5, '#3A2A20', .4);
    const fx = x + 2, fy = baseY - h + 4, fw = h * .45, fh = h * .32;
    const pts = [[fx, fy]];
    for (let i = 1; i <= 4; i++) pts.push([fx + fw * i / 4, fy + Math.sin(wave + i) * 3 + (torn && i === 4 ? 8 : 0)]);
    if (torn) pts.push([fx + fw * .8, fy + fh * .4], [fx + fw * 1.02, fy + fh * .6], [fx + fw * .7, fy + fh * .75]);
    for (let i = 4; i >= 0; i--) pts.push([fx + fw * i / 4 - (torn && i === 3 ? 6 : 0), fy + fh + Math.sin(wave + i + 1) * 3]);
    shape(ctx, pts, '#2E2433', { line: 2.2 });
    clawEmblem(ctx, fx + fw * .45, fy + fh * .5, fh * .3, '#B08A3E');
}

function house(ctx, x, y, w, h, burning)
{
    // tường đất + cột gỗ
    shape(ctx, [[x - w / 2, y], [x - w / 2, y - h * .55], [x + w / 2, y - h * .55], [x + w / 2, y]], '#C9A46A', { line: 2.6, sharp: true });
    for (let k = -2; k <= 2; k++) stroke(ctx, [[x + k * w / 5, y], [x + k * w / 5, y - h * .55]], 2.2, '#6B4A2E', .4);
    shape(ctx, [[x - w * .08, y], [x - w * .08, y - h * .38], [x + w * .1, y - h * .38], [x + w * .1, y]], '#3A2A20', { line: 2, sharp: true });
    // mái tranh
    const roof = [[x - w * .62, y - h * .5], [x - w * .32, y - h], [x + w * .32, y - h], [x + w * .62, y - h * .5]];
    shape(ctx, roof, burning ? '#6B4A30' : '#9C7A45', { line: 3 });
    for (let k = 0; k < 14; k++)
    {
        const t = k / 13, sx = x - w * .55 + t * w * 1.1;
        stroke(ctx, [[sx, y - h * .52], [sx * .8 + x * .2, y - h * .95]], 1.2, 'rgba(53,44,42,.45)', .6);
    }
    if (burning)
    {
        // lửa vẽ tay trên mái
        for (let k = 0; k < 5; k++)
        {
            const fx = x - w * .35 + k * w * .17 + jit(4), fy = y - h * .85, fh = h * rnd(.4, .75);
            shape(ctx, [[fx - 12, fy + 6], [fx - 6, fy - fh * .5], [fx + jit(4), fy - fh], [fx + 7, fy - fh * .45], [fx + 12, fy + 6]], '#E0733A', { line: 2.2, ink: '#8C2A1A' });
            shape(ctx, [[fx - 6, fy + 4], [fx - 2, fy - fh * .35], [fx + 1, fy - fh * .6], [fx + 5, fy - fh * .3], [fx + 6, fy + 4]], '#F6C25A', { line: 0 });
        }
    }
}

function dinh(ctx, x, y, s)
{
    // nền đá
    shape(ctx, [[x - 150 * s, y], [x - 145 * s, y - 14 * s], [x + 145 * s, y - 14 * s], [x + 150 * s, y]], '#9A8F80', { line: 3, sharp: true });
    // cột gỗ son
    for (let k = -3; k <= 3; k++)
        shape(ctx, [[x + k * 38 * s - 5 * s, y - 14 * s], [x + k * 38 * s - 5 * s, y - 80 * s], [x + k * 38 * s + 5 * s, y - 80 * s], [x + k * 38 * s + 5 * s, y - 14 * s]], '#8E3B2B', { line: 2.4, sharp: true });
    shape(ctx, [[x - 120 * s, y - 14 * s], [x - 120 * s, y - 70 * s], [x + 120 * s, y - 70 * s], [x + 120 * s, y - 14 * s]], 'rgba(60,40,30,.55)', { line: 0, sharp: true });
    // mái ngói hai tầng, đầu đao cong vút
    const roof = (yy, ww, hh, col) =>
    {
        shape(ctx, [[x - ww - 30 * s, yy - hh * .1 - 22 * s], [x - ww, yy], [x + ww, yy], [x + ww + 30 * s, yy - hh * .1 - 22 * s], [x + ww * .78, yy - hh * .55], [x + ww * .55, yy - hh], [x - ww * .55, yy - hh], [x - ww * .78, yy - hh * .55]], col, { line: 3.4 });
        for (let k = -6; k <= 6; k++) stroke(ctx, [[x + k * ww / 6.5, yy - 3 * s], [x + k * ww / 8.5, yy - hh + 4 * s]], 1.4, 'rgba(30,20,15,.5)', .5);
        // đầu đao xoắn
        stroke(ctx, [[x - ww - 30 * s, yy - hh * .1 - 22 * s], [x - ww - 38 * s, yy - hh * .1 - 34 * s], [x - ww - 28 * s, yy - hh * .1 - 38 * s]], 3, INK, .4);
        stroke(ctx, [[x + ww + 30 * s, yy - hh * .1 - 22 * s], [x + ww + 38 * s, yy - hh * .1 - 34 * s], [x + ww + 28 * s, yy - hh * .1 - 38 * s]], 3, INK, .4);
    };
    roof(y - 70 * s, 140 * s, 46 * s, '#6B3B2E');
    roof(y - 112 * s, 92 * s, 40 * s, '#7A4434');
    // lưỡng long chầu nguyệt cách điệu
    ell(ctx, x, y - 160 * s, 9 * s, 9 * s, PAL.vang, { line: 2.4 });
    for (const d of [-1, 1])
        stroke(ctx, [[x + d * 14 * s, y - 154 * s], [x + d * 30 * s, y - 166 * s], [x + d * 44 * s, y - 158 * s], [x + d * 52 * s, y - 166 * s]], 4 * s, '#4A6B4A', .6);
}

function bambooClump(ctx, x, y, n, h, color, leaves = true)
{
    for (let i = 0; i < n; i++)
    {
        ctx.save(); ctx.translate(x + jit(26), y + rnd(4));
        drawBamboo(ctx, h * rnd(.7, 1.15), rnd(6, 9), color, leaves, jit(.12));
        ctx.restore();
    }
}

/** Tán lá tre (đám mây lá) */
function leafCanopy(ctx, x, y, r, color)
{
    for (let i = 0; i < 16; i++)
    {
        const a = rnd(TAU), d = rnd(r), lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * .6;
        const L = rnd(14, 26), t = jit(1.2);
        shape(ctx, [[lx, ly], [lx + Math.cos(t) * L * .5 + 3, ly + Math.sin(t) * L * .5 - 3], [lx + Math.cos(t) * L, ly + Math.sin(t) * L], [lx + Math.cos(t) * L * .5 - 3, ly + Math.sin(t) * L * .5 + 3]],
            color, { line: 1.4, jitter: .3, double: false });
    }
}

// ------------------------------------------------------------ MÀN 1: PHÙ ĐỔNG RỰC LỬA
export function buildLevel1Layers(camY)
{
    const L = {};
    L.sky = makeLayer({
        y: camY, w: 34, h: 18.5, parallax: 1, order: -1000, res: 1, seed: 1, draw: (ctx, W, H) =>
        {
            gradient(ctx, W, H, [[0, '#F3E3B6'], [.45, '#F0CF8E'], [.72, '#E9A766'], [1, '#D9764A']]);
            sun(ctx, W * .72, H * .3, 46, '#F7D27A', 'rgba(255,220,140,.6)');
            for (let i = 0; i < 6; i++) bird(ctx, W * (.2 + i * .05) + jit(20), H * (.18 + jit(.05)), .9);
            // cột khói xa
            smoke(ctx, W * .18, H * .78, 260, .25); smoke(ctx, W * .55, H * .8, 300, .22); smoke(ctx, W * .86, H * .78, 220, .2);
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.clouds = makeLayer({
        y: 12.5, w: 44, h: 5, parallax: .93, order: -990, wrap: true, seed: 2, res: 1.2, draw: (ctx, W, H) =>
        {
            for (let i = 0; i < 5; i++) cloud(ctx, 120 + i * (W - 240) / 4 + jit(40), H * .7 + jit(20), rnd(.6, 1.1));
        },
    });
    L.far = makeLayer({
        y: 3.5, w: 48, h: 7, parallax: .82, order: -980, seed: 3, draw: (ctx, W, H) =>
        {
            hills(ctx, W, H, H * .45, 36, [[2, .6], [5, .3], [11, .1]], '#A7A27A', 0, 2.4);
            const r = hills(ctx, W, H, H * .65, 28, [[3, .5], [7, .3], [13, .15]], '#8A9067', 1.3, 2.6);
            // trại giặc trên đồi
            for (let i = 0; i < 4; i++)
            {
                const x = W * (.12 + i * .25) + jit(30), y = r[Math.round(x / 12)]?.[1] ?? H * .6;
                shape(ctx, [[x - 18, y + 2], [x, y - 20], [x + 18, y + 2]], '#5A4A44', { line: 2 });
                enemyFlag(ctx, x + 26, y + 2, 40, false, i);
            }
            grain(ctx, 0, 0, W, H, .4);
        },
    });
    L.village = makeLayer({
        y: 4.2, w: 48, h: 8.4, parallax: .58, order: -970, seed: 4, draw: (ctx, W, H) =>
        {
            const y = H - 6;
            hills(ctx, W, H, H - 30, 8, [[4, 1]], '#9C8A5E', 0, 2);
            bambooClump(ctx, W * .08, y, 6, 170, '#5E7E52');
            house(ctx, W * .2, y, 150, 120, true);
            house(ctx, W * .33, y, 120, 100, false);
            dinh(ctx, W * .5, y, 1);
            house(ctx, W * .67, y, 130, 110, false);
            house(ctx, W * .8, y, 150, 120, true);
            bambooClump(ctx, W * .92, y, 6, 180, '#5E7E52');
            // cây đa
            const tx = W * .4;
            stroke(ctx, [[tx, y], [tx - 4, y - 90]], 14, '#5A3F2C', 1.5);
            leafCanopy(ctx, tx, y - 120, 70, '#5B7D4C'); leafCanopy(ctx, tx - 30, y - 100, 50, '#4C6E40');
            // cờ giặc cắm trong làng
            enemyFlag(ctx, W * .27, y, 90, false, 1); enemyFlag(ctx, W * .74, y, 95, false, 2);
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.hedge = makeLayer({
        y: 3.2, w: 48, h: 6.8, parallax: .3, order: -960, seed: 5, draw: (ctx, W, H) =>
        {
            const y = H - 2;
            // hàng rào tre
            for (let x = 0; x < W; x += 22) stroke(ctx, [[x, y], [x + jit(2), y - 34]], 4, '#8A6A3E', .4);
            stroke(ctx, [[0, y - 14], [W, y - 16]], 3, '#6B4A2E', 2); stroke(ctx, [[0, y - 28], [W, y - 27]], 3, '#6B4A2E', 2);
            // lũy tre hai bên, chừa khoảng giữa nhìn vào làng
            for (const [a, b] of [[0, .3], [.7, 1]])
                for (let k = 0; k < 7; k++) bambooClump(ctx, W * (a + (b - a) * (k + .5) / 7), y, 3, 190, k % 2 ? '#4E7646' : '#557B50');
            // đống rơm
            for (const x of [W * .36, W * .62])
            {
                shape(ctx, [[x - 34, y], [x - 26, y - 34], [x, y - 52], [x + 26, y - 34], [x + 34, y]], '#D3A85A', { line: 2.6 });
                for (let k = 0; k < 8; k++) stroke(ctx, [[x - 24 + k * 6, y - 4], [x - 12 + k * 3, y - 40]], 1, 'rgba(53,44,42,.4)', .5);
            }
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.ground = groundLayer('#C8A270', '#B08856', '#6E8A4E', 6);
    L.fore = foreLayer('#3E5A34', 7);
    return L;
}

function groundLayer(top, bottom, grass, s)
{
    return makeLayer({
        y: -1.3, w: 48, h: 5, parallax: 0, order: -900, seed: s, draw: (ctx, W, H) =>
        {
            const gy = 1.3 * PX;  // y = 0 của thế giới
            const g = ctx.createLinearGradient(0, gy, 0, H);
            g.addColorStop(0, top); g.addColorStop(1, bottom);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0, gy - 4);
            for (let x = 0; x <= W; x += 24) ctx.lineTo(x, gy - 4 + jit(2));
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            stroke(ctx, [[0, gy - 4], [W * .25, gy - 3], [W * .5, gy - 5], [W * .75, gy - 3], [W, gy - 4]], 3.2, INK, 1);
            grassLine(ctx, W, gy - 4, grass, 220, 16);
            // vết đất, sỏi
            for (let i = 0; i < 70; i++)
            {
                const x = rnd(W), y = gy + 10 + rnd(H - gy - 14);
                ell(ctx, x, y, rnd(2, 6), rnd(1.5, 3), 'rgba(90,70,50,.45)', { line: 0 });
            }
            for (let i = 0; i < 30; i++)
            {
                const x = rnd(W), y = gy + 20 + rnd(H - gy - 30);
                stroke(ctx, [[x, y], [x + rnd(30, 70), y + jit(3)]], 1.4, 'rgba(53,44,42,.25)', 1);
            }
            grain(ctx, 0, 0, W, H, .8);
        },
    });
}

function foreLayer(color, s, rocks = false)
{
    return makeLayer({
        y: -2.6, w: 54, h: 3.2, parallax: -.35, order: 500, seed: s, draw: (ctx, W, H) =>
        {
            for (let i = 0; i < 14; i++)
            {
                const x = W * (i / 14) + rnd(60);
                if (rocks && i % 3 === 0) rock(ctx, x, H + 8, rnd(70, 120), rnd(40, 70), '#3E3C3A');
                // bụi cỏ / lá tre tiền cảnh
                for (let k = 0; k < 9; k++)
                {
                    const bx = x + jit(30), h = rnd(30, 70), a = jit(.6);
                    shape(ctx, [[bx - 5, H + 4], [bx + Math.sin(a) * h * .5 - 3, H - h * .5], [bx + Math.sin(a) * h, H - h], [bx + Math.sin(a) * h * .5 + 4, H - h * .5], [bx + 5, H + 4]],
                        k % 2 ? color : '#2F4528', { line: 1.8, jitter: .4, double: false });
                }
            }
        },
    });
}

// ------------------------------------------------------------ MÀN 2: SÓC SƠN HOÀNG HÔN
export function buildLevel2Layers(camY)
{
    const L = {};
    L.sky = makeLayer({
        y: camY, w: 34, h: 18.5, parallax: 1, order: -1000, res: 1, seed: 11, draw: (ctx, W, H) =>
        {
            gradient(ctx, W, H, [[0, '#4A2440'], [.3, '#8E3A3C'], [.58, '#D2643E'], [.8, '#EE9E52'], [1, '#F2C27A']]);
            sun(ctx, W * .5, H * .6, 70, '#F6B65A', 'rgba(255,170,90,.7)');
            // dải mây chiều
            for (let i = 0; i < 9; i++)
            {
                const y = H * (.15 + rnd(.4)), x = rnd(W), w = rnd(120, 300);
                shape(ctx, [[x - w / 2, y], [x - w / 4, y - 6], [x + w / 3, y - 5], [x + w / 2, y + 2], [x, y + 5]], 'rgba(120,40,50,.45)', { line: 1.4, ink: 'rgba(53,44,42,.4)' });
            }
            for (let i = 0; i < 7; i++) bird(ctx, W * (.62 + i * .035), H * (.22 + Math.sin(i) * .03), 1.1);
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    // trời bình minh (ẩn, hiện dần khi chiến thắng)
    L.dawn = makeLayer({
        y: camY, w: 34, h: 18.5, parallax: 1, order: -999, res: .8, seed: 17, draw: (ctx, W, H) =>
        {
            gradient(ctx, W, H, [[0, '#9CC3D6'], [.45, '#F4E2B8'], [.75, '#F7D08A'], [1, '#F2B870']]);
            sun(ctx, W * .5, H * .38, 64, '#FFE6A0', 'rgba(255,240,190,.8)');
            for (let i = 0; i < 6; i++) cloud(ctx, rnd(W), H * rnd(.1, .35), rnd(.6, 1));
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.dawn.color = new Color(1, 1, 1, 0);
    L.far = makeLayer({
        y: 4.2, w: 48, h: 8.4, parallax: .88, order: -980, seed: 12, wrap: true, draw: (ctx, W, H) =>
        {
            hills(ctx, W, H, H * .55, 70, [[2, .55], [3, .35], [7, .2], [13, .08]], '#8E6E86', .4, 2.4);
            ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#F2C27A'; ctx.fillRect(0, H * .7, W, H * .3); ctx.restore();
        },
    });
    L.mid = makeLayer({
        y: 3.6, w: 48, h: 7.4, parallax: .7, order: -970, seed: 13, draw: (ctx, W, H) =>
        {
            const r = hills(ctx, W, H, H * .62, 85, [[1, .5], [3, .4], [5, .25], [11, .1]], '#5B5E72', 2.1, 3);
            // vân đá vẽ nét
            for (let i = 0; i < 40; i++)
            {
                const x = rnd(W), base = r[Math.round(x / 12)]?.[1] ?? H * .5, y = base + rnd(20, 120);
                stroke(ctx, [[x, y], [x + rnd(10, 30), y + rnd(15, 40)]], 1.6, 'rgba(30,30,40,.45)', 1);
            }
            // cây thông trên sườn
            for (let i = 0; i < 18; i++)
            {
                const x = rnd(W), y = (r[Math.round(x / 12)]?.[1] ?? H * .5) + rnd(10, 40);
                shape(ctx, [[x - 9, y], [x, y - 28], [x + 9, y]], '#3C4A44', { line: 1.6 });
            }
            ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#E58A50'; ctx.fillRect(0, H * .8, W, H * .2); ctx.restore();
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.rocks = makeLayer({
        y: 3, w: 48, h: 6.2, parallax: .38, order: -960, seed: 14, draw: (ctx, W, H) =>
        {
            const y = H - 2;
            for (let i = 0; i < 9; i++) rock(ctx, W * (i / 9) + rnd(60), y, rnd(110, 200), rnd(60, 130), i % 2 ? '#6E6A66' : '#7A746C');
            for (let k = 0; k < 6; k++) bambooClump(ctx, W * (k / 6) + rnd(80), y, 4, 160, k % 2 ? '#3F5E3B' : '#4A6B44');
            // cờ chiến rách, giáo gãy cắm đất
            for (let i = 0; i < 5; i++) enemyFlag(ctx, W * (.1 + i * .2) + jit(40), y - 4, 100 + rnd(40), true, i * 2);
            for (let i = 0; i < 8; i++)
            {
                const x = rnd(W);
                stroke(ctx, [[x, y], [x + jit(20), y - rnd(30, 60)]], 3, '#5A3F2C', .5);
            }
            grain(ctx, 0, 0, W, H, .5);
        },
    });
    L.ground = groundLayer('#9C7656', '#7A5A44', '#5E6B3E', 15);
    L.fore = foreLayer('#2E3A2A', 16, true);
    return L;
}

// ------------------------------------------------------------ MENU: giấy dó + núi mực tàu
export function buildMenuLayers(camY)
{
    const L = {};
    L.paper = makeLayer({
        y: camY, w: 34, h: 18.5, parallax: 1, order: -1000, res: 1, seed: 21, draw: (ctx, W, H) =>
        {
            paper(ctx, W, H);
            // khung viền hoa văn
            ctx.save(); ctx.strokeStyle = PAL.muc; ctx.lineWidth = 6; ctx.strokeRect(18, 18, W - 36, H - 36);
            ctx.lineWidth = 2; ctx.strokeRect(30, 30, W - 60, H - 60); ctx.restore();
            for (let x = 44; x < W - 44; x += 26)
            {
                stroke(ctx, [[x, 24], [x + 6, 30], [x + 12, 24], [x + 18, 30]], 1.6, PAL.muc, .2);
                stroke(ctx, [[x, H - 24], [x + 6, H - 30], [x + 12, H - 24], [x + 18, H - 30]], 1.6, PAL.muc, .2);
            }
            drumSun(ctx, 30, 30, 22, PAL.son); drumSun(ctx, W - 30, 30, 22, PAL.son);
            drumSun(ctx, 30, H - 30, 22, PAL.son); drumSun(ctx, W - 30, H - 30, 22, PAL.son);
        },
    });
    L.far = makeLayer({
        y: 3.5, w: 48, h: 8, parallax: .85, order: -980, seed: 22, wrap: true, draw: (ctx, W, H) =>
        {
            ctx.save(); ctx.globalAlpha = .45;
            hills(ctx, W, H, H * .55, 60, [[2, .5], [3, .35], [7, .2]], '#8C8A80', 0, 2);
            ctx.restore();
        },
    });
    L.mid = makeLayer({
        y: 2.6, w: 48, h: 6.4, parallax: .55, order: -970, seed: 23, wrap: true, draw: (ctx, W, H) =>
        {
            ctx.save(); ctx.globalAlpha = .7;
            hills(ctx, W, H, H * .6, 50, [[1, .5], [4, .35], [9, .15]], '#5F6458', 1, 2.6);
            ctx.restore();
            for (let k = 0; k < 8; k++) bambooClump(ctx, W * (k / 8) + rnd(60), H, 3, 150, '#3F5E3B', true);
        },
    });
    L.near = makeLayer({
        y: -1, w: 48, h: 4, parallax: .2, order: -960, seed: 24, wrap: true, draw: (ctx, W, H) =>
        {
            shape(ctx, [[-20, H + 10], ...ridge(W, H * .4, 10, [[3, .6], [8, .3]]), [W + 20, H + 10]], '#8C8270', { line: 3 });
            ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#5C5446'; ctx.fillRect(0, H * .7, W, H * .3); ctx.restore();
            grassLine(ctx, W, H * .4, '#3F5A34', 160, 20);
            grain(ctx, 0, 0, W, H, .8);
        },
    });
    return L;
}

// ------------------------------------------------------------ CẢNH CUỐI: ĐỈNH SÓC SƠN, GIÓNG BAY VỀ TRỜI
export function buildEndingLayers()
{
    const L = {};
    // bầu trời cao: bình minh ở dưới, lên cao chuyển dần sang trời sao
    L.sky = makeLayer({
        y: 20, w: 34, h: 34, parallax: 1, parallaxY: .75, order: -1000, res: .9, seed: 31, draw: (ctx, W, H) =>
        {
            gradient(ctx, W, H, [[0, '#141A3A'], [.25, '#2E3F78'], [.5, '#6F8FC2'], [.7, '#E9C9A0'], [.85, '#F6D58C'], [1, '#F2B870']]);
            // sao
            for (let i = 0; i < 160; i++)
            {
                const y = rnd(H * .45), a = 1 - y / (H * .45);
                ctx.fillStyle = `rgba(255,248,220,${.3 + a * .7})`;
                const r = rnd(.6, 2.2);
                ctx.beginPath(); ctx.arc(rnd(W), y, r, 0, TAU); ctx.fill();
            }
            // tia nắng bình minh
            ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = '#FFF1C8';
            for (let i = 0; i < 9; i++)
            {
                const a = -Math.PI / 2 + (i - 4) * .16;
                ctx.beginPath(); ctx.moveTo(W * .62, H * .86);
                ctx.lineTo(W * .62 + Math.cos(a - .03) * H, H * .86 + Math.sin(a - .03) * H);
                ctx.lineTo(W * .62 + Math.cos(a + .03) * H, H * .86 + Math.sin(a + .03) * H);
                ctx.fill();
            }
            ctx.restore();
            sun(ctx, W * .62, H * .86, 60, '#FFE29A', 'rgba(255,230,170,.75)');
            grain(ctx, 0, 0, W, H, .4);
        },
    });
    // mây trên cao (bay qua khi camera đi lên)
    L.cloudsHigh = makeLayer({
        y: 21, w: 46, h: 12, parallax: .9, parallaxY: .35, order: -990, wrap: true, seed: 32, res: 1, draw: (ctx, W, H) =>
        {
            for (let i = 0; i < 9; i++) cloud(ctx, 100 + i * (W - 200) / 8 + jit(40), H * rnd(.2, .95), rnd(.8, 1.5), 'rgba(255,250,240,.9)');
        },
    });
    // dãy núi xa nhô lên khỏi biển mây
    L.far = makeLayer({
        y: 2.4, w: 48, h: 6, parallax: .85, order: -980, seed: 33, wrap: true, draw: (ctx, W, H) =>
        {
            hills(ctx, W, H, H * .55, 55, [[2, .5], [5, .35], [9, .2]], '#9C9CC0', 0, 2.2);
            hills(ctx, W, H, H * .75, 40, [[3, .5], [7, .3]], '#8486AE', 1.7, 2.4);
        },
    });
    // biển mây dưới chân núi
    L.mist = makeLayer({
        y: .6, w: 48, h: 3.4, parallax: .6, order: -970, seed: 34, wrap: true, res: 1.2, draw: (ctx, W, H) =>
        {
            for (let i = 0; i < 26; i++) cloud(ctx, i * W / 25, H * rnd(.45, .8), rnd(.8, 1.4), 'rgba(255,246,232,.95)');
            ctx.fillStyle = 'rgba(255,246,232,.95)'; ctx.fillRect(0, H * .7, W, H * .3);
        },
    });
    // đỉnh núi đá nơi Gióng đứng
    L.summit = makeLayer({
        y: -1.3, w: 48, h: 5, parallax: 0, order: -900, seed: 35, draw: (ctx, W, H) =>
        {
            const gy = 1.3 * PX;
            shape(ctx, [[W * .18, H + 10], [W * .22, gy + 6], [W * .3, gy - 6], [W * .45, gy - 2], [W * .55, gy - 4], [W * .7, gy - 6], [W * .78, gy + 8], [W * .84, H + 10]], '#7E7468', { line: 3.4, jitter: 1.5 });
            for (let i = 0; i < 30; i++)
            {
                const x = W * rnd(.24, .76), y = gy + rnd(10, H - gy);
                stroke(ctx, [[x, y], [x + rnd(10, 40), y + rnd(5, 25)]], 1.6, 'rgba(53,44,42,.4)', 1);
            }
            grassLine(ctx, W * .5, gy - 4, '#5E7A4A', 0, 0);
            for (let i = 0; i < 90; i++)
            {
                const x = W * rnd(.25, .75), hh = rnd(8, 18);
                stroke(ctx, [[x, gy - 2], [x + jit(4), gy - hh]], 2, '#5E7A4A', .3, .9);
            }
            // thông già bên trái, bụi tre bên phải
            const tx = W * .33;
            stroke(ctx, [[tx, gy - 2], [tx - 10, gy - 80], [tx + 6, gy - 130]], 12, '#4A3628', 1.5);
            for (const [dx, dy, r] of [[-30, -120, 40], [20, -140, 46], [-6, -170, 34]]) leafCanopy(ctx, tx + dx, gy + dy, r, '#3E5A40');
            bambooClump(ctx, W * .68, gy, 5, 170, '#4E7646');
            grain(ctx, 0, 0, W, H, .6);
        },
    });
    L.fore = foreLayer('#2F4528', 36);
    return L;
}
