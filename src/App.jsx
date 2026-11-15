import React, {useCallback, useEffect, useRef, useState} from 'react';
import {brand, mascot, photo, publicationDate, splitSentences, quizFallback, demoPlaces} from './data.js';
import {liveMode, loadQuiz, loadRecommendations, startGeneration, generationStatus, videoFromStatus, publishDisplay, subscribeDisplay} from './api.js';

const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
const clamp = (n,min,max) => Math.min(max, Math.max(min,n));
const glyph = (label,klass='') => <span aria-hidden="true" className={klass}>{label}</span>;
const placeImage = (place) => photo(place);

function SiteHeader({section}) {
  return <header className="site-header">
    <img className="gaya-logo" src={brand('logo_gaya')} alt="가야왕도 김해" />
    <div className="site-name">Local<span>Rise</span></div>
    {section && <div className="site-header-section">{section}</div>}
  </header>;
}

function PrimaryButton({children,onClick,variant='green',className='',disabled=false}) {
  return <button className={'primary-button '+variant+' '+className} onClick={onClick} disabled={disabled}>{children}</button>;
}

function TabletFrame({children,section='',klass=''}) {
  return <div className={'tablet-page '+klass} key={klass}>
    <SiteHeader section={section}/>
    {children}
  </div>;
}

function Intro({onStart}) {
  return <TabletFrame klass="intro-screen">
    <div className="intro-bubble">안녕하세요! 김해의 기자 토더기예요</div>
    <img className="intro-mascot" src={mascot('hello')} alt="김해 기자 토더기가 인사하고 있어요" />
    <div className="intro-bottom">
      <p className="small-accent">LOCALRISE TRAVEL EDITION</p>
      <h1>나만의 김해 여행</h1>
      <p className="subtitle">질문 7개에 답하면, 당신만의 김해시보가 완성돼요.</p>
      <PrimaryButton onClick={onStart}>시작하기 <span aria-hidden="true">→</span></PrimaryButton>
    </div>
  </TabletFrame>;
}

function Splash() {
  return <div className="splash-screen">
    <div className="splash-center">
      <div className="splash-word"><span>Local</span><strong>Rise</strong></div>
      <div className="splash-line"/>
      <p>흩어진 데이터를 모아, 당신만의 여행을 완성하다</p>
      <img src={mascot('flag')} alt="" className="splash-character"/>
    </div>
  </div>;
}

function Quiz({questions,answers,index,onSelect,onBack,selectionLocked}) {
  const question = questions[index];
  if(!question) return null;
  const remembered = questions.slice(0,index).filter(q=>answers[q.id]).slice(-3);
  return <TabletFrame section="나만의 김해시보 만들기" klass="quiz-screen">
    <div className="quiz-top">
      <div className="quiz-segments" aria-label={`질문 ${index+1}/${questions.length}`}>
        {questions.map((q,i)=><span key={q.id} className={i<=index?'on':''}/>)}
      </div>
      <span className="quiz-number">{index+1} <i>/</i> {questions.length}</span>
    </div>
    <div className={'previous-answers '+(remembered.length?'has-answers':'')}>
      {remembered.map(q=><span className="answer-ticket" key={q.id}>{q.options[answers[q.id]]?.label}</span>)}
    </div>
    <img className="quiz-character" src={mascot('read')} alt="책을 읽고 있는 토더기" />
    <section className="question-body" key={question.id}>
      <p className="question-id">Q{index+1}</p>
      <h1>{question.text}</h1>
      <div className="answer-options">
        {['A','B'].map((key)=>{
          const option=question.options?.[key];
          const picked=answers[question.id]===key;
          return <button key={key} type="button" disabled={selectionLocked}
            className={'answer-option '+(picked?'is-selected':'')} onClick={()=>onSelect(key)}>
            <span className="answer-letter">{key}</span>
            <strong>{option?.label}</strong>
            <small>{option?.phrase}</small>
            {picked && <span className="answer-pick-mark" aria-hidden="true">✓</span>}
          </button>;
        })}
      </div>
    </section>
    <footer className="quiz-footer">
      {index>0 ? <button className="subtle-button" onClick={onBack} disabled={selectionLocked}>〈 이전 질문</button> : <span/>}
      <span>당신만의 여행을 찾는 중</span>
    </footer>
  </TabletFrame>;
}

function NewspaperMasthead({date}) {
  return <>
    <div className="paper-folio">
      <span>{date}</span><span>LocalRise 특별판 · 제2026호</span><span>발행 · 토더기 기자</span>
    </div>
    <header className="paper-masthead">
      <img src={brand('logo_gaya')} alt="가야왕도 김해"/>
      <h1>김해시보</h1>
      <img src={brand('logo_city')} alt="김해시"/>
    </header>
    <div className="masthead-double-rule"/>
  </>;
}

function StoryText({value,limit}) {
  const chunks=splitSentences(value).slice(0,limit);
  return <>{chunks.map((s,i)=><p key={i}>{s}</p>)}</>;
}

function PaperStory({place,rank,onOpen}) {
  const excerpt=splitSentences(place.recommend_reason).slice(0,2).join(' ');
  const straplines={
    GIMHAE_008:'호수와 분수가 어우러진 도심 속 쉼터',
    GIMHAE_014:'밤하늘을 가까이에서 만나는 특별한 경험',
    GIMHAE_003:'고대 가야의 역사가 남겨진 언덕',
    GIMHAE_002:'허황옥 왕비의 이야기가 머무는 곳',
    GIMHAE_013:'철새와 습지가 어우러지는 평화로운 산책길'
  };
  return <article className="paper-story" tabIndex={0} role="button"
    aria-label={`${place.place_name} 기사 자세히 읽기`}
    onClick={onOpen} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen();}}}>
    <p className="print-section-label"><b>{rank}면</b><span className="print-divider">|</span> 김해 여행</p>
    <h3>{place.place_name}<span className="print-comma">,</span> <small>{straplines[place.place_id]||'오늘의 추천 여행지'}</small></h3>
    <div className="paper-story-grid">
      <figure><img src={placeImage(place)} alt={place.place_name} loading="lazy"/></figure>
      <p>{excerpt}</p>
    </div>
  </article>;
}

function Newspaper({places,persona,answers,questions,onOpen,onRestart}) {
  const [zoom,setZoom]=useState(1);
  const readerRef=useRef(null);
  const touchRef=useRef(null);
  const date=publicationDate();
  const lead=places[0];
  const other=places.slice(1,5);
  const keywords=questions.filter(q=>answers[q.id]).slice(0,3)
    .map(q=>q.options[answers[q.id]]?.label);
  const onPinchStart=e=>{
    if(e.touches.length===2) {
      touchRef.current={distance:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY), zoom};
    }
  };
  const onPinchMove=e=>{
    if(e.touches.length!==2||!touchRef.current)return;
    e.preventDefault();
    const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    setZoom(clamp(touchRef.current.zoom*(d/touchRef.current.distance),0.85,1.8));
  };
  useEffect(()=>{
    const element=readerRef.current;
    if(!element)return;
    element.addEventListener('touchmove',onPinchMove,{passive:false});
    return ()=>element.removeEventListener('touchmove',onPinchMove);
  });
  if(!lead)return <div className="paper-loading">신문을 인쇄하고 있어요…</div>;
  return <div className="newspaper-reader">
    <div className="reader-toolbar">
      <div><span className="reader-green-dot"/> 김해시보 · 나의 특별판</div>
      <div className="zoom-tools">
        <button type="button" aria-label="축소" onClick={()=>setZoom(v=>clamp(+(v-.15).toFixed(2),.85,1.8))}>−</button>
        <span>{Math.round(zoom*100)}%</span>
        <button type="button" aria-label="확대" onClick={()=>setZoom(v=>clamp(+(v+.15).toFixed(2),.85,1.8))}>+</button>
      </div>
    </div>
    <div ref={readerRef} className="paper-scroll" onTouchStart={onPinchStart} onTouchEnd={e=>{if(e.touches.length<2)touchRef.current=null;}}>
      <main className="newspaper-sheet" style={{zoom}} aria-label="김해시보 1면">
        <NewspaperMasthead date={date}/>
        <div className="print-theme">
          <span className="theme-chip">오늘의 여행자</span>
          <strong>{persona||'당신만을 위한 김해 여행이 시작됩니다.'}</strong>
        </div>
        <p className="print-keywords">{keywords.map((v,i)=><span key={i}>#{v}</span>)}</p>
        <div className="headline-rule"/>
        <article className="paper-lead" onClick={()=>onOpen(lead)} onKeyDown={e=>{if(e.key==='Enter'){onOpen(lead);}}}
          role="button" tabIndex={0} aria-label={lead.place_name+' 톱기사 읽기'}>
          <p className="print-section-label"><b>1면 톱</b><span className="print-divider">|</span> 오늘의 김해</p>
          <h2>{lead.place_name}, <span>김해에서 만나는 특별한 하루</span></h2>
          <p className="paper-standfirst">{splitSentences(lead.recommend_reason)[0]}</p>
          <div className="lead-content">
            <figure className="lead-photo">
              <img src={placeImage(lead)} alt={lead.place_name}/>
              <figcaption>▲ {lead.place_name}의 풍경 · 사진 김해시 제공</figcaption>
            </figure>
            <div className="lead-copy">
              <StoryText value={lead.recommend_reason} limit={4}/>
              <div className="reporter-name">토더기 기자</div>
            </div>
          </div>
        </article>
        <div className="wide-rule"/>
        <section className="paper-secondary" aria-label="추천 여행 기사">
          {other.map((place,i)=><PaperStory key={place.place_id} place={place} rank={i+2} onOpen={()=>onOpen(place)}/>)}
        </section>
        <footer className="paper-footer">
          <span>LOCALRISE GIMHAE TRAVEL EDITION</span>
          <span>독자와 함께 만드는 김해의 오늘</span>
          <span>01</span>
        </footer>
      </main>
    </div>
    <div className="reader-bottom">
      <button className="reader-home-link" onClick={onRestart}>처음으로</button>
      <p>기사의 제목 또는 사진을 눌러 자세히 읽어보세요.</p>
      <span className="reader-scroll-hint">지면을 확대하거나 스크롤할 수 있어요</span>
    </div>
  </div>;
}

function ArticleDetail({place,rank,onBack,onGenerate}) {
  const sentences=splitSentences(place.recommend_reason);
  return <div className="detail-screen">
    <div className="detail-paper">
      <NewspaperMasthead date={publicationDate()}/>
      <button className="article-back" onClick={onBack}>〈 김해시보 1면</button>
      <p className="detail-rank">{rank}면 여행 기사 · 추천 {rank}위</p>
      <h1>{place.place_name}</h1>
      <p className="detail-summary">{sentences[0]}</p>
      <figure className="detail-hero"><img src={placeImage(place)} alt={place.place_name}/><figcaption>김해 곳곳에 숨어 있는 여행의 한 장면</figcaption></figure>
      <div className="detail-tags">{(place.matching_tags||[]).map(t=><span key={t}>#{t}</span>)}</div>
      <div className="detail-copy"><StoryText value={sentences.slice(1).join(' ')} limit={5}/></div>
      <div className="article-actions">
        <PrimaryButton onClick={onGenerate}>이 여행지 영상 만들기 <span aria-hidden="true">→</span></PrimaryButton>
        <p>선택한 여행지의 영상은 옆 모니터에서 재생돼요.</p>
      </div>
    </div>
  </div>;
}

const stages=['장소 확정','영상 생성','송출 준비','영상 재생'];
function Waiting({place,progress,error,onBack}) {
  const stage=progress>=100?3:progress>=93?2:progress>=7?1:0;
  return <TabletFrame section="김해시보 · 영상 취재" klass="waiting-screen">
    <div className="waiting-body">
      <div className="waiting-character-wrap">
        <img src={mascot('camera')} alt="카메라를 든 토더기"/>
        <span className="camera-glow"/>
      </div>
      <p className="small-accent">LOCALRISE REPORTER</p>
      <h1>{error?'영상 준비에 문제가 생겼어요':'토더기가 취재 중이에요'}</h1>
      <p className="waiting-sub">{error||<><b>{place.place_name}</b>의 여행 영상을 만들고 있어요.</>}</p>
      <div className="progress-track" aria-label={`영상 생성 진행률 ${Math.round(progress)}%`}><span style={{width:progress+'%'}}/></div>
      <div className="progress-stat"><span>{progress>=100?'송출 준비 완료':'특별한 영상이 준비되는 중'}</span><strong>{Math.round(progress)}%</strong></div>
      <ol className="steps">{stages.map((s,i)=><li key={s} className={i<stage?'done':i===stage?'current':''}>
        <span>{i<stage?'✓':i+1}</span><small>{s}</small>
      </li>)}</ol>
      <div className="monitor-hint"><span className="monitor-icon">▣</span><p>영상이 완성되면 <b>옆 모니터에서 자동으로 재생</b>돼요.</p></div>
      {error && <button className="subtle-button" onClick={onBack}>〈 신문으로 돌아가기</button>}
    </div>
  </TabletFrame>;
}

function Playing({place,onFinish}) {
  return <TabletFrame section="김해시보 · 영상 상영" klass="playing-screen">
    <div className="playing-body">
      <img src={mascot('flag')} className="playing-mascot" alt="깃발을 들고 달리는 토더기"/>
      <p className="small-accent">NOW PLAYING ON THE MONITOR</p>
      <h1>모니터에서 영상 재생 중!</h1>
      <div className="viewing-pill"><span className="breathing-dot"/>지금 옆 모니터에서 감상해 주세요</div>
      <div className="playing-summary">
        <img src={placeImage(place)} alt=""/>
        <div><span>오늘의 여행지</span><h2>{place.place_name}</h2><p>토더기의 김해 여행 취재가 완성됐어요</p></div>
      </div>
      <PrimaryButton variant="orange" onClick={onFinish}>감상 마치기</PrimaryButton>
    </div>
  </TabletFrame>;
}

function Ending({place,onRestart}) {
  return <TabletFrame klass="ending-screen">
    <div className="end-body">
      <p className="small-accent">LOCALRISE · TRAVEL COMPLETE</p>
      <h1>김해에서 만나요!</h1>
      <img className="end-mascot" src={mascot('flag')} alt="여행을 마친 토더기"/>
      <div className="end-clipping">
        <img src={placeImage(place)} alt=""/>
        <div><small>김해시보 · 오늘의 여행지</small><h2>{place.place_name}</h2><span>토더기의 취재 완료</span></div>
      </div>
      <p className="end-sub">마음에 드셨다면 부스의 QR로 투표해 주세요.</p>
      <PrimaryButton onClick={onRestart}>처음으로 돌아가기</PrimaryButton>
    </div>
  </TabletFrame>;
}

function Monitor() {
  const [message,setMessage]=useState({type:'idle'});
  const [mediaFailed,setMediaFailed]=useState(false);
  useEffect(()=>subscribeDisplay(m=>{setMessage(m);setMediaFailed(false);}),[]);
  useEffect(()=>{
    if(message.type!=='playing')return;
    const onKey = event => {
      if(event.key.toLowerCase()==='f' && document.documentElement.requestFullscreen)
        document.documentElement.requestFullscreen().catch(()=>{});
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[message.type]);
  if(message.type==='playing') {
    return <div className="monitor-playback" aria-label="여행 영상 재생 화면">
      {message.video_url && !mediaFailed
        ? <video key={message.video_url} src={message.video_url} autoPlay playsInline muted loop onError={()=>setMediaFailed(true)}/>
        : <div className="monitor-demo-scene" style={{backgroundImage:`url("${message.image_url||placeImage(demoPlaces[0])}")`}}/>}
    </div>;
  }
  return <div className="monitor-idle">
    <div className="monitor-newspaper">
      <p className="monitor-edition">LocalRise 특별판 · 제2026호</p>
      <div className="monitor-masthead">
        <img src={brand('logo_gaya')} alt="가야왕도 김해"/>
        <h1>김해시보</h1>
        <img src={brand('logo_city')} alt="김해시"/>
      </div>
      <div className="monitor-rule"/>
      <div className="monitor-idle-content">
        <img src={mascot('camera')} alt="카메라를 든 토더기"/>
        <div><h2>당신만의 김해 여행이<br/><em>곧 시작됩니다</em></h2><p>토더기가 특별한 여행 영상을 준비하고 있어요.</p></div>
      </div>
      <div className="monitor-footline"/>
    </div>
  </div>;
}

function TabletApp() {
  const [screen,setScreen]=useState('intro');
  const [questions,setQuestions]=useState(quizFallback);
  const [answers,setAnswers]=useState({});
  const [questionIndex,setQuestionIndex]=useState(0);
  const [locked,setLocked]=useState(false);
  const [places,setPlaces]=useState([]);
  const [persona,setPersona]=useState('');
  const [selected,setSelected]=useState(null);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState('');
  const [newspaperLoading,setNewspaperLoading]=useState(false);
  const sessionRef=useRef('');
  const transitionRef=useRef(null);
  const currentRef=useRef('');
  const mountedRef=useRef(true);
  useEffect(()=>{
    mountedRef.current=true;
    return ()=>{mountedRef.current=false;clearTimeout(transitionRef.current);};
  },[]);
  const reset=useCallback(()=>{
    currentRef.current='';
    clearTimeout(transitionRef.current);
    setScreen('intro');setAnswers({});setQuestionIndex(0);setLocked(false);
    setPlaces([]);setPersona('');setSelected(null);setError('');setProgress(0);
    publishDisplay({type:'idle'});
  },[]);
  const start=async()=>{
    if(screen!=='intro')return;
    sessionRef.current='lr_'+Math.random().toString(36).slice(2,9);
    setScreen('splash');
    publishDisplay({type:'idle'});
    try {
      const [quiz]=await Promise.all([loadQuiz(),pause(2350)]);
      setQuestions(quiz);setQuestionIndex(0);setScreen('quiz');
    } catch(error) {
      setError('질문을 불러오지 못했어요. 서버 연결을 확인해 주세요.');
      setScreen('error');
    }
  };
  const pick=key=>{
    if(locked)return;
    setLocked(true);
    const q=questions[questionIndex];
    const next={...answers,[q.id]:key};
    setAnswers(next);
    transitionRef.current=setTimeout(async()=>{
      setLocked(false);
      if(questionIndex<questions.length-1){setQuestionIndex(i=>i+1);return;}
      setNewspaperLoading(true);
      setScreen('paper');
      try {
        const data=await loadRecommendations(next);
        if(!mountedRef.current)return;
        setPlaces((data.recommendations||[]).slice(0,5));
        setPersona(data.persona_summary||'김해를 새롭게 만나는 특별한 여행자예요.');
      } catch(error) {
        setError('추천 기사를 불러오지 못했어요. 서버 상태를 확인해 주세요.');
        setScreen('error');
      } finally {setNewspaperLoading(false);}
    },380);
  };
  useEffect(()=>{
    if(screen!=='wait'||!selected)return;
    let cancelled=false;
    let timer;
    const id=sessionRef.current+'_'+selected.place_id;
    currentRef.current=id;
    const work=async()=>{
      try {
        setError('');setProgress(0);
        publishDisplay({type:'idle'});
        const task=await startGeneration(selected,sessionRef.current);
        const tick=async()=>{
          if(cancelled||currentRef.current!==id)return;
          try {
            const result=await generationStatus(task);
            if(cancelled||currentRef.current!==id)return;
            if(result.status==='failed') throw new Error('영상 생성에 실패했어요. 잠시 뒤 다시 시도해 주세요.');
            if(result.status==='succeeded') {
              setProgress(100);
              publishDisplay({type:'playing',video_url:videoFromStatus(result),image_url:placeImage(selected),place_name:selected.place_name});
              setScreen('playing');
              return;
            }
            let p=Number(result.progress);
            if(!Number.isFinite(p))p=5;
            if(p>0&&p<=1)p*=100;
            setProgress(clamp(p,0,96));
            timer=setTimeout(tick,650);
          } catch(error) { if(!cancelled)setError(error.message||'영상을 불러올 수 없어요.');}
        };
        tick();
      } catch(error) {if(!cancelled)setError(error.message||'서버에 연결할 수 없어요.');}
    };
    work();
    return ()=>{cancelled=true;clearTimeout(timer);};
  },[screen,selected]);

  useEffect(()=>{
    if(!['quiz','paper','article'].includes(screen))return;
    let timer=setTimeout(reset,5*60*1000);
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(reset,5*60*1000);};
    for(const name of ['pointerdown','touchstart','keydown','scroll'])window.addEventListener(name,refresh,{passive:true});
    return ()=>{clearTimeout(timer);for(const name of ['pointerdown','touchstart','keydown','scroll'])window.removeEventListener(name,refresh);};
  },[screen,reset]);
  useEffect(()=>{
    if(screen!=='end')return;
    const timer=setTimeout(reset,30000);
    return ()=>clearTimeout(timer);
  },[screen,reset]);
  const openArticle=place=>{setSelected(place);setScreen('article');window.scrollTo({top:0,behavior:'instant'});};
  const finish=()=>{publishDisplay({type:'idle'});setScreen('end');};

  let view;
  if(screen==='intro')view=<Intro onStart={start}/>;
  else if(screen==='splash')view=<Splash/>;
  else if(screen==='quiz')view=<Quiz questions={questions} answers={answers} index={questionIndex}
    onSelect={pick} selectionLocked={locked} onBack={()=>setQuestionIndex(i=>Math.max(0,i-1))}/>;
  else if(screen==='paper')view=newspaperLoading||!places.length
    ? <div className="newspaper-reader"><div className="paper-loading"><span className="printing-line">김해시보</span><img src={mascot('read')} alt=""/><p>토더기가 당신만의 특별판을 발행하고 있어요…</p><div className="loading-dots"><i/><i/><i/></div></div></div>
    : <Newspaper places={places} persona={persona} answers={answers} questions={questions} onOpen={openArticle} onRestart={reset}/>;
  else if(screen==='article')view=<ArticleDetail place={selected} rank={places.findIndex(p=>p.place_id===selected?.place_id)+1} onBack={()=>setScreen('paper')} onGenerate={()=>setScreen('wait')}/>;
  else if(screen==='wait')view=<Waiting place={selected} progress={progress} error={error} onBack={()=>setScreen('paper')}/>;
  else if(screen==='playing')view=<Playing place={selected} onFinish={finish}/>;
  else if(screen==='end')view=<Ending place={selected} onRestart={reset}/>;
  else view=<div className="recover-screen"><h1>잠시 연결이 끊겼어요.</h1><p>{error}</p><PrimaryButton onClick={reset}>처음으로 돌아가기</PrimaryButton></div>;
  return <div className="tablet-shell">
    <div className="tablet-surface" key={screen}><div className="screen-entrance">{view}</div></div>
    {new URLSearchParams(location.search).has('debug') && <div className="debug-pill">screen: {screen} · {liveMode?'API':'DEMO'} <button onClick={()=>setScreen('paper')}>신문</button><button onClick={reset}>초기화</button></div>}
  </div>;
}

export default function App() {
  const monitor = window.location.pathname==='/monitor';
  return monitor ? <Monitor/> : <TabletApp/>;
}

export {Newspaper, Quiz, Monitor};
