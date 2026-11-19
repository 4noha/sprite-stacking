"use strict";
// ============================================================================
// 東雲はつり 2.5頭身・三面図（正面 32×48 / 横 24×48 / 背面 32×48）
// パーツごとに3つの絵を持つ。ここは「設計」だけで、立体化は stack.js が絵から行う。
// 座標: x=左右(0..31) / y=前後(0=前, 23=後ろ) / z=高さ(0=足元, 47=耳の先)
// 頭は z26..44 に帽子と耳を足して約19〜21px → 48px に対して約2.5頭身。
// ============================================================================
const W = 32, D = 24, H = 48, CX = 15.5, CY = 11.5;
const P = {
  H1:'#d9c8ff', H2:'#ab8df2', H3:'#7c5fd0',           // 髪（薄紫）
  S1:'#ffe3d0', S2:'#f2b49c', BL:'#ff9db2', MO:'#c9506e', // 肌・頬・口
  E1:'#45dccd', E2:'#178f8a', WH:'#ffffff',           // 瞳（ティール）
  W1:'#ffffff', W2:'#d6d2ea', K1:'#37323f', K2:'#1b1824', // 白・黒
  T:'#35c2b6',                                        // ティール（つば裏・紐先・髪ゴム）
  P1:'#9463e6', P2:'#7446c6', P3:'#55309a',           // パーカー・靴（紫）
  V1:'#e8dcff', V2:'#c4b1f3', PK:'#ffb7cc',           // 袖（白ラベンダー）・耳の内側
};
const parts = [];
const grid = w => Array.from({length:H}, () => Array(w).fill(null));
function part(name, n = 2) { const p = {name, n, front:grid(W), back:grid(W), side:grid(D)}; parts.push(p); return p; }
// 輪郭: 高さ z ごとに 正面の幅(cx±hw) と 横の奥行(cy±hd) を塗る
function prof(p, z0, z1, f) {
  for (let z = z0; z <= z1; z++) {
    const r = f(z), cx = r.cx ?? CX, cy = r.cy ?? CY;
    for (let x = Math.ceil(cx - r.hw); x <= Math.floor(cx + r.hw); x++) if (x >= 0 && x < W) p.front[z][x] = p.back[z][x] = r.c;
    for (let y = Math.ceil(cy - r.hd); y <= Math.floor(cy + r.hd); y++) if (y >= 0 && y < D) p.side[z][y] = r.c;
  }
}
// 描き込み: 輪郭の内側だけに色を置く
function px(g, a, z, c) { if (z >= 0 && z < H && a >= 0 && a < g[z].length && g[z][a] != null) g[z][a] = c; }
function box(g, a0, a1, z0, z1, c) { for (let z = z0; z <= z1; z++) for (let a = a0; a <= a1; a++) px(g, a, z, c); }
function sym(g, a, z, c) { px(g, a, z, c); px(g, W - 1 - a, z, c); }
function symbox(g, a0, a1, z0, z1, c) { for (let z = z0; z <= z1; z++) for (let a = a0; a <= a1; a++) sym(g, a, z, c); }
function mirror(p) { parts.push({name:p.name.replace('左','右'), n:p.n, front:p.front.map(r => r.slice().reverse()), back:p.back.map(r => r.slice().reverse()), side:p.side.map(r => r.slice())}); }

// ---- ツインテール（低め・膝まで）----
{ const p = part('ツインテ左');
  prof(p, 6, 31, z => { const t = (30 - z) / 24, s = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    const hw = z >= 29 ? 1 : t < 0.2 ? 2 : t < 0.75 ? 3 : t < 0.92 ? 2 : 1;
    return {cx: 5.5 - Math.round(2 * s) - (hw === 3 ? 1 : 0) + (hw === 3 ? 1 : 0), hw, cy: 13.5, hd: hw >= 2 ? 2 : 1, c: z >= 29 ? P.T : z <= 9 ? P.H3 : P.H2}; });
  for (const g of [p.front, p.back, p.side]) { box(g, 0, 31, 20, 21, P.H1); }
  for (let z = 10; z <= 28; z++) { const r = p.front[z], a = r.findIndex(v => v), b = r.lastIndexOf(r.filter(v => v).pop()); if (a >= 0 && b > a + 1) { px(p.front, a, z, P.H3); px(p.back, a, z, P.H3); } }
  mirror(p); }
// ---- 猫しっぽ + 付け根の白リボン ----
{ const p = part('しっぽ');
  prof(p, 10, 23, z => ({cx: 15.5 + Math.round((z - 10) / 13 * 4), hw: 1, cy: 17.5 + Math.round(Math.min(1, (z - 10) / 5) * 4), hd: 1, c: z >= 22 ? P.H1 : P.H2}));
  const r = part('リボン', 4); prof(r, 11, 12, z => ({cx: 16, hw: 2, cy: 19, hd: 2, c: z === 11 ? P.W2 : P.W1})); }
// ---- フード ----
{ const p = part('フード');
  prof(p, 21, 27, z => ({hw: z >= 27 ? 5 : 6, cy: 17.5, hd: z >= 27 || z <= 21 ? 2 : 3, c: z <= 21 ? P.P3 : P.P2})); }
// ---- 脚（白ソックス＋紫ライン）と靴（紫ハイカット）----
{ const p = part('脚左');
  prof(p, 4, 9, z => ({cx: 12, hw: 1, hd: 2, c: z <= 5 ? P.W1 : z === 6 ? P.P1 : z === 9 ? P.S2 : P.S1}));
  mirror(p);
  const s = part('靴左', 4);
  prof(s, 0, 3, z => z <= 1 ? {cx: 12, hw: 2, cy: 10.5, hd: 4.5, c: z === 0 ? P.W1 : P.P2}
                    : z === 2 ? {cx: 12, hw: 2, cy: 11, hd: 4, c: P.P2} : {cx: 12, hw: 2, cy: 11.5, hd: 2.5, c: P.P1});
  box(s.front, 10, 14, 1, 1, P.W1); px(s.front, 12, 2, P.W1); px(s.front, 12, 3, P.W1);   // つま先・靴紐
  box(s.side, 6, 7, 1, 1, P.W1); box(s.side, 10, 11, 2, 2, P.W1); box(s.back, 10, 14, 1, 2, P.P3);
  mirror(s); }
// ---- パーカー（腿丈・白リブ裾・猫顔パッチのポケット）----
{ const p = part('パーカー', 3);
  prof(p, 9, 25, z => ({hw: z <= 14 ? 8 : z <= 21 ? 7 : z <= 23 ? 6 : 5, hd: z <= 14 ? 6 : z <= 21 ? 5 : 4,
                        c: z === 9 ? P.W2 : z === 10 ? P.W1 : z >= 24 ? P.P2 : P.P1}));
  box(p.front, 12, 19, 12, 15, P.P2); box(p.front, 12, 19, 16, 16, P.P3);               // ポケット
  box(p.front, 11, 11, 12, 15, P.P3); box(p.front, 20, 20, 12, 15, P.P3);
  box(p.front, 13, 18, 13, 14, P.W1); sym(p.front, 13, 15, P.W1); sym(p.front, 14, 14, P.K2); // 猫顔パッチ
  symbox(p.front, 14, 14, 19, 23, P.W1); sym(p.front, 14, 19, P.T);                     // 紐
  box(p.side, 6, 7, 12, 16, P.P2);
  box(p.back, 15, 16, 11, 20, P.P2); }
// ---- 腕（白ラベンダーの袖・紫カフス・黒手袋）----
{ const p = part('腕左');
  prof(p, 10, 23, z => ({cx: z >= 22 ? 8 : z >= 15 ? 7 : 6, hw: z >= 22 ? 1.5 : 1, hd: 2,
                         c: z <= 11 ? P.K1 : z === 12 ? P.P2 : z === 13 ? P.P1 : z === 17 || z === 21 ? P.V2 : P.V1}));
  mirror(p); }
// ---- 首掛けヘッドホン ----
{ const b = part('ヘッドホン帯'); prof(b, 24, 25, () => ({hw: 7, cy: 12.5, hd: 6, c: P.W2}));
  const c = part('ヘッドホン左', 3);
  prof(c, 21, 25, () => ({cx: 10, hw: 2, cy: 6.5, hd: 2, c: P.W1}));
  box(c.front, 9, 11, 22, 24, P.V2); px(c.front, 10, 23, P.P1); box(c.side, 5, 5, 22, 24, P.V2);
  mirror(c); }
// ---- 頭（顔・前髪・後ろ髪）----
{ const p = part('頭');
  const k = z => Math.pow(Math.max(0, 1 - Math.pow(Math.abs((z - 35) / 9.6), 2.4)), 1 / 2.4);
  prof(p, 26, 44, z => ({hw: Math.max(4, Math.round(10 * k(z))), hd: Math.max(4, Math.round(9 * k(z))), c: z <= 27 ? P.H3 : P.H2}));
  const bz = [34, 35, 37, 37, 36, 37, 36, 35];           // 前髪の下端（x=8..15、左右対称）
  for (let z = 26; z <= 37; z++) for (let x = 0; x < W; x++) {
    const i = x <= 15 ? x - 8 : 23 - x;
    if (z <= 29 || (i >= 0 && z < bz[i])) px(p.front, x, z, z > 29 && z === bz[i] - 1 ? P.S2 : P.S1);
  }
  // 目（3×4）・頬・口
  [[P.K2, P.K2, P.K2], [P.E2, P.E2, P.WH], [P.E2, P.E1, P.E1], [P.E1, P.E1, P.E1]].forEach((row, r) => row.forEach((c, i) => sym(p.front, 10 + i, 33 - r, c)));
  sym(p.front, 9, 29, P.BL); sym(p.front, 10, 29, P.BL); box(p.front, 15, 16, 28, 28, P.MO);
  // 横: 顔は前側だけ、目を1つ
  for (let z = 26; z <= 36; z++) for (let y = 0; y <= (z <= 29 ? 9 : 6); y++) px(p.side, y, z, P.S1);
  box(p.side, 4, 5, 33, 33, P.K2); box(p.side, 4, 5, 30, 32, P.E2); box(p.side, 5, 5, 30, 31, P.E1);
  box(p.side, 9, 16, 35, 36, P.H1);
  // 背面: つや
  box(p.back, 9, 13, 35, 35, P.H1); box(p.back, 18, 22, 35, 35, P.H1); }
// ---- キャップ（前が白・後ろが黒・つばは黒で裏がティール）----
{ const hw = [11, 10, 10, 10, 9, 8, 7, 5, 3], hd = [10, 10, 9, 9, 8, 7, 6, 4, 2];
  const p = part('キャップ');
  prof(p, 38, 46, z => ({hw: hw[z - 38], hd: hd[z - 38], c: P.W1}));
  for (let z = 38; z <= 46; z++) { box(p.back, 0, 31, z, z, z === 38 ? P.K2 : P.K1); for (let y = 12; y < D; y++) px(p.side, y, z, P.K1); }
  box(p.front, 15, 16, 41, 42, P.T);                                                   // 前のマーク
  box(p.front, 0, 31, 46, 46, P.K1); box(p.side, 0, 23, 46, 46, P.K1);                 // てっぺんのボタン
  box(p.front, 21, 26, 39, 43, P.W2);                                                  // 前パネルの影
  box(p.back, 14, 17, 38, 39, P.H2);                                                   // 後ろのアジャスター穴から髪
  const b = part('つば');
  prof(b, 38, 39, z => ({hw: 9, cy: 3.5, hd: 3.5, c: z === 38 ? P.T : P.K1})); }
// ---- 猫耳（キャップを貫通）----
{ const p = part('猫耳左');
  prof(p, 43, 47, z => z <= 45 ? {cx: 9.5, hw: 2, hd: 2, c: P.H2} : z === 46 ? {cx: 9.5, hw: 1, hd: 1, c: P.H2} : {cx: 9, hw: 0.5, hd: 1, c: P.H3});
  box(p.front, 9, 10, 44, 45, P.PK);
  mirror(p); }
