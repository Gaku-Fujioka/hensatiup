import http from 'node:http';
import { readFile } from 'node:fs/promises';

const mime = { html:'text/html', css:'text/css', js:'text/javascript', svg:'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req,res) => {
  const path = req.url.split('?')[0];
  const file = path==='/' ? 'index.html' : path.slice(1);
  if (!/^(index\.html|styles\.css|icon\.svg|src\/[a-z-]+\.js)$/.test(file)) {
    res.writeHead(404).end(); return;
  }
  try {
    const body = await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'Content-Type':mime[file.split('.').at(-1)]+'; charset=utf-8','Cache-Control':'no-cache'}).end(body);
  } catch { res.writeHead(404).end(); }
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('RouteLab http://127.0.0.1:'+server.address().port));
