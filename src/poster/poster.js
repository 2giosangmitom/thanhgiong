// Poster 16:9 (3840×2160) vẽ bằng chính bộ bút mực Canvas2D và nhân vật của game.
// Mở /poster.html khi chạy `npm run dev`, nhấn nút "Tải PNG" để lưu.
import { PAL } from '../config.js';
import { seed, rnd, jit, shape, ell, stroke, grain, drumSun, INK } from '../art/ink.js';
import { gradient, hills, sun, cloud, bird, rock, bambooClump, enemyFlag } from '../art/backgrounds.js';
import { drawGiong } from '../art/giong.js';
import { drawBoss } from '../art/boss.js';
import { drawSoldier } from '../art/soldier.js';
import { drawHorse, GALLOP, riderArmor } from '../art/horse.js';
import { drawBamboo, drawSeal } from '../art/props.js';
import { text, brushBand } from '../ui/draw2d.js';

const W = 1920, H = 1080, SCALE = 2;   // thiết kế 1920×1080, xuất 3840×2160
const canvas = document.getElementById('poster');
canvas.width = W * SCALE; canvas.height = H * SCALE;
const ctx = canvas.getContext('2d');

/** Vẽ nhân vật ở vị trí chân (x, y) với tỉ lệ s, có thể lật */
function figure(x, y, s, mirror, fn)
{
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(mirror ? -s : s, s);
    fn(ctx);
    ctx.restore();
}

/** Quầng sáng tròn */
function glow(x, y, r, color)
{
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

async function render()
{
    await document.fonts.ready;
    ctx.save();
    ctx.scale(SCALE, SCALE);
    seed(2024);

    // ------------------------------------------------ trời hoàng hôn + mặt trời trống đồng
    gradient(ctx, W, H, [[0, '#2A1530'], [.3, '#6E2A3A'], [.55, '#C0503A'], [.75, '#EE9E52'], [1, '#F6C77E']]);
    glow(1180, 600, 700, 'rgba(255,190,110,.55)');
    sun(ctx, 1180, 600, 210, '#F6B65A', 'rgba(255,170,90,.6)');
    drumSun(ctx, 1180, 600, 470, 'rgba(120,30,25,.55)', .55, 14);
    for (let i = 0; i < 8; i++)
    {
        const y = rnd(80, 520), x = rnd(W), w = rnd(200, 460);
        shape(ctx, [[x - w / 2, y], [x - w / 4, y - 8], [x + w / 3, y - 7], [x + w / 2, y + 3], [x, y + 7]], 'rgba(120,40,50,.45)', { line: 1.6, ink: 'rgba(53,44,42,.4)' });
    }
    for (let i = 0; i < 9; i++) bird(ctx, 1450 + i * 38 + jit(10), 260 + Math.sin(i) * 22, 1.6);

    // ------------------------------------------------ núi Sóc Sơn nhiều lớp
    ctx.save(); ctx.translate(0, 360);
    hills(ctx, W, 720, 380, 120, [[2, .55], [3, .35], [7, .2], [13, .08]], '#8E6E86', .4, 3);
    hills(ctx, W, 720, 470, 110, [[1, .5], [3, .4], [5, .25], [11, .1]], '#5B5E72', 2.1, 3.5);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#F2B870'; ctx.fillRect(0, 800, W, 120); ctx.restore();

    // cờ giặc rách, đá, bụi tre ở trung cảnh
    for (let i = 0; i < 4; i++) rock(ctx, 260 + i * 470 + jit(60), 930, rnd(180, 300), rnd(90, 170), i % 2 ? '#6E6A66' : '#7A746C');
    for (const [x, h] of [[120, 260], [1010, 220], [1760, 280]]) enemyFlag(ctx, x, 930, h, true, x);
    for (let k = 0; k < 5; k++) bambooClump(ctx, 80 + k * 440 + rnd(60), 940, 4, 300, k % 2 ? '#3F5E3B' : '#4A6B44');

    // ------------------------------------------------ quân giặc bỏ chạy (xa, tối)
    ctx.save(); ctx.globalAlpha = .9;
    for (let i = 0; i < 5; i++)
    {
        const t = i / 4;
        figure(1060 + i * 66, 945 - (i % 2) * 6, 1.25 - t * .15, false, c => drawSoldier(c, { bob: -3 * (i % 2), legF: (i % 2 ? .7 : -.7), kneeF: .6, legB: (i % 2 ? -.7 : .7), kneeB: .6, armF: -1.8, elbowF: -.5, armB: 2, lean: .3, noSpear: true, noShield: true, face: 'hurt' }));
    }
    ctx.restore();

    // ------------------------------------------------ Thiết Giáp Tướng (phải, gồng đao)
    glow(1470, 640, 420, 'rgba(255,60,30,.45)');
    figure(1500, 1010, 2.75, true, c => drawBoss(c, {
        lean: -.16, armF: -2.05, elbowF: -.3, glaive: -2.2, armB: .6, elbowB: .5, legF: .32, kneeF: .2, legB: -.3, kneeB: .15,
        cape: 1.4, glaiveBehind: true, glint: true, eyes: '#FF3A20', bob: 2,
    }));
    // mắt đỏ rực
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(1500 - 18 * 2.75, 1010 - 154 * 2.75, 55, 'rgba(255,60,30,.9)');
    ctx.restore();

    // ------------------------------------------------ Gióng cưỡi ngựa sắt (trái), hào quang + tre thần
    glow(640, 640, 520, 'rgba(255,215,140,.55)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(640, 980, 380, 'rgba(120,255,110,.25)');
    ctx.restore();
    // tre thần mọc phía sau
    for (let i = 0; i < 9; i++)
    {
        const x = 300 + i * 80 + jit(20), h = 260 + Math.sin(i * 1.7) * 90 + rnd(60);
        ctx.save(); ctx.translate(x, 1010);
        drawBamboo(ctx, h, 15, i % 2 ? '#5E8A55' : PAL.tre, true, jit(.1));
        shape(ctx, [[-8, -h + 2], [0, -h - 30], [8, -h + 2]], '#7FB06A', { line: 2.6, sharp: true });
        ctx.restore();
    }
    figure(650, 1010, 3.2, false, c => drawHorse(c, { legs: GALLOP[0], bob: 2, tail: 1.2, snort: 1, rider: { ...riderArmor(0), glow: true } }));
    // tia lửa, vệt roi
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,235,160,.8)'; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++)
    {
        ctx.lineWidth = 14 - i * 2.5;
        ctx.beginPath(); ctx.arc(780, 420, 260 + i * 16, -2.2, -.9); ctx.stroke();
    }
    ctx.restore();
    // tre thần mọc phía trước
    for (let i = 0; i < 6; i++)
    {
        const x = 260 + i * 150 + jit(30), h = 150 + rnd(90);
        ctx.save(); ctx.translate(x, 1050);
        drawBamboo(ctx, h, 17, '#557B50', true, jit(.12));
        shape(ctx, [[-9, -h + 2], [0, -h - 34], [9, -h + 2]], '#8FC07A', { line: 2.6, sharp: true });
        ctx.restore();
    }

    // ------------------------------------------------ mặt đất + tiền cảnh
    shape(ctx, [[-20, 1000], [W * .3, 990], [W * .6, 1004], [W + 20, 992], [W + 20, H + 20], [-20, H + 20]], '#5A4232', { line: 4 });
    for (let i = 0; i < 260; i++)
    {
        const x = rnd(W), hh = rnd(14, 40);
        stroke(ctx, [[x, 1000], [x + jit(6), 1000 - hh * .6], [x + jit(9), 1000 - hh]], 2.6, i % 2 ? '#3F5A34' : '#2F4528', .4, .9);
    }
    // tàn lửa, lá tre bay
    for (let i = 0; i < 140; i++)
    {
        const x = rnd(W), y = rnd(H), r = rnd(1.5, 4.5);
        ctx.fillStyle = i % 3 ? `rgba(255,${160 + rnd(80) | 0},80,${rnd(.4, .9)})` : `rgba(120,180,90,${rnd(.4, .8)})`;
        ctx.beginPath(); ctx.ellipse(x, y, r * (i % 3 ? 1 : 2.4), r, rnd(3), 0, 7); ctx.fill();
    }

    // ------------------------------------------------ tiêu đề
    ctx.save();
    ctx.translate(W / 2, 190);
    brushBand(ctx, -620, -120, 1240, 200, 'rgba(36,26,24,.92)', 177);
    text(ctx, 'THÁNH GIÓNG', 0, -20, 150, '#F3D9A4', { line: 16 });
    brushBand(ctx, -330, 92, 660, 84, 'rgba(185,75,59,.97)', 178);
    text(ctx, 'METAL RISING', 0, 136, 62, PAL.giay, { line: 9 });
    drawSeal(ctx, 560, 90, 54, 'GIÓNG');
    ctx.restore();

    // khẩu hiệu + dòng phụ
    brushBand(ctx, W / 2 - 520, 948, 1040, 62, 'rgba(36,26,24,.88)', 179);
    text(ctx, '“Cầm roi sắt, gọi tre thần — cùng Thánh Gióng bảo vệ Phù Đổng!”', W / 2, 980, 34, '#FFE9A8', { line: 5, weight: 'italic bold' });
    text(ctx, 'Game hành động 2D · Dân gian Remix', W / 2, 1034, 24, PAL.giay, { line: 4, weight: 'bold' });

    // ------------------------------------------------ vân giấy, viền, vignette
    grain(ctx, 0, 0, W, H, .5, 1.5);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,8,.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.strokeStyle = PAL.vang; ctx.lineWidth = 2.5; ctx.strokeRect(28, 28, W - 56, H - 56);
    for (const [x, y] of [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]]) drumSun(ctx, x, y, 34, PAL.vang, .9, 12);
    ctx.restore();

    window.posterReady = true;
}

render();

// nút tải PNG
const btn = document.createElement('button');
btn.textContent = 'Tải PNG';
btn.style.cssText = 'position:fixed;top:12px;right:12px;padding:10px 18px;font:bold 16px serif;z-index:9';
btn.onclick = () => { const a = document.createElement('a'); a.download = 'thanh-giong-poster.png'; a.href = canvas.toDataURL('image/png'); a.click(); };
document.body.appendChild(btn);
