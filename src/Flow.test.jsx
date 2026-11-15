// @vitest-environment jsdom
import React from 'react';
import {afterEach, beforeAll, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';

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
    publishDisplay:vi.fn()
  };
});

import App from './App.jsx';

beforeAll(()=>{window.scrollTo=vi.fn();});
afterEach(()=>cleanup());

it('시작→7문항→전자신문→기사→영상 상영→마무리까지 이어진다',async()=>{
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
  fireEvent.click(screen.getByRole('button',{name:'감상 마치기'}));
  expect(document.querySelector('.end-body')).toBeTruthy();
},15000);
