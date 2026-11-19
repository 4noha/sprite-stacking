"use strict";
// 三面図 → スライスの積層。design.js の絵（front/side/back）の画素だけを読む。
// 各パーツの高さ z の1行について、正面の絵の横幅 × 横の絵の奥行 に内接する丸い断面を作り、
// 面の向きで色の出所を決める（前向き=正面の絵、後ろ向き=背面の絵、横向き=横の絵）。
const run = row => { let a = -1, b = -1; row.forEach((v, i) => { if (v) { if (a < 0) a = i; b = i; } }); return a < 0 ? null : [a, b]; };
function buildVox() {
  const vox = Array.from({length:H}, () => Array.from({length:D}, () => Array(W).fill(null)));
  for (const p of parts) for (let z = 0; z < H; z++) {
    const fx = run(p.front[z]), sy = run(p.side[z]); if (!fx || !sy) continue;
    const rx = (fx[1] - fx[0] + 1) / 2, cx = (fx[0] + fx[1] + 1) / 2, ry = (sy[1] - sy[0] + 1) / 2, cy = (sy[0] + sy[1] + 1) / 2;
    for (let y = sy[0]; y <= sy[1]; y++) for (let x = fx[0]; x <= fx[1]; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.pow(ax, p.n) + Math.pow(ay, p.n) > 1.15) continue;
      const f = p.front[z][x], b = p.back[z][x], s = p.side[z][y];
      vox[z][y][x] = (ax > ay ? s : dy < 0 ? f : b) || f || b || s;
    }
  }
  return vox;
}
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function buildLayers(vox) {
  return vox.map(sl => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = D;
    const g = cv.getContext('2d'), im = g.createImageData(W, D);
    for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) {
      const c = sl[y][x]; if (!c) continue;
      const i = ((D - 1 - y) * W + x) * 4, rgb = hex(c);             // y=0(前) を画像の下へ
      im.data[i] = rgb[0]; im.data[i + 1] = rgb[1]; im.data[i + 2] = rgb[2]; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); return cv;
  });
}
// 透明画素のうち不透明画素に接する所を縁取り色にする（GBA 風の輪郭）
function outline(ctx, x0, y0, w, h, col = [38, 26, 66]) {
  const im = ctx.getImageData(x0, y0, w, h), d = im.data, a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 200 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (a[i]) continue;
    if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  }
  ctx.putImageData(im, x0, y0);
}
function drawStack(ctx, layers, cx, cy, deg, tilt, sp, Z = 1) {   // Z: 描画倍率（1スライスを Z 回重ねて隙間を埋める）
  ctx.imageSmoothingEnabled = false;
  const a = deg * Math.PI / 180;
  layers.forEach((L, z) => {
    for (let k = 0; k < Z; k++) {
      ctx.save(); ctx.translate(cx, Math.round(cy - z * sp * Z - k)); ctx.scale(Z, Z * tilt); ctx.rotate(a);
      ctx.drawImage(L, -W / 2, -D / 2); ctx.restore();
    }
  });
}
// 三面図の1枚を合成する（奥のパーツから順に重ねる）
function compose(kind) {
  const w = kind === 'side' ? D : W, out = Array.from({length:H}, () => Array(w).fill(null));
  const mean = g => { let s = 0, n = 0; g.forEach(r => r.forEach((v, i) => { if (v) { s += i; n++; } })); return n ? s / n : 0; };
  const info = parts.map((p, i) => ({p, i, my: mean(p.side), mx: mean(p.front)}));
  info.sort((A, B) => (kind === 'front' ? B.my - A.my : kind === 'back' ? A.my - B.my : B.mx - A.mx) || A.i - B.i);
  for (const {p} of info) p[kind].forEach((r, z) => r.forEach((c, a) => { if (c) out[z][kind === 'back' ? W - 1 - a : a] = c; }));
  return out;
}
function drawView(ctx, v, x0, y0) { v.forEach((r, z) => r.forEach((c, a) => { if (c) { ctx.fillStyle = c; ctx.fillRect(x0 + a, y0 + H - 1 - z, 1, 1); } })); }
