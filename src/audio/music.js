// Nhạc nền tự sinh: soạn theo điệu ngũ cung + trống dân gian + guitar "metal" remix,
// render offline bằng zzfxG thành buffer stereo lặp liền mạch
import { Sound, zzfxG } from 'littlejsengine';
import { FX } from './sfx.js';
// nhạc thu sẵn (Vite đóng gói file vào bản build)
import honPhuDongUrl from '../../music/HonPhuDong.wav';
import treXanhUrl from '../../music/TreXanhVuotNangMoi.wav';

/** Bài phát từ file; nếu không tải được thì dùng bài tự sinh thay thế */
const FILE_SONGS = {
    menu: { url: honPhuDongUrl, fallback: 'menuGen' },
    ending: { url: treXanhUrl, fallback: 'victory' },
};

const SR = 44100;

// Nhạc cụ (tham số ZzFX, tần số ở vị trí 2 là nốt gốc)
const INST = {
    sao:    [.55, 0, 587, .03, .14, .22, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, .7, .06, .08],     // sáo trúc
    saoL:   [.5, 0, 587, .06, .4, .4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, .8, .1, .12],         // sáo ngân dài
    bau:    [.45, 0, 293, .003, .06, .45, 1, 1.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, .6, .12],       // gảy kiểu đàn bầu/đàn tranh
    bass:   [.8, 0, 73, .01, .18, .12, 1, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, .8],
    gtr:    [.32, 0, 146, .004, .07, .05, 2, 3.2, 0, 0, 0, 0, 0, 0, 0, .06, 0, .9],           // guitar méo tiếng
    gtrL:   [.3, 0, 146, .01, .35, .2, 2, 3, 0, 0, 0, 0, 0, 0, 0, .05, 0, .9],
    kick:   [1.5, 0, 55, .004, .04, .32, 0, 1.4, -1.5, 0, 0, 0, 0, .15],                      // trống cái
    tom:    [.8, 0, 130, .003, .03, .16, 0, 1.2, -3, 0, 0, 0, 0, .1],                         // trống cơm
    phach:  [.45, 0, 1250, 0, .004, .035, 1, 3, 0, 0, 0, 0, 0, .3],                           // phách gỗ
    hat:    [.18, 0, 9000, 0, .004, .03, 4, 1],
    gong:   [.8, 0, 98, .01, .6, 2, 0, 1, 0, 0, 0, 0, 0, 0, 6.5, 0, 0, .5, .3, .15],
};

// Ngũ cung (Do Re Fa Sol La) — chữ cái → nửa cung so với nốt gốc
const SCALE = { A: -12, B: -10, C: -7, D: -5, E: -3, F: 0, G: 2, H: 5, I: 7, J: 9, K: 12, L: 14, M: 17, N: 19, O: 21 };

const cache = new Map();
function sample(inst, semi)
{
    const key = inst + ':' + semi;
    if (!cache.has(key))
    {
        const p = INST[inst].slice();
        p[2] *= 2 ** (semi / 12);
        cache.set(key, zzfxG(...p));
    }
    return cache.get(key);
}

/**
 * Render bài: tracks = [{inst, vol, pan, pat: chuỗi mỗi ký tự 1 nốt móc kép, transpose, chord}]
 * Với trống: 'x' mạnh, 'o' nhẹ, '.' nghỉ. Với giai điệu: chữ cái theo SCALE.
 */
function render(song)
{
    const step = 60 / song.bpm / 4, steps = song.bars * 16;
    const len = Math.ceil(steps * step * SR) + (song.loop ? 0 : SR * 2.5);
    const L = new Float32Array(len), R = new Float32Array(len);
    for (const t of song.tracks)
    {
        const pat = t.pat.replace(/\s+/g, '');
        const panL = Math.min(1, 1 - (t.pan || 0)), panR = Math.min(1, 1 + (t.pan || 0));
        for (let s = 0; s < steps; s++)
        {
            const ch = pat[s % pat.length];
            if (!ch || ch === '.' || ch === '-') continue;
            let semis, vol = t.vol ?? 1;
            if (ch === 'x' || ch === 'o') { semis = [t.transpose || 0]; if (ch === 'o') vol *= .55; }
            else if (SCALE[ch] !== undefined) semis = (t.chord || [0]).map(c => SCALE[ch] + c + (t.transpose || 0));
            else continue;
            const start = Math.round(s * step * SR);
            for (const semi of semis)
            {
                const smp = sample(t.inst, semi);
                for (let i = 0; i < smp.length; i++)
                {
                    let k = start + i;
                    if (k >= len) { if (!song.loop) break; k %= len; }
                    const v = smp[i] * vol;
                    L[k] += v * panL; R[k] += v * panR;
                }
            }
        }
    }
    // nén mềm
    const g = song.gain || .6;
    for (let i = 0; i < len; i++) { L[i] = Math.tanh(L[i] * g); R[i] = Math.tanh(R[i] * g); }
    const snd = new Sound();
    if (!snd.sampleRate) return snd; // không có audio
    snd.sampleChannels = [L, R];
    snd.buildSampleBuffer?.();
    snd.loadedPercent = 1;
    snd.output = FX.hall;
    return snd;
}

const rep = (s, n) => s.repeat(n);

// ------------------------------------------------------------- các bài
const SONGS = {
    // Menu (dự phòng khi không tải được HonPhuDong.wav): sáo ngân, đàn gảy, trống trầm thưa
    menuGen: () => render({
        bpm: 76, bars: 8, loop: true, gain: .7, tracks: [
            { inst: 'gong', vol: .7, pat: 'x' + '.'.repeat(63) },
            { inst: 'kick', vol: .7, pat: rep('x.......o.......', 8) },
            { inst: 'tom', vol: .5, pat: rep('........x...o.o.', 8) },
            { inst: 'bau', vol: .5, pan: -.3, pat: rep('F...I...K...I...H...J...L...J...', 4) },
            { inst: 'bass', vol: .6, pat: rep('F.......F.......H.......H.......', 4), transpose: -12 },
            { inst: 'saoL', vol: .55, pan: .25, pat:
                'I.......J...K...' + 'J.......I.......' + 'H...I...J...I...' + 'F...............' +
                'K.......L...M...' + 'L.......K...J...' + 'I...J...H...G...' + 'F...............' },
        ],
    }),
    // Màn 1: hành khúc trống dân gian + sáo, nửa sau thêm guitar remix
    level1: () => render({
        bpm: 112, bars: 8, loop: true, gain: .62, tracks: [
            { inst: 'kick', vol: 1, pat: rep('x...x...x..x....', 7) + 'x...x...x.x.xxxx' },
            { inst: 'tom', vol: .6, pan: .2, pat: rep('..o...o.o.o...oo', 7) + 'oooooooo........' },
            { inst: 'phach', vol: .7, pan: -.3, pat: rep('....x.......x...', 8) },
            { inst: 'hat', vol: .6, pan: .3, pat: rep('..x...x...x...x.', 8) },
            { inst: 'bass', vol: .8, transpose: -12, pat:
                rep('F.F...F.F...F.H.', 2) + rep('H.H...H.H...H.F.', 2) + rep('D.D...D.D...D.F.', 2) + 'F.F...F.F...F.H.' + 'F...F...F...F...' },
            { inst: 'sao', vol: .7, pan: .15, pat:
                'I.....J.K...J.I.' + 'H.......I.H.F...' + 'F.G.I...J...I.H.' + 'I...............' +
                'K.....L.K...J.I.' + 'J.......K.J.I...' + 'I.J.K...J.I.H.F.' + 'F...............' },
            { inst: 'gtr', vol: .55, pan: -.15, chord: [0, 7], transpose: -12, pat:
                '.'.repeat(64) + 'F.FF..F.F.FF..H.' + 'H.HH..H.H.HH..F.' + 'D.DD..D.D.DD..F.' + 'F.F.F.F.FFFFFFFF' },
        ],
    }),
    // Màn 2: quyết chiến — trống dồn + guitar méo nặng
    level2: () => render({
        bpm: 132, bars: 8, loop: true, gain: .58, tracks: [
            { inst: 'gong', vol: .6, pat: 'x' + '.'.repeat(127) },
            { inst: 'kick', vol: 1, pat: rep('x.x...x.x.x...x.', 8) },
            { inst: 'tom', vol: .6, pan: .25, pat: rep('....o.......o.oo', 6) + rep('o.o.o.o.oooooooo', 2) },
            { inst: 'phach', vol: .7, pan: -.3, pat: rep('....x.......x...', 8) },
            { inst: 'hat', vol: .7, pan: .3, pat: rep('x.x.x.x.x.x.x.x.', 8) },
            { inst: 'bass', vol: .85, transpose: -12, pat: rep('E.E.E.E.E.E.D.D.', 4) + rep('C.C.C.C.D.D.E.E.', 4) },
            { inst: 'gtr', vol: .6, pan: -.15, chord: [0, 7], transpose: -12, pat: rep('E.EE.EE.E.EE.D.D', 4) + rep('C.CC.CC.D.DD.E.E', 4) },
            { inst: 'sao', vol: .6, pan: .15, pat:
                'J.....I.J...K...' + 'J...I...F.......' + 'J.....I.J...L...' + 'K...J...I.......' +
                'M.....L.K...L...' + 'K...J...I.......' + 'J...K...L...K...' + 'J...............' },
        ],
    }),
    // Pha 2 của boss: dồn dập hơn, thêm cồng và guitar ngân
    level2b: () => render({
        bpm: 132, bars: 8, loop: true, gain: .55, tracks: [
            { inst: 'gong', vol: .7, pat: 'x' + '.'.repeat(63) },
            { inst: 'kick', vol: 1, pat: rep('x.xxx.x.x.xxx.xx', 8) },
            { inst: 'tom', vol: .7, pan: .25, pat: rep('..o.o..oo.o.oooo', 8) },
            { inst: 'phach', vol: .7, pan: -.3, pat: rep('....x.......x.x.', 8) },
            { inst: 'hat', vol: .7, pan: .3, pat: rep('xxxxxxxxxxxxxxxx', 8) },
            { inst: 'bass', vol: .85, transpose: -12, pat: rep('E.EEE.EEE.EED.DD', 4) + rep('C.CCC.CCD.DDE.EE', 4) },
            { inst: 'gtr', vol: .62, pan: -.2, chord: [0, 7], transpose: -12, pat: rep('EEEEEEEEEEEEDDDD', 4) + rep('CCCCCCCCDDDDEEEE', 4) },
            { inst: 'gtrL', vol: .35, pan: .2, chord: [0, 7, 12], pat: 'J...............' + 'I...............' + 'L...............' + 'K...............' + 'M...............' + 'L...............' + 'O...............' + 'M...............' },
            { inst: 'sao', vol: .55, pan: .1, pat:
                'M.L.K.L.M...O...' + 'M.L.K.J.K.......' + 'M.L.K.L.M...O...' + 'O.M.L.K.J.......' +
                'J.K.L.M.O.M.L.K.' + 'L.K.J.I.J.......' + 'J.K.L.M.O...M...' + 'O...............' },
        ],
    }),
    // Chiến thắng: khúc khải hoàn (không lặp)
    victory: () => render({
        bpm: 120, bars: 4, loop: false, gain: .7, tracks: [
            { inst: 'gong', vol: .8, pat: 'x' + '.'.repeat(47) + 'x' },
            { inst: 'kick', vol: 1, pat: 'x...x...x...x...' + 'x...x...x.x.x...' + 'x...x...x...x...' + 'x.x.x.x.xxxxx...' },
            { inst: 'tom', vol: .7, pat: '..o...o...o...o.' + '..o...o...oooo..' + '..o...o...o...o.' + 'oooooooooooo....' },
            { inst: 'sao', vol: .75, pat: 'F...I...K.......' + 'J.K.L...K.......' + 'K...L...M...L.K.' + 'K...............' },
            { inst: 'gtrL', vol: .4, chord: [0, 7, 12], transpose: -12, pat: 'F...............' + 'J...............' + 'K...............' + 'K...............' },
            { inst: 'bass', vol: .8, transpose: -12, pat: 'F...F...F...F...' + 'J...J...J...J...' + 'K...K...K...K...' + 'F...............' },
        ],
    }),
    // Thất bại: sáo buồn rơi xuống
    defeat: () => render({
        bpm: 70, bars: 2, loop: false, gain: .7, tracks: [
            { inst: 'gong', vol: .6, pat: 'x' + '.'.repeat(31) },
            { inst: 'saoL', vol: .6, pat: 'J...I...H...F...' + 'E.......D.......' },
            { inst: 'bass', vol: .6, transpose: -12, pat: 'F...............' + 'D...............' },
        ],
    }),
};

const songs = {};
let current, currentName, pending;

/** Lấy bài theo tên (tạo khi cần). Bài từ file được tải bất đồng bộ */
export function getSong(name)
{
    if (songs[name]) return songs[name];
    const file = FILE_SONGS[name];
    if (!file) return songs[name] = SONGS[name]();
    return songs[name] = new Sound(file.url, 0, 0, undefined, snd =>
    {
        if (!snd.isLoaded())
        {
            // tải lỗi: chuyển sang bài tự sinh
            console.warn('Không tải được nhạc', file.url, '- dùng nhạc tự sinh');
            songs[name] = getSong(file.fallback);
        }
        if (pending && pending.name === name) { const p = pending; pending = undefined; startSong(p.name, p.volume, p.fade); }
    });
}

const isLoop = name => name !== 'victory' && name !== 'defeat';

function startSong(name, volume, fade)
{
    const snd = getSong(name);
    const inst = snd.play(undefined, .001, 1, 0, isLoop(name));
    inst?.setVolume(volume, fade);
    current = inst; currentName = name;
}

/** Phát nhạc với fade, mặc định lặp; bài từ file chưa tải xong thì phát ngay khi tải xong */
export function playMusic(name, volume = .55, fade = 1)
{
    if (currentName === name && (current || pending)) return;
    stopMusic(fade * .8);
    const snd = getSong(name);
    if (!snd.isLoaded()) { pending = { name, volume, fade }; currentName = name; return; }
    startSong(name, volume, fade);
}

export function stopMusic(fade = .6)
{
    current?.stop(fade);
    current = undefined; currentName = undefined; pending = undefined;
}

/** Render / tải trước các bài (tránh giật khi chuyển màn) */
export function prerenderMusic(names = Object.keys(SONGS))
{
    for (const n of names) getSong(n);
}
