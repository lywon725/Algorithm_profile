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

export default function OthersProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

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
          <div className="relative w-[1000px] h-[800px] mx-auto mt-8">
            {profile.images.map((image) => (
              <div
                key={image.id}
                className={`absolute transition-all duration-500 cursor-pointer hover:scale-105 hover:z-30`}
                style={{
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
              <div className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.main_keyword}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 정보 섹션 */}
              <div className="flex flex-col">
                {/* 키워드 */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">키워드</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {keyword}
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
    </main>
  );
}

// 프레임 스타일 가져오기
function getFrameStyle(image: ImageData): string {
  // 이미지 ID에서 프레임 스타일 추출 (예시 로직)
  if (image.id.includes('nature')) {
    return 'rounded-lg'; // healing
  } else if (image.id.includes('art')) {
    return ''; // inspiration (no rounded corners)
  } else if (image.id.includes('food')) {
    return 'rounded-full'; // people
  } else {
    return ''; // interest (no rounded corners)
  }
}

// 클립 패스 가져오기
function getClipPath(image: ImageData): string {
  // 이미지 ID에서 클립 패스 추출 (예시 로직)
  if (image.id.includes('art')) {
    return 'polygon(50% 0%, 100% 100%, 0% 100%)'; // inspiration
  } else if (image.id.includes('tech')) {
    return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'; // interest
  } else {
    return ''; // 기본값 (클립 패스 없음)
  }
} 