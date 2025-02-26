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

// 내 프로필용 이미지 데이터
export const myProfileImages: ImageData[] = [
  {
    id: "1",
    src: "/images/jd.jpg",
    main_keyword: "지디",
    width: 250,
    height: 250,
    rotate: -6,
    left: "10%",
    top: "20%",
    color: "yellow",
    keywords: ["유명인", "인기", "특이한"],
    sizeWeight: 2,
    relatedVideos: [
      {
        title: "치인다는 지디 실제 말투 #gd #광희 #카톡",
        embedId: "vKUvZwPk72w"
      },
      {
        title: "지디가 직접 말하는 MBTI",
        embedId: "07QjgJfrSNM"
      }
    ]
  },
  {
    id: "2",
    src: "/images/changbin.jpg",
    main_keyword: "창빈",
    width: 250,
    height: 250,
    rotate: 3,
    left: "50%",
    top: "0%",
    color: "pink",
    keywords: ["채령", "다정함", "사랑스러운"],
    sizeWeight: 5,
    relatedVideos: [
      {
        title: " 남녀 사이에 친구가 있다고 믿는 아이돌 TOP4",
        embedId: "vTvUBnBPWhM"
      },
      {
        title: " 창빈님의 다정함이 너무 오글거렸던 채령",
        embedId: "eqZA0z_bLHg"
      },
      {
        title: " 창빈X채령 연습생 때 친해진 계기",
        embedId: "eojlzOjPhiI"
      },
      {
        title: "Stray Kids ITZY Cut Ryujin, Yuna, Yeji, Chaeryeong",
        embedId: "5DEmWyekHx4"
      },
      {
        title: "전설의 JYP 3대 웃수저 ㅋㅋㅋㅋ",
        embedId: "D4jPZXrOF3Y"
      }
    ]
  },
  {
    id: "3",
    src: "/images/laughing.jpg",
    main_keyword: "유머",
    width: 280,
    height: 200,
    rotate: -12,
    left: "20%",
    top: "45%",
    color: "blue",
    keywords: ["유쾌한", "밝은", "웃김"],
    sizeWeight: 3,
    relatedVideos: [
      {
        title: "보는 사람이 더 민망한 오해원의 애교",
        embedId: "yBHW52P34to"
      },
      {
        title: "[르세라핌 LE SSERAFIM] 턱이요?",
        embedId: "r-eA0zHtrHU"
      },
      {
        title: "야노시호가 말하는 일본에서 추성훈 인기정도",
        embedId: "I_mrEE08Cvo"
      }
    ]
  },
  {
    id: "4",
    src: "/images/travel.jpg",
    main_keyword: "여행",
    width: 320,
    height: 250,
    rotate: 6,
    left: "60%",
    top: "40%",
    color: "green",
    keywords: ["세계여행", "도전", "관광객", "탐험하는"],
    sizeWeight: 3,
    relatedVideos: [
      {
        title: "태국 깊은 산 속 어딘가..",
        embedId: "P9rzOFoVWhM"
      },
      {
        title: "한국에 다시는 안온다는 관강객 ㄷㄷ",
        embedId: "5i0n89NMEtY"
      },
      {
        title: "최정상 피겨선수가 얼음판을 맛보는 이유",
        embedId: "ZV1ZaQkaHcM"
      }
    ]
  }
];

// 내 프로필 데이터도 dummyProfiles에 포함
export const myProfile: ProfileData = {
  id: 0, // 내 프로필은 ID 0으로 설정
  nickname: "나의 알고리즘",
  description: "나의 관심사와 취향을 담은 알고리즘 프로필입니다.",
  images: myProfileImages
};

// 다른 사용자들의 프로필 데이터
export const dummyProfiles: ProfileData[] = [
  myProfile, // 내 프로필을 첫 번째로 추가
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