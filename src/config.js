// Hằng số thiết kế lấy từ GDD (IDEAS.md)
import { Color, vec2 } from 'littlejsengine';

/** Bảng màu dân gian */
export const PAL = {
    son: '#B94B3B',     // Đỏ son
    vang: '#D6A65D',    // Vàng đất
    tre: '#557B50',     // Xanh tre
    muc: '#352C2A',     // Nâu mực
    giay: '#F1E1BE',    // Kem giấy
    sat: '#62676B',     // Xám sắt
    canh: '#DB6049',    // Đỏ cảnh báo
};

export const hex = (h, a = 1) => new Color().setHex(h).setAlpha(a);

/** Màu dạng Color cho WebGL / UI */
export const C = {
    son: hex(PAL.son), vang: hex(PAL.vang), tre: hex(PAL.tre), muc: hex(PAL.muc),
    giay: hex(PAL.giay), sat: hex(PAL.sat), canh: hex(PAL.canh),
};

export const PX = 30;                 // pixel thiết kế mỗi đơn vị thế giới (960×540 → 32×18)
export const DESIGN = vec2(960, 540);
export const VIEW_H = 18;             // chiều cao khung nhìn (đơn vị)
export const CAM_Y = 5.4;             // mặt đất nằm ở ~80% chiều cao màn hình
export const ARENA_HALF = 21;         // đấu trường rộng hơn màn hình để parallax có chiều sâu
export const FONT = "'Noto Serif', 'Times New Roman', 'DejaVu Serif', serif";

export const CFG = {
    playerHP: 5,
    rageMax: 100,
    rageGain: 20,
    whipCooldown: .45,
    whipRange: 75 / PX,       // 75px tính từ thân nhân vật
    whipDamage: 1,
    bambooRadius: 140 / PX,   // 140px
    bambooDamage: 3,
    bambooLife: .5,
    iframes: 1,
    playerSpeed: .16,         // đơn vị / frame
    playerHalfW: .5,

    soldierHP: 2,
    soldierSpeed: .16 * .64,  // chậm hơn Gióng ~36%
    soldierHalfW: .5,
    killsNeeded: 12,
    spawnEvery: 3,

    bossHP: 20,
    bossPhase2HP: 10,
    bossSpeed: .055,
    bossHalfW: 1.4,
    bossReach: 100 / PX,      // vùng đánh 100px trước mặt
    bossWindup1: .7, bossRecover1: 1.2,
    bossWindup2: .55, bossRecover2: 1.0,
};
