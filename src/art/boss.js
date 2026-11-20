// Thiết Giáp Tướng: tướng xâm lược hư cấu, giáp sắt lớn, mặt nạ sắt che kín, đại đao, áo choàng đỏ sẫm
import { shape, ell, stroke, limb, seg, INK } from './ink.js';
import { bakeSheet } from './sheet.js';
import { clawEmblem } from './soldier.js';

const IRON = '#565B5F', IRON_D = '#3C4044', IRON_L = '#8A9094', GOLD = '#B8913F';
const CAPE = '#6E2622', CAPE_D = '#4E1A17', POLE = '#3A2A20', BLADE = '#C3C8CC';
const P = Math.PI;

function drawGlaive(ctx, x, y, a, glint)
{
    const [bx, by] = seg(x, y, a, -48), [ex, ey] = seg(x, y, a, 70);
    limb(ctx, bx, by, ex, ey, 7, POLE, 2.6);
    for (const d of [-40, 10, 60])
    {
        const [sx, sy] = seg(x, y, a, d), nx = Math.cos(a) * 5, ny = -Math.sin(a) * 5;
        shape(ctx, [[sx - nx, sy - ny], [sx + nx, sy + ny]], null, { line: 4, ink: GOLD, closed: false, double: false, jitter: .2 });
    }
    // lưỡi đao cong lớn
    const ux = Math.sin(a), uy = Math.cos(a);      // hướng dọc cán
    const vx = Math.cos(a), vy = -Math.sin(a);     // vuông góc (phía lưỡi)
    const pt = (u, v) => [ex + (ux * u + vx * v) * 1.4, ey + (uy * u + vy * v) * 1.4];
    shape(ctx, [pt(-4, -6), pt(14, -9), pt(34, -12), pt(52, -6), pt(58, 2), pt(44, 4), pt(30, 6), pt(16, 9), pt(6, 6), pt(-2, 6)], BLADE, { line: 3 });
    shape(ctx, [pt(4, -7), pt(30, -11), pt(52, -6)], null, { line: 2, ink: '#F4F6F8', closed: false, double: false, jitter: .2 });
    // lưỡi răng cưa phía sau
    shape(ctx, [pt(16, 9), pt(20, 15), pt(24, 8)], BLADE, { line: 2.2, sharp: true });
    // tua đỏ
    const [qx, qy] = pt(-4, 0);
    shape(ctx, [[qx, qy], [qx - 8, qy + 10], [qx - 2, qy + 16], [qx + 4, qy + 9]], '#A3302A', { line: 2 });
    if (glint)
    {
        const [gx, gy] = pt(40, -9);
        ctx.save(); ctx.fillStyle = 'rgba(255,255,230,.9)';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? 2 : 9, t = i / 8 * P * 2; ctx.lineTo(gx + Math.cos(t) * r, gy + Math.sin(t) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }
}

function arm(ctx, sx, sy, a, elbow)
{
    const [ex, ey] = seg(sx, sy, a, 24), [hx, hy] = seg(ex, ey, a + elbow, 22);
    limb(ctx, sx, sy, ex, ey, 15, IRON_D, 3);
    limb(ctx, ex, ey, hx, hy, 13, IRON, 3);
    ell(ctx, ex, ey, 7, 7, IRON_L, { line: 2.4 });
    ell(ctx, hx, hy, 8, 7.5, '#2E2A28', { line: 2.6 });
    return [hx, hy];
}

export function drawBoss(ctx, p)
{
    const bob = p.bob || 0, lean = p.lean || 0, cw = p.cape || 0;
    const hip = [0, -76 + bob];
    const neck = seg(hip[0], hip[1], P - lean, 56);
    const head = [neck[0] + 4 + Math.sin(lean) * 14, neck[1] - 26];
    const sF = [neck[0] + 6, neck[1] + 10], sB = [neck[0] - 12, neck[1] + 10];

    // áo choàng phía sau
    const cpts = [[sB[0] + 2, sB[1] - 6]];
    for (let i = 0; i <= 5; i++)
    {
        const t = i / 5;
        cpts.push([sB[0] - 14 - t * 34 - Math.sin(cw + t * 3) * 6 * t, sB[1] + t * 128 + Math.cos(cw + t * 2) * 3]);
    }
    cpts.push([sB[0] + 10, hip[1] + 60], [sF[0] - 4, sF[1]]);
    shape(ctx, cpts, CAPE, { line: 3.2 });
    stroke(ctx, [[sB[0] - 10, sB[1] + 20], [sB[0] - 28, sB[1] + 90]], 2, CAPE_D, 1);
    stroke(ctx, [[sB[0] - 2, sB[1] + 30], [sB[0] - 12, sB[1] + 100]], 2, CAPE_D, 1);

    // tay sau
    arm(ctx, sB[0], sB[1], p.armB ?? -.2, p.elbowB ?? .5);

    // chân
    const leg = (x, a, knee, dark) =>
    {
        const [kx, ky] = seg(x, hip[1], a, 36), [fx, fy] = seg(kx, ky, a - knee, 36);
        limb(ctx, x, hip[1], kx, ky, 20, dark ? '#2E2A2C' : '#3A3436', 3);
        limb(ctx, kx, ky, fx, fy, 17, dark ? IRON_D : IRON, 3);
        ell(ctx, kx, ky, 9, 8, dark ? IRON : IRON_L, { line: 2.6 });
        shape(ctx, [[fx - 10, fy - 6], [fx + 15, fy - 5], [fx + 19, fy + 3], [fx - 11, fy + 3]], '#1E1B1B', { line: 2.6 });
    };
    leg(hip[0] - 7, p.legB ?? -.12, p.kneeB ?? .1, true);
    leg(hip[0] + 7, p.legF ?? .12, p.kneeF ?? .1, false);

    // váy giáp (phiến sắt nhiều hàng)
    const [hx, hy] = hip;
    for (let r = 2; r >= 0; r--)
    {
        const yy = hy - 4 + r * 12;
        shape(ctx, [[hx - 28, yy], [hx + 28, yy], [hx + 31 + r * 2, yy + 16], [hx - 31 - r * 2, yy + 16]], r % 2 ? IRON_D : IRON, { line: 2.6 });
        for (let c = -3; c <= 3; c++) stroke(ctx, [[hx + c * 8, yy + 2], [hx + c * 8.8, yy + 15]], 1.2, '#26292C', .3, .8);
        stroke(ctx, [[hx - 30 - r * 2, yy + 15], [hx + 30 + r * 2, yy + 15]], 2, GOLD, .4, .9);
    }

    // thân giáp
    const [nx, ny] = neck;
    shape(ctx, [[hx - 27, hy], [hx + 27, hy], [nx + 30, ny + 22], [nx + 22, ny - 2], [nx - 22, ny - 2], [nx - 30, ny + 22]], IRON, { line: 3.4 });
    // hàng vảy giáp
    for (let r = 0; r < 5; r++)
    {
        const yy = ny + 12 + r * 9;
        for (let c = -3; c <= 3; c++)
        {
            ctx.save(); ctx.strokeStyle = '#30353A'; ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.arc(nx + c * 8 + (r % 2) * 4, yy, 4.2, 0, P); ctx.stroke(); ctx.restore();
        }
    }
    // hộ tâm kính + ấn hiệu
    const cx = (hx + nx) / 2 + 4, cy = (hy + ny) / 2 - 4;
    ell(ctx, cx, cy, 13, 13, IRON_L, { line: 3 });
    ell(ctx, cx, cy, 9.5, 9.5, '#A8AEB2', { line: 1.6 });
    clawEmblem(ctx, cx, cy, 8, '#2A2228');
    // đai vàng
    shape(ctx, [[hx - 28, hy - 6], [hx + 28, hy - 6], [hx + 28, hy + 2], [hx - 28, hy + 2]], GOLD, { line: 2.4, sharp: true });
    ell(ctx, hx + 2, hy - 2, 7, 6, '#8C6A28', { line: 2 });

    // mũ trụ + mặt nạ sắt
    const [x, y] = head;
    // chỏm kim loại
    shape(ctx, [[x - 4, y - 24], [x + 1, y - 58], [x + 6, y - 24]], IRON_L, { line: 2.6, sharp: true });
    shape(ctx, [[x + 1, y - 46], [x - 12, y - 40 + Math.sin(cw) * 2], [x - 20, y - 26], [x - 6, y - 30]], '#A3302A', { line: 2.2 });
    // mũ
    shape(ctx, [[x - 24, y + 2], [x - 22, y - 16], [x - 10, y - 27], [x + 10, y - 27], [x + 22, y - 16], [x + 24, y + 2]], IRON_D, { line: 3.2 });
    shape(ctx, [[x - 26, y - 6], [x + 26, y - 8], [x + 25, y - 1], [x - 25, y + 1]], GOLD, { line: 2.4 });
    // tấm che gáy
    shape(ctx, [[x - 24, y], [x - 34, y + 22], [x - 14, y + 24], [x - 10, y + 4]], IRON, { line: 2.6 });
    // mặt nạ che kín (không thể hiện đặc điểm khuôn mặt)
    shape(ctx, [[x - 12, y - 2], [x + 20, y - 4], [x + 24, y + 10], [x + 18, y + 24], [x + 2, y + 28], [x - 10, y + 20]], '#4A4F53', { line: 3 });
    stroke(ctx, [[x + 2, y + 14], [x + 20, y + 13]], 1.6, '#2A2D30', .3);
    stroke(ctx, [[x + 4, y + 19], [x + 18, y + 18]], 1.6, '#2A2D30', .3);
    // khe mắt phát sáng
    const eye = p.eyes || '#F2C14E';
    shape(ctx, [[x + 6, y + 3], [x + 19, y + 1], [x + 18, y + 6], [x + 7, y + 7]], '#141212', { line: 1.6, sharp: true });
    ell(ctx, x + 14, y + 4, 3.2, 1.8, eye, { line: 0 });

    // giáp vai lớn
    for (let k = 0; k < 3; k++)
        ell(ctx, sF[0] - 2 + k * 2, sF[1] - 2 + k * 6, 18 - k * 2, 9, k % 2 ? IRON_D : IRON, { line: 2.8, rot: .25 });
    stroke(ctx, [[sF[0] - 14, sF[1] + 14], [sF[0] + 12, sF[1] + 18]], 2, GOLD, .3);

    // tay trước + đại đao
    const [ex, ey] = seg(sF[0], sF[1], p.armF ?? .6, 24);
    const hand = seg(ex, ey, (p.armF ?? .6) + (p.elbowF ?? -1), 22);
    if (p.glaiveBehind) drawGlaive(ctx, hand[0], hand[1], p.glaive ?? P * .92, p.glint);
    arm(ctx, sF[0], sF[1], p.armF ?? .6, p.elbowF ?? -1);
    if (!p.glaiveBehind) drawGlaive(ctx, hand[0], hand[1], p.glaive ?? P * .92, p.glint);
    ell(ctx, hand[0], hand[1], 8, 7.5, '#2E2A28', { line: 2.6 });
}

export function bakeBoss()
{
    return bakeSheet({
        seed: 37, res: 1.5,
        frame: [400, 330], origin: [200, 318],
        draw: drawBoss,
        clips: {
            idle: { count: 4, time: .22, pose: (i, n) => { const t = i / n * P * 2; return { bob: Math.sin(t) * 2, cape: t, armF: .5, elbowF: -1.3, glaive: P * .9, armB: -.2 + Math.sin(t) * .05 }; } },
            walk: {
                count: 6, time: .14, pose: (i, n) =>
                {
                    const t = i / n * P * 2, s = Math.sin(t), c = Math.cos(t);
                    return { bob: -Math.abs(s) * 4 + 2, legF: s * .4, kneeF: Math.max(0, -c) * .6 + .05, legB: -s * .4, kneeB: Math.max(0, c) * .6 + .05,
                        cape: t, armF: .5 + s * .06, elbowF: -1.3, glaive: P * .88, armB: -s * .3, lean: .08 };
                },
            },
            windup: {
                count: 3, time: .2, pose: i => ({ lean: -.08 - i * .06, armF: -1.6 - i * .35, elbowF: -.3, glaive: -1.9 - i * .25, armB: .5 + i * .1, elbowB: .5,
                    legF: .3, kneeF: .2, legB: -.3, kneeB: .15, cape: i, glaiveBehind: true, glint: i === 2 }),
            },
            slash: {
                count: 3, time: .06, pose: i => ({ lean: .15 + i * .05, armF: [2.0, 1.6, 1.15][i], elbowF: .05, glaive: [2.1, 1.62, 1.15][i], armB: -.8, elbowB: .4,
                    legF: .5, kneeF: .3, legB: -.5, kneeB: .05, bob: 3 + i, cape: 2 + i }),
            },
            recover: { count: 2, time: .3, pose: i => ({ lean: .12, armF: .9, elbowF: -.2, glaive: .7, armB: -.3, legF: .4, kneeF: .3, legB: -.4, kneeB: .1, bob: 4 + i * 1.5, cape: i }) },
            stagger: { count: 1, pose: () => ({ lean: -.3, armF: -1.0, elbowF: -.6, glaive: -2.6, armB: 1.2, elbowB: .3, legF: .4, kneeF: .5, legB: -.2, kneeB: .2, bob: 3, cape: 1 }) },
        },
    });
}
