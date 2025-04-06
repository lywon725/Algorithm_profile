"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import OpenAI from 'openai';
import { HelpCircle, Upload, ArrowRight, Youtube } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { transformClusterToImageData } from './utils/clusterTransform';

// 기본 이미지를 데이터 URI로 정의
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23666666'%3E이미지를 찾을 수 없습니다%3C/text%3E%3C/svg%3E";

// OpenAI 클라이언트 초기화 수정
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Supabase 클라이언트 초기화 부분 수정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// watchHistory 타입 정의 수정
type WatchHistoryItem = {
  //STEP1-0>>파싱
  title: string;
  videoId: string;
  url?: string;
  channelName?: string;
  date?: string;

  //STEP1-1>>youtube.data.api 
  categoryId?: string;
  tags?: string[];
  description?: string;
  timestamp?: string; //update한 시간 (무드보드 분석을 한 날짜)

  //STEP1-2>>openai 키워드 추출
  keywords: string[];

  // 사이트에서의 시청 기록 
  is_watched: boolean; //false=>사이트에서 시청하지 않음, true=>사이트에서 시청함
  watched_at: string; //시청한 시간
};

// 클러스터 타입 수정
interface Cluster {
  main_keyword: string;
  category: string;
  description: string;
  keywords: string[];
  mood_keyword: string;
  strength: number;
  related_videos: WatchHistoryItem[];
  metadata?: {
    keywordCount: number;
    videoCount: number;
    moodKeywords: string[];
  };
}

// 분석 결과 타입 정의
interface AnalysisResult {
  timestamp: string;
  totalClusters: number;
  clusters: Cluster[];
}

// 타입 정의 추가
type TabType = 'related' | 'recommended';

// 클러스터 이미지 타입 정의
type ClusterImage = {
  url: string;
  credit: {
    name: string;
    link: string;
  };
};


// 네이버 API 설정
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;



// Vision 검색 결과 타입 정의
interface VisionSearchResult {
  similarImages: { url: string; score: number }[];
  labels: { description: string; score: number }[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAbstractResults, setShowAbstractResults] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<{[key: number]: TabType}>({});
  const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
  const [successCount, setSuccessCount] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<{
    id: string;
    date: string;
    clusters: any[];
  }[]>([]);
  const [showVisionResults, setShowVisionResults] = useState(false);
  const [visionSearchResults, setVisionSearchResults] = useState<VisionSearchResult>({
    similarImages: [],
    labels: [],
  });
  // 토큰 사용량 상태 추가
  const [tokenUsage, setTokenUsage] = useState<Record<string, { prompt: number; completion: number; total: number }>>({});
  const [totalTokenUsage, setTotalTokenUsage] = useState({
    prompt: 0,
    completion: 0,
    total: 0
  });

  // useEffect 추가
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // watchHistory 데이터 로드
        const savedHistoryStr = localStorage.getItem('watchHistory');
        const savedHistory = savedHistoryStr ? JSON.parse(savedHistoryStr) : [];
        setWatchHistory(savedHistory);

        // clusters 데이터 로드
        const savedClustersStr = localStorage.getItem('watchClusters');
        const savedClusters = savedClustersStr ? JSON.parse(savedClustersStr) : [];
        setClusters(savedClusters);
      } catch (error) {
        console.error('로컬 스토리지 데이터 로드 중 오류 발생:', error);
        // 오류 발생 시 빈 배열로 초기화
        setWatchHistory([]);
        setClusters([]);
      }
    }
  }, []);

  // 데이터 마이그레이션을 위한 useEffect 추가
  useEffect(() => {
    // 로컬 스토리지에서 기존 데이터 마이그레이션
    const migrateLocalStorageData = () => {
      try {
        // 클러스터 이미지 마이그레이션
        const storedClusterImages = localStorage.getItem('clusterImages');
        if (storedClusterImages) {
          const parsedClusterImages = JSON.parse(storedClusterImages);
          
          // 각 클러스터 이미지 마이그레이션
          const migratedClusterImages: Record<string, any> = {};
          
          Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
            // alt 필드가 있고 main_keyword 필드가 없는 경우에만 마이그레이션
            if (value && typeof value === 'object') {
              migratedClusterImages[key] = {
                ...value,
                main_keyword: key, // 키를 main_keyword로 사용
              };
            } else {
              migratedClusterImages[key] = value;
            }
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
          console.log('클러스터 이미지 데이터 마이그레이션 완료');
        }
        
        // 마이그레이션 완료 표시
        localStorage.setItem('clusterDataMigrationCompleted', 'true');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
      }
    };
    
    // 마이그레이션이 이미 완료되었는지 확인
    const migrationCompleted = localStorage.getItem('clusterDataMigrationCompleted');
    if (migrationCompleted !== 'true') {
      migrateLocalStorageData();
    }
  }, []);


  

// STEP1-1>>YouTube API를 통해 description, tags, categoryId 정보 가져오기
const fetchVideoInfo = async (videoId: string) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('YouTube API 요청 실패');
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const videoInfo = data.items[0].snippet;
      
      // 로컬 스토리지에 저장
      const currentHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      const updatedHistory = [...currentHistory, {
        videoId,
        title: videoInfo.title,
        description: videoInfo.description,
        tags: videoInfo.tags || [],
        categoryId: videoInfo.categoryId,
        timestamp: new Date().toISOString()
      }];
      localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
      setWatchHistory(updatedHistory);

      return true;
    }
    return false;
  } catch (error) {
    console.error('비디오 정보 가져오기 실패:', error);
    throw error;
  }
};

// STEP1-0>> HTML 파일 파싱시작! 이 함수 안에서 and STEP1-1>>youtube api, STEP1-2>>openai 키워드 추출 함수 호출
const parseWatchHistory = async (file: File) => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    // 시청기록 항목 추출
    const watchItems = Array.from(doc.querySelectorAll('.content-cell'));
    
    // 시청기록 데이터 추출
    const watchHistory = watchItems
      .map((item): any => {
        try {
          const titleElement = item.querySelector('a');
          if (!titleElement) return null;

          const title = titleElement.textContent?.split(' 을(를) 시청했습니다.')[0];
          if (!title) return null;

          const videoUrl = titleElement.getAttribute('href') || '';
          const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];

          const channelElement = item.querySelector('a:nth-child(3)');
          const channelName = channelElement?.textContent || '';

          // 날짜 정보 추출
          const dateElement = item.querySelector('.date');
          const date = dateElement?.textContent ? new Date(dateElement.textContent) : new Date();

          // 광고 영상 필터링
          const isAd = (
            title.includes('광고') || 
            title.includes('Advertising') ||
            title.includes('AD:') ||
            channelName.includes('광고') ||
            videoUrl.includes('/ads/') ||
            videoUrl.includes('&ad_type=') ||
            videoUrl.includes('&adformat=')
          );

          if (isAd) return null;
          if (!videoId) return null;

          return {
            title,
            videoId,
            channelName,
            url: `https://youtube.com/watch?v=${videoId}`,
            date: date.toISOString(),
            keywords: [] as string[]
          };
        } catch (error) {
          console.error('항목 파싱 실패:', error);
          return null;
        }
      })
      .filter(item => item !== null);

    if (watchHistory.length === 0) {
      throw new Error('시청기록을 찾을 수 없습니다.');
    }

    // 날짜별로 그룹화
    const groupedByDate = watchHistory.reduce((acc: { [key: string]: any[] }, item) => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(item);
      return acc;
    }, {});

    // 날짜별로 정렬하고 최근 200개만 선택
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const recentWatchHistory = sortedDates
      .map(dateStr => 
        groupedByDate[dateStr]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 200); // 최근 200개만 선택

    console.log('파싱된 전체 항목 수:', watchItems.length);
    console.log('처리할 시청기록 수:', recentWatchHistory.length);

    let apiSuccessCount = 0;
    const batchSize = 100;
    const totalVideos = recentWatchHistory.length;

    console.log('처리할 총 비디오 수:', totalVideos);
    console.log('시청기록 데이터:', recentWatchHistory);

    for (let i = 0; i < recentWatchHistory.length; i += batchSize) {
      const batch = recentWatchHistory.slice(i, i + batchSize);
      console.log(`배치 ${Math.floor(i/batchSize) + 1} 처리 시작:`, batch);

      try {
        const results = await Promise.all(
          batch.map(async (item) => {
            try {
              console.log(`비디오 처리 시작: ${item.videoId}`);
              // STEP1-1. fetchVideoInfo 함수 호출하여 각 비디오 youtube api로 description, tags, categoryId 정보 가져오기
              const success = await fetchVideoInfo(item.videoId);
              console.log(`비디오 처리 결과: ${item.videoId} - ${success ? '성공' : '실패'}`);
              return success;
            } catch (error) {
              console.error(`비디오 정보 가져오기 실패 (${item.videoId}):`, error);
              return false;
            }
          })
        );

        // 성공한 비디오 수 업데이트
        const batchSuccessCount = results.filter(Boolean).length;
        apiSuccessCount += batchSuccessCount;
        
        console.log(`배치 처리 완료: ${batchSuccessCount}개 성공 (총 ${apiSuccessCount}/${totalVideos})`);
        
        // 상태 업데이트
        setSuccessCount(apiSuccessCount);
        
        // API 호출 간격 조절
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`배치 처리 중 오류 발생:`, error);
      }
    }

    // STEP1-2. extractVideoKeywords 함수 호출하여 OpenAI로 키워드 추출
    console.log('키워드 추출 시작...');
    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    const keywordSuccessCount = await extractVideoKeywords(savedHistory);

    // 최종 watchHistory 상태 업데이트
    const finalHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    setWatchHistory(finalHistory);
    // 최종 결과 확인
    console.log('저장된 시청 기록:', finalHistory);

    alert(`${keywordSuccessCount}개의 시청기록이 성공적으로 처리되었습니다! (총 ${totalVideos}개 중)`);

    if (finalHistory.length > 0) {
      // 자동으로 STEP2. 클러스터링 분석 (수정필요)
      //const clusters = await analyzeKeywordsWithOpenAI(finalHistory);
      //localStorage.setItem('watchClusters', JSON.stringify(clusters));

      console.log('분석 완료:', {
        totalVideos: finalHistory.length,
        totalClusters: clusters.length,
        topCategories: clusters.slice(0, 3).map((c: Cluster) => ({
          category: c.main_keyword,
          strength: c.strength
        }))
      });
    } else {
      console.error('저장된 시청 기록이 없습니다.');
      alert('시청 기록이 저장되지 않았습니다. 다시 시도해주세요.');
    }
  } catch (err) {
    console.error('시청기록 파싱 실패:', err);
    setError(err instanceof Error ? err.message : '시청기록 파일 처리 중 오류가 발생했습니다.');
  }
};

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      parseWatchHistory(file)
        .finally(() => setIsLoading(false));
    }
  };

  // 드래그 이벤트 핸들러들
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      if (file.name.endsWith('.html')) {
        setIsLoading(true);
        setError(null);
        parseWatchHistory(file)
          .finally(() => setIsLoading(false));
      } else {
        setError('HTML 파일만 업로드 가능합니다.');
      }
    }
  };
// STEP1-2>> 영상 키워드 추출 함수
const extractVideoKeywords = async (watchHistory: WatchHistoryItem[]) => {
  const batchSize = 100;
  let successCount = 0;
  const totalVideos = watchHistory.length;

  console.log('키워드 추출 시작 - 총 영상 수:', totalVideos);

  for (let i = 0; i < watchHistory.length; i += batchSize) {
    const batch = watchHistory.slice(i, i + batchSize);
    console.log(`배치 ${Math.floor(i/batchSize) + 1} 처리 시작:`, batch);

    try {
      // 배치의 모든 비디오 정보를 하나의 프롬프트로 구성
      const batchPrompt = `
당신은 YouTube 영상 콘텐츠 분석 전문가입니다. 
다음 영상들의 정보를 분석하여 각각 가장 적절한 키워드를 추출해주세요.

${batch.map((item, index) => `
[비디오 ${index + 1}]
제목: ${item.title}
설명: ${item.description?.slice(0, 200)}
태그: ${item.tags ? item.tags.join(', ') : '없음'}
`).join('\n')}

[추출 기준]
1. 주제 관련성: 영상의 핵심 주제를 대표하는 고유명사 키워드
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 고유명사 키워드
3. 감정/톤: 영상의 분위기나 감정을 나타내는 형용사 키워드
4. 대상 시청자: 주요 타겟 시청자층을 나타내는 고유명사 키워드
5. 트렌드/이슈: 관련된 시의성 있는 고유명사 키워드

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1-2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어 제외
- 키워드 간 중복되지 않는 키워드를 생성

응답 형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5
`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: batchPrompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 8000
      });

      // 토큰 사용량 출력
      console.log(`배치 ${Math.floor(i/batchSize) + 1} 토큰 사용량:`, {
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_tokens: completion.usage?.total_tokens,
        videos_in_batch: batch.length
      });

      const response = completion.choices[0].message.content?.trim() || '';
      const videoKeywords = response.split('\n').reduce((acc, line, index) => {
        if (line.startsWith('비디오')) {
          const keywords = line.split(':')[1].trim().split(',').map(k => k.trim());
          acc[batch[index].videoId] = keywords;
        }
        return acc;
      }, {} as Record<string, string[]>);

      // watchHistory 업데이트
      const currentHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      const updatedHistory = currentHistory.map((video: WatchHistoryItem) => {
        if (videoKeywords[video.videoId]) {
          return { ...video, keywords: videoKeywords[video.videoId] };
        }
        return video;
      });

      // localStorage 업데이트
      localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
      
      // 상태 업데이트
      setWatchHistory(updatedHistory);

      // 성공한 비디오 수 업데이트
      const batchSuccessCount = Object.keys(videoKeywords).length;
      successCount += batchSuccessCount;
      
      console.log(`배치 처리 완료: ${batchSuccessCount}개 성공 (총 ${successCount}/${totalVideos})`);
      
      // 상태 업데이트
      setSuccessCount(successCount);
      
      // API 호출 간격 조절
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`배치 처리 중 오류 발생:`, error);
    }
  }

  // 최종 watchHistory 상태 업데이트
  const finalHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
  setWatchHistory(finalHistory);
  console.log('최종 watchHistory:', finalHistory);

  return successCount;
};

  // STEP2>> 새로운 클러스터링 분석 버튼 핸들러
  const handleCluster = async () => {
    try {
      setIsLoading(true);
      // STEP2-1>> 클러스터링 분석 함수
      const newClusters = await analyzeKeywordsWithOpenAI(watchHistory);
      console.log('클러스터링 결과:', newClusters);
      
      if (!newClusters || newClusters.length === 0) {
        throw new Error('클러스터링 결과가 없습니다.');
      }

    // 새로운 분석 결과 생성
    const newAnalysis = {
      id: new Date().getTime().toString(),
      date: new Date().toLocaleString(),
      clusters: newClusters
        .sort((a, b) => b.related_videos.length - a.related_videos.length)
        .slice(0, 7)
    };

    // 기존 분석 기록 불러오기
    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    const updatedAnalyses = [...savedAnalyses, newAnalysis];

    // 저장
    localStorage.setItem('analysisHistory', JSON.stringify(updatedAnalyses)); //히스토리 (모든 분석 기록)
    localStorage.setItem('watchClusters', JSON.stringify(newClusters)); //현재 상태 (현재 분석 결과)
    
    // 상태 업데이트
    setAnalysisHistory(updatedAnalyses);
    setClusters(newClusters
      .sort((a, b) => b.related_videos.length - a.related_videos.length)
      .slice(0, 7)
    );
    setShowAnalysis(true);

    console.log('클러스터링 완료:', {
      clusterCount: newClusters.length,
      analysisHistory: updatedAnalyses.length
    });

    // STEP3>> 클러스터 이미지 검색하기
    const clusterImagesData: Record<number, any> = {};
    for (let i = 0; i < newClusters.length; i++) {
      const image = await searchClusterImage(newClusters[i], true);
      clusterImagesData[i] = image;
    }

    // ImageData 형식으로 변환(최종 단위 이미지 데이터)
    const profileImages = newClusters.map((cluster: any, index: number) => {
      const imageUrl = clusterImagesData[index]?.url || placeholderImage;
      return transformClusterToImageData(cluster, index, imageUrl);
    });

    // 프로필 이미지 데이터 저장
    localStorage.setItem('profileImages', JSON.stringify(profileImages));
    
    } catch (error) {
    console.error('❌ 클러스터링 실패:', error);
      setError('클러스터링 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP2-1>> 클러스터링 함수
  const analyzeKeywordsWithOpenAI = async (watchHistory: WatchHistoryItem[]) => {
    try {
      console.log('클러스터링 분석 시작...');
      const allKeywords = new Set(watchHistory.flatMap(item => item.keywords));
      console.log(`전체 키워드 수: ${allKeywords.size}개`);

      // 1. 키워드 빈도수 계산
      const keywordFrequencies: { [key: string]: number } = {};
      watchHistory.forEach(item => {
        if (item && Array.isArray(item.keywords)) {
          item.keywords.forEach(keyword => {
            keywordFrequencies[keyword] = (keywordFrequencies[keyword] || 0) + 1;
          });
        }
      });

      // 2. 빈도수 기준으로 정렬된 전체 키워드
      const sortedKeywords = Object.entries(keywordFrequencies)
        .sort(([, a], [, b]) => b - a)
        .map(([keyword]) => keyword);

      // 3. 각 키워드별 대표 영상 1개만 선택하여 토큰 사용량 감소
      const keywordToVideos: { [key: string]: string[] } = {};
      sortedKeywords.forEach(keyword => {
        const videos = watchHistory
          .filter(item => item.keywords && item.keywords.includes(keyword))
          .slice(0, 1)
          .map(item => item.title);
        keywordToVideos[keyword] = videos;
      });

      const prompt = `
다음 YouTube 시청 기록 키워드들을 분석하여 의미 있는 그룹으로 분류해주세요.

키워드 데이터:
${Object.entries(keywordToVideos).map(([keyword, titles]) => 
  `${keyword} (${keywordFrequencies[keyword]}회)`
).join('\n')}

분석 요구사항:
1. 키워드들을 최소 3개 이상의 연관 키워드를 포함한 유사한 주제끼리 그룹화
2. 대표 키워드는 구체적인 고유명사
3. 특정 인물이 포착될 경우 해당 인물 중심으로 그룹화
4. 각 그룹은 클러스터링된 키워드와 관련된 최소 3개 이상의 연관된 영상을 포함 [필수조건]

응답 형식:
CLUSTER_START
대표키워드: [그룹 대표 키워드]
카테고리: [카테고리]
관심영역: [설명]
핵심키워드: [주요 키워드들]
감성태도: [감성 키워드들]
관련영상: [관련 영상 id]
CLUSTER_END`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 8000,
      });

      console.log('API 응답 받음');
      console.log('API 응답 내용:', completion.choices[0].message.content);
      console.log(`토큰 사용량:
        - Prompt: ${completion.usage?.prompt_tokens || 0}
        - Completion: ${completion.usage?.completion_tokens || 0}
        - Total: ${completion.usage?.total_tokens || 0}
      `);

      const response = completion.choices[0].message.content || '';
      const clusters: Array<Cluster> = response.split('CLUSTER_START')
        .slice(1)
        .map((clusterText: string): Cluster => {
          const clusterTextContent = clusterText.split('CLUSTER_END')[0].trim();
          const lines = clusterTextContent.split('\n');
          
          const parsedData = lines.reduce((acc: any, line) => {
            const [key, value] = line.split(': ').map(s => s.trim());
            const keyMap: { [key: string]: string } = {
              '대표키워드': 'main_keyword',
              '카테고리': 'category',
              '관심영역': 'description',
              '핵심키워드': 'keywords',
              '감성태도': 'mood_keyword',
              '관련영상': 'related_videos'
            };
            if (keyMap[key]) {
              acc[keyMap[key]] = value || '';
            }
            return acc;
          }, {});

          const relatedKeywords = parsedData.keywords ? 
            parsedData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : 
            [];

          const relatedVideos = watchHistory.filter(item => 
            item.keywords && Array.isArray(item.keywords) && 
            item.keywords.some(k => relatedKeywords.includes(k))
          );

          return {
            main_keyword: parsedData.main_keyword || '',
            category: parsedData.category || '기타',
            description: parsedData.description || '',
            keywords: relatedKeywords,
            mood_keyword: parsedData.mood_keyword || '',
            strength: relatedVideos.length,
            related_videos: relatedVideos
          };
        })
        .filter((cluster): cluster is Cluster => 
          cluster.related_videos && cluster.related_videos.length >= 3
        );

      console.log(`클러스터링 완료: ${clusters.length}개 클러스터 생성`);
      return clusters;

    } catch (error) {
      console.error('❌ 클러스터링 실패:', error);
      return [];
    }
  };

  // STEP3>> 이미지 검색 함수 수정
  const searchClusterImage = async (cluster: Cluster, forceRefresh: boolean = false): Promise<ClusterImage> => {
    if (!cluster || typeof cluster !== 'object') {
      console.error('❌ 유효하지 않은 클러스터:', cluster);
      return {
        url: placeholderImage,
        credit: {
          name: 'Default Image',
          link: '#'
        }
      };
    }

    try {
      console.log('🔍 이미지 검색 시작');
      console.log('클러스터 정보:', {
        main_keyword: cluster.main_keyword,
        category: cluster.category,
        mood_keyword: cluster.mood_keyword,
        strength: cluster.strength
      });

      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      const hasAttempted = localStorage.getItem(imageAttemptKey);
      
      // forceRefresh가 true인 경우 이전 실패 기록 무시
      if (!forceRefresh && hasAttempted === 'failed') {
        console.log('⚠️ 이전 검색 실패 기록 발견:', cluster.main_keyword);
        console.groupEnd();
        return {
          url: placeholderImage,
          credit: {
            name: 'Default Image',
            link: '#'
          }
        };
      }

      // 이미지 URL 유효성 검사 함수
      const isImageUrlValid = async (url: string): Promise<boolean> => {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors' // CORS 정책 우회
          });
          return true; // no-cors 모드에서는 상태를 확인할 수 없으므로, 응답이 있다면 true 반환
        } catch {
          return false;
        }
      };

      // 검색 시도 함수
      const attemptImageSearch = async (searchParams: URLSearchParams) => {
      const response = await fetch(
          `/api/search-image?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
              'Accept': 'application/json',
              'Cache-Control': forceRefresh ? 'no-cache' : 'default'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
        
        // 유효한 이미지 URL만 필터링
        if (data.items?.length > 0) {
          const validItems = [];
          for (const item of data.items) {
            if (await isImageUrlValid(item.link)) {
              validItems.push(item);
            }
          }
          data.items = validItems;
        }
        
        return data;
      };

      // 첫 번째 시도: 모든 키워드 포함
      const searchParams = new URLSearchParams();
      
      // 1. 메인 키워드 처리
      console.log('1️⃣ 메인 키워드 처리 시작');
      let mainKeyword = cluster.main_keyword;
      if (cluster.main_keyword.includes('인물')) {
        mainKeyword = `${mainKeyword} 인물사진 프로필`;
        console.log('👤 인물 키워드 감지 - 수정된 키워드:', mainKeyword);
      }
      searchParams.append('query', mainKeyword);
      console.log('메인 키워드 처리 완료:', mainKeyword);
      
      // 2. 카테고리 추가
      console.log('2️⃣ 카테고리 처리 시작');
      if (cluster.category && cluster.category !== '기타') {
        searchParams.append('category', cluster.category);
        console.log('카테고리 추가:', cluster.category);
      } else {
        console.log('카테고리 제외: 기타 또는 없음');
      }
      
      // 3. 감성 키워드 추가
      console.log('3️⃣ 감성 키워드 처리 시작');
      if (cluster.mood_keyword) {
        const moodKeywords = cluster.mood_keyword.split(',')[0].trim();
        searchParams.append('mood', moodKeywords);
        console.log('감성 키워드 추가:', moodKeywords);
      } else {
        console.log('감성 키워드 없음');
      }

      if (forceRefresh) {
        searchParams.append('t', new Date().getTime().toString());
        console.log('🔄 강제 새로고침 적용');
      }

      console.log('📝 첫 번째 시도 검색 쿼리:', searchParams.toString());
      
      try {
        // 첫 번째 시도
        let data = await attemptImageSearch(searchParams);
        
        if (!data.items?.length) {
          // 첫 번째 시도 실패 시, 메인 키워드로만 재시도
          console.log('⚠️ 첫 번째 검색 실패, 메인 키워드로만 재시도');
          const simpleSearchParams = new URLSearchParams();
          simpleSearchParams.append('query', mainKeyword);
          if (forceRefresh) {
            simpleSearchParams.append('t', new Date().getTime().toString());
          }
          
          console.log('📝 두 번째 시도 검색 쿼리:', simpleSearchParams.toString());
          data = await attemptImageSearch(simpleSearchParams);
          
          if (!data.items?.length) {
            throw new Error('모든 검색 시도 실패');
          }
        }

        // 이전 결과와 다른 이미지를 선택
        const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
        const currentImage = savedImages[cluster.main_keyword]?.url;
        
        // 현재 이미지와 다른 새로운 이미지 찾기
        const availableImages = data.items.filter((item: any) => item.link !== currentImage);
        console.log('🖼 사용 가능한 이미지 수:', availableImages.length);
        
        const selectedImage = availableImages.length > 0 ? 
          availableImages[Math.floor(Math.random() * availableImages.length)] : 
          data.items[0];
        
        // 이미지 URL에 타임스탬프 추가하여 캐시 방지
        const imageUrl = new URL(selectedImage.link);
        imageUrl.searchParams.append('t', new Date().getTime().toString());
        
        const image = {
          url: imageUrl.toString(),
          credit: {
            name: 'Naver',
            link: selectedImage.link
          }
        };

        // 로컬 스토리지에 이미지 저장
        savedImages[cluster.main_keyword] = image;
        localStorage.setItem('clusterImages', JSON.stringify(savedImages));
        
        // 성공 기록 저장
        localStorage.setItem(imageAttemptKey, 'success');
        console.log('💾 이미지 저장 완료');
        return image;
      } catch (error) {
        console.error('❌ 모든 검색 시도 실패:', error);
      localStorage.setItem(imageAttemptKey, 'failed');
        console.groupEnd();
      return {
          url: placeholderImage,
        credit: {
          name: 'Default Image',
          link: '#'
        }
      };
      }
    } catch (error) {
      console.error('❌ 이미지 검색 실패:', error);
      console.groupEnd();
      
      if (cluster && cluster.main_keyword) {
      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      localStorage.setItem(imageAttemptKey, 'failed');
      }
      
      return {
        url: placeholderImage,
        credit: {
          name: 'Default Image',
          link: '#'
        }
      };
    }
  };

  // 메인 컴포넌트에서 클러스터 이미지 설정 부분 수정
  useEffect(() => {
    const fetchClusterImages = async () => {
      const newClusterImages = {} as Record<number, ClusterImage | null>
      
      for (let i = 0; i < clusters.length; i++) {
        newClusterImages[i] = await searchClusterImage(clusters[i]);
      }
      
      setClusterImages(newClusterImages);
    };

    if (clusters.length > 0) {
      fetchClusterImages();
    }
  }, [clusters]);

  // 컴포넌트 초기화 시 저장된 이미지 로드
  useEffect(() => {
    const loadSavedImages = () => {
      const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
      const newClusterImages = { ...clusterImages };
      
      clusters.forEach((cluster, index) => {
        if (savedImages[cluster.main_keyword]) {
          newClusterImages[index] = savedImages[cluster.main_keyword];
        }
      });
      
      setClusterImages(newClusterImages);
    };

    loadSavedImages();
  }, [clusters]); // clusters가 변경될 때마다 실행

  // useEffect에 분석 기록 로드 추가
  useEffect(() => {
    // 기존 코드...
    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    setAnalysisHistory(savedAnalyses);
  }, []);

  // 토큰 사용량 추적 함수 추가
  const trackTokenUsage = (completion: any, step: string) => {
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;
    
    console.log(`[${step}] Token Usage:
      - Prompt: ${promptTokens}
      - Completion: ${completionTokens}
      - Total: ${totalTokens}
    `);
    
    // 토큰 사용량을 상태에 저장
    setTokenUsage(prev => ({
      ...prev,
      [step]: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      }
    }));
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
        <div className="space-y-7 max-w-8xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold px-4 sm:px-14">
              <div className="inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600">
                Are you curious how your algorithm sees you?
                </span>
              </div>
            </h1>
          </div>
        </div>

        <div className="w-full max-w-[700px] p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full cursor-pointer backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 ${
              isDragging 
                ? 'border-2 border-blue-500 bg-blue-50/30 scale-[1.02] shadow-lg' 
                : 'border-2 border-gray-200/60 hover:border-blue-400/60 shadow-sm hover:shadow-md bg-white/70'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".html"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-blue-500" />
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {isLoading ? '처리 중...' : (
                    isDragging 
                      ? '여기에 파일을 놓아주세요'
                      : 'Google Takeout에서 다운로드한\nYoutube 시청기록 파일을 업로드하세요'
                  )}
                </p>
                <style jsx>{`
                  p {
                    white-space: pre-line;
                  }
                `}</style>
                <p className="text-sm text-gray-500">
                  {isLoading ? (
                    <span className="w-full max-w-md mx-auto">
                      <span className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <span 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${(successCount ) * 100}%`,
                            animation: 'progress-animation 1.5s ease-in-out infinite'
                          }}
                        />
                      </span>
                      <span className="mt-2 text-sm text-gray-600">{successCount}개 분석 완료</span>
                    </span>
                  ) : (
                    '파일을 드래그하거나 클릭하여 업로드'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <HoverCard>
              <HoverCardTrigger>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Google Takeout 가이드 보기</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[600px] p-6 rounded-xl shadow-lg" side="bottom" align="center">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 pb-2 border-b">
                    <Youtube className="w-5 h-5 text-blue-500" />
                    Google Takeout에서 Youtube 시청기록 내보내기
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">1. Google Takeout 접속</div>
                      <a 
                        href="https://takeout.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-500 hover:underline"
                      >
                        takeout.google.com
                      </a>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">2. YouTube 데이터 선택</div>
                      <p className="text-sm text-gray-500">다른 항목 모두 해제</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">3. 시청기록 선택</div>
                      <p className="text-sm text-gray-500">모든 YouTube 데이터 포함 → 시청기록</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">4. 내보내기</div>
                      <p className="text-sm text-gray-500">HTML 형식 선택 후 내보내기</p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        

        {watchHistory.length > 0 && (
          <div className="mt-8 w-full max-w-[897px] bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">분석된 시청 기록</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('watchHistory');
                    localStorage.removeItem('watchClusters');
                    localStorage.removeItem('analysisHistory');
                    setWatchHistory([]);
                    setClusters([]);
                    setAnalysisHistory([]);
                    setShowAnalysis(false);
                    setShowAbstractResults(false);
                  }}
                  variant="outline"
                  className="hover:bg-red-50 text-red-500"
                >
                  기록 초기화
                </Button>
                <Button 
                  onClick={handleCluster}
                  variant="outline"
                  className="hover:bg-blue-50"
                >
                  새로운 클러스터 분석
                </Button>
              </div>
            </div>

            {/* 분석 기록 목록 */}
            {analysisHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">분석 기록</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisHistory.map((analysis, index) => (
                    <Button
                      key={analysis.id}
                      onClick={() => {
                        setClusters(analysis.clusters);
                        setShowAnalysis(true);
                      }}
                      variant="outline"
                      className="hover:bg-blue-50"
                    >
                      분석 {index + 1} ({analysis.date})
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">기본 정보</h3>
                <p>총 영상 수: {watchHistory.length}</p>
                <p>총 키워드 수: {
                  new Set(watchHistory.flatMap(item => item.keywords)).size
                }</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">최다 출현 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    watchHistory.flatMap(item => item.keywords)
                      .reduce((acc: {[key: string]: number}, keyword) => {
                        acc[keyword] = (acc[keyword] || 0) + 1;
                        return acc;
                      }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([keyword, count]) => (
                      <span key={keyword} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                        {keyword} ({count})
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {showAnalysis && clusters.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">클러스터 분석 결과</h3>
                </div>
                <div className="space-y-4">
                  {clusters.map((cluster, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          const newExpandedClusters = new Set(expandedClusters);
                          if (newExpandedClusters.has(index)) {
                            newExpandedClusters.delete(index);
                          } else {
                            newExpandedClusters.add(index);
                          }
                          setExpandedClusters(newExpandedClusters);
                        }}
                        className="w-full px-6 py-4 bg-white hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {cluster.main_keyword}
                          </span>
                          <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
                            {cluster.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            영상 {cluster.related_videos ? cluster.related_videos.length : 0}개
                          </span>
                        </div>
                        <svg
                          className={`w-6 h-6 transform transition-transform ${
                            expandedClusters.has(index) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedClusters.has(index) && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          {/* 이미지 검색 버튼과 키워드 표시 */}
                          <div className="mb-4 p-4 bg-white rounded-lg">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-700">대표 이미지 검색</h5>
                              <Button
                                onClick={async () => {
                                  try {
                                    console.log('이미지 검색 시작:', cluster.main_keyword);
                                    
                                    
                                    // 캐시 초기화: localStorage에서 해당 키워드의 이미지 검색 시도 기록 삭제
                                    const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
                                    localStorage.removeItem(imageAttemptKey);
                                    
                                    // 기존 저장된 이미지 삭제
                                    const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
                                    delete savedImages[cluster.main_keyword];
                                    localStorage.setItem('clusterImages', JSON.stringify(savedImages));
                                    
                                    // 새로운 이미지 검색
                                    const image = await searchClusterImage(cluster, true);
                                    console.log('검색된 이미지:', image);

                                    if (image) {
                                      console.log('이미지 상태 업데이트:', index);
                                      setClusterImages(prev => {
                                        const newImages = { ...prev };
                                        newImages[index] = image;
                                        console.log('새 이미지 상태:', newImages);
                                        return newImages;
                                      });
                                    }
                                  } catch (error) {
                                    console.error('이미지 검색/업데이트 실패:', error);
                                  }
                                }}
                                variant="outline"
                                className="hover:bg-blue-50"
                              >
                                이미지 검색하기
                              </Button>
                            </div>
                            {clusterImages[index] && (
                              <div className="mt-2 text-sm text-gray-500">
                                검색 키워드: {cluster.main_keyword}
                              </div>
                            )}
                          </div>

                          {/* 클러스터 대표 이미지 */}
                          {clusterImages[index] && (
                            <div className="space-y-4">
                            <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                              <img
                                src={clusterImages[index]?.url || placeholderImage}
                                alt={cluster.main_keyword}
                                className="w-full h-full object-contain bg-gray-100"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                    console.error('이미지 로드 실패:', target.src);
                                    
                                    if (target.src === placeholderImage) {
                                      return;
                                    }
                                    
                                  target.src = placeholderImage;
                                  
                                  setClusterImages(prev => {
                                    const newImages = { ...prev };
                                    newImages[index] = {
                                      url: placeholderImage,
                                      credit: {
                                        name: 'Default Image',
                                        link: '#'
                                      }
                                    };
                                    return newImages;
                                  });
                                }}
                              />
                              <div className="absolute bottom-0 right-0 p-2 text-xs text-white bg-black bg-opacity-50">
                                출처: {clusterImages[index]?.credit?.name || 'Default'}
                              </div>
                            </div>
                              
                              {/* 핀터레스트 검색 버튼 추가 */}
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    const imageUrl = clusterImages[index]?.url;
                                    if (imageUrl && imageUrl !== placeholderImage) {
                                      // 일반 검색
                                      window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(cluster.main_keyword)}`, '_blank');
                                    }
                                  }}
                                  variant="outline"
                                  className="flex items-center gap-2 hover:bg-red-50 text-red-500"
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.43.04-3.47.22-.97 1.4-6.16 1.4-6.16s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.39 2.55-5.39 5.18 0 1.02.39 2.12.89 2.71.1.12.11.22.08.34l-.33 1.37c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.77 2.74-7.25 7.9-7.25 4.14 0 7.36 2.95 7.36 6.9 0 4.12-2.6 7.43-6.2 7.43-1.21 0-2.35-.63-2.74-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
                                  </svg>
                                  키워드 검색
                                </Button>
                                
                                <Button
                                  onClick={async () => {
                                    const imageUrl = clusterImages[index]?.url;
                                    if (imageUrl && imageUrl !== placeholderImage) {
                                      try {
                                        // 로딩 상태 표시
                                        setIsLoading(true);

                                        // Google Vision API 호출
                                        const response = await fetch('/api/google-vision-search', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ imageUrl }),
                                        });

                                        if (!response.ok) {
                                          throw new Error('API 호출 실패');
                                        }

                                        const data = await response.json();

                                        // 결과 모달 표시
                                        setVisionSearchResults({
                                          similarImages: data.similarImages,
                                          labels: data.labels,
                                        });
                                        setShowVisionResults(true);
                                      } catch (error) {
                                        console.error('Vision 검색 실패:', error);
                                        alert('이미지 검색 중 오류가 발생했습니다.');
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    } else {
                                      alert('유효한 이미지가 없습니다.');
                                    }
                                  }}
                                  variant="outline"
                                  className="flex items-center gap-2 hover:bg-purple-50 text-purple-500"
                                  disabled={isLoading}
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {isLoading ? '검색 중...' : 'Vision 검색'}
                                </Button>
                            </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">최근 분석된 영상</h3>
              <div className="space-y-3">
                {watchHistory
                  .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()) // 최신순 정렬
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:text-blue-600"
                      >
                        {item.title}
                      </a>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.keywords?.map((keyword: string, kidx: number) => (
                          <span key={kidx} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <Button 
                onClick={() => {
                  // 가장 최신 분석 결과 가져오기
                  const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
                  if (savedAnalyses.length > 0) {
                    const latestAnalysis = savedAnalyses[savedAnalyses.length - 1];
                    // 최신 분석 결과를 profileImages로 변환
                    const profileImages = latestAnalysis.clusters.map((cluster: any, index: number) => {
                      // clusterImages가 없거나 해당 인덱스의 이미지가 없을 경우 placeholderImage 사용
                      const imageUrl = clusterImages[index]?.url || placeholderImage;
                      return transformClusterToImageData(cluster, index, imageUrl);
                    });
                    // profileImages 저장
                    localStorage.setItem('profileImages', JSON.stringify(profileImages));
                    console.log('✨ 프로필 데이터 저장 성공!');
                    alert('프로필 데이터가 성공적으로 저장되었습니다!');
                  }
                }}
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all px-16 py-8 text-2xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] text-white"
              >
                <Link href="/my_profile">
                  Tell me who I am
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 검색 결과 모달 */}
      {showVisionResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Vision 검색 결과</h3>
              <Button
                variant="ghost"
                onClick={() => setShowVisionResults(false)}
                className="hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            {/* 유사 이미지 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">유사한 이미지</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visionSearchResults.similarImages.map((img: { url: string; score: number }, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={img.url}
                      alt={`Similar image ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = placeholderImage;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-bl-lg">
                      {(img.score * 100).toFixed(0)}% 유사
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 관련 레이블 */}
            <div>
              <h4 className="font-medium mb-3">관련 키워드</h4>
              <div className="flex flex-wrap gap-2">
                {visionSearchResults.labels.map((label: { description: string; score: number }, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                    title={`신뢰도: ${(label.score * 100).toFixed(0)}%`}
                  >
                    {label.description}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 토큰 사용량 표시 */}
      {Object.entries(tokenUsage).length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">API 토큰 사용량</h3>
          <div className="space-y-2">
            {Object.entries(tokenUsage).map(([step, usage]) => (
              <div key={step} className="flex justify-between items-center">
                <span className="font-medium">{step}:</span>
                <span>Total: {usage.total} tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// VideoCard 컴포넌트
const VideoCard = ({ video }: { video: any }) => (
  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="relative aspect-video">
      <img
        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
        alt={video.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300" />
    </div>
    <div className="p-3">
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium line-clamp-2 hover:text-blue-600 transition-colors"
      >
        {video.title}
      </a>
      <div className="mt-2 flex flex-wrap gap-1">
        {video.keywords?.slice(0, 3).map((keyword: string, kidx: number) => (
          <span key={kidx} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
            {keyword}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// 추천 영상 컴포넌트 단순화
const RecommendedVideos = ({ cluster }: { cluster: any }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // 주요 키워드와 분위기 키워드 조합
        const searchQuery = `${cluster.main_keyword} ${cluster.mood_keyword.split(',')[0]}`;
        
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&regionCode=KR&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );

        const data = await response.json();
        
        if (data.items) {
          const videoList = data.items.map((item: any) => ({
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            videoId: item.id.videoId,
            url: `https://youtube.com/watch?v=${item.id.videoId}`,
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            keywords: [cluster.main_keyword]
          }));
          setVideos(videoList);
        }
      } catch (error) {
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [cluster.main_keyword, cluster.mood_keyword]);

  if (isLoading) {
    return (
      <div className="col-span-2 flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.videoId} video={video} />
      ))}
    </div>
  );
};
