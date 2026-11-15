// @vitest-environment jsdom
import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {Newspaper, Quiz} from './App.jsx';
import {demoPlaces, quizFallback} from './data.js';

afterEach(()=>{cleanup();vi.restoreAllMocks();});

describe('김해시보 전자신문',()=>{
  it('5개 추천을 신문 기사로 표현하며 카드 버튼 문구가 없다',()=>{
    const open=vi.fn();
    render(<Newspaper places={demoPlaces} persona="자연 속에서 쉬는 여행자" answers={{}} questions={quizFallback} onOpen={open} onRestart={()=>{}}/>);
    expect(screen.getByRole('heading',{name:'김해시보'})).toBeTruthy();
    expect(screen.getByText('화포천습지생태공원,',{exact:false})).toBeTruthy();
    expect(document.querySelectorAll('.paper-story').length).toBe(4);
    expect(document.querySelectorAll('.paper-lead').length).toBe(1);
    expect(screen.queryByText(/기사 보기/)).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'화포천습지생태공원 톱기사 읽기'}));
    expect(open).toHaveBeenCalledWith(demoPlaces[0]);
  });
  it('지면 확대 및 축소가 작동한다',()=>{
    render(<Newspaper places={demoPlaces} persona="휴식형 여행자" answers={{}} questions={quizFallback} onOpen={()=>{}} onRestart={()=>{}}/>);
    expect(screen.getByText('100%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'확대'}));
    expect(screen.getByText('115%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'축소'}));
    expect(screen.getByText('100%')).toBeTruthy();
  });
});

describe('7문항 퀴즈',()=>{
  it('기존 선택을 재방문할 때 유지할 수 있다',()=>{
    const select=vi.fn();
    render(<Quiz questions={quizFallback} answers={{mood:'A'}} index={2} onSelect={select} onBack={()=>{}} selectionLocked={false}/>);
    expect(screen.getByText('원하는 분위기는?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/조용하고 차분한 분위기/}));
    expect(select).toHaveBeenCalledWith('A');
    expect(document.querySelector('.answer-option.is-selected')).toBeTruthy();
  });
});
