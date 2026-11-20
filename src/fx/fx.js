// Hiệu ứng: post-process, hitstop/slow-mo, rung camera, particle, vệt chém, số sát thương, vết mực
import {
    EngineObject, PostProcessPlugin, postProcess, postProcessEffects, postProcessChromatic, postProcessGlow, postProcessVignette,
    setTimeScale, Timer, averageFPS, cameraShake, vec2, rgb, hsl, particleEffect, drawPoly, drawText, drawTile, setAdditiveBlendMode,
    rand, randSign, lerp, clamp, WHITE, Color, time,
} from 'littlejsengine';
import { C, FONT } from '../config.js';

// ------------------------------------------------------------- hậu kỳ
function postShader(glow)
{
    return postProcessEffects(
        postProcessChromatic('chroma'),
        ...(glow ? [postProcessGlow(.92, .45, 6)] : []),
        // chớp đỏ khi trúng đòn, chớp trắng khi kết liễu
        'c.rgb += flash * vec3(.9, .18, .1);',
        'c.rgb = mix(c.rgb, vec3(1., .97, .9), white);',
        // giảm bão hoà (thua) + ấm màu giấy
        'float _l = dot(c.rgb, vec3(.299, .587, .114)); c.rgb = mix(c.rgb, vec3(_l) * vec3(1.06, .98, .88), desat);',
        'c.rgb = mix(c.rgb, c.rgb * vec3(1.04, 1., .92), warm);',
        // vân giấy tĩnh phủ toàn khung hình
        'vec2 _q = floor(p / 1.5); float _g = fract(sin(dot(_q, vec2(12.9898, 78.233))) * 43758.5453); c.rgb *= .97 + .045 * _g;',
        postProcessVignette(.55, 2.4),
    );
}

export function initPost()
{
    new PostProcessPlugin(postShader(true));
    Object.assign(postProcess.values, { chroma: 0, flash: 0, white: 0, desat: 0, warm: .6 });
}

// tự hạ chất lượng: máy yếu (FPS thấp kéo dài) thì bỏ glow
const quality = { glow: true, low: 0, check: new Timer(4, true) };
function autoQuality()
{
    if (!quality.glow || !quality.check.elapsed()) return;
    quality.check.set(1);
    quality.low = averageFPS < 45 ? quality.low + 1 : 0;
    if (quality.low >= 4) { quality.glow = false; postProcess.setShaderCode(postShader(false)); }
}

const pv = () => postProcess?.values;
export function flash(amount = .35) { const v = pv(); if (v) v.flash = Math.max(v.flash, amount); }
export function whiteFlash(amount = .8) { const v = pv(); if (v) v.white = Math.max(v.white, amount); }
export function chroma(amount = .012) { const v = pv(); if (v) v.chroma = Math.max(v.chroma, amount); }
export function setDesat(d) { const v = pv(); if (v) v.desat = d; }

// ------------------------------------------------------------- hitstop / slow-mo
// timeScale = 0 vẫn chạy tick "đóng băng" 60 lần/giây (gameUpdatePost vẫn gọi) nên dùng cho hitstop;
// slow-mo dùng tỉ lệ vừa phải để khung hình không bị giật
const stopTimer = new Timer(undefined, true);
let stopScale = 1;
export function hitstop(duration = .06, scale = 0)
{
    if (stopTimer.active() && stopScale < scale) return;
    stopScale = scale;
    setTimeScale(scale);
    stopTimer.set(duration);
}
export const slowmo = (scale, duration) => hitstop(duration, scale);
export function clearTimeFx() { stopTimer.unset(); setTimeScale(1); }

/** Gọi mỗi tick trong gameUpdatePost (chạy cả khi tạm dừng / đóng băng) */
export function fxFrame()
{
    if (stopTimer.isSet() && stopTimer.elapsed()) { stopTimer.unset(); setTimeScale(1); }
    autoQuality();
    const v = pv();
    if (v)
    {
        v.flash *= .86; v.white *= .9; v.chroma *= .88;
        if (v.flash < .003) v.flash = 0;
        if (v.white < .003) v.white = 0;
        if (v.chroma < .0003) v.chroma = 0;
    }
}

export const shake = (amount = .3, dir) => cameraShake(amount, dir);

// ------------------------------------------------------------- particle
const setOrder = (e, order = 30) => { if (e) e.renderOrder = order; return e; };

export function fxSparks(pos, dir = 0, big = false)
{
    setOrder(particleEffect('sparks', pos, { scale: big ? 1.4 : .9, emitTime: .08, hue: .02, emitRate: big ? 260 : 160,
        angle: dir > 0 ? Math.PI / 2 : dir < 0 ? -Math.PI / 2 : 0, emitConeAngle: dir ? .9 : Math.PI, speed: big ? .32 : .22, additive: true }));
}
export function fxHit(pos, hue = .1)
{
    setOrder(particleEffect('hit', pos, { scale: 1.1, hue }));
}
export function fxDust(pos, scale = 1, hue = .08)
{
    setOrder(particleEffect('dust', pos, { scale, hue, saturation: .6 }), 25);
}
export function fxDebris(pos, scale = 1)
{
    setOrder(particleEffect('debris', pos, { scale, hue: .07, saturation: .5 }));
}
export function fxBambooDust(pos, radius)
{
    setOrder(particleEffect('dust', pos, { scale: 2.2, hue: .28, saturation: .7, emitSize: vec2(radius * 2, .5) }), 25);
    setOrder(particleEffect('dust', pos, { scale: 1.6, hue: .08, emitSize: vec2(radius * 2, .5) }), 25);
    setOrder(particleEffect('leaves', pos.add(vec2(0, 3)), { scale: 1.4, emitTime: .25, emitRate: 80, emitSize: vec2(radius * 2, 4), hue: .26 }), 35);
}
export function fxConfetti(pos)
{
    setOrder(particleEffect('confetti', pos, { scale: 2.5 }), 40);
}
export function fxSparkle(pos, scale = 1.5, hue = .12)
{
    return setOrder(particleEffect('sparkle', pos, { scale, hue }), 40);
}
export function fxFire(pos, scale = 1.2)
{
    return setOrder(particleEffect('fire', pos, { scale }), -600);
}
export function fxSmoke(pos, scale = 2)
{
    return setOrder(particleEffect('smoke', pos, { scale, saturation: .3 }), -610);
}
export function fxEmbers(pos, size)
{
    return setOrder(particleEffect('fireflies', pos, { scale: 1, hue: .05, emitSize: size, emitRate: 14 }), 40);
}
export function fxLeaves(pos, size, rate = 3)
{
    return setOrder(particleEffect('leaves', pos, { scale: 1.1, emitSize: size, emitRate: rate, hue: .2 }), 45);
}

// ------------------------------------------------------------- vệt roi / vệt đao
export class SlashFx extends EngineObject
{
    /** center: tâm cung, radius: bán kính, a0/a1: góc bắt đầu/kết thúc (0 = lên, theo chiều kim đồng hồ) */
    constructor(center, radius, a0, a1, color = rgb(1, .93, .65), life = .16, width = .45)
    {
        super(center, vec2(1));
        Object.assign(this, { radius, a0, a1, tint: color, life, width });
        this.renderOrder = 40;
        this.timer = new Timer(life);
    }
    update() { if (this.timer.elapsed()) this.destroy(); }
    render()
    {
        const t = this.timer.getPercent(), n = 18, pts = [];
        const head = clamp(t * 2.2), tail = clamp(t * 2.2 - .7);
        const arc = (k, r) => { const a = lerp(this.a0, this.a1, k); return this.pos.add(vec2(Math.sin(a) * r, Math.cos(a) * r)); };
        for (let i = 0; i <= n; i++) pts.push(arc(lerp(tail, head, i / n), this.radius));
        for (let i = n; i >= 0; i--)
        {
            const k = i / n;
            pts.push(arc(lerp(tail, head, k), this.radius - this.width * Math.sin(k * Math.PI) * (1.2 - t)));
        }
        const c = this.tint.copy(); c.a *= 1 - t * t;
        setAdditiveBlendMode(true);
        drawPoly(pts, c);
        drawPoly(pts.map(p => p.lerp(this.pos, .04)), c.scale(.6, .5));
        setAdditiveBlendMode(false);
    }
}

// ------------------------------------------------------------- vòng sóng xung kích trên mặt đất
export class RingFx extends EngineObject
{
    constructor(pos, radius, color = rgb(.6, 1, .5), life = .45)
    {
        super(pos, vec2(1));
        Object.assign(this, { radius, tint: color, life });
        this.renderOrder = 4;
        this.timer = new Timer(life);
    }
    update() { if (this.timer.elapsed()) this.destroy(); }
    render()
    {
        const t = this.timer.getPercent(), r = this.radius * (.3 + .7 * Math.sqrt(t)), n = 40, pts = [];
        const c = this.tint.copy(); c.a *= (1 - t) * .8;
        for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push(this.pos.add(vec2(Math.cos(a) * r, Math.sin(a) * r * .18))); }
        for (let i = n; i >= 0; i--) { const a = i / n * Math.PI * 2; pts.push(this.pos.add(vec2(Math.cos(a) * r * .86, Math.sin(a) * r * .14))); }
        setAdditiveBlendMode(true); drawPoly(pts, c); setAdditiveBlendMode(false);
    }
}

// ------------------------------------------------------------- số sát thương / chữ bay
export class FloatText extends EngineObject
{
    constructor(pos, text, color = C.giay, size = .8, life = .8)
    {
        super(pos, vec2(1));
        Object.assign(this, { text, tint: color, textSize: size, life });
        this.vel = vec2(rand(-.02, .02), .09);
        this.renderOrder = 60;
        this.timer = new Timer(life);
    }
    update()
    {
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.scale(.9);
        if (this.timer.elapsed()) this.destroy();
    }
    render()
    {
        const t = this.timer.getPercent(), pop = 1 + Math.max(0, .4 - t) * 1.5;
        const c = this.tint.copy(); c.a = 1 - t * t;
        drawText(this.text, this.pos, this.textSize * pop, c, .14, C.muc.copy().setAlpha(c.a), 'center', FONT, 'bold');
    }
}

// ------------------------------------------------------------- vết mực / tia sáng khi trúng
let splatTiles = [], softTile;
export function setFxTiles(splats, soft) { splatTiles = splats; softTile = soft; }

export class SplatFx extends EngineObject
{
    constructor(pos, size = 1.6, color = rgb(1, .95, .7), additive = true)
    {
        super(pos, vec2(size));
        this.tileInfo = splatTiles[(rand(splatTiles.length)) | 0];
        this.angle = rand(6.28);
        this.tint = color; this.additive = additive;
        this.renderOrder = 38;
        this.timer = new Timer(.18);
    }
    update() { if (this.timer.elapsed()) this.destroy(); }
    render()
    {
        const t = this.timer.getPercent(), c = this.tint.copy(); c.a *= 1 - t;
        this.additive && setAdditiveBlendMode(true);
        drawTile(this.pos, this.size.scale(.6 + t * .7), this.tileInfo, c, this.angle);
        softTile && drawTile(this.pos, this.size.scale(1.6), softTile, c.scale(.5, .6));
        this.additive && setAdditiveBlendMode(false);
    }
}

/** Bóng đổ mềm dưới chân */
export function drawShadow(pos, w, alpha = .35)
{
    if (!softTile) return;
    drawTile(pos.add(vec2(0, .05)), vec2(w, w * .22), softTile, new Color(.12, .08, .06, alpha));
}

export { softTile };
export const getSoftTile = () => softTile;
