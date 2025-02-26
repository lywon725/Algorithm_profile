// 더미 사용자 프로필 데이터 타입 정의
export type VideoData = {
  title: string;
  embedId: string;
};

export type ImageData = {
  id: string;
  src: string;
  main_keyword: string;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  color: string;
  keywords: string[];
  sizeWeight: number;
  relatedVideos: VideoData[];
};

export type ProfileData = {
  id: number;
  nickname: string;
  description: string;
  images: ImageData[];
};

// 더미 프로필 데이터
export const dummyProfiles: ProfileData[] = [
  {
    id: 1,
    nickname: "자연 탐험가",
    description: "자연과 풍경에 관심이 많은 사용자입니다. 산과 바다, 숲을 좋아하며 여행을 통해 다양한 자연 경관을 탐험합니다.",
    images: [
      {
        id: "nature-1",
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        main_keyword: "산",
        width: 600,
        height: 400,
        rotate: 0,
        left: "10%",
        top: "5%",
        color: "#3B7A57",
        keywords: ["산", "풍경", "자연", "하이킹", "모험"],
        sizeWeight: 1.2,
        relatedVideos: [
          { title: "아름다운 산 풍경 4K", embedId: "3pysVpnS7HY" },
          { title: "산에서의 하루", embedId: "dQw4w9WgXcQ" }
        ]
      },
      {
        id: "nature-2",
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        main_keyword: "바다",
        width: 550,
        height: 380,
        rotate: -2,
        left: "45%",
        top: "15%",
        color: "#4682B4",
        keywords: ["바다", "해변", "파도", "휴양", "여름"],
        sizeWeight: 1.1,
        relatedVideos: [
          { title: "해변에서의 일출", embedId: "KkKZeZw3EXk" },
          { title: "파도 소리 ASMR", embedId: "V-_O7nl0Ii0" }
        ]
      },
      {
        id: "nature-3",
        src: "https://images.unsplash.com/photo-1511497584788-876760111969",
        main_keyword: "숲",
        width: 500,
        height: 350,
        rotate: 3,
        left: "20%",
        top: "45%",
        color: "#228B22",
        keywords: ["숲", "나무", "녹색", "평화", "산책"],
        sizeWeight: 1.0,
        relatedVideos: [
          { title: "숲속 산책로", embedId: "dJZJxX5G0YU" },
          { title: "숲속의 새소리", embedId: "rYoZgpAEkFs" }
        ]
      },
      {
        id: "nature-4",
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e",
        main_keyword: "가을",
        width: 520,
        height: 370,
        rotate: -1,
        left: "55%",
        top: "50%",
        color: "#D2691E",
        keywords: ["가을", "단풍", "낙엽", "계절", "공원"],
        sizeWeight: 1.05,
        relatedVideos: [
          { title: "가을 풍경 모음", embedId: "PLOPygVcaVE" },
          { title: "단풍길 드라이브", embedId: "2ZIpFytCSVc" }
        ]
      }
    ]
  },
  // 나머지 프로필 데이터...
  {
    id: 2,
    nickname: "도시 탐험가",
    description: "도시의 다양한 모습과 건축물에 관심이 많습니다. 세계 각국의 도시를 여행하며 도시만의 독특한 문화와 분위기를 경험합니다.",
    images: [
      // 이미지 데이터...
    ]
  },
  // 나머지 프로필 데이터는 기존과 동일하게 유지
]; 