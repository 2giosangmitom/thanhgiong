// Gióng: vẽ bằng Canvas2D theo kiểu rối giấy (các bộ phận + khớp), bake thành sprite
import { PAL } from '../config.js';
import { shape, ell, stroke, limb, seg, jit, INK } from './ink.js';
import { bakeSheet } from './sheet.js';

const SKIN = '#E7B184', SKIN_D = '#C98E62';
const PANTS = '#2F3E57', PANTS_D = '#26324A';
const WRAP = '#E9D6AE';
const IRON = PAL.sat, IRON_L = '#9AA0A4';
const HAIR = '#231C1B';
const P = Math.PI;

/** Vẽ roi sắt: thanh sắt nhiều đốt, có núm */
function drawRod(ctx, x, y, a, len, glow)
{
    const [bx, by] = seg(x, y, a, -10);
    const [ex, ey] = seg(x, y, a, len);
    if (glow)
    {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,230,150,.55)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
    }
    limb(ctx, bx, by, ex, ey, 6, IRON, 2.5);
    // đốt sắt
    for (let i = 1; i < 7; i++)
    {
        const [sx, sy] = seg(x, y, a, -10 + (len + 10) * i / 7);
        const [nx, ny] = [Math.cos(a) * 4.5, -Math.sin(a) * 4.5];
        stroke(ctx, [[sx - nx, sy - ny], [sx + nx, sy + ny]], 1.6, INK, .2);
    }
    // ánh kim
    const [hx, hy] = seg(x, y, a, len * .3), [hx2, hy2] = seg(x, y, a, len * .8);
    stroke(ctx, [[hx - Math.cos(a) * 1.5, hy + Math.sin(a) * 1.5], [hx2 - Math.cos(a) * 1.5, hy2 + Math.sin(a) * 1.5]], 1.4, IRON_L, .3);
    ell(ctx, ex, ey, 5.5, 5.5, IRON, { line: 2.5 });
    ell(ctx, bx, by, 4, 4, '#4A4E52', { line: 2 });
}

function drawArm(ctx, sx, sy, a, elbow, sleeve, skin, armor = true)
{
    const [ex, ey] = seg(sx, sy, a, 15);
    const [hx, hy] = seg(ex, ey, a + elbow, 14);
    limb(ctx, ex, ey, hx, hy, 7.5, skin, 2.6);
    limb(ctx, sx, sy, ex, ey, 10, sleeve, 2.6);
    // vòng cổ tay (giáp tay)
    if (armor)
    {
        const [wx, wy] = seg(ex, ey, a + elbow, 10);
        ell(ctx, wx, wy, 4.5, 4.5, PAL.vang, { line: 2 });
    }
    ell(ctx, hx, hy, 5, 5, skin, { line: 2.5 });
    return [hx, hy];
}

function drawLeg(ctx, hx, hy, a, knee, pants, wrap)
{
    const [kx, ky] = seg(hx, hy, a, 20);
    const [fx, fy] = seg(kx, ky, a - knee, 20);
    limb(ctx, hx, hy, kx, ky, 11, pants, 2.6);
    limb(ctx, kx, ky, fx, fy, 9, wrap, 2.6);
    // xà cạp quấn ống chân
    for (let i = 1; i < 4; i++)
    {
        const [sx, sy] = seg(kx, ky, a - knee, i * 5);
        stroke(ctx, [[sx - 4, sy - 1.5], [sx + 4, sy + 1.5]], 1.2, INK, .3, .7);
    }
    // bàn chân (dép cỏ)
    ell(ctx, fx + 4, fy + 1, 7.5, 3.6, '#5A3A28', { line: 2.4 });
}

export function drawGiong(ctx, p)
{
    const bob = p.bob || 0, lean = p.lean || 0;
    const hip = [0 + (p.hipX || 0), -44 + bob];
    const neck = seg(hip[0], hip[1], P - lean, 34);
    const head = [neck[0] + 3 + Math.sin(lean) * 9, neck[1] - 17];
    const sF = [neck[0] + 2, neck[1] + 5], sB = [neck[0] - 4, neck[1] + 5];
    const sc = p.scarf || 0;

    // --- khăn đỏ bay phía sau ---
    for (let k = 0; k < 2; k++)
    {
        const len = 34 + k * 8, ox = head[0] - 12, oy = head[1] - 6 + k * 3;
        const pts = [], n = 6;
        for (let i = 0; i <= n; i++)
        {
            const t = i / n;
            pts.push([ox - t * len, oy + Math.sin(sc + t * 4 + k) * 4 * t + t * (6 + k * 5) - (p.wind || 0) * t * 6]);
        }
        const back = pts.slice().reverse().map(([x, y], i) => [x, y + 5 - (i / n) * 2]);
        shape(ctx, [...pts, ...back], k ? '#9C3B2E' : PAL.son, { line: 2.4, jitter: .4 });
    }

    // --- tay sau ---
    const armor = !p.noArmor;
    drawArm(ctx, sB[0], sB[1], p.armB ?? -.3, p.elbowB ?? .4, '#963A2E', SKIN_D, armor);
    // --- chân sau, chân trước ---
    drawLeg(ctx, hip[0] - 3, hip[1], p.legB ?? -.1, p.kneeB ?? .1, PANTS_D, '#D3BE95');
    drawLeg(ctx, hip[0] + 3, hip[1], p.legF ?? .1, p.kneeF ?? .1, PANTS, WRAP);

    // --- vạt áo ---
    const hx = hip[0], hy = hip[1];
    shape(ctx, [[hx - 13, hy - 4], [hx + 14, hy - 4], [hx + 18, hy + 12], [hx + 4, hy + 15], [hx - 6, hy + 12], [hx - 17, hy + 14]], PAL.son, { line: 3 });
    // --- thân áo ---
    const nx = neck[0], ny = neck[1];
    shape(ctx, [[hx - 13, hy], [hx + 13, hy], [nx + 15, ny + 14], [nx + 11, ny], [nx - 10, ny], [nx - 15, ny + 14]], PAL.son, { line: 3.2 });
    // áo giáp ngực vàng + hoạ tiết trống đồng
    const cx = (hx + nx) / 2 + 3, cy = (hy + ny) / 2 - 1;
    if (armor) {
    shape(ctx, [[cx - 11, cy - 10], [cx + 11, cy - 11], [cx + 13, cy + 8], [cx, cy + 13], [cx - 12, cy + 8]], PAL.vang, { line: 2.6 });
    ell(ctx, cx + 1, cy, 7, 7, '#E8C27A', { line: 2 });
    ctx.save(); ctx.fillStyle = INK;
    ctx.beginPath();
    for (let i = 0; i < 16; i++)
    {
        const a = i / 16 * P * 2, r = i % 2 ? 1.6 : 4.4;
        ctx.lineTo(cx + 1 + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
    } else {
        // áo vải đơn sơ khi đã cởi giáp
        stroke(ctx, [[nx + 1, ny + 8], [cx + 2, cy + 6], [hx + 3, hy - 4]], 1.8, INK, .5, .6);
    }
    // đai lưng
    shape(ctx, [[hx - 14, hy - 4], [hx + 14, hy - 4], [hx + 14, hy + 2], [hx - 14, hy + 2]], '#3A2E2B', { line: 2.4, sharp: true });
    armor && ell(ctx, hx + 2, hy - 1, 3.5, 3.5, PAL.vang, { line: 1.6 });
    // cổ áo
    stroke(ctx, [[nx - 7, ny + 1], [nx + 1, ny + 8], [nx + 9, ny + 1]], 2.2);

    // --- đầu ---
    const [x, y] = head;
    ell(ctx, x - 1, y, 16.5, 16, SKIN, { line: 3.2 });
    // tóc phía sau + chỏm tóc
    shape(ctx, [[x - 17, y + 3], [x - 15, y - 10], [x - 4, y - 17], [x + 9, y - 15], [x + 14, y - 9], [x + 4, y - 11], [x - 6, y - 6], [x - 9, y + 5], [x - 14, y + 9]], HAIR, { line: 2.4 });
    ell(ctx, x - 8, y - 19, 6.5, 5.5, HAIR, { line: 2.4 });
    // khăn đỏ quấn trán
    shape(ctx, [[x - 16, y - 7], [x + 14, y - 11], [x + 15, y - 5], [x - 16, y - 1]], PAL.son, { line: 2.4 });
    ell(ctx, x - 17, y - 4, 4.5, 4, '#9C3B2E', { line: 2 });
    // tai
    ell(ctx, x - 4, y + 2, 3.5, 4.5, SKIN_D, { line: 2 });
    // mũi
    stroke(ctx, [[x + 14.5, y - 1], [x + 17.5, y + 3], [x + 14, y + 4]], 2);
    // mắt + lông mày
    const face = p.face || 'normal';
    if (face === 'hurt')
    {
        stroke(ctx, [[x + 5, y - 3], [x + 9, y - 1], [x + 5, y + 1]], 2.2);
        stroke(ctx, [[x + 7, y + 9], [x + 11, y + 8]], 2);
    }
    else
    {
        ell(ctx, x + 8, y - 1, 2.3, 2.6, INK, { line: 0 });
        ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x + 8.3, y - 2.4, 1, 1); ctx.restore();
        stroke(ctx, [[x + 3, y - 7], [x + 8, y - 6.5], [x + 12, y - 4.5]], 2.8);
        if (face === 'shout')
            shape(ctx, [[x + 7, y + 7], [x + 13, y + 6], [x + 12, y + 11], [x + 8, y + 11]], '#5B1F1A', { line: 2 });
        else
            stroke(ctx, [[x + 8, y + 9], [x + 12, y + 8]], 2);
    }
    // má hồng
    ctx.save(); ctx.fillStyle = 'rgba(214,90,70,.35)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 5, 3.5, 2.2, 0, 0, P * 2); ctx.fill(); ctx.restore();

    // --- tay trước + roi sắt ---
    const hand = (() =>
    {
        const [ex, ey] = seg(sF[0], sF[1], p.armF ?? .3, 15);
        return seg(ex, ey, (p.armF ?? .3) + (p.elbowF ?? -.6), 14);
    })();
    if (p.rodBehind && !p.noRod) drawRod(ctx, hand[0], hand[1], p.rod ?? -2.6, 74, p.glow);
    drawArm(ctx, sF[0], sF[1], p.armF ?? .3, p.elbowF ?? -.6, '#A8432F', SKIN, armor);
    if (!p.rodBehind && !p.noRod) drawRod(ctx, hand[0], hand[1], p.rod ?? -2.6, 74, p.glow);
    ell(ctx, hand[0], hand[1], 5, 5, SKIN, { line: 2.5 });
    // tô cơm trên tay (mini game ăn cơm)
    if (p.bowl)
    {
        const [bx, by] = hand;
        ell(ctx, bx + 2, by - 9, 10, 6, '#FBF7EC', { line: 1.8 });
        shape(ctx, [[bx - 11, by - 7], [bx + 15, by - 7], [bx + 10, by + 3], [bx - 6, by + 3]], '#3E6E8E', { line: 2 });
        stroke(ctx, [[bx - 8, by - 4], [bx + 12, by - 4]], 1.2, '#F1E1BE', .2);
        // đũa
        stroke(ctx, [[bx + 4, by - 10], [bx + 16, by - 24 - (p.bowl > 1 ? 4 : 0)]], 1.8, '#8C5A2E', .2);
        stroke(ctx, [[bx + 7, by - 9], [bx + 19, by - 22 - (p.bowl > 1 ? 4 : 0)]], 1.8, '#8C5A2E', .2);
    }
}

/** Định nghĩa pose cho từng clip */
const idlePose = (i, n) =>
{
    const t = i / n * P * 2;
    return { bob: Math.sin(t) * 1.2, armF: .45 + Math.sin(t) * .03, elbowF: -.75, rod: 1.08 + Math.sin(t) * .03, armB: -.25 + Math.sin(t) * .05, elbowB: .5,
        legF: .12, kneeF: .05, legB: -.12, kneeB: .05, scarf: t, lean: .03 };
};
const walkPose = (i, n) =>
{
    const t = i / n * P * 2, s = Math.sin(t), c = Math.cos(t);
    return { bob: -Math.abs(s) * 2.5 + 1, legF: s * .55, kneeF: Math.max(0, -c) * .8 + .05, legB: -s * .55, kneeB: Math.max(0, c) * .8 + .05,
        armF: .5 + s * .1, elbowF: -.7, rod: 1.2 + s * .08, armB: -s * .45, elbowB: .5, scarf: t * 1.5, lean: .1, wind: 1 };
};
const attackPoses = [
    { lean: -.12, armF: -2.5, elbowF: -.25, rod: -2.15, legF: .25, kneeF: .15, legB: -.3, kneeB: .2, armB: .4, elbowB: .4, face: 'shout', rodBehind: true },
    { lean: .2, armF: 1.55, elbowF: .05, rod: 1.6, legF: .55, kneeF: .35, legB: -.55, kneeB: .05, armB: -.7, elbowB: .3, bob: 2, face: 'shout', glow: true, wind: 1 },
    { lean: .22, armF: 1.05, elbowF: .05, rod: .95, legF: .55, kneeF: .4, legB: -.55, kneeB: .05, armB: -.8, elbowB: .3, bob: 3, face: 'shout', wind: 1 },
    { lean: .1, armF: .8, elbowF: -.4, rod: 1.3, legF: .3, kneeF: .2, legB: -.3, kneeB: .1, armB: -.3, elbowB: .4, bob: 1 },
];

export function bakeGiong()
{
    return bakeSheet({
        seed: 11, res: 2,
        frame: [240, 210], origin: [120, 200],
        draw: drawGiong,
        clips: {
            idle: { count: 4, time: .18, pose: idlePose },
            walk: { count: 6, time: .085, pose: walkPose },
            attack: { count: 4, time: .07, pose: i => ({ ...attackPoses[i], scarf: i }) },
            hurt: { count: 1, pose: () => ({ lean: -.32, armF: -.7, elbowF: -.6, rod: -1.0, legF: .3, kneeF: .3, legB: -.35, kneeB: .2, armB: .9, elbowB: .5, face: 'hurt', bob: 1, scarf: 2, wind: -1 }) },
            cheer: { count: 2, time: .25, pose: i => ({ lean: -.05, armF: 2.25, elbowF: .35, rod: P * .92, armB: -.9 - i * .1, elbowB: .9, legF: .3, kneeF: .05, legB: -.3, kneeB: .05, face: 'shout', scarf: i * 2, wind: 1, glow: i == 1, bob: -i }) },
            slam: { count: 1, pose: () => ({ lean: .28, armF: .5, elbowF: .1, rod: .2, legF: .7, kneeF: 1.0, legB: -.6, kneeB: .5, armB: -1.2, elbowB: .6, bob: 7, face: 'shout', glow: true, scarf: 1, wind: 1 }) },
            dash: { count: 1, pose: () => ({ lean: .5, armF: -1.3, elbowF: .2, rod: -1.75, legF: 1.05, kneeF: .35, legB: -.95, kneeB: .7, armB: -1.4, elbowB: .4, bob: 4, face: 'shout', scarf: 3, wind: 2.5, rodBehind: true }) },
            // cảnh cuối: cởi giáp, bỏ roi, bay về trời
            free: { count: 4, time: .2, pose: (i, n) => { const t = i / n * P * 2; return { noArmor: true, noRod: true, bob: Math.sin(t) * 1.2, armF: .15, elbowF: -.25, armB: -.15, elbowB: .3, legF: .1, kneeF: .05, legB: -.1, kneeB: .05, scarf: t, lean: -.03 }; } },
            fly: { count: 3, time: .16, pose: i => ({ noArmor: true, noRod: true, armF: 1.95 + i * .06, elbowF: .25, armB: -2.0 - i * .06, elbowB: -.25, legF: .25, kneeF: .5, legB: .05, kneeB: .6, lean: -.08, scarf: i * 2, wind: -1.5, face: 'shout', bob: -i }) },
            eat: { count: 2, time: .1, pose: i => ({ noArmor: true, noRod: true, bowl: 1 + i, armF: i ? 1.7 : 1.05, elbowF: i ? -2.5 : -1.7, armB: .5, elbowB: -.9, face: i ? 'shout' : 'normal', lean: i ? -.08 : .02, bob: i ? -1 : 0, scarf: i, legF: .12, kneeF: .05, legB: -.12, kneeB: .05 }) },
            dead: { count: 1, pose: () => ({ lean: -.2, armF: -1.2, elbowF: -.3, rod: -1.6, legF: .2, kneeF: .6, legB: .1, kneeB: .7, armB: 1.3, elbowB: .2, face: 'hurt', bob: 0 }) },
        },
    });
}
