import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lightweight same-Wi-Fi relay. It is not a public production authentication system.
const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4174);
const upstream = process.env.API_UPSTREAM?.replace(/\/$/, '');
let state = { type:'idle', stamp:Date.now() };
const clients = new Set();
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.woff':'font/woff', '.woff2':'font/woff2', '.mp4':'video/mp4',
  '.svg':'image/svg+xml', '.ico':'image/x-icon'
};
const sendJSON = (res, obj, status=200) => {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
};

async function readJSON(req) {
  let body='';
  for await (const chunk of req) {
    body += chunk;
    if (body.length>100000) throw new Error('payload too large');
  }
  return JSON.parse(body || '{}');
}

function relay(update) {
  state={ ...update, stamp:Date.now() };
  const packet='data: '+JSON.stringify(state)+'\n\n';
  for (const res of clients) { try { res.write(packet); } catch { clients.delete(res); } }
}

async function proxy(req,res,url) {
  if (!upstream) return sendJSON(res,{error:'API_UPSTREAM is not configured'},503);
  const headers={'Content-Type':'application/json'};
  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') body = JSON.stringify(await readJSON(req));
  try {
    const response=await fetch(upstream+url.pathname+url.search,{method:req.method,headers,body});
    res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'});
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { sendJSON(res,{error:'upstream unavailable',detail:error.message},502); }
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/', 'http://localhost');
  try {
    if (url.pathname==='/api/relay/events' && req.method==='GET') {
      res.writeHead(200,{
        'Content-Type':'text/event-stream; charset=utf-8',
        'Cache-Control':'no-cache, no-transform','Connection':'keep-alive',
        'X-Accel-Buffering':'no'
      });
      res.write('data: '+JSON.stringify(state)+'\n\n');
      clients.add(res);
      const timer=setInterval(()=>{ try { res.write(': keep-alive\n\n'); } catch {} },15000);
      req.on('close',()=>{clearInterval(timer);clients.delete(res);});
      return;
    }
    if (url.pathname==='/api/relay') {
      if (req.method==='GET') return sendJSON(res,state);
      if (req.method==='POST') { relay(await readJSON(req)); return sendJSON(res,{ok:true}); }
    }
    if (upstream && (url.pathname==='/quiz'||url.pathname==='/recommend_quiz'||
        url.pathname==='/api/videos'||url.pathname.startsWith('/api/video-status/')))
      return await proxy(req,res,url);

    const pathname = decodeURIComponent(url.pathname);
    const requested = pathname==='/' || pathname==='/tablet' || pathname==='/monitor'
      ? '/index.html' : pathname;
    const resolved=path.resolve(dist,'.'+requested);
    if (!resolved.startsWith(dist+path.sep) && resolved!==path.join(dist,'index.html'))
      return sendJSON(res,{error:'not found'},404);
    fs.stat(resolved,(error,info)=>{
      if (error || !info.isFile()) return sendJSON(res,{error:'not found'},404);
      res.writeHead(200,{
        'Content-Type':mime[path.extname(resolved)]||'application/octet-stream',
        'Cache-Control':path.extname(resolved)==='.html'?'no-store':'public, max-age=3600'
      });
      fs.createReadStream(resolved).pipe(res);
    });
  } catch (error) {
    sendJSON(res,{error:error.message},400);
  }
});
server.listen(port,'0.0.0.0',()=>{
  process.stdout.write('LocalRise http://localhost:'+port+'/tablet | /monitor\n');
  if (upstream) process.stdout.write('Backend proxy connected\n');
});
