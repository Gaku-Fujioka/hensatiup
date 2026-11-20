import { TERRAIN } from './maps.js';

const tree = [
  '    aa    ', '    ab    ', '   aabb   ', '   acbb   ', '  accabb  ',
  '   accb   ', '  acccbb  ', ' accccabb ', 'accdccaabb', '  eeeeeb  ', '    tt    ', '    tt    '
];
const palette = { a:'#307858', b:'#266549', c:'#4a9364', d:'#75aa73', e:'#3d8056', t:'#876c42' };

function sprite(ctx, pattern, x, y, scale) {
  pattern.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === ' ') return;
    ctx.fillStyle = palette[c];
    ctx.fillRect(x+i*scale, y+j*scale, scale, scale);
  }));
}

function tile(ctx, type, x, y, seed) {
  const colors = ['#dce8af','#d6e4a7','#dae6ac','#d3e2a4'];
  ctx.fillStyle = type === '~' ? '#9ccbd0' : type === ':' ? '#eace93' : type === '#' ? '#b9d396' : colors[seed % 4];
  ctx.fillRect(x,y,40,40);
  if (type === '#') {
    ctx.fillStyle = '#a1be85';
    ctx.fillRect(x+4,y+29,22,4);
    sprite(ctx, tree, x+3, y+9, 2);
    sprite(ctx, tree, x+15, y+1, 2);
    return;
  }
  for (let n=0; n<4; n++) {
    const dx = x + 3 + ((seed*7+n*11)%30);
    const dy = y + 4 + ((seed*11+n*17)%28);
    if (type === '~') {
      ctx.fillStyle = n%2 ? '#aad9d7' : '#81b8be';
      ctx.fillRect(dx-2,dy,5+n,1.6);
      ctx.fillRect(dx+3+n,dy-1.5,3,1.6);
    } else if (type === ':') {
      ctx.fillStyle = n%2 ? '#f7deaa' : '#c5a56b';
      ctx.fillRect(dx,dy,3,2);
    } else {
      ctx.fillStyle = n%2 ? '#bed298' : '#c5d89a';
      ctx.fillRect(dx,dy,2,3);
      ctx.fillRect(dx+2,dy+2,2,2);
      if (seed%11===0 && n<2) {
        ctx.fillStyle = '#fff3c0';
        ctx.fillRect(dx-2,dy,3,2);
        ctx.fillStyle = '#d3a34d';
        ctx.fillRect(dx,dy,2,2);
      }
    }
  }
}

export function coordinates(map, cell) {
  return String.fromCharCode(65+cell%map.cols) + (Math.floor(cell/map.cols)+1);
}

export function boardLabel(map, cell) {
  return coordinates(map,cell) + ' ' + (cell===map.start ? '出発地' : cell===map.goal ? '目的地' : TERRAIN[map.cells[cell]].name);
}

let cache;
function terrainLayer(map) {
  const key = [map.cols,map.rows,map.cells.join('')].join('/');
  if (cache?.key === key) return cache.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = map.cols*40;
  canvas.height = map.rows*40;
  const ctx = canvas.getContext('2d');
  for (let i=0; i<map.cells.length; i++) {
    const x = (i%map.cols)*40, y = Math.floor(i/map.cols)*40;
    tile(ctx,map.cells[i],x,y,(i*97+(i%map.cols)*13)%997);
    ctx.strokeStyle = 'rgba(84,109,65,.16)';
    ctx.strokeRect(x+.5,y+.5,39.5,39.5);
  }
  cache = { key, canvas };
  return canvas;
}

export function draw(canvas, map, result, index, cursor) {
  const unit = 40, w = map.cols*unit, h = map.rows*unit;
  const scale = Math.max(1,Math.min(3,window.devicePixelRatio || 1));
  if (canvas.width !== w*scale || canvas.height !== h*scale) {
    canvas.width = w*scale; canvas.height = h*scale;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.drawImage(terrainLayer(map),0,0);
  const center = cell => [(cell%map.cols+.5)*unit,(Math.floor(cell/map.cols)+.5)*unit];
  function shade(i, fill) {
    const [x,y] = center(i);
    ctx.fillStyle = fill; ctx.fillRect(x-19,y-19,38,38);
  }
  const frame = result.frames[index];
  result.frames.slice(1,index+1).forEach(f => shade(f.current,'rgba(29,140,128,.30)'));
  for (const i of frame.frontier) {
    if (index===0) continue;
    const [x,y]=center(i);
    ctx.fillStyle='#407a8a'; ctx.fillRect(x-3,y-3,6,6);
  }
  if (frame.current!==null) {
    const [x,y] = center(frame.current);
    ctx.strokeStyle='#225950'; ctx.lineWidth=3; ctx.strokeRect(x-15,y-15,30,30);
  }
  if (index===result.frames.length-1 && result.path.length) {
    ctx.beginPath();
    result.path.forEach((i,n) => n ? ctx.lineTo(...center(i)) : ctx.moveTo(...center(i)));
    ctx.lineWidth=8; ctx.strokeStyle='#fff5c8'; ctx.lineJoin='round'; ctx.stroke();
    ctx.lineWidth=4; ctx.strokeStyle='#b6721e'; ctx.stroke();
  }
  for (const [i,label,color] of [[map.start,'S','#246c53'],[map.goal,'G','#b9682c']]) {
    const [x,y] = center(i);
    ctx.fillStyle='rgba(62,71,41,.18)'; ctx.fillRect(x-14,y-11,28,29);
    ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x-15,y-16,30,30,6); ctx.fill();
    ctx.strokeStyle='#fff7d9'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 20px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(label,x,y);
  }
  if (cursor!==null) {
    const [x,y]=center(cursor);
    ctx.strokeStyle='#182b39'; ctx.lineWidth=2; ctx.setLineDash([3,2]);ctx.strokeRect(x-17,y-17,34,34);ctx.setLineDash([]);
  }
}
