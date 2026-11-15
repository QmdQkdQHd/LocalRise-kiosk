// @vitest-environment jsdom
import React from 'react';
import {afterEach, beforeAll, expect, it, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';

const relay=vi.hoisted(()=>({listeners:new Set()}));

vi.mock('./api.js', async (importOriginal)=>{
  const original=await importOriginal();
  const {quizFallback,demoPersonalization}=await import('./data.js');
  return {
    ...original,
    liveMode:false,
    loadQuiz:vi.fn(async()=>quizFallback),
    loadRecommendations:vi.fn(async(answers)=>demoPersonalization(answers)),
    startGeneration:vi.fn(async()=>({task_id:'test_video'})),
    generationStatus:vi.fn(async()=>({status:'succeeded',progress:100,result:{}})),
    publishDisplay:vi.fn(),
    subscribeDisplay:vi.fn(callback=>{
      relay.listeners.add(callback);
      return ()=>relay.listeners.delete(callback);
    })
  };
});

import App, {Monitor, Waiting} from './App.jsx';
import {publishDisplay, startGeneration} from './api.js';

beforeAll(()=>{window.scrollTo=vi.fn();});
afterEach(()=>{cleanup();relay.listeners.clear();vi.clearAllMocks();});

it('첫 영상 감상 후 동일한 추천 신문에서 다른 여행지 영상을 다시 생성할 수 있다',async()=>{
  render(<App/>);
  fireEvent.click(screen.getByRole('button',{name:/시작하기/}));
  await waitFor(()=>expect(screen.getByText('이번 여행, 누구와 함께하나요?')).toBeTruthy(),{timeout:5000});
  for(let i=0;i<7;i++){
    const options=document.querySelectorAll('.answer-option');
    expect(options.length).toBe(2);
    fireEvent.click(options[i%2]);
    if(i<6) await waitFor(()=>expect(screen.getByText('Q'+(i+2))).toBeTruthy(),{timeout:2000});
  }
  await waitFor(()=>expect(document.querySelector('.paper-lead')).toBeTruthy(),{timeout:3000});
  fireEvent.click(document.querySelector('.paper-lead'));
  expect(document.querySelector('.detail-paper')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/이 여행지 영상 만들기/}));
  await waitFor(()=>expect(document.querySelector('.playing-body')).toBeTruthy(),{timeout:2000});
  fireEvent.click(screen.getByRole('button',{name:'다른 추천지 영상 보기'}));
  expect(document.querySelector('.paper-lead')).toBeTruthy();
  expect(document.querySelectorAll('.paper-story').length).toBe(4);
  fireEvent.click(document.querySelector('.paper-story'));
  fireEvent.click(screen.getByRole('button',{name:/이 여행지 영상 만들기/}));
  await waitFor(()=>expect(document.querySelector('.playing-body')).toBeTruthy(),{timeout:2000});
  expect(startGeneration).toHaveBeenCalledTimes(2);
  const playingMessages=vi.mocked(publishDisplay).mock.calls.map(([message])=>message)
    .filter(message=>message.type==='playing');
  expect(playingMessages).toHaveLength(2);
  expect(playingMessages[0].playback_id).not.toBe(playingMessages[1].playback_id);
  act(()=>{
    for(const listener of relay.listeners)listener({type:'finished',playback_id:playingMessages[0].playback_id});
  });
  expect(document.querySelector('.playing-body')).toBeTruthy();
  act(()=>{
    for(const listener of relay.listeners)listener({type:'finished',playback_id:playingMessages[1].playback_id});
  });
  expect(document.querySelector('.paper-lead')).toBeTruthy();
},15000);

it('모니터에서 영상이 종료되면 해당 재생의 종료 신호를 보낸다',()=>{
  const {container}=render(<Monitor/>);
  act(()=>{
    for(const listener of relay.listeners)listener({type:'playing',video_url:'/demo.mp4',playback_id:'play-2'});
  });
  const video=container.querySelector('video');
  expect(video).toBeTruthy();
  fireEvent.ended(video);
  expect(publishDisplay).toHaveBeenCalledWith({type:'finished',playback_id:'play-2'});
});

it('백엔드가 진행률을 주지 않으면 임의의 숫자 대신 생성 중으로 표시한다',()=>{
  const {container}=render(<Waiting place={{place_name:'국립김해박물관'}} progress={null} error=""/>);
  expect(screen.getByText('생성 중')).toBeTruthy();
  expect(container.querySelector('.progress-track.is-indeterminate')).toBeTruthy();
  expect(container.querySelector('[aria-valuenow]')).toBeNull();
});
