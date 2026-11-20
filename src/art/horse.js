// Ngựa sắt (bờm và đuôi lửa) có Gióng cưỡi — vẽ Canvas2D, bake thành sprite cho cảnh cuối
import { PAL } from '../config.js';
import { shape, ell, stroke, limb, seg, INK } from './ink.js';
import { bakeSheet } from './sheet.js';
import { drawGiong } from './giong.js';

const IRON = '#5E646A', IRON_D = '#43484D', IRON_L = '#9AA1A6', GOLD = '#B8913F';
const FIRE = '#F08A3A', FIRE_Y = '#FFD27A', FIRE_D = '#B5402A';
const P = Math.PI;

/** Ngọn lửa vẽ tay hướng theo góc a (0 = lên) */
function flame(ctx, x, y, a, len, w)
{
    const ux = Math.sin(a), uy = -Math.cos(a), vx = -uy, vy = ux;
    const pt = (u, v) => [x + ux * u + vx * v, y + uy * u + vy * v];
    shape(ctx, [pt(0, -w), pt(len * .45, -w * .9), pt(len, 0), pt(len * .4, w * .5), pt(0, w)], FIRE, { line: 1.8, ink: FIRE_D, jitter: .4, double: false });
    shape(ctx, [pt(0, -w * .5), pt(len * .55, -w * .2), pt(len * .35, w * .3), pt(0, w * .4)], FIRE_Y, { line: 0, jitter: .3 });
}

/** Chân ngựa: đùi + cẳng + móng; k là độ gập khớp (âm = gập về sau) */
function leg(ctx, x, y, a, k, dark)
{
    const [kx, ky] = seg(x, y, a, 27), [hx, hy] = seg(kx, ky, a + k, 27);
    limb(ctx, x, y, kx, ky, 12, dark ? IRON_D : IRON, 2.6);
    limb(ctx, kx, ky, hx, hy, 8, dark ? '#3A3E42' : IRON_D, 2.6);
    ell(ctx, kx, ky, 5, 5, GOLD, { line: 1.8 });
    shape(ctx, [[hx - 6, hy - 4], [hx + 7, hy - 4], [hx + 8, hy + 3], [hx - 6, hy + 3]], '#1E1B1B', { line: 2 });
}

export function drawHorse(ctx, p)
{
    const bob = p.bob || 0, by = -74 + bob, L = p.legs;
    ctx.save();
    if (p.tilt) { ctx.translate(0, by); ctx.rotate(p.tilt); ctx.translate(0, -by); }

    // đuôi lửa
    const tw = p.tail || 0;
    for (let i = 0; i < 3; i++)
        flame(ctx, -46, by - 12 + i * 5, -1.2 - i * .25 + Math.sin(tw + i) * .15, 42 + i * 8 + (p.fly ? 20 : 0), 7 - i);
    // hai chân phía xa
    leg(ctx, 26, by + 12, L[1][0], L[1][1], true);
    leg(ctx, -30, by + 12, L[3][0], L[3][1], true);
    // thân sắt
    shape(ctx, [[-52, by - 6], [-40, by - 22], [0, by - 26], [36, by - 22], [52, by - 6], [44, by + 16], [0, by + 22], [-44, by + 16]], IRON, { line: 3.2 });
    for (const x of [-30, -12, 8, 26]) stroke(ctx, [[x, by - 20], [x + 3, by + 16]], 1.6, '#30353A', .4, .8);
    stroke(ctx, [[-40, by - 14], [30, by - 18]], 2, IRON_L, .6, .7);
    for (let i = 0; i < 7; i++) ell(ctx, -36 + i * 12, by + 12, 1.6, 1.6, '#2A2D30', { line: 0 });
    // yên đỏ viền vàng
    shape(ctx, [[-22, by - 24], [10, by - 26], [16, by - 6], [-26, by - 4]], '#A3302A', { line: 2.4 });
    stroke(ctx, [[-25, by - 6], [15, by - 8]], 2.4, GOLD, .3);
    // cổ + đầu
    shape(ctx, [[28, by - 20], [46, by - 8], [66, by - 46], [56, by - 60], [44, by - 56]], IRON, { line: 3 });
    shape(ctx, [[52, by - 60], [64, by - 66], [96, by - 48], [98, by - 37], [84, by - 33], [62, by - 42]], IRON, { line: 3 });
    shape(ctx, [[56, by - 62], [58, by - 76], [66, by - 64]], IRON_D, { line: 2, sharp: true });
    stroke(ctx, [[62, by - 52], [92, by - 40]], 1.8, IRON_L, .3, .7);
    // dây cương vàng
    stroke(ctx, [[60, by - 58], [70, by - 38], [86, by - 36]], 2, GOLD, .3);
    // mắt rực lửa
    ell(ctx, 72, by - 52, 3.4, 2.6, FIRE_Y, { line: 1.4 });
    // bờm lửa dọc cổ
    for (let i = 0; i < 5; i++)
    {
        const t = i / 4, x = 30 + t * 28, y = by - 22 - t * 36;
        flame(ctx, x, y, -1.0 + Math.sin(tw * 1.3 + i) * .2 - (p.fly ? .4 : 0), 20 + (1 - t) * 10, 5);
    }
    // lửa phun từ mũi
    if (p.snort) flame(ctx, 98, by - 40, 1.75, 30 + p.snort * 14, 6);
    // hai chân phía gần
    leg(ctx, 32, by + 12, L[0][0], L[0][1], false);
    leg(ctx, -26, by + 12, L[2][0], L[2][1], false);

    // Gióng cưỡi trên yên (hông đặt tại yên)
    if (p.rider)
    {
        ctx.save();
        ctx.translate(-6, by - 24 + 44);
        drawGiong(ctx, { ...p.rider, hipX: 0 });
        ctx.restore();
    }
    ctx.restore();
}

// tư thế người cưỡi
const RIDE = { legF: 1.25, kneeF: 1.5, legB: 1.1, kneeB: 1.35, lean: .08 };
const riderArmor = s => ({ ...RIDE, armF: 2.15 + s * .05, elbowF: .2, rod: P * .86, armB: .8, elbowB: -.6, scarf: s * 2, wind: 2, face: 'shout', bob: -s });
const riderFree = s => ({ ...RIDE, noArmor: true, noRod: true, armF: .9, elbowF: -.7, armB: .8, elbowB: -.6, scarf: s * 2, wind: 1, bob: -s * .5 });
const riderFly = s => ({ ...RIDE, noArmor: true, noRod: true, armF: 2.15, elbowF: .3, armB: .9, elbowB: -.5, scarf: s * 2, wind: 3, face: 'shout', lean: -.05 });

// chân: [gần-trước, xa-trước, gần-sau, xa-sau] mỗi chân [góc đùi, độ gập]
const GALLOP = [
    [[.75, -.2], [.55, -.15], [-.65, .25], [-.5, .15]],
    [[-.15, -1.1], [.05, -.9], [.5, .45], [.3, .55]],
    [[.2, -.5], [.35, -1.2], [.1, .9], [-.3, .25]],
    [[.6, -1.4], [.1, -.35], [-.35, .6], [.2, .25]],
];
const STAND = [[.05, 0], [-.05, .02], [-.05, .05], [.05, .03]];
const FLY = [[1.15, -1.7], [.95, -1.5], [-.85, .25], [-.7, .15]];

export function bakeHorse()
{
    return bakeSheet({
        seed: 61, res: 1.6,
        frame: [320, 300], origin: [150, 290],
        draw: drawHorse,
        clips: {
            gallop: { count: 4, time: .09, pose: i => ({ legs: GALLOP[i], bob: [2, -3, 0, -1][i], tail: i, rider: riderArmor(i % 2) }) },
            stand: { count: 2, time: .3, pose: i => ({ legs: STAND, bob: i, tail: i * 2, snort: i, rider: riderArmor(0) }) },
            free: { count: 2, time: .3, pose: i => ({ legs: STAND, bob: i, tail: i * 2, snort: i ? .6 : 0, rider: riderFree(i) }) },
            fly: { count: 2, time: .14, pose: i => ({ legs: FLY, bob: i * 2, tail: i * 3, tilt: -.38, fly: true, rider: riderFly(i) }) },
        },
    });
}
