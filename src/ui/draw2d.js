// Tiện ích vẽ Canvas2D trên màn hình theo toạ độ thiết kế 960×540
import { mainContext, mainCanvasSize, RandomGenerator } from 'littlejsengine';
import { PAL, FONT } from '../config.js';

/** Vẽ trong hệ toạ độ thiết kế (tự scale theo kích thước canvas) */
export function withUI(fn)
{
    const ctx = mainContext, S = mainCanvasSize.y / 540;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const ratio = ctx.canvas.height / mainCanvasSize.y || 1;
    ctx.scale(S * ratio, S * ratio);
    const W = mainCanvasSize.x / S;
    fn(ctx, W, 540);
    ctx.restore();
}

/** Chữ có viền mực */
export function text(ctx, str, x, y, size, color = PAL.giay, opts = {})
{
    const { align = 'center', line = size * .16, ink = PAL.muc, weight = 'bold', font = FONT, baseline = 'middle', shadow = true, alpha = 1, maxWidth } = opts;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align; ctx.textBaseline = baseline;
    ctx.lineJoin = 'round';
    if (shadow) { ctx.fillStyle = 'rgba(30,20,15,.45)'; ctx.fillText(str, x + size * .05, y + size * .08, maxWidth); }
    if (line > 0) { ctx.strokeStyle = ink; ctx.lineWidth = line; ctx.strokeText(str, x, y, maxWidth); }
    ctx.fillStyle = color; ctx.fillText(str, x, y, maxWidth);
    ctx.restore();
}

const R = new RandomGenerator(5);
/** Nét cọ (dải mực) có mép xơ, ổn định theo seed */
export function brushBand(ctx, x, y, w, h, color, seed = 1, alpha = 1)
{
    R.seed = seed * 131 + 7;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    const n = 24;
    ctx.moveTo(x, y + h * .5);
    for (let i = 0; i <= n; i++) ctx.lineTo(x + w * i / n, y + R.float(-h * .08, h * .1));
    ctx.lineTo(x + w + R.float(4, 14), y + h * .5);
    for (let i = n; i >= 0; i--) ctx.lineTo(x + w * i / n, y + h + R.float(-h * .1, h * .08));
    ctx.closePath(); ctx.fill();
    // sợi cọ khô
    ctx.globalAlpha = alpha * .5;
    for (let i = 0; i < 10; i++)
    {
        const yy = y + R.float(h), xx = x + w + R.float(-10, 30);
        ctx.fillRect(xx, yy, R.float(10, 40), 1.5);
    }
    ctx.restore();
}

/** Khung chữ nhật run tay */
export function roughRect(ctx, x, y, w, h, fill, stroke = PAL.muc, line = 3, seed = 1)
{
    R.seed = seed * 17 + 3;
    const j = () => R.float(-1.2, 1.2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + j(), y + j()); ctx.lineTo(x + w + j(), y + j()); ctx.lineTo(x + w + j(), y + h + j()); ctx.lineTo(x + j(), y + h + j()); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
}

/** Trái tim vẽ tay */
export function heart(ctx, x, y, s, fill, stroke = PAL.muc)
{
    ctx.save();
    ctx.translate(x, y); ctx.scale(s / 16, s / 16);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-14, -3, -9, -15, 0, -7);
    ctx.bezierCurveTo(9, -15, 14, -3, 0, 6);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = 2.6; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke();
    if (fill) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-5, -6, 2.5, 1.6, -.6, 0, 7); ctx.fill(); }
    ctx.restore();
}
