// Lính giặc (quân xâm lược hư cấu): giáp tối, mặt che khăn, giáo ngắn, khiên có ấn hiệu móng vuốt
import { shape, ell, stroke, limb, seg, INK } from './ink.js';
import { bakeSheet } from './sheet.js';

const ARMOR = '#3E4654', ARMOR_L = '#5B6575', CLOTH = '#7A6A55', CLOTH_D = '#5F523F';
const PANTS = '#2B2B30', BOOT = '#1E1B1B', SKIN = '#D9A57A';
const SHAFT = '#6B4A2E', TIP = '#9AA0A4';
const FLAG_DARK = '#2E2433', FLAG_GOLD = '#B08A3E';
const P = Math.PI;

/** Ấn hiệu quân xâm lược (hư cấu): ba vết móng vuốt */
export function clawEmblem(ctx, x, y, r, color = FLAG_DARK)
{
    for (let k = -1; k <= 1; k++)
    {
        shape(ctx, [[x + k * r * .45 - r * .15, y - r * .8], [x + k * r * .45 + r * .18, y - r * .6], [x + k * r * .45 + r * .05, y + r * .75], [x + k * r * .45 - r * .1, y + r * .5]],
            color, { line: 0, jitter: .3 });
    }
}

function drawSpear(ctx, x, y, a, len = 78)
{
    const [bx, by] = seg(x, y, a, -26), [ex, ey] = seg(x, y, a, len - 26);
    limb(ctx, bx, by, ex, ey, 4.5, SHAFT, 2.2);
    const [tx, ty] = seg(ex, ey, a, 16), nx = Math.cos(a) * 5, ny = -Math.sin(a) * 5;
    shape(ctx, [[ex - nx, ey - ny], [tx, ty], [ex + nx, ey + ny], [ex - Math.sin(a) * 3, ey - Math.cos(a) * 3]], TIP, { line: 2.2, sharp: true });
    // tua đen
    const [qx, qy] = seg(ex, ey, a, -2);
    shape(ctx, [[qx, qy], [qx - 6, qy + 8], [qx - 1, qy + 12], [qx + 4, qy + 7]], '#1E1B1B', { line: 1.6 });
}

function drawShield(ctx, x, y, r)
{
    ell(ctx, x, y, r, r * 1.05, '#8A7D62', { line: 3 });
    ell(ctx, x, y, r * .78, r * .82, FLAG_GOLD, { line: 1.8 });
    clawEmblem(ctx, x, y, r * .6);
    // đinh tán
    for (let i = 0; i < 6; i++)
    {
        const a = i / 6 * P * 2;
        ell(ctx, x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9, 1.4, 1.4, '#3B3B3B', { line: 0 });
    }
}

function drawHelmet(ctx, x, y)
{
    // chùm lông đen trên đỉnh
    shape(ctx, [[x - 2, y - 24], [x - 14, y - 34], [x - 20, y - 26], [x - 10, y - 21]], '#1E1B1B', { line: 2 });
    // mũ trụ nhọn
    shape(ctx, [[x - 17, y - 2], [x - 13, y - 14], [x - 1, y - 25], [x + 12, y - 14], [x + 17, y - 2], [x + 20, y + 1], [x - 20, y + 1]], ARMOR, { line: 3 });
    stroke(ctx, [[x - 12, y - 6], [x - 1, y - 21]], 1.6, ARMOR_L, .4);
    // vành mũ
    shape(ctx, [[x - 21, y - 2], [x + 21, y - 3], [x + 19, y + 3], [x - 19, y + 3]], '#2B3038', { line: 2.4 });
}

export function drawSoldier(ctx, p)
{
    const bob = p.bob || 0, lean = p.lean || 0;
    const hip = [0, -40 + bob];
    const neck = seg(hip[0], hip[1], P - lean, 31);
    const head = [neck[0] + 2 + Math.sin(lean) * 8, neck[1] - 15];
    const sF = [neck[0] + 2, neck[1] + 5], sB = [neck[0] - 3, neck[1] + 5];

    // tay sau cầm khiên
    const [ebx, eby] = seg(sB[0], sB[1], p.armB ?? .6, 13);
    const [hbx, hby] = seg(ebx, eby, (p.armB ?? .6) + (p.elbowB ?? -.8), 12);
    limb(ctx, sB[0], sB[1], ebx, eby, 8.5, CLOTH_D, 2.4);
    limb(ctx, ebx, eby, hbx, hby, 7, '#B78A66', 2.4);

    // chân
    const leg = (a, knee, pants) =>
    {
        const [kx, ky] = seg(hip[0], hip[1], a, 19), [fx, fy] = seg(kx, ky, a - knee, 19);
        limb(ctx, hip[0], hip[1], kx, ky, 10, pants, 2.5);
        limb(ctx, kx, ky, fx, fy, 9, BOOT, 2.5);
        ell(ctx, fx + 4, fy, 7.5, 3.6, BOOT, { line: 2.2 });
    };
    leg(p.legB ?? -.1, p.kneeB ?? .1, '#232327');
    leg(p.legF ?? .1, p.kneeF ?? .1, PANTS);

    // vạt áo
    const [hx, hy] = hip, [nx, ny] = neck;
    shape(ctx, [[hx - 13, hy - 3], [hx + 13, hy - 3], [hx + 16, hy + 13], [hx - 15, hy + 13]], CLOTH, { line: 2.8 });
    // giáp phiến
    shape(ctx, [[hx - 13, hy + 1], [hx + 13, hy + 1], [nx + 14, ny + 12], [nx + 10, ny - 1], [nx - 10, ny - 1], [nx - 14, ny + 12]], ARMOR, { line: 3 });
    for (let r = 0; r < 4; r++)
    {
        const yy = ny + 6 + r * 6.5;
        stroke(ctx, [[nx - 12 + r * .3, yy], [nx + 12, yy - .5]], 1.4, '#232830', .4);
        for (let c = -2; c <= 2; c++) stroke(ctx, [[nx + c * 5 + (r % 2) * 2.5, yy], [nx + c * 5 + (r % 2) * 2.5, yy + 6]], 1, '#2A2F38', .2, .7);
    }
    stroke(ctx, [[nx - 9, ny + 4], [nx - 6, hy - 4]], 1.6, ARMOR_L, .5, .6);
    // đai
    shape(ctx, [[hx - 14, hy - 3], [hx + 14, hy - 3], [hx + 14, hy + 2], [hx - 14, hy + 2]], FLAG_GOLD, { line: 2, sharp: true });

    // khiên nhỏ (ở phía sau thân)
    if (!p.noShield) drawShield(ctx, hbx - 2, hby - 4, 13);

    // đầu: mặt che khăn xám, chỉ lộ đôi mắt
    const [x, y] = head;
    ell(ctx, x, y + 1, 14, 14.5, SKIN, { line: 3 });
    shape(ctx, [[x - 14, y + 1], [x + 15, y + 1], [x + 13, y + 12], [x + 2, y + 16], [x - 11, y + 12]], '#6F6A66', { line: 2.4 });
    stroke(ctx, [[x - 6, y + 6], [x + 11, y + 5]], 1.2, INK, .4, .5);
    if (p.face === 'hurt')
    {
        stroke(ctx, [[x + 5, y - 4], [x + 9, y - 2], [x + 5, y]], 2);
    }
    else
    {
        ell(ctx, x + 8, y - 2, 2, 2.2, INK, { line: 0 });
        stroke(ctx, [[x + 3, y - 7], [x + 12, y - 4]], 2.4);
    }
    drawHelmet(ctx, x, y - 8);

    // tay trước + giáo
    const [ex, ey] = seg(sF[0], sF[1], p.armF ?? .9, 13);
    const [hx2, hy2] = seg(ex, ey, (p.armF ?? .9) + (p.elbowF ?? .3), 12);
    if (!p.noSpear) drawSpear(ctx, hx2, hy2, p.spear ?? 1.75);
    limb(ctx, sF[0], sF[1], ex, ey, 9, CLOTH, 2.4);
    limb(ctx, ex, ey, hx2, hy2, 7.5, SKIN, 2.4);
    ell(ctx, hx2, hy2, 4.5, 4.5, '#3B3B3B', { line: 2.2 });
}

export function bakeSoldier()
{
    return bakeSheet({
        seed: 23, res: 2,
        frame: [200, 160], origin: [100, 150],
        draw: (ctx, p, name) =>
        {
            if (name === 'parts')
            {
                // mảnh văng ra khi bị hạ
                // vẽ ở tâm frame (gốc chân ở y=150, tâm ở y=80) để xoay quanh chính nó
                if (p.part === 0) drawHelmet(ctx, 0, -62);
                if (p.part === 1) drawShield(ctx, 0, -70, 13);
                if (p.part === 2) drawSpear(ctx, -4, -70, P / 2, 50);
                return;
            }
            drawSoldier(ctx, p);
        },
        clips: {
            walk: {
                count: 6, time: .1, pose: (i, n) =>
                {
                    const t = i / n * P * 2, s = Math.sin(t), c = Math.cos(t);
                    return { bob: -Math.abs(s) * 2 + 1, legF: s * .5, kneeF: Math.max(0, -c) * .7 + .05, legB: -s * .5, kneeB: Math.max(0, c) * .7 + .05,
                        armF: .9 + s * .08, elbowF: .3, spear: 1.72 + s * .05, armB: .55 - s * .1, lean: .12 };
                },
            },
            thrust: { count: 1, pose: () => ({ armF: 1.45, elbowF: .1, spear: 1.6, lean: .22, legF: .5, kneeF: .3, legB: -.45, kneeB: .1, bob: 1 }) },
            hurt: { count: 1, pose: () => ({ lean: -.35, armF: .2, elbowF: -.4, spear: 2.4, armB: -.3, legF: .35, kneeF: .3, legB: -.2, kneeB: .2, face: 'hurt' }) },
            die: { count: 1, pose: () => ({ lean: -.6, armF: -1.2, elbowF: -.2, spear: -1.1, armB: -1.8, legF: .7, kneeF: .5, legB: .4, kneeB: .6, face: 'hurt', noShield: true, noSpear: true, bob: -2 }) },
            flee: {
                count: 4, time: .08, pose: (i, n) =>
                {
                    const t = i / n * P * 2, s = Math.sin(t);
                    return { bob: -Math.abs(s) * 3, legF: s * .7, kneeF: .6, legB: -s * .7, kneeB: .6, armF: -1.8 + s * .4, elbowF: -.5, armB: 2 - s * .4, lean: .3, noSpear: true, noShield: true, face: 'hurt' };
                },
            },
            parts: { count: 3, pose: i => ({ part: i }) },
        },
    });
}
