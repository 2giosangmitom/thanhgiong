// HUD trong trận (vẽ tay bằng Canvas2D, không bị LightSystem làm tối) + banner + chuyển cảnh vệt mực
import { timeReal, lerp, clamp, tweenProperty, Ease, rand } from 'littlejsengine';
import { PAL, CFG, FONT } from '../config.js';
import { game, world } from '../state.js';
import { withUI, text, brushBand, roughRect, heart } from './draw2d.js';

const hud = {
    rage: 0, bossHP: CFG.bossHP, bossLag: CFG.bossHP, lastHP: CFG.playerHP, heartPop: [], killsPop: 0, lastKills: 0,
    showBoss: 0, visible: true,
};

export function resetHud()
{
    hud.rage = game.rage; hud.bossHP = hud.bossLag = CFG.bossHP; hud.lastHP = game.hp; hud.heartPop = [];
    hud.lastKills = game.kills; hud.killsPop = 0; hud.showBoss = 0;
}
export const showBossBar = () => tweenProperty(hud, 'showBoss', 0, 1, .6, { ease: Ease.OUT(Ease.BACK), useRealTime: true });

export function drawHud()
{
    if (!['PLAYING', 'PAUSED', 'LEVEL_CLEAR', 'GAME_OVER', 'CUTSCENE'].includes(game.state) || !world.player) return;
    const t = timeReal;
    // nội suy giá trị hiển thị
    hud.rage = lerp(hud.rage, game.rage, .18);
    if (game.hp < hud.lastHP) for (let i = game.hp; i < hud.lastHP; i++) hud.heartPop[i] = t;
    hud.lastHP = game.hp;
    if (game.kills !== hud.lastKills) { hud.killsPop = t; hud.lastKills = game.kills; }
    hud.bossHP = lerp(hud.bossHP, game.bossHP, .25);
    hud.bossLag = hud.bossLag > hud.bossHP ? hud.bossLag - .04 : hud.bossHP;

    withUI((ctx, W) =>
    {
        // ---- máu (trái tim)
        brushBand(ctx, 14, 16, 232, 86, 'rgba(241,225,190,.82)', 3);
        for (let i = 0; i < CFG.playerHP; i++)
        {
            const pop = hud.heartPop[i] ? clamp(1 - (t - hud.heartPop[i]) / .5) : 0;
            const x = 40 + i * 38 + (pop ? Math.sin(t * 60) * 3 * pop : 0), y = 40;
            const full = i < game.hp;
            heart(ctx, x, y, 15 * (1 + pop * .5), full ? PAL.son : 'rgba(53,44,42,.15)');
        }
        // ---- Nộ Khí
        const bx = 26, by = 64, bw = 206, bh = 20, full = game.rage >= CFG.rageMax;
        roughRect(ctx, bx, by, bw, bh, 'rgba(53,44,42,.55)', PAL.muc, 3, 2);
        const fw = bw * clamp(hud.rage / CFG.rageMax);
        if (fw > 1)
        {
            const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
            g.addColorStop(0, '#3E6B3A'); g.addColorStop(1, full ? '#A7E07A' : '#6FA25E');
            ctx.save();
            if (full) { ctx.shadowColor = 'rgba(160,255,120,.9)'; ctx.shadowBlur = 12 + Math.sin(t * 8) * 6; }
            ctx.fillStyle = g; ctx.fillRect(bx + 2, by + 2, fw - 4, bh - 4);
            ctx.restore();
            // đốt tre trên thanh
            ctx.strokeStyle = 'rgba(30,50,25,.6)'; ctx.lineWidth = 1.5;
            for (let x = bx + 34; x < bx + fw - 4; x += 34) { ctx.beginPath(); ctx.moveTo(x, by + 3); ctx.lineTo(x, by + bh - 3); ctx.stroke(); }
        }
        text(ctx, `NỘ KHÍ ${Math.round(game.rage)}/${CFG.rageMax}`, bx + bw / 2, by + bh / 2 + 1, 12, full ? '#F4FFE8' : PAL.giay, { line: 3 });

        // ---- số giặc đã hạ (màn 1)
        if (game.level === 1)
        {
            const pop = clamp(1 - (t - hud.killsPop) / .35);
            brushBand(ctx, W - 214, 18, 196, 46, 'rgba(53,44,42,.78)', 9);
            text(ctx, `Đã hạ: ${game.kills}/${CFG.killsNeeded}`, W - 116, 42, 22 * (1 + pop * .35), pop > .5 ? '#FFE9A8' : PAL.giay, { line: 4 });
        }

        // ---- thanh máu boss (màn 2)
        if (game.level === 2 && hud.showBoss > .01)
        {
            const s = hud.showBoss, cw = 440, cx = W / 2 - cw / 2, cy = 26 - (1 - s) * 80;
            text(ctx, 'THIẾT GIÁP TƯỚNG', W / 2, cy, 20, '#F2D7C8', { line: 4 });
            roughRect(ctx, cx, cy + 14, cw, 20, 'rgba(30,20,20,.75)', PAL.muc, 3, 4);
            const k = clamp(hud.bossHP / CFG.bossHP), lag = clamp(hud.bossLag / CFG.bossHP);
            ctx.fillStyle = '#F1E1BE'; ctx.fillRect(cx + 2, cy + 16, (cw - 4) * lag, 16);
            const g = ctx.createLinearGradient(0, cy + 16, 0, cy + 32);
            g.addColorStop(0, '#E0644C'); g.addColorStop(1, '#8E2A22');
            ctx.fillStyle = g; ctx.fillRect(cx + 2, cy + 16, (cw - 4) * k, 16);
            // vạch giai đoạn 2
            const px = cx + cw * CFG.bossPhase2HP / CFG.bossHP;
            ctx.strokeStyle = PAL.muc; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, cy + 12); ctx.lineTo(px, cy + 36); ctx.stroke();
        }

        // ---- nhắc dùng Tre Thần
        if (full && game.state === 'PLAYING')
        {
            const a = .65 + .35 * Math.sin(t * 7), s = 1 + .04 * Math.sin(t * 7);
            brushBand(ctx, W / 2 - 130, 482, 260, 40, `rgba(62,107,58,${.75 * a})`, 12);
            text(ctx, 'E — TRE THẦN!', W / 2, 503, 24 * s, '#F4FFE8', { line: 4, alpha: a + .2 });
        }
    });
}

// ------------------------------------------------------------ banner
const banners = [];
/** kind: 'level' | 'boss' | 'big' */
export function showBanner(title, sub = '', kind = 'level', duration = 2.2)
{
    const b = { title, sub, kind, k: 0, start: timeReal, duration };
    banners.push(b);
    tweenProperty(b, 'k', 0, 1, .45, { ease: Ease.OUT(Ease.BACK), useRealTime: true });
    return b;
}
export function clearBanners() { banners.length = 0; }

export function drawBanners()
{
    if (!banners.length) return;
    const t = timeReal;
    withUI((ctx, W) =>
    {
        for (let i = banners.length; i--;)
        {
            const b = banners[i], age = t - b.start;
            if (age > b.duration) { banners.splice(i, 1); continue; }
            const out = clamp((age - (b.duration - .35)) / .35), a = 1 - out, k = b.k;
            if (b.kind === 'boss')
            {
                const y = 230;
                brushBand(ctx, W / 2 - 360 * k, y - 50, 720 * k, 110, `rgba(26,16,16,${.85 * a})`, 21);
                text(ctx, b.title, W / 2 + (1 - k) * 120, y - 4, 58, '#E9573F', { line: 7, alpha: a });
                text(ctx, b.sub, W / 2 - (1 - k) * 120, y + 42, 20, PAL.giay, { line: 4, alpha: a });
            }
            else if (b.kind === 'big')
            {
                const y = 200;
                brushBand(ctx, W / 2 - 420 * k, y - 56, 840 * k, 120, `rgba(53,44,42,${.85 * a})`, 31);
                text(ctx, b.title, W / 2, y + 2, 50 * (.8 + .2 * k), '#FFE9A8', { line: 7, alpha: a, maxWidth: 780 });
                b.sub && text(ctx, b.sub, W / 2, y + 46, 20, PAL.giay, { line: 4, alpha: a });
            }
            else
            {
                const y = 150;
                brushBand(ctx, W / 2 - 330 * k, y - 38, 660 * k, 82, `rgba(185,75,59,${.88 * a})`, 41);
                text(ctx, b.title, W / 2, y - 4, 34, PAL.giay, { line: 6, alpha: a * k, maxWidth: 620 });
                b.sub && text(ctx, b.sub, W / 2, y + 28, 17, '#FFE9C8', { line: 4, alpha: a * k });
            }
        }
    });
}

// ------------------------------------------------------------ chuyển cảnh vệt mực
const wipe = { v: 0, busy: false, edge: [...Array(30)].map(() => rand(-40, 40)) };
export function transition(fn, onDone)
{
    if (wipe.busy) return;
    wipe.busy = true;
    tweenProperty(wipe, 'v', 0, 1, .38, { ease: Ease.IN(Ease.POWER(2)), useRealTime: true }).then(() =>
    {
        fn();
        tweenProperty(wipe, 'v', 1, 2, .5, { ease: Ease.OUT(Ease.POWER(2)), useRealTime: true }).then(() => { wipe.busy = false; wipe.v = 0; onDone?.(); });
    });
}
export const isTransitioning = () => wipe.busy;

export function drawWipe()
{
    if (wipe.v <= 0) return;
    withUI((ctx, W, H) =>
    {
        const v = wipe.v, x0 = v <= 1 ? -60 : (v - 1) * (W + 180) - 60, x1 = v <= 1 ? v * (W + 180) - 60 : W + 120;
        ctx.save();
        ctx.fillStyle = '#231B19';
        ctx.beginPath();
        const n = wipe.edge.length;
        ctx.moveTo(x0, -10);
        for (let i = 0; i <= n; i++) ctx.lineTo(x1 + wipe.edge[i % n], i / n * (H + 20) - 10);
        for (let i = n; i >= 0; i--) ctx.lineTo(x0 + (v > 1 ? wipe.edge[(i + 7) % n] : -100), i / n * (H + 20) - 10);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    });
}
