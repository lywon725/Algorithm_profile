"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2 } from "lucide-react";

type WatchHistoryItem = {
  title: string;
  embedId: string;
  timestamp: number;
};

export default function WatchHistoryPage() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 시청 기록 불러오기
    const history = localStorage.getItem('watchHistory');
    if (history) {
      setWatchHistory(JSON.parse(history));
    }
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">시청 기록</h1>
        <div className="grid gap-8">
          {watchHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">아직 시청 기록이 없습니다.</p>
          ) : (
            watchHistory.map((video, idx) => (
              <div key={idx} className="space-y-2 bg-white rounded-lg p-6 shadow-sm">
                <h5 className="text-lg font-medium text-gray-800 mb-2">{video.title}</h5>
                <div className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.embedId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">시청함</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(video.timestamp).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
} 