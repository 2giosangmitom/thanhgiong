// Dân làng: bô lão (khăn xếp, áo the, râu bạc) và trẻ con ngồi nghe; tô cơm, nồi cơm, chiếu
import { TextureInfo, tile, vec2 } from 'littlejsengine';
import { PAL } from '../config.js';
import { shape, ell, stroke, limb, seg, makeCanvas, seed, grain, rnd, jit, INK } from './ink.js';
import { bakeSheet } from './sheet.js';

const P = Math.PI;
const SKIN = '#D9A57A', SKIN_KID = '#E7B184';

// ------------------------------------------------------------ BÔ LÃO (ngồi xếp bằng, quay sang phải)
function drawElder(ctx, p)
{
    const talk = p.talk || 0, lean = .12;
    // chân xếp bằng
    shape(ctx, [[-34, -2], [-30, -16], [0, -20], [30, -16], [36, -4], [0, 2]], '#4A3A2E', { line: 3 });
    stroke(ctx, [[-10, -14], [14, -6]], 1.6, INK, .4, .6);
    ell(ctx, 32, -4, 7, 4, '#2E2522', { line: 2 });
    // tay sau đặt trên gối
    limb(ctx, -12, -58, -20, -30, 9, '#5C3E2A', 2.4);
    limb(ctx, -20, -30, -6, -20, 7, SKIN, 2.4);
    // thân áo the
    const nx = 2 + lean * 40, ny = -62;
    shape(ctx, [[-22, -16], [22, -16], [nx + 18, ny + 10], [nx + 12, ny - 2], [nx - 12, ny - 2], [nx - 18, ny + 12]], '#6B4A33', { line: 3.2 });
    stroke(ctx, [[nx + 6, ny + 2], [10, -18]], 1.8, INK, .4, .7);
    for (let i = 0; i < 3; i++) ell(ctx, nx + 8 - i * 1.5, ny + 12 + i * 10, 1.6, 1.6, PAL.vang, { line: 0 });
    const sx = nx + 6, sy = ny + 6;
    if (p.point)
    {
        const [ex, ey] = seg(sx, sy, 1.85, 18), [wx, wy] = seg(ex, ey, 2.35, 17);
        limb(ctx, sx, sy, ex, ey, 9, '#6B4A33', 2.4);
        limb(ctx, ex, ey, wx, wy, 7, SKIN, 2.4);
        ell(ctx, wx, wy, 4, 4, SKIN, { line: 2 });
        stroke(ctx, [[wx, wy], [wx + 4, wy - 7]], 2.4, INK, .2);
    }
    // đầu
    const hx = nx + 6, hy = ny - 16;
    ell(ctx, hx, hy, 14, 15, SKIN, { line: 3 });
    // khăn xếp
    shape(ctx, [[hx - 15, hy - 4], [hx - 13, hy - 14], [hx, hy - 19], [hx + 13, hy - 14], [hx + 15, hy - 5]], '#2A2220', { line: 2.6 });
    for (let i = 0; i < 3; i++) stroke(ctx, [[hx - 13, hy - 7 - i * 4], [hx + 13, hy - 8 - i * 4]], 1, '#5A4A44', .3, .8);
    // râu bạc dài
    const open = talk ? 3 : 0;
    shape(ctx, [[hx + 2, hy + 6 + open], [hx + 14, hy + 4 + open], [hx + 12, hy + 22 + open], [hx + 8, hy + 36 + open], [hx + 4, hy + 22]], '#F2EFE6', { line: 2.2 });
    shape(ctx, [[hx + 4, hy + 4], [hx + 15, hy + 2], [hx + 18, hy + 7], [hx + 10, hy + 6]], '#F2EFE6', { line: 1.8 });
    if (talk) ell(ctx, hx + 11, hy + 7, 2.6, 1.8, '#5B1F1A', { line: 1.4 });
    // mắt cười, lông mày bạc
    stroke(ctx, [[hx + 5, hy - 3], [hx + 8, hy - 5], [hx + 11, hy - 3]], 2, INK, .2);
    stroke(ctx, [[hx + 3, hy - 8], [hx + 13, hy - 9], [hx + 17, hy - 6]], 2.6, '#F2EFE6', .3);
    stroke(ctx, [[hx + 13, hy - 1], [hx + 16, hy + 3]], 1.6, INK, .3);
    // tay trước: cầm quạt / chỉ lên trời / giơ tay kể
    if (p.point) return;
    const a = talk ? 1.6 : .9, el = talk ? -.6 : -1.5;
    const [ex, ey] = seg(sx, sy, a, 18), [wx, wy] = seg(ex, ey, a + el, 16);
    limb(ctx, sx, sy, ex, ey, 9, '#6B4A33', 2.4);
    limb(ctx, ex, ey, wx, wy, 7, SKIN, 2.4);
    {
        // quạt nan
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(talk ? -.6 : -1.2);
        shape(ctx, [[0, 0], [-14, -20], [-4, -26], [8, -26], [16, -18]], '#D9B878', { line: 2 });
        for (let i = -2; i <= 2; i++) stroke(ctx, [[0, 0], [i * 6, -24]], 1, INK, .2, .6);
        ctx.restore();
    }
    ell(ctx, wx, wy, 4, 4, SKIN, { line: 2 });
}

// ------------------------------------------------------------ TRẺ CON (ngồi bó gối, quay sang phải)
const KIDS = [
    { shirt: '#8C6A4A', pants: '#4A3A2E', hair: 'tuft' },   // bé trai để chỏm
    { shirt: PAL.son, pants: '#3B3030', hair: 'buns' },     // bé gái tóc trái đào
    { shirt: PAL.tre, pants: '#3E3A34', hair: 'bowl' },     // bé trai tóc bát úp
];

function drawKid(ctx, p)
{
    const k = KIDS[p.kid], up = p.raise || 0, cheer = p.cheer, bob = p.bob || 0;
    // chân bó gối
    limb(ctx, -6, -10, 12, -26 + bob, 9, k.pants, 2.4);
    limb(ctx, 12, -26 + bob, 18, -2, 8, SKIN_KID, 2.4);
    ell(ctx, 21, -2, 5, 3, '#5A3A28', { line: 1.8 });
    // thân
    shape(ctx, [[-12, -6], [8, -6], [10, -34 + bob], [-8, -36 + bob]], k.shirt, { line: 2.8 });
    // tay giơ lên (vẽ trước đầu để không che mặt)
    if (cheer)
    {
        limb(ctx, -2, -32 + bob, -18, -62 + bob, 6.5, SKIN_KID, 2.2);
        limb(ctx, 4, -32 + bob, 22, -64 + bob, 6.5, SKIN_KID, 2.2);
    }
    else if (up) limb(ctx, 4, -32 + bob, 22, -66 + bob, 6.5, SKIN_KID, 2.2);
    // đầu to
    const hx = 2, hy = -50 + bob;
    ell(ctx, hx, hy, 13, 13, SKIN_KID, { line: 2.8 });
    if (k.hair === 'tuft') { shape(ctx, [[hx - 2, hy - 13], [hx + 2, hy - 20], [hx + 7, hy - 12]], '#231C1B', { line: 1.6 }); }
    if (k.hair === 'buns') { ell(ctx, hx - 9, hy - 11, 5, 5, '#231C1B', { line: 1.8 }); ell(ctx, hx + 7, hy - 13, 5, 5, '#231C1B', { line: 1.8 }); shape(ctx, [[hx - 13, hy - 2], [hx - 8, hy - 11], [hx + 6, hy - 12], [hx + 12, hy - 4], [hx + 2, hy - 7]], '#231C1B', { line: 1.6 }); }
    if (k.hair === 'bowl') shape(ctx, [[hx - 14, hy + 1], [hx - 11, hy - 10], [hx + 2, hy - 15], [hx + 12, hy - 9], [hx + 13, hy - 3], [hx - 4, hy - 5]], '#231C1B', { line: 1.8 });
    // mặt
    ell(ctx, hx + 7, hy, 1.9, 2.2, INK, { line: 0 });
    ctx.save(); ctx.fillStyle = 'rgba(214,90,70,.4)'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 5, 3, 2, 0, 0, 7); ctx.fill(); ctx.restore();
    if (up || cheer) shape(ctx, [[hx + 7, hy + 6], [hx + 11, hy + 6], [hx + 10, hy + 9]], '#5B1F1A', { line: 1.2 });
    else stroke(ctx, [[hx + 7, hy + 7], [hx + 10, hy + 6]], 1.6);
    // tay
    if (up && !cheer) limb(ctx, 4, -32 + bob, 10, -24 + bob, 6.5, SKIN_KID, 2.2);
    else if (!cheer) limb(ctx, 2, -30 + bob, 12, -22 + bob, 6.5, SKIN_KID, 2.2);
}

export function bakeVillagers()
{
    const kid = (kidI) => ({
        [`kid${kidI}`]: { count: 2, time: .45 + kidI * .07, pose: i => ({ kid: kidI, bob: i }) },
        [`kid${kidI}Raise`]: { count: 1, pose: () => ({ kid: kidI, raise: 1 }) },
        [`kid${kidI}Cheer`]: { count: 2, time: .18, pose: i => ({ kid: kidI, cheer: true, bob: -i * 2 }) },
    });
    return bakeSheet({
        seed: 71, res: 2,
        frame: [150, 140], origin: [70, 132],
        draw: (ctx, p, name) => name.startsWith('elder') ? drawElder(ctx, p) : drawKid(ctx, p),
        clips: {
            elderIdle: { count: 2, time: .7, pose: i => ({ talk: 0, bob: i }) },
            elderTalk: { count: 2, time: .16, pose: i => ({ talk: i }) },
            elderPoint: { count: 2, time: .2, pose: i => ({ point: true, talk: i }) },
            ...kid(0), ...kid(1), ...kid(2),
        },
    });
}

// ------------------------------------------------------------ đạo cụ bữa cơm & buổi kể chuyện
function drawBowl(ctx, x, y, full)
{
    if (full)
    {
        ell(ctx, x, y - 12, 15, 9, '#FBF7EC', { line: 2 });
        for (let i = 0; i < 6; i++) ell(ctx, x + jit(10), y - 13 + jit(4), 1.6, 1, '#E6DCC4', { line: 0 });
    }
    shape(ctx, [[x - 18, y - 10], [x + 18, y - 10], [x + 12, y + 2], [x - 12, y + 2]], '#3E6E8E', { line: 2.4 });
    stroke(ctx, [[x - 15, y - 6], [x + 15, y - 6]], 1.6, '#F1E1BE', .3);
    shape(ctx, [[x - 6, y + 2], [x + 6, y + 2], [x + 5, y + 6], [x - 5, y + 6]], '#2E5670', { line: 1.8, sharp: true });
}

/** Tô cơm đầy / rỗng, nồi cơm, chiếu, bếp lửa */
export function bakeFeastProps()
{
    const res = 2, W = 420, H = 140;
    const c = makeCanvas(W * res, H * res), ctx = c.getContext('2d');
    ctx.save(); ctx.scale(res, res);
    seed(901);
    drawBowl(ctx, 25, 40, true);           // ô 0: tô đầy (50×50)
    drawBowl(ctx, 75, 40, false);          // ô 1: tô rỗng
    // ô 2: nồi cơm đồng lớn (100×100) tại x 100..200
    shape(ctx, [[112, 50], [188, 50], [184, 92], [116, 92]], '#8C5A2E', { line: 3 });
    ell(ctx, 150, 50, 40, 9, '#6B4423', { line: 2.6 });
    ell(ctx, 150, 46, 34, 10, '#FBF7EC', { line: 2 });
    stroke(ctx, [[118, 62], [182, 62]], 2, PAL.vang, .4);
    ell(ctx, 108, 58, 6, 4, '#6B4423', { line: 2 }); ell(ctx, 192, 58, 6, 4, '#6B4423', { line: 2 });
    // ô 3: chiếu cói (200×40) tại x 200..400, y 0..40
    shape(ctx, [[205, 30], [215, 8], [390, 8], [398, 30]], '#D8BC7C', { line: 2.4, sharp: true });
    for (let x = 220; x < 390; x += 10) stroke(ctx, [[x, 10], [x - 3, 29]], 1, 'rgba(120,80,40,.5)', .2);
    stroke(ctx, [[208, 24], [396, 24]], 2, PAL.son, .3);
    ctx.restore();
    grain(ctx, 0, 0, c.width, c.height, .4, 1.5);
    const tex = new TextureInfo(c, true, false, false);
    const t = (x, y, w, h) => tile(vec2(0), vec2(w * res, h * res), tex).offset(vec2(x * res, y * res));
    return {
        bowlFull: t(0, 0, 50, 50), bowlEmpty: t(50, 0, 50, 50), pot: t(100, 0, 100, 100), mat: t(200, 0, 200, 40),
        bowlSize: vec2(50 / 30, 50 / 30), potSize: vec2(100 / 30, 100 / 30), matSize: vec2(200 / 30, 40 / 30),
    };
}
