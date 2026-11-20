// Cảnh mở đầu: tranh minh hoạ động + chữ chạy kiểu đánh máy
import { vec2, rgb, timeReal, Timer, FollowCamera, Light, lightSystem, uiSystem, keyWasPressed, tweenProperty, Ease, rand } from 'littlejsengine';
import { CAM_Y, PAL } from '../config.js';
import { game, world, assets } from '../state.js';
import { buildLevel1Layers, layerPoint } from '../art/backgrounds.js';
import { Player } from '../entities/Player.js';
import { Soldier } from '../entities/Soldier.js';
import { playMusic, stopMusic } from '../audio/music.js';
import { play, S } from '../audio/sfx.js';
import { fxFire, fxSmoke, fxEmbers, fxSparkle, fxDust, whiteFlash, shake, chroma } from '../fx/fx.js';
import { withUI, text, brushBand } from '../ui/draw2d.js';
import { goFeast } from './flow.js';
import { SpriteProp } from '../entities/Prop.js';

const LINES = [
    'Giặc kéo đến Phù Đổng. Tiếng trống làng nổi lên.',
    'Cậu bé Gióng ba tuổi bỗng cất tiếng: “Hãy rèn cho ta ngựa sắt, roi sắt!”',
    'Dân làng góp gạo nuôi Gióng, mong Gióng mau lớn...',
];

export class IntroScene
{
    enter()
    {
        game.state = 'INTRO';
        game.runStart = performance.now();
        world.scene = this;
        world.enemies = [];
        uiSystem.destroyObjects();
        lightSystem.ambientColor = rgb(.62, .52, .5);
        this.layers = buildLevel1Layers(CAM_Y);
        this.camera = new FollowCamera(vec2(6, CAM_Y), 0);
        tweenProperty(this.camera, 'target', vec2(6, CAM_Y), vec2(0, CAM_Y), 6, { ease: Ease.IN_OUT(Ease.SINE) });
        const v = this.layers.village, W = 48 * 30, H = 8.4 * 30;
        this.fires = [];
        for (const fx of [.2, .8])
        {
            this.fires.push([v, W * fx, H - 115, fxFire(vec2(), 1)]);
            this.fires.push([v, W * fx, H - 170, fxSmoke(vec2(), 2.2)]);
            this.fires.push([v, W * fx, H - 110, new Light(vec2(), 9, rgb(1, .55, .2, .8), 9)]);
        }
        fxEmbers(vec2(0, 5), vec2(60, 8));
        playMusic('menu', .7, 1); // nhạc Hồn Phù Đổng tiếp tục suốt phần mở đầu

        this.line = -1; this.lineStart = 0; this.typed = 0; this.done = false;
        this.t = new Timer; this.t.set(0);
        this.events = [
            [.3, () => { this.next(); for (let i = 0; i < 6; i++) { const s = new Soldier(19 + i * 2.2, 'march'); s.dir = -1; s.stopX = 7.5 + i * 1.7; } }],
            [.6, () => this.drum(0)],
            [1, () => this.drum(1)],
            [1.4, () => this.drum(2)],
            [3.6, () => this.kidSpeaks()],
            [7.6, () => this.next()],
            [11, () => this.finish()],
        ];
    }

    next() { this.line++; this.lineStart = timeReal; this.typed = 0; }

    drum(i)
    {
        play('drum', undefined, 1, 1 + i * .08);
        shake(.35 + i * .1, vec2(0, 1));
        chroma(.006);
    }

    /** Cậu bé Gióng cất tiếng nói đầu tiên */
    kidSpeaks()
    {
        this.next();
        this.kid = new SpriteProp(assets.giong, ['free', 'cheer'], vec2(-1, 0), { scale: .55, shadow: 2 });
        fxSparkle(vec2(-1, 1.2), 1, .12);
        play('gong'); whiteFlash(.3);
        tweenProperty(lightSystem, 'ambientColor', rgb(.62, .52, .5), rgb(.8, .7, .62), 1.5);
        // dân làng kéo đến
        const v = assets.villagers;
        this.villagers = [
            new SpriteProp(v, ['elderIdle'], vec2(-5.5, 0), { scale: 1.1 }),
            new SpriteProp(v, ['kid0'], vec2(-7.5, 0), { scale: 1 }),
            new SpriteProp(v, ['kid1'], vec2(-3.3, 0)),
        ];
    }

    finish()
    {
        if (this.done) return;
        this.done = true;
        goFeast();
    }

    update()
    {
        for (const [layer, px, py, obj] of this.fires) obj.pos = layerPoint(layer, px, py);
        while (this.events.length && this.t.get() >= this.events[0][0]) this.events.shift()[1]();
        // gõ chữ
        if (this.line >= 0)
        {
            const n = Math.min(LINES[this.line].length, ((timeReal - this.lineStart) * 28) | 0);
            if (n > this.typed) { this.typed = n; LINES[this.line][n - 1] !== ' ' && S.type?.play(undefined, .6, rand(.9, 1.2)); }
        }
        if (keyWasPressed('Enter') || keyWasPressed('Escape')) this.finish();
    }

    drawUI()
    {
        withUI((ctx, W) =>
        {
            // khung tranh: dải mực trên/dưới như cuộn tranh
            ctx.fillStyle = 'rgba(35,27,25,.92)';
            ctx.fillRect(0, 0, W, 46); ctx.fillRect(0, 540 - 120, W, 120);
            if (this.line >= 0)
            {
                for (let i = 0; i <= this.line; i++)
                {
                    const s = i === this.line ? LINES[i].slice(0, this.typed) : LINES[i];
                    const y = 540 - 96 + i * 32, cur = i === this.line;
                    text(ctx, s, 80, y, cur ? 26 : 22, cur ? '#FFE9A8' : PAL.giay, { align: 'left', line: 4, alpha: cur ? 1 : .6, maxWidth: W - 140 });
                }
            }
            text(ctx, 'Enter — bỏ qua', W - 20, 24, 14, PAL.giay, { align: 'right', line: 0, alpha: .6, weight: 'normal', shadow: false });
        });
    }

    leave() { world.player = undefined; world.enemies = []; }
}
