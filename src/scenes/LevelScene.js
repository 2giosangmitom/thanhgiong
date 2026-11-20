// Màn chơi: 1 — Phù Đổng rực lửa (12 lính), 2 — Sóc Sơn quyết chiến (Thiết Giáp Tướng)
import {
    vec2, rgb, Timer, FollowCamera, Light, lightSystem, time, rand, randInt, clamp, lerp, tweenProperty, Ease, uiSystem,
    EngineObject, drawPoly, drawLine, Color,
} from 'littlejsengine';
import { CFG, ARENA_HALF, CAM_Y, C } from '../config.js';
import { game, world } from '../state.js';
import { buildLevel1Layers, buildLevel2Layers, layerPoint } from '../art/backgrounds.js';
import { Player } from '../entities/Player.js';
import { Soldier } from '../entities/Soldier.js';
import { Boss } from '../entities/Boss.js';
import { playMusic, stopMusic } from '../audio/music.js';
import { play, muffle, S } from '../audio/sfx.js';
import { fxFire, fxSmoke, fxEmbers, fxLeaves, fxConfetti, fxSparkle, slowmo, whiteFlash, shake, setDesat, flash, hitstop } from '../fx/fx.js';
import { showBanner, resetHud, showBossBar, clearBanners } from '../ui/hud.js';
import { openPanel, closePanel } from '../ui/panels.js';
import { retryLevel, goMenu, nextLevel, startRun, goEnding } from './flow.js';
import { clawEmblem } from '../art/soldier.js';

/** Cờ giặc tung bay (vẽ mỗi frame bằng drawPoly, gắn với thế giới) */
class WarFlag extends EngineObject
{
    constructor(x, h, torn)
    {
        super(vec2(x, 0), vec2(1));
        this.h = h; this.torn = torn; this.renderOrder = -50; this.seed = rand(10);
    }
    render()
    {
        const x = this.pos.x, top = this.h, w = this.h * .42, fh = this.h * .3, n = 8;
        drawLine(vec2(x, 0), vec2(x, top + .2), .14, rgb(.2, .14, .1));
        const pts = [];
        for (let i = 0; i <= n; i++)
        {
            const k = i / n, wave = Math.sin(time * 4 + this.seed + k * 4) * .18 * k;
            pts.push(vec2(x + k * w, top + wave - (this.torn && i === n ? .3 : 0)));
        }
        for (let i = n; i >= 0; i--)
        {
            const k = i / n, wave = Math.sin(time * 4 + this.seed + k * 4 + .6) * .18 * k;
            const tear = this.torn && (i === n - 1 || i === n - 3) ? .35 : 0;
            pts.push(vec2(x + k * w - tear * .5, top - fh + wave + tear));
        }
        drawPoly(pts, rgb(.18, .14, .2), .08, C.muc);
        // ấn hiệu móng vuốt (3 vạch)
        for (let k = -1; k <= 1; k++)
        {
            const cx = x + w * .45 + k * .22, cy = top - fh / 2 + Math.sin(time * 4 + this.seed + 2) * .08;
            drawLine(vec2(cx - .06, cy + .35), vec2(cx + .06, cy - .35), .1, rgb(.69, .54, .24));
        }
    }
}

export class LevelScene
{
    constructor(level) { this.level = level; }

    enter()
    {
        const L = this.level;
        game.level = L;
        game.kills = 0; game.spawned = 0; game.bossHP = CFG.bossHP;
        game.rageAtLevelStart = game.rage;
        game.state = 'CUTSCENE';
        world.enemies = []; world.boss = undefined;
        world.scene = this;
        resetHud(); clearBanners();
        setDesat(0);
        uiSystem.destroyObjects();

        this.camTarget = vec2(0, CAM_Y);
        this.layers = L === 1 ? buildLevel1Layers(CAM_Y) : buildLevel2Layers(CAM_Y);
        this.levelTime = new Timer; this.levelTime.set(0);
        this.spawnT = new Timer;
        this.ended = false;
        this.anchored = [];   // hiệu ứng gắn vào điểm trên lớp parallax

        world.player = new Player(L === 1 ? 0 : -9);
        this.camera = new FollowCamera(this.camTarget, .3);
        this.camera.boundsMin = vec2(-ARENA_HALF, -50);
        this.camera.boundsMax = vec2(ARENA_HALF, 50);
        this.camera.snap?.();

        if (L === 1) this.setupLevel1(); else this.setupLevel2();
    }

    // ------------------------------------------------------------------ MÀN 1
    setupLevel1()
    {
        lightSystem.ambientColor = rgb(.86, .76, .68);
        playMusic('level1', .6, 1.5);
        // lửa cháy trên mái nhà ở lớp làng (gắn theo parallax)
        const v = this.layers.village, W = 48 * 30, H = 8.4 * 30;
        for (const [fx, fy] of [[.2, H - 120], [.17, H - 110], [.23, H - 108], [.8, H - 120], [.77, H - 108], [.83, H - 110]])
            this.anchor(v, W * fx, fy, fxFire(vec2(), .9));
        for (const fx of [.2, .8]) this.anchor(v, W * fx, H - 170, fxSmoke(vec2(), 2.2));
        for (const fx of [.2, .8])
        {
            const light = new Light(vec2(), 9, rgb(1, .55, .2, .7), 9);
            light.flicker = rand(10);
            this.anchor(v, W * fx, H - 110, light);
        }
        // tàn lửa, lá tre bay
        fxEmbers(vec2(0, 5), vec2(60, 8));
        fxLeaves(vec2(0, 13), vec2(60, 2), 2);
        // cờ giặc trong đấu trường
        new WarFlag(-17, 5.5, false); new WarFlag(16, 6, false);

        showBanner('MÀN 1 — PHÙ ĐỔNG RỰC LỬA', `Hạ ${CFG.killsNeeded} lính giặc để bảo vệ làng!`, 'level', 2.6);
        play('drum'); setTimeout(() => play('drum', undefined, .8), 260);
        this.after(.6, () => { game.state = 'PLAYING'; });
        this.spawnT.set(1.6);
    }

    spawnSoldier()
    {
        const p = world.player, edge = ARENA_HALF + .8;
        let side = rand() < .5 ? -1 : 1;
        if (Math.abs(side * edge - p.pos.x) < 9) side = -side;
        new Soldier(side * edge, 'attack', () => this.onKill());
        game.spawned++;
    }

    onKill()
    {
        game.kills++;
        if (game.kills >= CFG.killsNeeded && !this.ended) this.levelClear();
    }

    updateSpawner()
    {
        if (game.state !== 'PLAYING' || game.spawned >= CFG.killsNeeded) return;
        if (!this.spawnT.elapsed()) return;
        const t = this.levelTime.get();
        const cap = t < 15 ? 2 : t < 45 ? 3 : 4;
        const alive = world.enemies.filter(e => e.alive && e.mode === 'attack').length;
        if (alive < cap) this.spawnSoldier();
        // lượt đầu cho phép 2 lính đầu tiên sát nhau hơn để vào nhịp
        this.spawnT.set(game.spawned === 1 ? 1.5 : CFG.spawnEvery);
    }

    levelClear()
    {
        this.ended = true;
        game.state = 'LEVEL_CLEAR';
        slowmo(.35, .9); whiteFlash(.35);
        world.player.cheer = true;
        play('gong'); stopMusic(1.5);
        this.after(.8, () =>
        {
            fxConfetti(world.player.pos.add(vec2(0, 5)));
            playMusic('victory', .5, .2);
            showBanner('ĐÃ GIỮ ĐƯỢC LÀNG!', 'Giặc tháo chạy về phía Sóc Sơn...', 'big', 2.2);
        });
        // lính còn sót bỏ chạy
        for (let i = 0; i < 3; i++) this.after(.5 + i * .4, () => new Soldier(world.player.pos.x + (i % 2 ? 6 : -6), 'flee').dir = i % 2 ? 1 : -1);
        this.after(2.8, () => openPanel({
            title: 'ĐÃ GIỮ ĐƯỢC LÀNG!', title2: 'Phù Đổng bình yên trở lại',
            lines: [`Giặc đã hạ: ${game.kills}/${CFG.killsNeeded} · Nộ Khí giữ lại: ${game.rage}`],
            buttons: [{ text: 'Enter — Đến Sóc Sơn', onClick: nextLevel }],
            titleColor: C.tre, dim: .35,
        }));
    }

    // ------------------------------------------------------------------ MÀN 2
    setupLevel2()
    {
        lightSystem.ambientColor = rgb(.84, .7, .66);
        playMusic('level2', .6, 2);
        fxEmbers(vec2(0, 4), vec2(60, 8));
        fxLeaves(vec2(0, 13), vec2(60, 2), 1.2);
        new WarFlag(-18, 6.5, true); new WarFlag(-6, 5, true); new WarFlag(13, 6, true);
        // ánh hoàng hôn từ phía sau
        this.sunLight = new Light(vec2(0, 12), 40, rgb(1, .55, .3, .35), 40);

        world.player.locked = true;
        const boss = new Boss(ARENA_HALF + 4, {
            onArrive: () => this.bossArrived(),
            onPhase2: () => this.bossPhase2(),
            onDeath: () => this.bossDefeated(),
        });
        boss.enterX = 9;
        showBanner('MÀN 2 — SÓC SƠN: QUYẾT CHIẾN', 'Đánh bại tướng giặc!', 'level', 2.2);
    }

    bossArrived()
    {
        play('gong'); play('drum');
        shake(.5);
        showBanner('THIẾT GIÁP TƯỚNG', 'Thủ lĩnh quân xâm lược', 'boss', 2);
        showBossBar();
        this.after(2, () =>
        {
            world.player.locked = false;
            game.state = 'PLAYING';
            world.boss.setState('approach');
        });
    }

    bossPhase2()
    {
        play('drum'); setTimeout(() => play('drum', undefined, 1, 1.2), 140); setTimeout(() => play('drum', undefined, 1, 1.4), 280);
        lightSystem.ambientColor = rgb(.8, .58, .55);
        showBanner('NỘ KHÍ CỦA TƯỚNG GIẶC!', 'Đòn đao nhanh hơn — hãy cẩn thận', 'level', 1.8);
    }

    bossDefeated()
    {
        this.ended = true;
        game.state = 'VICTORY';
        world.player.locked = true;
        slowmo(.35, 1.4); whiteFlash(.9); shake(1);
        stopMusic(.5);
        play('gong');
        // quân giặc rút lui
        for (let i = 0; i < 5; i++) this.after(1.2 + i * .35, () => { const s = new Soldier(world.boss.pos.x + 2 + i, 'flee'); s.dir = 1; });
        this.after(1.6, () =>
        {
            world.player.cheer = true;
            playMusic('victory', .55, .2);
            // trời sáng dần
            tweenProperty(lightSystem, 'ambientColor', lightSystem.ambientColor.copy(), rgb(1, 1, 1), 2.5);
            tweenProperty(this.layers.dawn, 'color', rgb(1, 1, 1, 0), rgb(1, 1, 1, 1), 3.5, { ease: Ease.IN_OUT(Ease.SINE) });
            tweenProperty(this.sunLight, 'color', this.sunLight.color.copy(), rgb(1, .9, .6, .7), 2.5);
            for (let i = 0; i < 4; i++) this.after(i * .5, () => fxConfetti(vec2(world.player.pos.x + rand(-8, 8), 9)));
            fxSparkle(world.player.pos.add(vec2(0, 3)), 2.5);
            showBanner('ĐẤT NƯỚC YÊN BÌNH — CHIẾN THẮNG!', 'Gióng đã đánh tan quân xâm lược', 'big', 3.6);
        });
        this.after(2.4, () => tweenProperty(world.boss, 'alpha', 1, 0, 1.5));
        // sang cảnh cuối: Gióng bay về trời
        this.after(6, () => goEnding());
    }

    // ------------------------------------------------------------------ chung
    /** Gắn một đối tượng (particle/light) vào điểm trên lớp parallax */
    anchor(layer, px, py, obj)
    {
        if (!obj) return;
        this.anchored.push({ layer, px, py, obj });
        obj.pos = layerPoint(layer, px, py);
    }

    after(sec, fn)
    {
        (this.timers ||= []).push({ t: new Timer(sec), fn });
    }

    gameOver()
    {
        this.ended = true;
        game.state = 'GAME_OVER';
        stopMusic(.6);
        muffle(true, 1.2);
        const d = { v: 0 };
        tweenProperty(d, 'v', 0, 1, 1.2, { useRealTime: true });
        this.desatTween = d;
        this.after(1.4, () =>
        {
            playMusic('defeat', .5, .1);
            openPanel({
                title: 'THẤT BẠI', title2: game.level === 1 ? 'Làng Phù Đổng vẫn đang chờ Gióng...' : 'Tướng giặc vẫn đứng vững...',
                buttons: [{ text: 'Chơi lại màn', onClick: retryLevel }, { text: 'Về menu', onClick: goMenu }],
                titleColor: C.canh,
            });
        });
    }

    update()
    {
        // hẹn giờ
        if (this.timers) for (let i = this.timers.length; i--;)
            if (this.timers[i].t.elapsed()) { const f = this.timers[i].fn; this.timers.splice(i, 1); f(); }

        if (this.level === 1) this.updateSpawner();

        // camera: bám Gióng (màn 2 nhìn giữa Gióng và boss)
        const p = world.player;
        let cx = p.pos.x + p.dir * 1.5;
        if (this.level === 2 && world.boss && world.boss.state !== 'dead') cx = lerp(p.pos.x, world.boss.pos.x, .35);
        this.camTarget.x = cx;
        this.camera.target = this.camTarget;

        // cập nhật vị trí hiệu ứng gắn trên lớp parallax + lửa lập loè
        for (const a of this.anchored)
        {
            a.obj.pos = layerPoint(a.layer, a.px, a.py);
            if (a.obj.flicker !== undefined) a.obj.color = rgb(1, .55, .2, .55 + Math.sin(time * 13 + a.obj.flicker) * .12 + Math.sin(time * 31) * .06);
        }
        // mây trôi
        if (this.layers.clouds) this.layers.clouds.pos.x += .004;

        if (this.desatTween) setDesat(this.desatTween.v * .85);
        if (p.dead && !this.ended) this.gameOver();
    }

    leave()
    {
        uiSystem.destroyObjects();
        clearBanners();
        world.player = undefined; world.boss = undefined; world.enemies = [];
        setDesat(0);
    }
}
