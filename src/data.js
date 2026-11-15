export const asset = (name) => '/assets/' + name;
export const brand = (name) => asset('brand/' + name + '.png');
export const mascot = (name) => asset('characters/' + name + '.png');
export const photo = (place) =>
  place?.image_url && /^(https?:|\/)/.test(place.image_url)
    ? place.image_url
    : asset('places/' + (place?.place_id || 'GIMHAE_013') + '.jpg');

export const quizFallback = [
  { id:'with', text:'이번 여행, 누구와 함께하나요?', options:{ A:{label:'가족·아이와 함께',phrase:'소중한 사람들과 느긋한 나들이'}, B:{label:'친구·연인과 함께',phrase:'함께 새로운 추억을 만들어요'} } },
  { id:'theme', text:'더 끌리는 여행지는?', options:{ A:{label:'역사와 전통이 살아 있는 곳',phrase:'가야의 오래된 이야기를 따라가요'}, B:{label:'자연 풍경이 아름다운 곳',phrase:'초록빛 자연을 가까이에서 만나요'} } },
  { id:'mood', text:'원하는 분위기는?', options:{ A:{label:'조용하고 차분한 분위기',phrase:'고요하고 한적한 곳에서 쉬고 싶어요'}, B:{label:'활기차고 신나는 분위기',phrase:'새로운 사람과 풍경을 만나는 여행'} } },
  { id:'fun', text:'어떤 재미를 원하나요?', options:{ A:{label:'보고 배우는 재미',phrase:'알아갈수록 더 흥미로운 여행'}, B:{label:'직접 해보는 재미',phrase:'체험하며 남기는 특별한 순간'} } },
  { id:'move', text:'얼마나 움직이고 싶나요?', options:{ A:{label:'가볍게 걷는 정도',phrase:'천천히 걸으며 풍경을 즐겨요'}, B:{label:'땀 흘릴 만큼 활발하게',phrase:'움직일수록 더 신나는 하루'} } },
  { id:'time', text:'언제 여행하고 싶나요?', options:{ A:{label:'햇살 좋은 낮',phrase:'따스한 햇살 아래의 여행'}, B:{label:'분위기 있는 저녁·밤',phrase:'저녁과 밤에 더 빛나는 풍경'} } },
  { id:'keep', text:'여행에서 가장 기대되는 건?', options:{ A:{label:'멋진 풍경 감상',phrase:'오래 기억할 풍경 한 장면'}, B:{label:'맛있는 먹거리',phrase:'김해의 새로운 맛을 찾아서'} } }
];

export const demoPlaces = [
  {place_id:'GIMHAE_013',place_name:'화포천습지생태공원',recommend_reason:'화포천습지생태공원은 다양한 수생식물과 철새가 서식하는 김해의 자연 명소입니다. 데크길을 따라 걸으며 사계절 달라지는 습지의 풍경을 만나 볼 수 있습니다. 자연 속에서 여유로운 시간을 보내고 싶은 여행자에게 어울리는 곳입니다.',matching_tags:['습지','철새','생태 산책']},
  {place_id:'GIMHAE_008',place_name:'연지공원',recommend_reason:'연지공원은 호수와 분수가 어우러진 도심 속 휴식 공간입니다. 여유롭게 호숫가를 걸으며 계절마다 다른 풍경을 감상할 수 있습니다. 가족과 함께 쉬어 가기에도 좋은 공원입니다.',matching_tags:['호수','분수','산책']},
  {place_id:'GIMHAE_014',place_name:'김해천문대',recommend_reason:'김해천문대는 높은 곳에서 밤하늘과 야경을 감상할 수 있는 천문 교육 공간입니다. 별자리를 알아보고 특별한 밤의 추억을 남길 수 있습니다. 고요한 밤을 좋아한다면 추천합니다.',matching_tags:['밤하늘','별 관측','야경']},
  {place_id:'GIMHAE_003',place_name:'대성동고분군',recommend_reason:'대성동고분군은 옛 가야의 이야기를 품은 유적지입니다. 언덕 위 고분 사이를 걸으며 고대 금관가야의 흔적을 만날 수 있습니다. 역사에 관심 있는 여행자에게 뜻깊은 산책길입니다.',matching_tags:['가야 역사','유적','산책']},
  {place_id:'GIMHAE_002',place_name:'수로왕비릉',recommend_reason:'수로왕비릉은 가야의 왕비 허황옥과 관련된 능역입니다. 푸른 숲에 둘러싸인 조용한 공간에서 가야의 오랜 설화를 되새길 수 있습니다. 차분한 역사 여행을 원하는 분에게 좋습니다.',matching_tags:['가야 이야기','능역','역사']}
];

export function demoPersonalization(answers) {
  const history = answers.theme === 'A';
  const night = answers.time === 'B';
  const ids = history
    ? ['GIMHAE_003','GIMHAE_002','GIMHAE_013','GIMHAE_008','GIMHAE_014']
    : night
      ? ['GIMHAE_014','GIMHAE_008','GIMHAE_013','GIMHAE_003','GIMHAE_002']
      : ['GIMHAE_013','GIMHAE_008','GIMHAE_014','GIMHAE_003','GIMHAE_002'];
  const recommendations = ids.map(id => demoPlaces.find(p => p.place_id === id));
  const persona_summary = history
    ? '오랜 역사와 가야의 이야기를 천천히 따라가는 여행자예요.'
    : night
      ? '밤하늘과 야경 속에서 특별한 순간을 찾는 여행자예요.'
      : '자연 속에서 여유롭게 산책하며 풍경을 즐기는 여행자예요.';
  return { recommendations, persona_summary, source: 'demo' };
}

export const splitSentences = (value='') =>
  String(value).match(/[^.!?。]+[.!?。]?/g)?.map(s=>s.trim()).filter(Boolean) || [];

export const publicationDate = (date=new Date()) =>
  new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(date);
