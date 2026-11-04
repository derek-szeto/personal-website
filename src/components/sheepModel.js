// Shared geometry for the SVG illustrations and the Three.js models.
// The sheep faces +Z: a white wool body, wool hood, tan face and brown legs.
export const sheepPalette = {
  wool: { top: '#f4f4f3', front: '#d6d7d6', side: '#a9abaa', patch: '#7f8280' },
  skin: { top: '#a58c75', front: '#957b65', side: '#705a49', patch: '#564536' },
  hoof: { top: '#6c5745', front: '#67513f', side: '#493b30', patch: '#30291f' },
  white: { top: '#fafaf8', front: '#f4f3ef', side: '#d0d1cb', patch: '#a8aba2' },
  black: { top: '#242522', front: '#121411', side: '#171a16', patch: '#121411' },
  pink: { top: '#cf9b9e', front: '#c48d91', side: '#a76e75', patch: '#945f68' },
};
const part = (id, position, size, material, group) => ({ id, position, size, material, group });
function leg(x, z, name, group) {
  return [
    part(`${name}-leg`, [x, .32, z], [.34, .64, .38], 'skin', group),
    part(`${name}-hoof`, [x, .065, z], [.34, .13, .38], 'hoof', group),
    part(`${name}-cuff`, [x, .69, z], [.48, .4, .5], 'wool', group),
  ];
}
export const sheepParts = [
  ...leg(-.48, -.74, 'back-left', 'back-legs'),
  ...leg(.48, -.74, 'back-right', 'back-legs'),
  part('tail', [0, 1.29, -1.24], [.32, .38, .26], 'wool', 'body'),
  part('body', [0, 1.4, 0], [1.42, 1.35, 2.25], 'wool', 'body'),
  ...leg(-.48, .74, 'front-left', 'front-legs'),
  ...leg(.48, .74, 'front-right', 'front-legs'),
  part('hood', [0, 1.55, 1.36], [1.05, 1.03, .94], 'wool', 'head'),
  part('face', [0, 1.48, 1.845], [.84, .77, .055], 'skin', 'head'),
  part('forehead-left', [-.31, 1.84, 1.886], [.24, .12, .035], 'wool', 'head'),
  part('forehead-right', [.2, 1.84, 1.886], [.36, .12, .035], 'wool', 'head'),
  part('eye-left', [-.27, 1.57, 1.891], [.22, .2, .025], 'white', 'eyes'),
  part('eye-right', [.27, 1.57, 1.891], [.22, .2, .025], 'white', 'eyes'),
  part('pupil-left', [-.32, 1.57, 1.912], [.12, .2, .025], 'black', 'eyes'),
  part('pupil-right', [.32, 1.57, 1.912], [.12, .2, .025], 'black', 'eyes'),
  part('nose', [0, 1.31, 1.891], [.3, .18, .03], 'pink', 'head'),
  part('mouth', [0, 1.17, 1.891], [.3, .1, .03], 'skin', 'head'),
];
// Stable pixel pattern: no image downloads, random flickering, or smooth gradients.
export function sheepPixel(x, y, seed = 0) {
  return ((x * 37 + y * 61 + seed * 17 + x * y * 13) % 101);
}