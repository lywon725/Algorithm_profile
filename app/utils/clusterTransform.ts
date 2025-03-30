import { ImageData } from '../types/profile';

export const transformClusterToImageData = (
  cluster: any,
  index: number,
  imageUrl: string
): ImageData => {
  // 랜덤 위치 및 회전 생성
  const randomRotate = Math.floor(Math.random() * 12) - 6; // -6 ~ 6도
  
  // 좌측 상단을 제외한 영역에서 위치 생성
  let randomLeft, randomTop;
  
  // 화면을 3개 영역으로 나누어 배치 (우측 상단, 중앙 하단, 우측 하단)
  const area = Math.floor(Math.random() * 3); // 0, 1, 2 중 하나 선택
  
  switch(area) {
    case 0: // 우측 상단
      randomLeft = `${Math.floor(Math.random() * 30) + 60}%`; // 60% ~ 90%
      randomTop = `${Math.floor(Math.random() * 20) + 20}%`; // 20% ~ 40%
      break;
    case 1: // 중앙 하단
      randomLeft = `${Math.floor(Math.random() * 40) + 30}%`; // 30% ~ 70%
      randomTop = `${Math.floor(Math.random() * 20) + 60}%`; // 60% ~ 80%
      break;
    case 2: // 우측 하단
      randomLeft = `${Math.floor(Math.random() * 30) + 60}%`; // 60% ~ 90%
      randomTop = `${Math.floor(Math.random() * 20) + 60}%`; // 60% ~ 80%
      break;
    default: // 기본값 (우측 하단)
      randomLeft = `${Math.floor(Math.random() * 30) + 60}%`;
      randomTop = `${Math.floor(Math.random() * 20) + 60}%`;
  }
  
  // 영상 데이터 변환
  const relatedVideos = cluster.related_videos?.map((video: any) => ({
    title: video.title,
    embedId: video.videoId || video.url?.split('v=')[1] || ''
  })) || [];

  // 키워드 리스트 변환
  const keywords = cluster.keyword_list?.split(',').map((k: string) => k.trim()) || [];

  // strength 기반으로 sizeWeight 계산
  // strength가 높을수록 크기가 커지도록 설정 (0.05 ~ 0.3 범위)
  const strength = cluster.strength || cluster.metadata?.videoCount || 1;
  const maxStrength = 10; // 예상되는 최대 strength 값
  const sizeWeight = Math.min(0.05 + (strength / maxStrength) * 0.15, 0.3);

  return {
    id: String(index + 1),
    src: imageUrl,
    main_keyword: cluster.main_keyword,
    sub_keyword: cluster.sub_keyword || '',
    mood_keyword: cluster.mood_keyword || '',
    description: cluster.description || '',
    category: cluster.category?.toLowerCase() || 'other',
    width: 200,
    height: 200,
    rotate: randomRotate,
    left: randomLeft,
    top: randomTop,
    keywords: keywords.slice(0, 3),
    sizeWeight,
    relatedVideos: relatedVideos.slice(0, 5),
    created_at: cluster.created_at || new Date().toISOString(),
    desired_self: false,
    metadata: cluster.metadata || {},
    desired_self_profile: null
  };
}; 