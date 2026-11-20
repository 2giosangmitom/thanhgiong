// Cảnh cuối (phần 2) — dạng phim cũ: nhiều năm sau, bô lão kể chuyện Thánh Gióng cho trẻ con trong làng nghe
import {
    EngineObject, vec2, rgb, time, timeReal, Timer, FollowCamera, Light, lightSystem, uiSystem, keyWasPressed, tweenProperty, Ease,
    rand, particleEffect, drawTile,
} from 'littlejsengine';
import { CAM_Y, PAL, C } from '../config.js';
import { game, world, assets } from '../state.js';
import { buildStoryLayers } from '../art/backgrounds.js';
import { SpriteProp } from '../entities/Prop.js';
import { playMusic } from '../audio/music.js';
import { play } from '../audio/sfx.js';
import { fxFire, setFilm, setDesat } from '../fx/fx.js';
import { withUI, text } from '../ui/draw2d.js';
import { clearBanners } from '../ui/hud.js';
import { openPanel } from '../ui/panels.js';
import { startRun, goMenu } from './flow.js';

// [người nói, lời thoại, ai đang nói: 'elder' | số thứ tự em bé]
const SCRIPT = [
    ['Bô lão', 'Ngày xửa ngày xưa, ở làng Phù Đổng có một cậu bé lên ba mà chẳng biết nói, chẳng biết cười...', 'elder'],
    ['Bô lão', 'Giặc kéo đến, cậu bỗng cất tiếng xin ngựa sắt, roi sắt. Dân làng góp gạo nuôi, cậu lớn nhanh như thổi.', 'elder'],
    ['Bô lão', 'Gióng vươn vai thành tráng sĩ, roi sắt quật tan quân giặc, tre làng cũng hoá thành vũ khí.', 'elder'],
    ['Bé Na', 'Thế rồi Gióng đi đâu hả ông?', 1],
    ['Bô lão', 'Giặc tan, Gióng cưỡi ngựa sắt lên đỉnh Sóc Sơn, rồi bay thẳng về trời.', 'point'],
    ['Cu Tí', 'Ông ơi, Gióng có còn ở trên trời không ạ?', 0],
    ['Bô lão', 'Còn chứ! Mỗi khi đất nước cần, tinh thần Gióng lại sống trong mỗi người con đất Việt.', 'point'],
];
const CPS = 30; // ký tự mỗi giây

/** Bếp lửa giữa sân (đặt trước mặt bô lão) */
class Campfire extends EngineObject
{
    constructor(pos)
    {
        super(pos, vec2(1));
        this.fire = fxFire(pos.add(vec2(0, .3)), .9);
        this.light = new Light(pos.add(vec2(0, 1.5)), 15, rgb(1, .65, .3, .9), 15);
        this.renderOrder = 7;
    }
    update() { this.light.color = rgb(1, .6, .25, .7 + Math.sin(time * 13) * .08 + Math.sin(time * 29) * .05); }
    render()
    {
        // củi
        drawTile(this.pos.add(vec2(0, .15)), vec2(1.8, .25), undefined, rgb(.3, .2, .12), .25);
        drawTile(this.pos.add(vec2(0, .15)), vec2(1.8, .25), undefined, rgb(.35, .22, .14), -.25);
    }
}

export class StoryScene
{
    enter()
    {
        game.state = 'STORY';
        world.scene = this;
        world.enemies = [];
        uiSystem.destroyObjects();
        clearBanners();
        setDesat(0);
        setFilm(1);
        lightSystem.ambientColor = rgb(.8, .74, .72);
        this.layers = buildStoryLayers(CAM_Y);
        this.target = vec2(-3, CAM_Y);
        this.camera = new FollowCamera(this.target, 0);
        // máy quay lia chậm như phim
        tweenProperty(this.target, 'x', -3, 2.5, 36, { ease: Ease.IN_OUT(Ease.SINE) });
        playMusic('ending', .75, 1);

        const v = assets.villagers, f = assets.feast;
        // chiếu, bếp lửa, bô lão và các em nhỏ
        const mat = new EngineObject(vec2(.8, .2), f.matSize.scale(1.9), f.mat); mat.renderOrder = 2;
        this.fire = new Campfire(vec2(1, 0));
        this.elder = new SpriteProp(v, ['elderIdle', 'elderTalk', 'elderPoint'], vec2(4.4, 0), { mirror: true, scale: 1.25 });
        this.kids = [
            new SpriteProp(v, ['kid0', 'kid0Raise'], vec2(-3.2, 0), { scale: 1.05 }),
            new SpriteProp(v, ['kid1', 'kid1Raise'], vec2(-1.2, 0), { scale: 1 }),
            new SpriteProp(v, ['kid2', 'kid2Raise'], vec2(-5.2, 0), { scale: 1.05 }),
        ];
        particleEffect('fireflies', vec2(0, 4), { scale: 1, emitSize: vec2(30, 6), emitRate: 6 }).renderOrder = 40;

        this.phase = 'title';  // title → talk → end
        this.idx = -1; this.typed = 0; this.lineStart = 0; this.titleK = 0;
        this.t = new Timer; this.t.set(0);
        tweenProperty(this, 'titleK', 0, 1, 1.2, { useRealTime: true });
    }

    nextLine()
    {
        this.idx++;
        if (this.idx >= SCRIPT.length) return this.end();
        this.phase = 'talk';
        this.lineStart = timeReal; this.typed = 0;
        const who = SCRIPT[this.idx][2];
        this.elder.clip = who === 'point' ? 'elderPoint' : who === 'elder' ? 'elderTalk' : 'elderIdle';
        this.kids.forEach((k, i) => { k.clip = i === who ? Object.keys(k.anim.clips)[1] : Object.keys(k.anim.clips)[0]; });
    }

    end()
    {
        if (this.phase === 'end') return;
        this.phase = 'end';
        this.elder.clip = 'elderIdle';
        this.kids.forEach(k => k.clip = Object.keys(k.anim.clips)[0]);
        this.endK = 0;
        tweenProperty(this, 'endK', 0, 1, 1.5, { useRealTime: true });
        play('gong', undefined, .6);
        this.panelT = new Timer(3.2, true);
    }

    update()
    {
        const t = this.t.get();
        if (this.phase === 'title' && t > 3.2) { this.nextLine(); }
        if (this.phase === 'talk')
        {
            const line = SCRIPT[this.idx][1];
            const n = Math.min(line.length, ((timeReal - this.lineStart) * CPS) | 0);
            if (n > this.typed) { this.typed = n; line[n - 1] !== ' ' && play('type', undefined, .35, rand(.8, 1.1)); }
            // nói xong thì nhân vật ngừng mấp máy
            if (n >= line.length)
            {
                this.elder.clip = SCRIPT[this.idx][2] === 'point' ? 'elderPoint' : 'elderIdle';
                const done = timeReal - this.lineStart - line.length / CPS;
                if (done > 2.2) this.nextLine();
            }
            // Enter: hiện hết câu, bấm tiếp để sang câu sau
            if (keyWasPressed('Enter') || keyWasPressed('Space'))
            {
                if (n < line.length) this.lineStart = timeReal - line.length / CPS;
                else this.nextLine();
            }
        }
        if (keyWasPressed('Escape') && this.phase !== 'end') this.end();
        if (this.panelT?.elapsed())
        {
            this.panelT = undefined;
            const secs = Math.round((performance.now() - game.runStart) / 1000);
            openPanel({
                title: 'CHIẾN THẮNG!', title2: 'Cảm ơn bạn đã cùng Thánh Gióng bảo vệ quê hương',
                lines: [`Tổng số giặc đã hạ: ${game.totalKills} · Thời gian: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
                buttons: [{ text: 'Chơi lại từ đầu', onClick: startRun }, { text: 'Về menu', onClick: goMenu }],
                titleColor: C.son, dim: .3, width: 560,
            });
        }
    }

    drawUI()
    {
        withUI((ctx, W, H) =>
        {
            // khung phim màn ảnh rộng
            ctx.fillStyle = '#0E0A09';
            ctx.fillRect(0, 0, W, 62); ctx.fillRect(0, H - 92, W, 92);
            // lỗ răng cưa của cuộn phim
            ctx.fillStyle = 'rgba(241,225,190,.18)';
            const off = (time * 60) % 40;
            for (let x = -40 + off; x < W; x += 40) { ctx.fillRect(x, 10, 18, 12); ctx.fillRect(x, H - 22, 18, 12); }

            if (this.phase === 'title')
                text(ctx, 'Nhiều năm sau...', W / 2, 270, 46, '#F3E3C0', { line: 0, alpha: this.titleK * Math.min(1, (3.2 - this.t.get()) * 2), shadow: false, weight: 'italic' });
            if (this.phase === 'talk')
            {
                const [who, line] = SCRIPT[this.idx];
                const s = line.slice(0, this.typed);
                text(ctx, who + ':', 60, H - 70, 18, who === 'Bô lão' ? '#F2C27A' : '#B9E0A0', { align: 'left', line: 0, shadow: false });
                text(ctx, s, 60, H - 40, 22, '#F3E3C0', { align: 'left', line: 0, shadow: false, weight: 'normal', maxWidth: W - 120 });
                text(ctx, 'Enter — tiếp · Esc — bỏ qua', W - 20, 40, 13, '#F3E3C0', { align: 'right', line: 0, alpha: .5, weight: 'normal', shadow: false });
            }
            if (this.phase === 'end')
            {
                ctx.fillStyle = `rgba(14,10,9,${.7 * this.endK})`; ctx.fillRect(0, 0, W, H);
                text(ctx, 'HẾT', W / 2, 230, 80, '#F3E3C0', { line: 0, alpha: this.endK, shadow: false });
                text(ctx, 'Thánh Gióng: Metal Rising', W / 2, 295, 22, '#F3E3C0', { line: 0, alpha: this.endK * .8, shadow: false, weight: 'italic' });
            }
        });
    }

    leave() { setFilm(0); uiSystem.destroyObjects(); }
}
