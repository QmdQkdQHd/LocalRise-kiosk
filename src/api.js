import { quizFallback, demoPersonalization } from './data.js';

const params = new URLSearchParams(window.location.search);
export const liveMode = params.get('live') === '1';
export const demoSeconds = Math.max(4, Number(params.get('demoSec') || 12));

async function json(url, options={}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('서버 응답 오류: ' + response.status);
  return response.json();
}

export async function loadQuiz() {
  if (!liveMode) return quizFallback;
  const payload = await json('/quiz');
  return payload.questions || payload;
}

export async function loadRecommendations(answers) {
  if (!liveMode) {
    await new Promise(resolve => setTimeout(resolve, 750));
    return demoPersonalization(answers);
  }
  return json('/recommend_quiz', {
    method:'POST',
    body: JSON.stringify({ answers })
  });
}

export async function startGeneration(place, sessionId) {
  if (!liveMode) return {task_id:'demo_' + sessionId, started:Date.now()};
  return json('/api/videos', {
    method:'POST',
    body:JSON.stringify({place_id:place.place_id, session_id:sessionId})
  });
}

export async function generationStatus(task) {
  if (!liveMode) {
    const progress = Math.min(100, Math.round((Date.now()-task.started) / (demoSeconds*1000) * 100));
    return {status:progress>=100?'succeeded':'running',progress, result:{}};
  }
  return json('/api/video-status/' + encodeURIComponent(task.task_id));
}

const channel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('localrise-display')
  : null;

export function publishDisplay(data) {
  const payload = { ...data, stamp:Date.now() };
  // BroadcastChannel/localStorage cover local preview; HTTP relay covers different devices.
  channel?.postMessage(payload);
  try { localStorage.setItem('localrise-display', JSON.stringify(payload)); } catch { /* private mode */ }
  fetch('/api/relay', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),
    keepalive:true
  }).catch(() => {});
}

export function subscribeDisplay(callback) {
  let latestStamp = 0;
  const deliver = value => {
    if (!value || typeof value !== 'object') return;
    const stamp = Number(value.stamp || 0);
    if (stamp && stamp < latestStamp) return;
    latestStamp = stamp;
    callback(value);
  };
  const channelListener = event => deliver(event.data);
  channel?.addEventListener('message', channelListener);
  const storageListener = event => {
    if (event.key !== 'localrise-display' || !event.newValue) return;
    try { deliver(JSON.parse(event.newValue)); } catch {}
  };
  window.addEventListener('storage', storageListener);
  try {
    const saved = localStorage.getItem('localrise-display');
    if (saved) deliver(JSON.parse(saved));
  } catch {}

  let eventSource;
  try {
    eventSource = new EventSource('/api/relay/events');
    eventSource.onmessage = event => {
      try { deliver(JSON.parse(event.data)); } catch {}
    };
  } catch { /* dev mode can run without a relay */ }
  const interval = setInterval(async () => {
    try { deliver(await json('/api/relay')); } catch {}
  }, 2500);
  return () => {
    channel?.removeEventListener('message', channelListener);
    window.removeEventListener('storage', storageListener);
    eventSource?.close();
    clearInterval(interval);
  };
}

export function videoFromStatus(status) {
  const result = status?.result || {};
  return status?.video_url || result?.video_url || result?.output_url ||
    result?.url || result?.video?.url || '';
}
