// Hiệu ứng âm thanh ZzFX (không cần file) + chuỗi hiệu ứng âm thanh của LittleJS
import { Sound, AudioReverb, AudioFilter, AudioCompressor, setAudioMasterEffect, rand } from 'littlejsengine';

// Tham số ZzFX: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide,
// pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter
export const S = {};
export const FX = {};

export function initAudio()
{
    // master: lọc thông thấp (bóp tiếng khi tạm dừng/thua) → nén (chống vỡ tiếng)
    FX.filter = new AudioFilter('lowpass', 20000, .7);
    FX.comp = new AudioCompressor(-18, 6);
    FX.filter.connect(FX.comp);
    setAudioMasterEffect(FX.filter, FX.comp);
    // vang cho trống, cồng và nhạc
    FX.reverb = new AudioReverb(2.2, 2.5, .3);
    FX.reverb.connect(FX.filter);
    FX.hall = new AudioReverb(3, 2, .45);
    FX.hall.connect(FX.filter);

    S.whoosh   = new Sound([.6, .1, 320, .02, .03, .12, 4, .5, -18, 0, 0, 0, 0, 1.2, 0, 0, 0, .6, .05]);
    S.whooshBig= new Sound([1, .05, 160, .08, .06, .25, 4, .4, -6, 0, 0, 0, 0, 1.5, 0, 0, 0, .7, .1]);
    S.clang    = new Sound([.9, .05, 950, 0, .01, .28, 2, 2.4, 0, 0, 0, 0, 0, 0, 37, 0, 0, .35, .05]);
    S.clangBig = new Sound([1.3, .05, 520, 0, .02, .5, 2, 2, -1, 0, 0, 0, 0, .1, 23, 0, 0, .4, .1]);
    S.hit      = new Sound([1.1, .1, 140, 0, .03, .14, 0, 2, -7, 0, 0, 0, 0, 1.6, 0, .1]);
    S.kill     = new Sound([1, .1, 220, .01, .05, .35, 2, 1, -6, 0, 0, 0, 0, .8, 0, .05, .05, .5]);
    S.hurt     = new Sound([1.2, .05, 320, .01, .06, .25, 3, 2, -14, 0, 0, 0, 0, 1, 0, .2]);
    S.pop      = new Sound([.9, .2, 170, .004, .02, .12, 1, 2, 22, 0, 0, 0, 0, .3]);
    S.boom     = new Sound([1.6, 0, 60, .02, .2, .7, 0, 1.2, -1.5, 0, 0, 0, 0, .7, 0, 0, 0, .6, .2]);
    S.drum     = new Sound([1.8, 0, 58, .004, .07, .5, 0, 1.5, -1.6, 0, 0, 0, 0, .25, 0, 0, 0, .6, .2]);
    S.gong     = new Sound([1.1, 0, 98, .01, .5, 2.2, 0, 1, 0, 0, 0, 0, 0, 0, 6.5, 0, 0, .5, .3, .15]);
    S.charge   = new Sound([.7, 0, 140, .35, .1, .15, 2, 1, 9, 0, 0, 0, 0, .4, 0, 0, 0, .7]);
    S.glint    = new Sound([.5, 0, 1800, 0, .03, .25, 1, 1, 0, 0, 700, .03]);
    S.roar     = new Sound([1.6, .1, 85, .12, .5, .8, 2, 2.2, -1.5, 0, 0, 0, 0, 2.2, 4]);
    S.step     = new Sound([1, .1, 48, 0, .04, .2, 0, 1.2, -3, 0, 0, 0, 0, .6]);
    S.rageFull = new Sound([.6, 0, 660, .01, .12, .35, 1, 1, 0, 0, 330, .07, 0, 0, 0, 0, 0, .7]);
    S.uiMove   = new Sound([.35, 0, 700, 0, .01, .05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, .5]);
    S.uiOk     = new Sound([.5, 0, 520, 0, .04, .18, 1, 1, 0, 0, 260, .05]);
    S.type     = new Sound([.15, .3, 900, 0, .005, .02, 4]);
    S.fire     = new Sound([.2, .5, 80, .2, .4, .4, 4, 0, 0, 0, 0, 0, 0, 2]);

    // trống, cồng và tiếng nổ lớn đi qua vang
    for (const k of ['drum', 'gong', 'boom', 'roar', 'clangBig']) S[k].output = FX.reverb;
}

export const play = (name, pos, volume = 1, pitch = 1) => S[name]?.play(pos, volume, pitch);

/** Tre bật lên: chuỗi tiếng "póc" lệch nhịp */
export function playBambooPops(pos, count = 7)
{
    for (let i = 0; i < count; i++)
        setTimeout(() => S.pop.play(pos, .8, rand(.8, 1.4)), i * 35 + rand(20));
}

/** Bóp tiếng khi tạm dừng / thua */
export function muffle(on, time = .3)
{
    FX.filter?.setFrequency(on ? 650 : 20000, time);
}
