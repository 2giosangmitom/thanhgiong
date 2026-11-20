// Bake nhân vật vẽ bằng Canvas2D thành spritesheet → TextureInfo của LittleJS (vẽ bằng WebGL)
import { TextureInfo, tile, vec2, SpriteAnimation, SpriteAnimator, drawTile, WHITE } from 'littlejsengine';
import { PX } from '../config.js';
import { makeCanvas, seed, grain } from './ink.js';

export const RES_DEFAULT = 2; // độ phân giải bake (pixel texture / pixel thiết kế)

/**
 * Tạo một sheet
 * @param {object} def
 *   frame: [w, h] kích thước frame (px thiết kế), origin: [x, y] vị trí chân trong frame
 *   clips: { name: { count, time, mode, pose: (i, n) => pose } }
 *   draw: (ctx, pose) => void  vẽ nhân vật với gốc toạ độ ở chân, y âm là hướng lên
 *   seed: số gốc cho nét run
 */
export function bakeSheet(def)
{
    const [fw, fh] = def.frame, [ox, oy] = def.origin;
    const RES = def.res || RES_DEFAULT;
    const names = Object.keys(def.clips);
    const cols = Math.max(...names.map(n => def.clips[n].count));
    const W = fw * RES, H = fh * RES;
    const canvas = makeCanvas(cols * W, names.length * H);
    const ctx = canvas.getContext('2d');

    names.forEach((name, row) =>
    {
        const clip = def.clips[name];
        for (let i = 0; i < clip.count; i++)
        {
            seed((def.seed || 1) * 1000 + row * 50 + i);
            ctx.save();
            ctx.beginPath(); ctx.rect(i * W, row * H, W, H); ctx.clip();
            ctx.translate(i * W + ox * RES, row * H + oy * RES);
            ctx.scale(RES, RES);
            def.draw(ctx, clip.pose(i, clip.count), name);
            ctx.restore();
            // vân giấy trên nhân vật
            seed(row * 77 + i);
            grain(ctx, i * W, row * H, W, H, .5, RES * .8);
        }
    });

    const texture = new TextureInfo(canvas, true, false, false);
    const sheet = {
        texture, canvas,
        size: vec2(fw / PX, fh / PX),
        // dịch tâm frame so với chân (đơn vị thế giới)
        offset: vec2((fw / 2 - ox) / PX, (oy - fh / 2) / PX),
        clips: {},
        tiles: {},
    };
    names.forEach((name, row) =>
    {
        const c = def.clips[name];
        const t = tile(vec2(0, row), vec2(W, H), texture);
        t.setColumns?.(cols);
        sheet.tiles[name] = t;
        sheet.clips[name] = c;
    });
    return sheet;
}

/** Ô của frame thứ i trong clip */
export const frameTile = (sheet, name, i) => sheet.tiles[name].frame(Math.max(0, Math.min(i | 0, sheet.clips[name].count - 1)));

/** Tạo SpriteAnimator cho các clip lặp */
export function makeAnimator(sheet, names)
{
    const clips = {};
    for (const n of names)
    {
        const c = sheet.clips[n];
        const a = new SpriteAnimation(sheet.tiles[n], c.count, c.time || .1);
        clips[n] = c.mode === 'pingPong' ? a.pingPong() : a.loop();
    }
    return new SpriteAnimator(clips);
}

/** Vẽ một frame tại vị trí chân, có lật trái/phải */
export function drawSprite(sheet, tileInfo, feet, mirror, color = WHITE, additive, scale = 1, angle = 0)
{
    const off = vec2(mirror ? -sheet.offset.x : sheet.offset.x, sheet.offset.y).scale(scale);
    drawTile(feet.add(off), sheet.size.scale(scale), tileInfo, color, angle, mirror, additive);
}
