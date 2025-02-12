"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Edit2, Save, CheckCircle2, RefreshCw } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Position = {
  x: number;
  y: number;
};

type VideoData = {
  title: string;
  embedId: string;
};

type ImageData = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  color: string;
  position?: Position;
  keywords: string[];
  isPersonImage: boolean;
  isFrequent: boolean;
  relatedVideos: VideoData[];
  sizeWeight: number;
};

type HistoryData = {
  timestamp: number;
  positions: Record<string, Position>;
};

function DraggableImage({ 
  image, 
  position, 
  isEditing,
  positions 
}: { 
  image: ImageData; 
  position?: Position; 
  isEditing: boolean;
  positions: Record<string, Position>;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: image.id,
    disabled: !isEditing,
  });

  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [frameStyle, setFrameStyle] = useState<'healing' | 'inspiration' | 'people' | 'interest'>('healing');
  const [showImageModal, setShowImageModal] = useState(false);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${image.rotate}deg)`,
    transition: isEditing ? 'none' : 'transform 0.8s ease-in-out'
  } : {
    transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) rotate(${image.rotate}deg)`,
    transition: isEditing ? 'none' : 'transform 0.8s ease-in-out'
  };

  const getClipPath = () => {
    switch (frameStyle) {
      case 'inspiration':
        return 'polygon(50% 0%, 100% 100%, 0% 100%)';
      case 'interest':
        return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      default:
        return '';
    }
  };

  const getFrameStyle = () => {
    switch (frameStyle) {
      case 'healing':
        return 'rounded-lg';
      case 'inspiration':
        return '';
      case 'people':
        return 'rounded-full';
      case 'interest':
        return '';
    }
  };

  useEffect(() => {
    // YouTube IFrame API 로드
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        return new Promise<void>((resolve) => {
          window.onYouTubeIframeAPIReady = () => {
            resolve();
          };
        });
      }
      return Promise.resolve();
    };

    const initializePlayers = async () => {
      await loadYouTubeAPI();
      
      image.relatedVideos.forEach((video) => {
        const playerElement = document.getElementById(`player-${video.embedId}`);
        if (playerElement) {
          new window.YT.Player(playerElement, {
            videoId: video.embedId,
            events: {
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setWatchedVideos(prev => 
                    prev.includes(video.embedId) ? prev : [...prev, video.embedId]
                  );
                }
              }
            }
          });
        }
      });
    };

    initializePlayers();
  }, [image.relatedVideos]);

  const handleVideoClick = (video: VideoData) => {
    // 로컬 스토리지에서 현재 시청 기록 가져오기
    const currentHistory = localStorage.getItem('watchHistory');
    const history = currentHistory ? JSON.parse(currentHistory) : [];
    
    // 이미 있는 영상인지 확인
    const isExist = history.some((item: any) => item.embedId === video.embedId);
    
    if (!isExist) {
      // 새로운 시청 기록 추가
      const newHistory = [
        {
          title: video.title,
          embedId: video.embedId,
          timestamp: Date.now()
        },
        ...history
      ];
      
      // 로컬 스토리지에 저장
      localStorage.setItem('watchHistory', JSON.stringify(newHistory));
      
      // 시청한 영상 목록 업데이트
      setWatchedVideos(prev => [...prev, video.embedId]);
    }
  };

  return (
    <>
      <Sheet>
        <div
          ref={setNodeRef}
          style={{
            ...style,
            position: 'absolute',
            width: image.width * image.sizeWeight,
            height: (image.height + 80) * image.sizeWeight,
            left: image.left,
            top: image.top,
            transform: transform ? 
              `translate3d(${transform.x + (positions[image.id]?.x || 0)}px, ${transform.y + (positions[image.id]?.y || 0)}px, 0) rotate(${image.rotate}deg)` :
              `translate3d(${positions[image.id]?.x || 0}px, ${positions[image.id]?.y || 0}px, 0) rotate(${image.rotate}deg)`,
            transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
            touchAction: 'none',
          }}
          className={isEditing ? "cursor-move" : "cursor-pointer"}
        >
          {isEditing && (
            <div className="absolute inset-0 transform transition-all duration-300 hover:scale-110 hover:z-30 group">
              <div className={`relative w-full h-[calc(100%-80px)] ${frameStyle === 'people' ? 'rounded-full overflow-hidden' : ''}`}>
                <div
                  style={{
                    clipPath: getClipPath(),
                  }}
                  className={`relative w-full h-full ${getFrameStyle()} overflow-hidden`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover shadow-lg"
                  />
                </div>
                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-full flex flex-col items-center gap-2">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {image.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm rounded-full shadow-sm"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                  <button 
                    className="flex items-center justify-center gap-1.5 py-1.5 px-4 min-w-[120px] bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-sm transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowImageModal(true);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">이미지 변경</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isEditing && (
            <SheetTrigger asChild>
              <div className="absolute inset-0 transform transition-all duration-300 hover:scale-110 hover:z-30 group">
                <div className={`relative w-full h-[calc(100%-80px)] ${frameStyle === 'people' ? 'rounded-full overflow-hidden' : ''}`}>
                  <div
                    style={{
                      clipPath: getClipPath(),
                    }}
                    className={`relative w-full h-full ${getFrameStyle()} overflow-hidden`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover shadow-lg"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex flex-wrap gap-2 justify-center p-4">
                      {image.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-sm font-medium text-white bg-black/40 backdrop-blur-sm rounded-full"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SheetTrigger>
          )}
          {isEditing && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-3 py-1 z-40">
              <select 
                className="text-sm border-none bg-transparent outline-none cursor-pointer"
                value={frameStyle}
                onChange={(e) => setFrameStyle(e.target.value as 'healing' | 'inspiration' | 'people' | 'interest')}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="healing">⬛️ 나에게 힐링이 되는 영상</option>
                <option value="inspiration">🔺 영감을 주는 영상</option>
                <option value="people">⚪️ 내가 좋아하는 사람</option>
                <option value="interest">🔶 나만의 관심사</option>
              </select>
            </div>
          )}
          <div
            className={`absolute top-2 right-2 w-4 h-4 bg-${image.color}-200 rounded-full shadow-sm`}
          />
          {isEditing && (
            <div
              className="absolute inset-0 z-10"
              {...listeners}
              {...attributes}
            />
          )}
        </div>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] sm:h-[85vh]"
        >
          <div className="h-full overflow-y-auto px-4">
            <div className="flex flex-col max-w-3xl mx-auto pb-8">
              <div className="relative w-full h-[400px] flex-shrink-0">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">{image.alt}</h3>
                  <div className="flex flex-wrap gap-2">
                    {image.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 text-base font-medium bg-gray-100 text-gray-700 rounded-full"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-9">
                  <Tabs defaultValue="history" className="w-full">
                    <div className="bg-gray-70/70 rounded-lg">
                      <TabsList className="w-full grid grid-cols-2 py-0">
                        <TabsTrigger value="history" className="text-xl py-1">History contents</TabsTrigger>
                        <TabsTrigger value="ai" className="text-xl py-1">AI-driven contents</TabsTrigger>
                      </TabsList>
                      <br/> <br/>
                      <TabsContent value="history" className="px-6 pb-6">
                        <div className="grid gap-8">
                          {[
                            {
                              title: "따뜻한 감성의 일상 브이로그",
                              embedId: "gQHvqQw0GzM"
                            },
                            {
                              title: "포근한 주말 아침 일상",
                              embedId: "D3ZFtSUDNQM"
                            },
                            {
                              title: "감성 사진 촬영 팁",
                              embedId: "BQHgmqZqwYY"
                            },
                            {
                              title: "힐링되는 감성 영상",
                              embedId: "D4jPZXrOF3Y"
                            },
                            {
                              title: "밤의 여유로운 재즈 카페",
                              embedId: "cJWBJ4uYVHk"
                            },
                            {
                              title: "편안한 밤 분위기 음악",
                              embedId: "DrmcAh2FRHQ"
                            }
                          ].map((video, idx) => (
                            <div key={idx} className="space-y-2">
                              <h5 className="text-lg font-medium text-gray-800 mb-2">{video.title}</h5>
                              <div 
                                className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => handleVideoClick(video)}
                              >
                                <iframe
                                  id={`player-${video.embedId}`}
                                  className="absolute inset-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                                <div className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                  watchedVideos.includes(video.embedId) 
                                    ? "bg-green-500/80 text-white" 
                                    : "bg-gray-900/80 text-gray-200"
                                }`}>
                                  <CheckCircle2 className={`h-4 w-4 ${
                                    watchedVideos.includes(video.embedId)
                                      ? "text-white"
                                      : "text-gray-400"
                                  }`} />
                                  <span className="text-sm font-medium">
                                    {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="ai" className="px-6 pb-6">
                        <div className="grid gap-8">
                          {[
                            {
                              title: "AI 추천: 감성적인 일상 브이로그",
                              embedId: "QpQNemr-m2c"
                            },
                            {
                              title: "AI 추천: 힐링되는 자연 소리",
                              embedId: "qRXBGIK7Rqk"
                            },
                            {
                              title: "AI 추천: 아늑한 집에서의 하루",
                              embedId: "ZVrGw8QnqWY"
                            },
                            {
                              title: "AI 추천: 편안한 홈카페 브이로그",
                              embedId: "X2mnHpqiHGQ"
                            },
                            {
                              title: "AI 추천: 일상의 기록, 폴라로이드",
                              embedId: "hZONJ8XnKHE"
                            },
                            {
                              title: "AI 추천: 평화로운 자연 풍경",
                              embedId: "BHACKCNDMW8"
                            }
                          ].map((video, idx) => (
                            <div key={idx} className="space-y-2">
                              <h5 className="text-lg font-medium text-gray-800 mb-2">{video.title}</h5>
                              <div 
                                className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => handleVideoClick(video)}
                              >
                                <iframe
                                  id={`player-${video.embedId}`}
                                  className="absolute inset-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                                <div className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                  watchedVideos.includes(video.embedId) 
                                    ? "bg-green-500/80 text-white" 
                                    : "bg-gray-900/80 text-gray-200"
                                }`}>
                                  <CheckCircle2 className={`h-4 w-4 ${
                                    watchedVideos.includes(video.embedId)
                                      ? "text-white"
                                      : "text-gray-400"
                                  }`} />
                                  <span className="text-sm font-medium">
                                    {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-[300px] w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">이미지 변경</h3>
              <button onClick={() => setShowImageModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image.src}
                  alt="현재 이미지"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white font-medium">현재 이미지</span>
                </div>
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <span className="text-gray-500">새 이미지 선택</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// YouTube IFrame API 타입 선언
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MyProfilePage() {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // 컴포넌트 마운트 시 저장된 히스토리 불러오기 및 최근 위치 설정
  useEffect(() => {
    const savedHistories = localStorage.getItem('moodboardHistories');
    if (savedHistories) {
      const parsedHistories = JSON.parse(savedHistories);
      setHistories(parsedHistories);
      
      // 가장 최근 히스토리의 위치로 설정
      if (parsedHistories.length > 0) {
        const latestHistory = parsedHistories[parsedHistories.length - 1];
        setPositions(latestHistory.positions);
        setCurrentHistoryIndex(parsedHistories.length - 1);
      }
    }
  }, []);

  // 히스토리 재생 효과
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying && histories.length > 0) {
      intervalId = setInterval(() => {
        setCurrentHistoryIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= histories.length) {
            setIsPlaying(false);
            return prev;
          }
          setPositions(histories[nextIndex].positions);
          return nextIndex;
        });
      }, 2000); // 2초마다 다음 히스토리로 전환 (애니메이션 시간 고려)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, histories]);

  const handleSave = () => {
    const newHistory: HistoryData = {
      timestamp: Date.now(),
      positions: positions
    };

    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories);
    localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    setCurrentHistoryIndex(updatedHistories.length - 1);
    setIsEditing(false);
  };

  const handleHistoryClick = (index: number) => {
    if (currentHistoryIndex === index) return;
    setCurrentHistoryIndex(index);
    setPositions(histories[index].positions);
  };

  const handlePlayHistory = () => {
    if (histories.length > 0) {
      setCurrentHistoryIndex(0);
      setPositions(histories[0].positions);
      setIsPlaying(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    
    const { active, delta } = event;
    setPositions(prev => {
      const oldPosition = prev[active.id] || { x: 0, y: 0 };
      return {
        ...prev,
        [active.id]: {
          x: oldPosition.x + delta.x,
          y: oldPosition.y + delta.y,
        },
      };
    });
  };

  const images: ImageData[] = [
    {
      id: "1",
      src: "https://images.unsplash.com/photo-1611516491426-03025e6043c8",
      alt: "Mood 1",
      width: 250,
      height: 250,
      rotate: -6,
      left: "10%",
      top: "5%",
      color: "yellow",
      keywords: ["따뜻한", "가족", "일상"],
      isPersonImage: false,
      isFrequent: false,
      sizeWeight: 0.7,
      relatedVideos: [
        {
          title: "따뜻한 감성의 일상 브이로그",
          embedId: "gQHvqQw0GzM"
        },
        {
          title: "포근한 주말 아침 일상",
          embedId: "D3ZFtSUDNQM"
        }
      ]
    },
    {
      id: "2",
      src: "https://images.unsplash.com/photo-1609151354448-c4a53450c6e9",
      alt: "Mood 2",
      width: 250,
      height: 250,
      rotate: 3,
      left: "50%",
      top: "0%",
      color: "pink",
      keywords: ["감성", "포토", "힐링"],
      isPersonImage: false,
      isFrequent: false,
      sizeWeight: 0.6,
      relatedVideos: [
        {
          title: "감성 사진 촬영 팁",
          embedId: "BQHgmqZqwYY"
        },
        {
          title: "힐링되는 감성 영상",
          embedId: "D4jPZXrOF3Y"
        }
      ]
    },
    {
      id: "3",
      src: "https://images.unsplash.com/photo-1616046229478-9901c5536a45",
      alt: "Mood 3",
      width: 280,
      height: 200,
      rotate: -12,
      left: "20%",
      top: "45%",
      color: "blue",
      keywords: ["여유", "휴식", "밤"],
      isPersonImage: false,
      isFrequent: false,
      sizeWeight: 0.6,
      relatedVideos: [
        {
          title: "밤의 여유로운 재즈 카페",
          embedId: "cJWBJ4uYVHk"
        },
        {
          title: "편안한 밤 분위기 음악",
          embedId: "DrmcAh2FRHQ"
        }
      ]
    },
    {
      id: "4",
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      alt: "Mood 4",
      width: 320,
      height: 250,
      rotate: 6,
      left: "60%",
      top: "40%",
      color: "green",
      keywords: ["자연", "풍경", "평화"],
      isPersonImage: false,
      isFrequent: true,
      sizeWeight: 1.1,
      relatedVideos: [
        {
          title: "평화로운 자연 풍경",
          embedId: "BHACKCNDMW8"
        },
        {
          title: "힐링되는 자연 소리",
          embedId: "qRXBGIK7Rqk"
        }
      ]
    },
    {
      id: "5",
      src: "https://images.unsplash.com/photo-1615529182904-14819c35db37",
      alt: "Mood 5",
      width: 280,
      height: 320,
      rotate: -3,
      left: "5%",
      top: "70%",
      color: "purple",
      keywords: ["아늑함", "집", "편안"],
      isPersonImage: false,
      isFrequent: false,
      sizeWeight: 0.6,
      relatedVideos: [
        {
          title: "아늑한 집에서의 하루",
          embedId: "ZVrGw8QnqWY"
        },
        {
          title: "편안한 홈카페 브이로그",
          embedId: "X2mnHpqiHGQ"
        }
      ]
    },
    {
      id: "6",
      src: "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98",
      alt: "Mood 6",
      width: 250,
      height: 250,
      rotate: 12,
      left: "45%",
      top: "75%",
      color: "red",
      keywords: ["추억", "일상", "기록"],
      isPersonImage: true,
      isFrequent: false,
      sizeWeight: 1.1,
      relatedVideos: [
        {
          title: "일상의 기록, 폴라로이드",
          embedId: "hZONJ8XnKHE"
        },
        {
          title: "추억이 담긴 브이로그",
          embedId: "QpQNemr-m2c"
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen p-4 relative">
      <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto">
          <div className="absolute z-30 pl-8 max-w-[600px] space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-bold tracking-tight">
                Yeowon&apos;s Mood board
              </h1>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed mt-4">
              This girl likes warm contents with family and into photography.
              I mainly watch calming videos for healing purposes, usually at night before going to sleep.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" />
                    편집
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative w-[1000px] h-[800px] mx-auto mt-8">
            <DndContext onDragEnd={handleDragEnd}>
              {images.map((image) => (
                <DraggableImage
                  key={image.id}
                  image={image}
                  position={positions[image.id]}
                  isEditing={isEditing}
                  positions={positions}
                />
              ))}
            </DndContext>
          </div>

          {/* 히스토리 슬라이더 */}
          {histories.length > 0 && !isEditing && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[800px] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">무드보드 히스토리</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayHistory}
                  disabled={isPlaying}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <span className="animate-pulse">재생중...</span>
                    </>
                  ) : (
                    <>
                      <span>히스토리 재생</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {histories.map((history, index) => (
                  <button
                    key={history.timestamp}
                    onClick={() => handleHistoryClick(index)}
                    className={`flex-shrink-0 p-3 rounded-lg transition-all ${
                      currentHistoryIndex === index
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <time className="text-sm font-medium">
                      {new Date(history.timestamp).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 