// Each character is one intersection. Coordinates are zero-based inside the engine.
export const TERRAIN = {
  '.': { name: '平地', cost: 1 },
  ':': { name: '砂地', cost: 4 },
  '#': { name: '森', cost: Infinity },
  '~': { name: '水辺', cost: Infinity }
};

const layouts = [
  ['river', '川辺の町', [
    '...##......~~..',
    '...##..#...~~..',
    '.......#.......',
    '.##....#...~...',
    '.S.:::::::...G.',
    '...:..##:..~...',
    '.##...##...~~..',
    '......#....~~..',
    '..##.......~~..'
  ]],
  ['sand', '砂丘の集落', [
    '.........#.....',
    '.###...:::.##..',
    '....#..:::.....',
    '....#..:::..#..',
    '.S..:::::::..G.',
    '....#..:::..#..',
    '.......:::..#..',
    '..##.......##..',
    '...............'
  ]],
  ['pass', '森の峠', [
    '..#....#.....G.',
    '..#.#..#.##....',
    '....#....#..##.',
    '.#####.###.....',
    '...:::...#..##.',
    '...###.#.#...#.',
    '....#..#...#...',
    '.S..#..#####...',
    '.......:::::...'
  ]]
];

export const maps = layouts.map(([id, name, rows]) => {
  const cells = [...rows.join('')];
  const start = cells.indexOf('S');
  const goal = cells.indexOf('G');
  cells[start] = cells[goal] = '.';
  return { id, name, cols: rows[0].length, rows: rows.length, cells, start, goal };
});

export function neighbours(map, cell) {
  const x = cell % map.cols;
  const y = Math.floor(cell / map.cols);
  return [
    x < map.cols - 1 ? cell + 1 : -1,
    y < map.rows - 1 ? cell + map.cols : -1,
    x > 0 ? cell - 1 : -1,
    y > 0 ? cell - map.cols : -1
  ].filter(i => i >= 0 && Number.isFinite(TERRAIN[map.cells[i]].cost));
}
