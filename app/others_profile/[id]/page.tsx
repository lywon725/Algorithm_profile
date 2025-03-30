"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { dummyProfiles, ProfileData, ImageData } from '../../data/dummyProfiles';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OthersProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    // URL에서 프로필 ID 가져오기
    const profileId = params.id;
    if (profileId) {
      // 더미 데이터에서 해당 ID의 프로필 찾기
      const foundProfile = dummyProfiles.find(p => p.id.toString() === profileId);
      if (foundProfile) {
        setProfile(foundProfile);
      }
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // 컴포넌트 마운트 시 히스토리 데이터 초기화
    const initializeHistories = () => {
      const histories = JSON.parse(localStorage.getItem('moodboardHistories') || '[]');
      if (!Array.isArray(histories)) {
        localStorage.setItem('moodboardHistories', JSON.stringify([]));
      }
    };
    
    initializeHistories();
  }, []);

  // 이미지 클릭 핸들러
  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // 비디오 시청 완료 핸들러
  const handleVideoWatched = (videoId: string) => {
    if (!watchedVideos.includes(videoId)) {
      setWatchedVideos(prev => [...prev, videoId]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-gray-900 to-blue-800">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-gray-900 to-blue-800">
        <h1 className="text-3xl font-bold text-white mb-4">Profile Not Found</h1>
        <Button 
          onClick={() => router.back()}
          className="bg-white/20 hover:bg-white/30 text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 relative bg-gradient-to-br from-emerald-900 via-gray-900 to-blue-800">
      {/* 뒤로 가기 버튼 */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto">
          {/* 프로필 제목과 설명 */}
          <div className="absolute z-30 pl-8 max-w-[600px] space-y-6 mt-16">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-bold tracking-tight text-white">
                {profile.nickname}의 무드보드
              </h1>
            </div>
            <p className="text-white/80 text-lg leading-relaxed mt-4">
              {profile.description}
            </p>
          </div>

          {/* 무드보드 이미지 */}
          <div className="relative w-[800px] h-[800px] mx-auto mt-8">
            {profile.images.map((image) => (
              <div
                key={image.id}
                className={`absolute transition-all duration-500 cursor-pointer hover:scale-105 hover:z-30`}
                style={{
                  position: 'absolute',
                  width: `${image.width * image.sizeWeight * 4}px`,
                  height: `${(image.height + 80) * image.sizeWeight * 4}px`,
                  left: image.left,
                  top: image.top,
                  transform: `rotate(${image.rotate}deg)`,
                  zIndex: 10,
                }}
                onClick={() => handleImageClick(image)}
              >
                <div 
                  className={getFrameStyle(image)}
                  style={{
                    width: `${image.width}px`,
                    height: `${image.height}px`,
                    clipPath: getClipPath(image),
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    border: '5px solid white',
                    backgroundColor: 'white',
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.main_keyword}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-sm font-medium">#{image.main_keyword}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 키워드 섹션 */}
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-[1000px] mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">주요 관심사</h2>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(profile.images.flatMap(img => [img.main_keyword, ...img.keywords]))).map((keyword, idx) => (
                <span 
                  key={idx}
                  className="bg-white/20 px-4 py-2 rounded-full text-white"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* 관련 비디오 섹션 */}
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-[1000px] mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">관련 비디오</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.images.slice(0, 2).flatMap(img => img.relatedVideos.slice(0, 1)).map((video, idx) => (
                <div key={idx} className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.embedId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 상세 Sheet */}
      {selectedImage && (
        <Sheet open={showImageModal} onOpenChange={setShowImageModal}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader className="relative border-b pb-4">
              <SheetTitle className="text-2xl font-bold">
                #{selectedImage.main_keyword}
              </SheetTitle>
            </SheetHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 h-[calc(100%-80px)] overflow-y-auto">
              {/* 이미지 섹션 */}
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.src}
                    alt={selectedImage.main_keyword}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 카테고리 뱃지 */}
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium">
                    {selectedImage.category}
                  </span>
                </div>
                
                {/* 이미지 가져오기 버튼 추가 */}
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => {
                    try {
                      // 로컬 스토리지에서 현재 히스토리 데이터 가져오기
                      const histories = JSON.parse(localStorage.getItem('moodboardHistories') || '[]');
                      
                      // 유효성 검사
                      if (!Array.isArray(histories)) {
                        throw new Error('Invalid history data');
                      }
                      
                      // 가장 최근 히스토리 가져오기
                      const latestHistory = histories.length > 0 ? histories[histories.length - 1] : {
                        timestamp: Date.now(),
                        positions: {},
                        frameStyles: {},
                        images: []
                      };
                      
                      // 새 이미지 객체 생성 전 selectedImage 확인
                      if (!selectedImage) {
                        throw new Error('No image selected');
                      }
                      
                      const newId = `imported-${Date.now()}`;
                      const newImage = {
                        ...selectedImage,
                        id: newId,
                        left: "30%",
                        top: "30%",
                        rotate: 0,
                        sizeWeight: 0.3,
                        desired_self: true,
                        desired_self_profile: profile.id
                      };
                      
                      const newHistory = {
                        timestamp: Date.now(),
                        positions: latestHistory.positions || {},
                        frameStyles: {
                          ...(latestHistory.frameStyles || {}),
                          [newId]: 'star'  // 새 이미지의 프레임 스타일을 star로 설정
                        },
                        images: [...(latestHistory.images || []), newImage]
                      };
                      
                      histories.push(newHistory);
                      localStorage.setItem('moodboardHistories', JSON.stringify(histories));
                      
                      setShowSuccessDialog(true);
                    } catch (error) {
                      console.error('히스토리 저장 중 오류:', error);
                      alert('이미지 저장 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    이 이미지 가져오기
                  </div>
                </Button>
                
              </div>

              {/* 정보 섹션 */}
              <div className="flex flex-col gap-6">
                {/* 키워드 카드들 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <h4 className="text-sm font-medium text-emerald-600 mb-2">메인 키워드</h4>
                    <p className="text-xl font-bold text-emerald-900">#{selectedImage.main_keyword}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <h4 className="text-sm font-medium text-purple-600 mb-2">감성/분위기</h4>
                    <p className="text-xl font-bold text-purple-900">#{selectedImage.mood_keyword}</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <h4 className="text-sm font-medium text-blue-600 mb-2">서브 키워드</h4>
                    <p className="text-xl font-bold text-blue-900">#{selectedImage.sub_keyword}</p>
                  </div>
                </div>

                {/* 관심도 섹션 */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">관심도</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedImage.sizeWeight >= 1.2 ? "bg-red-100 text-red-700" :
                      selectedImage.sizeWeight >= 0.8 ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedImage.sizeWeight >= 1.2 ? "강" :
                       selectedImage.sizeWeight >= 0.8 ? "중" : "약"}
                    </span>
                  </div>
                  
                  {/* 게이지 바 */}
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                        selectedImage.sizeWeight >= 1.2 ? "bg-gradient-to-r from-red-400 to-red-500" :
                        selectedImage.sizeWeight >= 0.8 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                        "bg-gradient-to-r from-blue-400 to-blue-500"
                      }`}
                      style={{ width: `${Math.min(selectedImage.sizeWeight * 50, 100)}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {selectedImage.sizeWeight >= 1.2 ? "이 주제에 대한 높은 관심도를 보입니다" :
                     selectedImage.sizeWeight >= 0.8 ? "이 주제에 대해 보통 수준의 관심을 가지고 있습니다" :
                     "이 주제에 대해 가볍게 관심을 두고 있습니다"}
                  </p>
                </div>

                {/* 이미지 설명 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-3">이미지 설명</h4>
                  <p className="text-gray-700">{selectedImage.description}</p>
                </div>

                {/* 관련 키워드 */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">관련 키워드</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 관련 비디오 */}
                <div className="flex-1 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-2">관련 비디오</h3>
                  <div className="space-y-4">
                    {selectedImage.relatedVideos.map((video, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="aspect-video rounded-lg overflow-hidden mb-3">
                          <iframe
                            id={`player-${video.embedId}`}
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.embedId}`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onEnded={() => handleVideoWatched(video.embedId)}
                          ></iframe>
                        </div>
                        <h4 className="font-medium">{video.title}</h4>
                        <div className="flex items-center mt-2">
                          {watchedVideos.includes(video.embedId) ? (
                            <span className="text-green-600 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              시청 완료
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">아직 시청하지 않음</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* 성공 다이얼로그 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이미지 추가 완료</DialogTitle>
            <DialogDescription>
              이미지가 성공적으로 무드보드에 추가되었습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              다음에
            </Button>
            <Button
              onClick={() => router.push('/my_profile')}
            >
              마이페이지 가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// 프레임 스타일 가져오기
function getFrameStyle(image: ImageData): string {
  // frameStyle이 'star'인 경우 빈 문자열 반환 (clip-path가 적용되도록)
  if (image.desired_self === true) {
    return 'star';
  }
  
  // 기존 로직 유지
  if (image.id.includes('nature')) {
    return 'rounded-lg';
  } else if (image.id.includes('art')) {
    return '';
  } else if (image.id.includes('food')) {
    return 'rounded-full';
  } else {
    return '';
  }
}

// 클립 패스 가져오기
function getClipPath(image: ImageData): string {
  // frameStyle이 'star'인 경우 별 모양 클립패스 반환
  if (image.frameStyle === 'star') {
    return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
  }
  
  // 기존 로직 유지
  if (image.id.includes('art')) {
    return 'polygon(50% 0%, 100% 100%, 0% 100%)';
  } else if (image.id.includes('tech')) {
    return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  } else {
    return '';
  }
} 

//test 입니다