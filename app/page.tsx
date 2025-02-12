"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube 동영상 ID 추출 함수
  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
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
        
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${videoInfo.channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );
        
        const channelData = await channelResponse.json();
        const channelInfo = channelData.items[0].snippet;

        // 콘솔에 정보 출력
        console.log('=== 비디오 정보 ===');
        console.log('제목:', videoInfo.title);
        console.log('설명:', videoInfo.description);
        console.log('태그:', videoInfo.tags || []);
        console.log('채널명:', channelInfo.title);
        console.log('채널설명:', channelInfo.description);

        // Supabase에 데이터 저장
        const { error: insertError } = await supabase
          .from('watched_video')
          .insert([
            {
              user_id: (await supabase.auth.getUser()).data.user?.id,
              video_link: `https://youtube.com/watch?v=${videoId}`,
              video_title: videoInfo.title,
              video_tags: videoInfo.tags ? videoInfo.tags.join(',') : '',
              channel_name: channelInfo.title,
              channel_description: channelInfo.description,
              watched_at: new Date().toISOString(),
              extracted_keywords: videoInfo.tags ? videoInfo.tags.slice(0, 5).join(',') : '' // 상위 5개 태그만 저장
            }
          ]);

        if (insertError) throw insertError;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('비디오 정보 가져오기 실패:', error);
      throw error;
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const videoId = extractVideoId(playlistUrl);
      
      if (!videoId) {
        throw new Error('올바른 YouTube URL이 아닙니다.');
      }

      await fetchVideoInfo(videoId);
      setPlaylistUrl('');
      alert('비디오 정보가 성공적으로 저장되었습니다!');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex flex-col items-center space-y-4 text-center relative z-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Create my own algorithm profile
          </h1>          
        </div>
        <div className="w-full max-w-[897px] p-4">
          <form onSubmit={handleSubmit} className="relative w-full rounded-[20px] bg-white/80 backdrop-blur-sm p-4 shadow-[3px_3px_27.4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-white/90">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </form>
          {error && (
            <div className="mt-2 text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-8">
          <Button 
            onClick={handleSubmit}
            size="lg" 
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 transition-all px-8 py-8 text-2xl font-semibold rounded-full shadow-xl hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? '분석 중...' : '분석하기'}
          </Button>
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-all px-16 py-8 text-2xl font-semibold rounded-full shadow-xl hover:scale-105"
          >
            <Link href="/login">
              Create Profile
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
