// Mini game: giúp Gióng ăn mau lớn — bấm SPACE càng nhanh, ăn càng nhiều tô cơm trong 10 giây
import {
    EngineObject, vec2, rgb, time, timeReal, Timer, FollowCamera, lightSystem, uiSystem, keyWasPressed, tweenProperty, Ease,
    drawTile, clamp, lerp, rand, randInt, particleEffect,
} from 'littlejsengine';
import { CAM_Y, PAL, C } from '../config.js';
import { game, world, assets } from '../state.js';
import { buildLevel1Layers } from '../art/backgrounds.js';
import { frameTile } from '../art/sheet.js';
import { SpriteProp } from '../entities/Prop.js';
import { playMusic } from '../audio/music.js';
import { play } from '../audio/sfx.js';
import { fxSparkle, fxDust, fxEmbers, fxLeaves, fxConfetti, whiteFlash, shake, chroma, FloatText } from '../fx/fx.js';
import { withUI, text, brushBand, roughRect } from '../ui/draw2d.js';
import { showBanner, clearBanners } from '../ui/hud.js';
import { goLevel } from './flow.js';

const DURATION = 10;          // giây
const PRESS_PER_BOWL = 4;     // số lần bấm để ăn hết một tô
const RAGE_PER_BOWL = 5;      // mỗi tô cơm = +5 Nộ Khí khởi đầu (tối đa 100)

/** Chồng tô cơm đã ăn hết bên cạnh Gióng */
class BowlStack extends EngineObject
{
    constructor(x)
    {
        super(vec2(x, 0), vec2(1));
        this.count = 0;
        this.renderOrder = 9;
        this.pop = [];
    }
    render()
    {
        const f = assets.feast, s = f.bowlSize.scale(.62);
        for (let i = 0; i < this.count; i++)
        {
            const col = (i / 8) | 0, row = i % 8;
            const age = time - (this.pop[i] || 0), k = clamp(age / .15);
            const p = vec2(this.pos.x + col * 1.05 + (row % 2) * .04, .32 + row * .42 + (1 - k) * .8);
            drawTile(p, s, f.bowlEmpty);
        }
    }
}

/** Đạo cụ tĩnh (chiếu, nồi cơm) */
class Still extends EngineObject
{
    constructor(pos, size, tileInfo, order) { super(pos, size); this.tileInfo = tileInfo; this.renderOrder = order; }
}

export class FeastScene
{
    enter()
    {
        game.state = 'FEAST';
        world.scene = this;
        world.enemies = []; world.player = undefined; world.boss = undefined;
        uiSystem.destroyObjects();
        clearBanners();
        lightSystem.ambientColor = rgb(.86, .76, .68);
        this.layers = buildLevel1Layers(CAM_Y);
        this.camera = new FollowCamera(vec2(0, CAM_Y), 0);
        playMusic('menu', .7, 1);
        fxEmbers(vec2(0, 5), vec2(60, 8));
        fxLeaves(vec2(0, 13), vec2(60, 2), 2);

        const f = assets.feast, v = assets.villagers;
        new Still(vec2(.3, .2), f.matSize.scale(1.5), f.mat, 2);
        new Still(vec2(-3.3, 1.55), f.potSize.scale(.95), f.pot, 6);
        this.steam = particleEffect('steam', vec2(-3.3, 2.6), { scale: .9 });
        this.hero = new SpriteProp(assets.giong, ['free', 'eat', 'cheer'], vec2(0, 0), { scale: .5, shadow: 2 });
        this.stack = new BowlStack(1.9);
        this.crowd = [
            new SpriteProp(v, ['elderIdle', 'elderTalk'], vec2(-6.6, 0), { scale: 1.1 }),
            new SpriteProp(v, ['kid0', 'kid0Cheer'], vec2(-9, 0)),
            new SpriteProp(v, ['kid1', 'kid1Cheer'], vec2(6.4, 0), { mirror: true }),
            new SpriteProp(v, ['kid2', 'kid2Cheer'], vec2(8.6, 0), { mirror: true }),
        ];

        this.state = 'ready';
        this.presses = 0; this.bowls = 0; this.mouth = 0; this.recent = [];
        this.t = new Timer; this.t.set(0);
        this.count = 3;
        showBanner('GIÚP GIÓNG ĂN MAU LỚN!', 'Bấm SPACE thật nhanh — mỗi 4 lần bấm là một tô cơm', 'level', 2.6);
        this.events = [[2.6, () => this.tick(3)], [3.4, () => this.tick(2)], [4.2, () => this.tick(1)], [5, () => this.start()]];
    }

    tick(n) { this.count = n; play('drum', undefined, .9, 1 + (3 - n) * .1); shake(.15, vec2(0, 1)); }

    start()
    {
        this.state = 'eat';
        this.count = 0;
        this.eatT = new Timer(DURATION);
        play('gong'); chroma(.006);
        this.hero.clip = 'eat';
        this.crowd[0].clip = 'elderTalk';
    }

    eat()
    {
        this.presses++;
        this.mouth = .09;
        this.recent.push(timeReal);
        play('pop', this.hero.pos, .6, rand(1.1, 1.6));
        // hạt cơm bay
        particleEffect('dust', this.hero.pos.add(vec2(.5, 2.1 * this.hero.scale + .3)), { scale: .3, hue: .12, saturation: 0, emitTime: .05 });
        if (this.presses % PRESS_PER_BOWL === 0)
        {
            this.bowls++;
            this.stack.pop[this.stack.count] = time;
            this.stack.count++;
            play('uiOk', this.hero.pos, .7, 1 + Math.min(this.bowls, 30) * .02);
            new FloatText(this.hero.pos.add(vec2(0, 2.6)), '+1 tô', C.giay, .7, .6);
            // trẻ con reo hò
            const kid = this.crowd[1 + randInt(3)];
            kid.clip = Object.keys(kid.anim.clips)[1];
            kid.cheerT = new Timer(.6);
        }
    }

    finishEating()
    {
        this.state = 'done';
        this.hero.clip = 'free';
        this.crowd[0].clip = 'elderIdle';
        game.rage = Math.min(100, this.bowls * RAGE_PER_BOWL);
        play('gong');
        showBanner('HẾT GIỜ!', `Gióng đã ăn ${this.bowls} tô cơm · Nộ Khí khởi đầu +${game.rage}`, 'big', 2.4);
        this.events.push([this.t.get() + 2.6, () => this.grow()], [this.t.get() + 6.2, () => goLevel(1)]);
    }

    /** Gióng vươn vai thành tráng sĩ */
    grow()
    {
        const g = this.hero;
        g.clip = 'cheer';
        tweenProperty(g, 'scale', g.scale, 1, .8, { ease: Ease.OUT(Ease.ELASTIC) });
        whiteFlash(.8); shake(.9); chroma(.02);
        play('gong'); play('boom');
        fxDust(vec2(0, .2), 2.8);
        fxSparkle(vec2(0, 2.5), 2.2);
        fxConfetti(vec2(0, 6));
        for (const k of this.crowd.slice(1)) { k.clip = Object.keys(k.anim.clips)[1]; k.cheerT = undefined; }
        showBanner('GIÓNG VƯƠN VAI THÀNH TRÁNG SĨ!', 'Cầm roi sắt, xuất trận!', 'big', 3.2);
    }

    update()
    {
        while (this.events.length && this.t.get() >= this.events[0][0]) this.events.shift()[1]();
        const g = this.hero;
        if (this.state === 'eat')
        {
            if (keyWasPressed('Space')) this.eat();
            if (this.eatT.elapsed()) this.finishEating();
            // lớn dần theo số tô
            g.scale = lerp(g.scale, .5 + .38 * Math.min(1, this.bowls / 20), .08);
        }
        // khung há miệng ăn
        this.mouth -= 1 / 60;
        if (this.state === 'eat') g.frameOverride = frameTile(assets.giong, 'eat', this.mouth > 0 ? 1 : 0);
        else g.frameOverride = undefined;
        for (const k of this.crowd) if (k.cheerT?.elapsed()) { k.clip = Object.keys(k.anim.clips)[0]; k.cheerT = undefined; }
        this.recent = this.recent.filter(t => timeReal - t < 1);
    }

    drawUI()
    {
        withUI((ctx, W) =>
        {
            const t = timeReal;
            if (this.state === 'ready' && this.count > 0)
            {
                text(ctx, String(this.count), W / 2, 270, 120, '#FFE9A8', { line: 10 });
            }
            if (this.state !== 'eat' && this.state !== 'done') return;
            // thanh thời gian
            const remain = this.state === 'eat' ? clamp(-this.eatT.get() / DURATION) : 0;
            brushBand(ctx, W / 2 - 250, 14, 500, 66, 'rgba(53,44,42,.85)', 51);
            roughRect(ctx, W / 2 - 200, 52, 400, 16, 'rgba(0,0,0,.4)', PAL.giay, 2, 52);
            ctx.fillStyle = remain < .3 ? PAL.canh : PAL.vang; ctx.fillRect(W / 2 - 198, 54, 396 * remain, 12);
            text(ctx, `Thời gian: ${(remain * DURATION).toFixed(1)}s`, W / 2, 34, 22, PAL.giay, { line: 4 });
            // số tô cơm
            brushBand(ctx, W - 230, 96, 210, 70, 'rgba(241,225,190,.9)', 53);
            text(ctx, `Tô cơm: ${this.bowls}`, W - 125, 122, 28, PAL.son, { line: 4 });
            const prog = (this.presses % PRESS_PER_BOWL) / PRESS_PER_BOWL;
            roughRect(ctx, W - 200, 144, 150, 10, 'rgba(53,44,42,.4)', PAL.muc, 2, 54);
            ctx.fillStyle = '#FBF7EC'; ctx.fillRect(W - 198, 146, 146 * prog, 6);
            // sức ăn (lần bấm / giây)
            const rate = this.recent.length;
            text(ctx, `Sức ăn: ${rate} miếng/giây`, W - 125, 178, 15, PAL.muc, { line: 0, shadow: false });
            // nhắc bấm SPACE
            if (this.state === 'eat')
            {
                const s = 1 + .08 * Math.sin(t * 16), y = 470;
                roughRect(ctx, W / 2 - 110 * s, y - 24 * s, 220 * s, 48 * s, this.mouth > 0 ? '#FFE9A8' : PAL.giay, PAL.muc, 4, 55);
                text(ctx, 'SPACE', W / 2, y + 1, 30 * s, PAL.muc, { line: 0, shadow: false });
                text(ctx, 'Bấm liên tục để Gióng ăn!', W / 2, y + 44, 18, PAL.giay, { line: 4 });
            }
        });
    }

    leave() { uiSystem.destroyObjects(); this.steam?.destroy(); }
}
