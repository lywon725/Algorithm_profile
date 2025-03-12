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
  title: string;
  videoId: string;
  keywords: string[];
  tags?: string[];
  timestamp?: string;
  url?: string;
  date?: any;  // any 타입으로 변경
  channelName?: string;  // 옵셔널로 변경
};

// 클러스터 타입 수정
type Category = 
  | "영화/애니메이션"
  | "자동차"
  | "음악"
  | "동물"
  | "스포츠"
  | "여행/이벤트"
  | "게임"
  | "사람/블로그"
  | "코미디"
  | "엔터테인먼트"
  | "뉴스/정치"
  | "노하우/스타일"
  | "교육"
  | "과학/기술"
  | "비영리 활동";

type Cluster = {
  id?: number;
  user_id?: string;
  main_keyword: string;
  sub_keyword: string;
  mood_keyword: string;
  description: string;
  category: Category;  // 카테고리 필드 추가
  rotation?: string;
  keyword_list: string;
  strength: number;
  video_links: string;
  created_at: string;
  desired_self: boolean;
  main_image_url?: string;
  metadata: any;
};

// 타입 정의 추가
type TabType = 'related' | 'recommended';

// Unsplash API 키 설정
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

// 클러스터 이미지 타입 정의
type ClusterImage = {
  url: string;
  credit: {
    name: string;
    link: string;
  };
};

// keywordFrequency 타입 정의 추가
type KeywordFrequency = {
  [key: string]: number;
};

// 네이버 API 설정
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

type KeywordToVideos = {
  [key: string]: string[];
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
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

  // useEffect 추가
  useEffect(() => {
    // localStorage에서 데이터 로드
    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    setWatchHistory(savedHistory);
    const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
    setClusters(savedClusters);
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

  // YouTube 동영상 ID 추출 함수
  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // OpenAI API 테스트 함수
  const testOpenAI = async () => {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Hello! Please respond with 'OpenAI is working!'" }],
        model: "gpt-4",
      });

      console.log("OpenAI 응답:", completion.choices[0].message);
      return true;
    } catch (error) {
      console.error("OpenAI API 에러:", error);
      return false;
    }
  };

  // YouTube API를 통해 비디오 정보 가져오기
  const fetchVideoInfo = async (videoId: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('YouTube API 요청 실패');
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoInfo = data.items[0].snippet;
        
        try {
          // OpenAI로 키워드 추출 시도
          const extractedKeywords = await extractVideoKeywords(videoInfo);
          console.log('AI가 추출한 키워드:', extractedKeywords);

          // 로컬 스토리지에 저장
          const currentHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
          const updatedHistory = [...currentHistory, {
            videoId,
            title: videoInfo.title,
            tags: videoInfo.tags || [],
            keywords: extractedKeywords.map(k => k.keyword),
            timestamp: new Date().toISOString()
          }];
          localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
          setWatchHistory(updatedHistory);

          return true;
        } catch (error) {
          console.error('키워드 추출 실패:', error);
          // 실패 시 기본 태그 저장
          const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
          watchHistory.push({
            videoId,
            title: videoInfo.title,
            tags: videoInfo.tags || [],
            keywords: videoInfo.tags ? videoInfo.tags.slice(0, 5) : [],
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('비디오 정보 가져오기 실패:', error);
      throw error;
    }
  };

  // 키워드 간 유사도 계산 함수
  const calculateSimilarity = (keyword1: string, keyword2: string, watchHistory: any[]) => {
    let coOccurrence = 0;
    let total1 = 0;
    let total2 = 0;

    watchHistory.forEach(item => {
      const hasKeyword1 = item.keywords.includes(keyword1);
      const hasKeyword2 = item.keywords.includes(keyword2);
      
      if (hasKeyword1 && hasKeyword2) coOccurrence++;
      if (hasKeyword1) total1++;
      if (hasKeyword2) total2++;
    });

    // Jaccard 유사도 계산
    return coOccurrence / (total1 + total2 - coOccurrence);
  };

  // 통합된 키워드 분석 및 클러스터링 함수
  const analyzeKeywordsWithOpenAI = async (watchHistory: WatchHistoryItem[]) => {
    try {
      // 데이터를 더 작은 청크로 나눕니다 (예: 20개씩)
      const chunkSize = 20;
      const chunks = [];
      for (let i = 0; i < watchHistory.length; i += chunkSize) {
        chunks.push(watchHistory.slice(i, i + chunkSize));
      }

      let allKeywordFrequencies: { [key: string]: number } = {};
      let allKeywordToVideos: { [key: string]: string[] } = {};

      // 각 청크별로 키워드 빈도수와 비디오 매핑을 계산
      for (const chunk of chunks) {
        chunk.forEach(item => {
          if (item && Array.isArray(item.keywords)) {
            item.keywords.forEach(keyword => {
              allKeywordFrequencies[keyword] = (allKeywordFrequencies[keyword] || 0) + 1;
              if (!allKeywordToVideos[keyword]) {
                allKeywordToVideos[keyword] = [];
              }
              if (item.title) {
                allKeywordToVideos[keyword].push(item.title);
              }
            });
          }
        });
      }

      // 상위 출현 키워드 추출 (10개)
      const topKeywords = Object.entries(allKeywordFrequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const prompt = `
당신은 YouTube 시청 기록을 분석하여 사용자의 취향과 관심사를 깊이 있게 이해하는 전문가입니다.
다음 시청 기록 데이터를 분석하여 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹으로 분류해주세요.

시청 기록 데이터 (상위 10개 키워드 관련):
${topKeywords.map(keyword => 
  `${keyword}:
   - ${allKeywordToVideos[keyword].slice(0, 5).join('\n   - ')}${allKeywordToVideos[keyword].length > 5 ? '\n   - ...' : ''}`
).join('\n\n')}

가장 자주 등장하는 키워드 (상위 10개):
${topKeywords.map(keyword => `${keyword} (${allKeywordFrequencies[keyword]}회)`).join('\n')}

분석 요구사항:
1. 모든 영상이 최소 하나의 그룹에 포함되어야 합니다.
2. 각 그룹은 최소 3개 이상의 연관된 영상을 포함해야 합니다.
3. 하나의 영상이 여러 그룹에 포함될 수 있습니다.
4. 각 그룹은 사용자의 뚜렷한 관심사나 취향을 나타내야 합니다.
5. 클러스터 수는 최소 5개 이상이어야 합니다.

응답 형식:
CLUSTER_START
대표키워드: [그룹의 핵심 키워드 또는 인물명]
카테고리: [콘텐츠 카테고리]
관심영역: [사용자의 관심사와 취향을 2-3문장으로 설명]
연관키워드: [관련 키워드들을 빈도순으로 나열]
감성태도: [감성과 태도 키워드 3-4개]
예상영상수: [해당 그룹에 속할 것으로 예상되는 영상 수]
CLUSTER_END`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4",
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0].message.content || '';
      const clusters = response.split('CLUSTER_START')
        .slice(1)
        .map(cluster => {
          const clusterText = cluster.split('CLUSTER_END')[0].trim();
          const lines = clusterText.split('\n');
          
          // 각 라인에서 키와 값을 정확히 추출
          const parsedData = lines.reduce((acc: any, line) => {
            const [key, value] = line.split(': ').map(s => s.trim());
            const keyMap: { [key: string]: string } = {
              '대표키워드': 'main_keyword',
              '카테고리': 'category',
              '관심영역': 'description',
              '연관키워드': 'keywords',
              '감성태도': 'mood_keyword',
              '예상영상수': 'video_count'
            };
            if (keyMap[key]) {
              acc[keyMap[key]] = value || '';
            }
            return acc;
          }, {});

          // 연관 키워드 문자열을 배열로 변환
          const relatedKeywords = parsedData.keywords ? 
            parsedData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : 
            [];

          // 클러스터에 속한 영상 찾기
          const relatedVideos = watchHistory.filter(item => 
            item.keywords && Array.isArray(item.keywords) && 
            item.keywords.some(k => relatedKeywords.includes(k))
          );

          return {
            main_keyword: parsedData.main_keyword || '',
            category: parsedData.category || '기타',
            description: parsedData.description || '',
            keyword_list: relatedKeywords.join(', '),
            mood_keyword: parsedData.mood_keyword || '',
            strength: relatedVideos.length,
            related_videos: relatedVideos,
            metadata: {
              keywordCount: relatedKeywords.length,
              videoCount: relatedVideos.length,
              moodKeywords: (parsedData.mood_keyword || '').split(',').map((k: string) => k.trim()).filter(Boolean)
            }
          };
        })
        .filter(cluster => cluster.related_videos && cluster.related_videos.length >= 3);

      return clusters;
    } catch (error) {
      console.error('클러스터 분석 실패:', error);
      throw error;
    }
  };

  // HTML 파일 파싱 함수 수정
  const parseWatchHistory = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // 시청기록 항목 추출
      const watchItems = Array.from(doc.querySelectorAll('.content-cell'));
      
      // 시청기록 데이터 추출
      const watchHistory = watchItems
        .map((item): any => {  // any 타입으로 변경
          try {
            const titleElement = item.querySelector('a');
            if (!titleElement) return null;

            const title = titleElement.textContent?.split(' 을(를) 시청했습니다.')[0];
            const videoUrl = titleElement.getAttribute('href') || '';
            const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];

            const channelElement = item.querySelector('a:nth-child(3)');
            const channelName = channelElement?.textContent || '';

            const dateText = item.textContent || '';
            const dateMatch = dateText.match(/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/);
            if (!dateMatch) return null;

            const date = new Date(dateMatch[0].replace(/\./g, '-'));

            if (!videoId || !title) return null;

            return {
              title,
              videoId,
              channelName,
              date,
              url: `https://youtube.com/watch?v=${videoId}`,
              keywords: [] as string[]
            };
          } catch (error) {
            console.error('항목 파싱 실패:', error);
            return null;
          }
        })
        .filter(item => item !== null);  // 단순화된 필터

      if (watchHistory.length === 0) {
        throw new Error('시청기록을 찾을 수 없습니다.');
      }

      // 최근 순으로 정렬하고 30개만 선택
      const recentWatchHistory = watchHistory
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 30);

      console.log('파싱된 전체 항목 수:', watchItems.length);
      console.log('처리할 시청기록 수:', recentWatchHistory.length);

      // 각 비디오 정보 가져오기 (병렬 처리로 최적화)
      let successCount = 0;
      const batchSize = 5; // 한 번에 처리할 비디오 수

      for (let i = 0; i < recentWatchHistory.length; i += batchSize) {
        const batch = recentWatchHistory.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (item) => {
            try {
              await fetchVideoInfo(item.videoId);
              successCount++;
            } catch (error) {
              console.error(`비디오 정보 가져오기 실패 (${item.videoId}):`, error);
            }
          })
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      alert(`${successCount}개의 시청기록이 성공적으로 처리되었습니다!`);

      // 저장된 시청 기록 분석
      const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      const clusters = await analyzeKeywordsWithOpenAI(savedHistory);
      localStorage.setItem('watchClusters', JSON.stringify(clusters));

      console.log('분석 완료:', {
        totalVideos: savedHistory.length,
        totalClusters: clusters.length,
        topCategories: clusters.slice(0, 3).map(c => ({
          category: c.main_keyword,
          strength: c.strength
        }))
      });
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

  // 클러스터링 버튼 핸들러
  const handleCluster = async () => {
    try {
      setIsLoading(true);
      const newClusters = await analyzeKeywordsWithOpenAI(watchHistory);
      
      // 새로운 분석 결과 생성
      const newAnalysis = {
        id: new Date().getTime().toString(),
        date: new Date().toLocaleString(),
        clusters: newClusters
      };

      // 기존 분석 기록 불러오기
      const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      const updatedAnalyses = [...savedAnalyses, newAnalysis];

      // 저장
      localStorage.setItem('analysisHistory', JSON.stringify(updatedAnalyses));
      setAnalysisHistory(updatedAnalyses);
      
      // 현재 클러스터 설정
      setClusters(newClusters);
      setShowAnalysis(true);
    } catch (error) {
      console.error('클러스터링 실패:', error);
      setError('클러스터링 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 추상화 함수 수정
  const abstractCategories = async (keywords: string[]) => {
    const prompt = `
당신은 YouTube 시청 기록을 분석하여 사용자의 취향과 관심사를 깊이 있게 이해하는 전문가입니다.
다음 시청 기록 데이터를 분석하여 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹으로 분류해주세요.

시청 기록 데이터:
${Array.from(keywordToVideos.entries()).map(([keyword, titles]) => 
  `${keyword}:
   - ${titles.join('\n   - ')}`
).join('\n\n')}

분석 요구사항:
1. 모든 영상이 최소 하나의 그룹에 포함되어야 합니다.
2. 각 그룹은 최소 3개 이상의 연관된 영상을 포함해야 합니다.
3. 하나의 영상이 여러 그룹에 포함될 수 있습니다.
4. 각 그룹은 사용자의 뚜렷한 관심사나 취향을 나타내야 합니다.
5. 클러스터 수는 최소 5개 이상의 클러스터를 만들어주세요. 각 클러스터는 명확한 주제와 특정을 가져야합니다.
6. 특정인물이 포착될때, 인물이 클러스터의 기준이 됩니다.

각 그룹은 다음 네 가지 관점에서 분석해주세요:

1. 콘텐츠 카테고리:
사용자의 관심사를 가장 잘 나타내는 YouTube 공식 카테고리를 선택해주세요:
[카테고리 목록...]

2. 관심 영역 설명:
- 이 그룹이 나타내는 사용자의 구체적인 관심사와 취향
- 시청 패턴에서 발견되는 특징적인 성향
- 콘텐츠 소비 방식이나 선호도

3. 핵심 키워드:
- 이 그룹을 대표하는 구체적인 키워드
- 사용자의 관심사를 가장 잘 설명하는 키워드
- 시청 패턴의 특징을 나타내는 키워드

4. 감성과 태도:
- 이 그룹의 콘텐츠를 통해 드러나는 사용자의 성향
- 콘텐츠를 대하는 태도나 몰입도
- 시청 목적이나 기대하는 가치

응답 형식:
CLUSTER_START
대표키워드: [이 그룹을 대표하는 핵심 주제]
카테고리: [선택된 카테고리]
관심영역: [사용자의 관심사와 취향을 2-3문장으로 설명]
핵심키워드: [주요 키워드 3개]
감성태도: [감성과 태도 키워드 3-4개]
포함키워드: [이 그룹에 포함된 모든 관련 키워드]
관련영상수: [예상 영상 수]
CLUSTER_END

예시:
CLUSTER_START
대표키워드: 테크 리뷰
카테고리: 과학/기술
관심영역: 최신 전자기기와 IT 트렌드를 깊이 있게 파악하려는 성향이 강함. 특히 실사용 경험과 상세한 성능 분석을 중시하며, 구매 결정에 신중한 접근을 보임.
핵심키워드: 스마트폰리뷰, 전자기기비교, 신제품분석
감성태도: 분석적인, 실용적인, 신중한, 트렌디한
포함키워드: 스마트폰, 태블릿, 노트북, 웨어러블, 리뷰, 비교, 성능테스트
관련영상수: 5
CLUSTER_END`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.8, // 더 창의적인 응답을 위해 temperature 증가
    });

    const response = completion.choices[0].message.content?.trim() || '';
    const categories = response.split('\n').reduce((acc: any, line) => {
      const [key, value] = line.split(':|');
      acc[key] = value;
      return acc;
    }, {});

    return {
      main_keyword: categories['최상단'],
      sub_keyword: categories['중간'],
      mood_keyword: categories['감성']
    };
  };

  // 클러스터 저장 함수 수정
  const saveClusterToLocal = async (cluster: any) => {
    try {
      const categories = await abstractCategories(cluster.keyword_list.split(','));
      
      // 클러스터에 속한 영상 수 계산
      const videoCount = cluster.related_videos.length;
      // 영상 링크 추출
      const videoLinks = cluster.related_videos.map((v: any) => v.url).join(',');

      return {
        main_keyword: categories.main_keyword,
        sub_keyword: categories.sub_keyword,
        mood_keyword: categories.mood_keyword,
        keyword_list: cluster.keyword_list,
        strength: videoCount,
        video_links: videoLinks,
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {
          ...cluster.metadata,
          video_count: videoCount,
          videos: cluster.related_videos.map((v: any) => ({
            title: v.title,
            url: v.url,
            keywords: v.keywords
          }))
        }
      } as Cluster;
    } catch (error) {
      console.error('클러스터 처리 실패:', error);
      return null;
    }
  };

  // 클러스터 추상화 버튼 핸들러 수정
  const handleAbstractClusters = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.all(
        clusters.map(cluster => saveClusterToLocal(cluster))
      );

      const successfulClusters = results.filter(result => result !== null);
      
      if (successfulClusters.length > 0) {
        localStorage.setItem('abstractedClusters', JSON.stringify(successfulClusters));
        
        // 상세 로깅 개선
        console.group('🎯 클러스터 분석 결과');
        successfulClusters.forEach((cluster: Cluster, index) => {
          console.group(`📌 클러스터 ${index + 1}`);
          console.log('ID:', cluster.id);
          console.log('대표 카테고리:', cluster.main_keyword);
          console.log('서브 키워드:', cluster.sub_keyword);
          console.log('감성 키워드:', cluster.mood_keyword);
          console.log('설명:', cluster.description);  // description 별도 로깅
          console.log('키워드 목록:', cluster.keyword_list.split(',').map(k => k.trim()));
          console.log('강도 (영상 수):', cluster.strength);
          console.log('비디오 링크:', cluster.video_links.split(','));
          console.log('생성일:', cluster.created_at);
          console.log('메타데이터:', cluster.metadata);
          
          // 클러스터 데이터 구조 검증
          console.log('\n📊 데이터 구조 검증:');
          const validation = {
            hasMainKeyword: !!cluster.main_keyword,
            hasSubKeyword: !!cluster.sub_keyword,
            hasMoodKeyword: !!cluster.mood_keyword,
            hasKeywordList: !!cluster.keyword_list,
            hasStrength: typeof cluster.strength === 'number',
            hasVideoLinks: !!cluster.video_links,
            hasCreatedAt: !!cluster.created_at,
            hasMetadata: !!cluster.metadata
          };
          console.table(validation);
          console.groupEnd();
        });
        console.groupEnd();

        // 카테고리 분포 확인
        console.group('🎯 카테고리 분포');
        const categoryCount = successfulClusters.reduce((acc: {[key: string]: number}, cluster) => {
          acc[cluster.main_keyword] = (acc[cluster.main_keyword] || 0) + 1;
          return acc;
        }, {});
        console.table(categoryCount);
        console.groupEnd();

        setShowAbstractResults(true);
        alert(`${successfulClusters.length}개의 클러스터가 성공적으로 처리되었습니다.`);
      } else {
        throw new Error('클러스터 처리에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '클러스터 추상화 중 오류가 발생했습니다.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const extractVideoKeywords = async (videoInfo: any) => {
    const prompt = `
당신은 YouTube 영상 콘텐츠 분석 전문가입니다. 
다음 영상의 정보를 분석하여 가장 적절한 키워드를 추출해주세요.

[입력 정보]
제목: ${videoInfo.title}
설명: ${videoInfo.description?.slice(0, 200)}
태그: ${videoInfo.tags ? videoInfo.tags.join(', ') : '없음'}

[추출 기준]
1. 주제 관련성: 영상의 핵심 주제를 대표하는 명사 키워드
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 명사 키워드
3. 감정/톤: 영상의 분위기나 감정을 나타내는 형용사 키워드
4. 대상 시청자: 주요 타겟 시청자층을 나타내는 명사 키워드
5. 트렌드/이슈: 관련된 시의성 있는명사 키워드

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1-2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어 제외
- 위의 5가지 기준 중 최소 3가지 이상 포함
- 키워드 간의 중복성 최소화

응답 형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5

각 키워드 뒤에 해당하는 기준 카테고리를 괄호 안에 표시해주세요.
예시: 브이로그(콘텐츠 유형), 일상(주제 관련성), 힐링(감정/톤)`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7, // 적당한 창의성 부여
    });

    // 응답 파싱 및 검증
    const response = completion.choices[0].message.content?.trim() || '';
    const keywords = response.split(',').map(k => {
      const [keyword, category] = k.trim().split('(');
      return {
        keyword: keyword.trim(),
        category: category?.replace(')', '').trim()
      };
    });

    return keywords;
  };

  // 이미지 검색 함수 수정
  const searchClusterImage = async (cluster: any, forceRefresh: boolean = false) => {
    try {
      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      const hasAttempted = localStorage.getItem(imageAttemptKey);
      
      if (!forceRefresh && hasAttempted === 'failed') {
        console.log('이전에 이미지 검색 실패 기록이 있습니다. 기본 이미지 사용:', cluster.main_keyword);
        return {
          url: placeholderImage,
          credit: {
            name: 'Default Image',
            link: '#'
          }
        };
      }

      // 검색 쿼리 최적화
      const searchParams = new URLSearchParams();
      
      // 1. 메인 키워드 처리
      let mainKeyword = cluster.main_keyword;
      if (cluster.main_keyword.includes('인물')) {
        mainKeyword = `${mainKeyword} 인물사진 프로필`;
      }
      searchParams.append('query', mainKeyword);
      
      // 2. 카테고리 추가
      if (cluster.category && cluster.category !== '기타') {
        searchParams.append('category', cluster.category);
      }
      
      // 3. 감성 키워드 추가
      if (cluster.mood_keyword) {
        const moodKeywords = cluster.mood_keyword.split(',')[0].trim();
        searchParams.append('mood', moodKeywords);
      }

      // 캐시 방지를 위한 타임스탬프 추가
      if (forceRefresh) {
        searchParams.append('t', new Date().getTime().toString());
      }

      console.log('이미지 검색 시작:', searchParams.toString());

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
        localStorage.setItem(imageAttemptKey, 'failed');
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('검색 결과:', data);

      if (data.items?.length > 0) {
        // 이전 결과와 다른 이미지를 선택
        const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
        const currentImage = savedImages[cluster.main_keyword]?.url;
        
        // 현재 이미지와 다른 새로운 이미지 찾기
        const availableImages = data.items.filter((item: any) => item.link !== currentImage);
        const selectedImage = availableImages.length > 0 ? 
          availableImages[Math.floor(Math.random() * availableImages.length)] : 
          data.items[0];
        
        const image = {
          url: selectedImage.link,
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

        return image;
      }

      // 결과가 없는 경우 실패 기록 저장
      localStorage.setItem(imageAttemptKey, 'failed');
      return {
        url: placeholderImage,
        credit: {
          name: 'Default Image',
          link: '#'
        }
      };
    } catch (error) {
      console.error('이미지 검색 실패:', error);
      
      // 실패 기록 저장
      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      localStorage.setItem(imageAttemptKey, 'failed');
      
      return {
        url: placeholderImage,
        credit: {
          name: 'Default Image',
          link: '#'
        }
      };
    }
  };

  // 랜덤 색상 생성 함수 추가
  const getRandomColor = () => {
    const colors = [
      '#E6F3FF', '#FFE6E6', '#E6FFE6', '#FFE6F3', '#F3E6FF',
      '#E6FFF3', '#F3FFE6', '#FFE6FF', '#E6F3FF', '#FFE6E6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 클러스터 이미지 배경 생성 함수 수정
  const generateClusterBackground = (cluster: any) => {
    const color1 = getRandomColor();
    const color2 = getRandomColor();
    return `linear-gradient(45deg, ${color1}, ${color2})`;
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

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex flex-col items-center space-y-8 text-center relative z-10">
        <div className="space-y-6 max-w-8xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold">
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
                    <div className="w-full max-w-md mx-auto">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${(successCount / 30) * 100}%`,
                            animation: 'progress-animation 1.5s ease-in-out infinite'
                          }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{successCount}/30개 분석 완료</p>
                    </div>
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
                  <Button 
                    onClick={handleAbstractClusters}
                    variant="outline"
                    className="hover:bg-purple-50"
                    disabled={isLoading}
                  >
                    키워드 추상화하기
                  </Button>
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
                            영상 {cluster.related_videos.length}개
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
                            <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                              <img
                                src={clusterImages[index]?.url || placeholderImage}
                                alt={cluster.main_keyword}
                                className="w-full h-full object-contain bg-gray-100"
                                onError={(e) => {
                                  console.error('이미지 로드 실패:', e);
                                  const target = e.target as HTMLImageElement;
                                  
                                  // 이미 재시도했는지 확인
                                  if (target.dataset.retried === 'true') {
                                    console.log('이미 재시도했습니다. 더 이상 시도하지 않습니다.');
                                    return; // 이미 재시도했으면 더 이상 처리하지 않음
                                  }
                                  
                                  // 재시도 표시
                                  target.dataset.retried = 'true';
                                  
                                  // 데이터 URI 사용
                                  target.src = placeholderImage;
                                  
                                  // 이미지 상태 업데이트
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
                          )}

                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-semibold text-gray-700">카테고리:</span>
                                <span className="px-2.5 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
                                  {cluster.category}
                                </span>
                              </div>
                              <p className="text-gray-700">{cluster.description}</p>
                            </div>

                            <div className="bg-white rounded-lg p-4">
                              <h5 className="font-semibold mb-3 text-gray-700">주요 키워드</h5>
                              <div className="flex flex-wrap gap-2">
                                {cluster.keyword_list.split(',').map((keyword: string, idx: number) => (
                                  <span key={idx} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                                    {keyword.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {cluster.mood_keyword && (
                              <div className="bg-white rounded-lg p-4">
                                <h5 className="font-semibold mb-3 text-gray-700">감성 & 분위기</h5>
                                <div className="flex flex-wrap gap-2">
                                  {cluster.mood_keyword.split(',').map((keyword: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1.5 bg-purple-100 rounded-full text-sm font-medium text-purple-700">
                                      {keyword.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 탭 버튼 */}
                            <div className="flex gap-2 border-b border-gray-200">
                              <button
                                className={`px-4 py-2 ${
                                  activeTab[index] === 'related' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500'
                                }`}
                                onClick={() => setActiveTab({...activeTab, [index]: 'related'})}
                              >
                                관련 영상 ({cluster.related_videos.length})
                              </button>
                              <button
                                className={`px-4 py-2 ${
                                  activeTab[index] === 'recommended' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500'
                                }`}
                                onClick={() => setActiveTab({...activeTab, [index]: 'recommended'})}
                              >
                                추천 영상
                              </button>
                            </div>

                            {/* 영상 목록 */}
                            <div className="bg-white rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeTab[index] === 'related' ? (
                                  // 관련 영상 목록
                                  cluster.related_videos.map((video: any, idx: number) => (
                                    <VideoCard key={idx} video={video} />
                                  ))
                                ) : (
                                  // 추천 영상 목록
                                  <RecommendedVideos cluster={cluster} />
                                )}
                              </div>
                            </div>
                          </div>
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
