import {spawn} from 'node:child_process';

const port=String(4200 + Math.floor(Math.random()*500));
const base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('../',import.meta.url).pathname,
  env:{...process.env,PORT:port},
  stdio:['ignore','pipe','pipe']
});
let ready=false;
for(let attempt=0;attempt<40;attempt++){
  try {const response=await fetch(base+'/api/relay');if(response.ok){ready=true;break;}}
  catch {}
  await new Promise(resolve=>setTimeout(resolve,150));
}
try {
  if(!ready)throw new Error('시연 서버 시작 실패');
  const tablet=await fetch(base+'/tablet');
  const monitor=await fetch(base+'/monitor');
  const mock=await fetch(base+'/mock/quiz.json');
  if(!tablet.ok||!monitor.ok||!mock.ok)throw new Error('정적 페이지/공개 예시 데이터 로딩 실패');
  const update={type:'playing',place_name:'화포천습지생태공원',image_url:'/assets/places/GIMHAE_013.jpg'};
  const response=await fetch(base+'/api/relay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(update)});
  const saved=await (await fetch(base+'/api/relay')).json();
  if(!response.ok||saved.type!=='playing'||saved.place_name!==update.place_name)
    throw new Error('모니터 상태 공유 실패');
  console.log('PASS: 태블릿/모니터 페이지, 공개 예시 데이터, 영상 상태 중계');
}finally {server.kill('SIGTERM');}
