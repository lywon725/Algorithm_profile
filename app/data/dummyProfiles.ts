// 더미 사용자 프로필 데이터 타입 정의
export type VideoData = {
  title: string;
  embedId: string;
};

// Category 타입 정의
export type Category = 'nature' | 'city' | 'food' | 'music' | 'art' | 'sports' | 'fashion' | 'tech';

// ImageData 타입에 필드 추가
export type ImageData = {
  id: string;
  src: string;
  main_keyword: string;
  sub_keyword: string;
  mood_keyword: string;
  description: string;
  category: Category;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  keywords: string[];
  sizeWeight: number;
  relatedVideos: VideoData[];
  created_at: string;
  desired_self: boolean;
  metadata: any;
  desired_self_profile: string | null;
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
    sub_keyword: "패션",
    mood_keyword: "카리스마",
    description: "독특한 패션 센스와 카리스마 넘치는 아티스트",
    category: "fashion",
    width: 250,
    height: 250,
    rotate: -6,
    left: "10%",
    top: "20%",
    keywords: ["유명인", "인기", "특이한"],
    sizeWeight: 0.2,
    relatedVideos: [
      {
        title: "치인다는 지디 실제 말투 #gd #광희 #카톡",
        embedId: "vKUvZwPk72w"
      },
      {
        title: "지디가 직접 말하는 MBTI",
        embedId: "07QjgJfrSNM"
      }
    ],
    created_at: new Date().toISOString(),
    desired_self: false,
    metadata: {},
    desired_self_profile: null
  },
  {
    id: "2",
    src: "/images/changbin.jpg",
    main_keyword: "창빈",
    sub_keyword: "음악",
    mood_keyword: "다정함",
    description: "따뜻한 미소와 친근한 매력의 아이돌",
    category: "music",
    width: 100,
    height: 100,
    rotate: 3,
    left: "50%",
    top: "0%",
    keywords: ["채령", "다정함", "사랑스러운"],
    sizeWeight: 0.3,
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
    ],
    created_at: new Date().toISOString(),
    desired_self: false,
    metadata: {},
    desired_self_profile: null
  },
  {
    id: "3",
    src: "/images/laughing.jpg",
    main_keyword: "유머",
    sub_keyword: "예능",
    mood_keyword: "유쾌함",
    description: "웃음이 가득한 즐거운 순간들",
    category: "art",

    width: 200,
    height: 180,
    rotate: -12,
    left: "20%",
    top: "45%",
    keywords: ["유쾌한", "밝은", "웃김"],
    sizeWeight: 0.3,
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
    ],
    created_at: new Date().toISOString(),
    desired_self: false,
    metadata: {},
    desired_self_profile: null
  },
  {
    id: "4",
    src: "/images/travel.jpg",
    main_keyword: "여행",
    sub_keyword: "모험",
    mood_keyword: "자유로움",
    description: "새로운 경험을 찾아 떠나는 여행",
    category: "nature",
    width: 320,
    height: 250,
    rotate: 6,
    left: "60%",
    top: "40%",
    keywords: ["세계여행", "도전", "관광객", "탐험하는"],
    sizeWeight: 0.3,
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
    ],
    created_at: new Date().toISOString(),
    desired_self: false,
    metadata: {},
    desired_self_profile: null
  }
];

// 다른 사용자들의 프로필 데이터
export const dummyProfiles: ProfileData[] = [
  
    id: 3,
    nickname: "미식 탐험가",
    description: "전 세계의 다양한 음식과 요리 문화에 관심이 많습니다. 맛있는 음식을 찾아다니며 새로운 맛의 경험을 기록합니다.",
    images: [
      {
        id: "food-1",
        src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
        main_keyword: "피자",
        sub_keyword: "이탈리안",
        mood_keyword: "행복",
        description: "정통 나폴리 피자의 풍미와 향을 담은 순간",
        category: "food",
        width: 580,
        height: 400,
        r{
    id: 1,
    nickname: "자연 탐험가",
    description: "자연과 풍경에 관심이 많은 사용자입니다. 산과 바다, 숲을 좋아하며 여행을 통해 다양한 자연 경관을 탐험합니다.",
    images: [
      {
        id: "nature-1",
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        
        main_keyword: "산",
        sub_keyword: "하이킹",
        mood_keyword: "평화로움",
        description: "웅장한 산맥과 맑은 하늘이 어우러진 자연의 풍경",
        category: "nature",

       
        rotate: 0,
        keywords: ["산", "풍경", "자연", "하이킹", "모험"],
        sizeWeight: 0.2,
        
        relatedVideos: [
          { title: "아름다운 산 풍경 4K", embedId: "3pysVpnS7HY" },
          { title: "산에서의 하루", embedId: "dQw4w9WgXcQ" }
        ],
        width: 600,
        height: 400,
        left: "10%",
        top: "5%",
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "nature-2",
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        main_keyword: "바다",
        sub_keyword: "해변",
        mood_keyword: "시원함",
        description: "끝없이 펼쳐진 푸른 바다와 하얀 모래사장",
        category: "nature",
        width: 550,
        height: 380,
        rotate: -2,
        left: "45%",
        top: "15%",
        keywords: ["바다", "해변", "파도", "휴양", "여름"],
        sizeWeight: 0.2,
        relatedVideos: [
          { title: "해변에서의 일출", embedId: "KkKZeZw3EXk" },
          { title: "파도 소리 ASMR", embedId: "V-_O7nl0Ii0" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "nature-3",
        src: "https://images.unsplash.com/photo-1511497584788-876760111969",
        main_keyword: "숲",
        sub_keyword: "숲속",
        mood_keyword: "평화로움",
        description: "숲속에서 평화로운 시간을 보내는 것을 좋아합니다.",
        category: "nature",
        width: 500,
        height: 350,
        rotate: 3,
        left: "20%",
        top: "45%",
        keywords: ["숲", "나무", "녹색", "평화", "산책"],
        sizeWeight: 0.6,
        relatedVideos: [
          { title: "숲속 산책로", embedId: "dJZJxX5G0YU" },
          { title: "숲속의 새소리", embedId: "rYoZgpAEkFs" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "nature-4",
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e",
        main_keyword: "가을",
        sub_keyword: "단풍",
        mood_keyword: "계절",
        description: "가을 풍경을 좋아하는 사용자입니다.",
        category: "nature",
        width: 520,
        height: 370,
        rotate: -1,
        left: "55%",
        top: "50%",
        keywords: ["가을", "단풍", "낙엽", "계절", "공원"],
        sizeWeight: 0.2,
        relatedVideos: [
          { title: "가을 풍경 모음", embedId: "PLOPygVcaVE" },
          { title: "단풍길 드라이브", embedId: "2ZIpFytCSVc" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      }
    ]
  },
  {
    id: 2,
    nickname: "도시 탐험가",
    description: "도시의 다양한 모습과 건축물에 관심이 많습니다. 세계 각국의 도시를 여행하며 도시만의 독특한 문화와 분위기를 경험합니다.",
    images: [
      {
        id: "city-1",
        src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
        main_keyword: "도시",
        sub_keyword: "야경",
        mood_keyword: "활기참",
        description: "밤이 되면 더욱 빛나는 도시의 모습",
        category: "city",
        width: 580,
        height: 400,
        rotate: -3,
        left: "10%",
        top: "15%",
        keywords: ["도시", "야경", "빌딩", "현대적", "도시생활"],
        sizeWeight: 0.6,
        relatedVideos: [
          { title: "서울의 아름다운 야경", embedId: "7OuOXJ3c9jk" },
          { title: "세계의 멋진 도시들", embedId: "8XK9QvRgx8w" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "city-2",
        src: "https://images.unsplash.com/photo-1514565131-fce0801e5785",
        main_keyword: "카페",
        sub_keyword: "문화",
        mood_keyword: "여유",
        description: "도시의 작은 휴식처, 카페에서의 여유로운 시간",
        category: "city",
        width: 500,
        height: 380,
        rotate: 2,
        left: "45%",
        top: "20%",
        keywords: ["카페", "커피", "휴식", "도시문화", "일상"],
        sizeWeight: 1.1,
        relatedVideos: [
          { title: "세계의 유명 카페 투어", embedId: "QK9lXtO9Zs8" },
          { title: "도시의 카페 문화", embedId: "Y6KS8Yz6al8" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "city-3",
        src: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25",
        main_keyword: "지하철",
        sub_keyword: "교통",
        mood_keyword: "역동적",
        description: "도시의 동맥, 지하철로 연결되는 사람들의 이야기",
        category: "city",
        width: 520,
        height: 370,
        rotate: -1,
        left: "20%",
        top: "50%",
        keywords: ["지하철", "대중교통", "도시생활", "일상", "여행"],
        sizeWeight: 1.0,
        relatedVideos: [
          { title: "세계의 특별한 지하철역", embedId: "K6GCdZLWJWs" },
          { title: "도시 교통의 진화", embedId: "dNFrZNjs2ng" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "city-4",
        src: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb",
        main_keyword: "거리",
        sub_keyword: "사람들",
        mood_keyword: "생동감",
        description: "다양한 사람들이 만들어내는 도시의 일상",
        category: "city",
        width: 540,
        height: 390,
        rotate: 4,
        left: "60%",
        top: "45%",
        keywords: ["거리", "사람", "도시생활", "문화", "일상"],
        sizeWeight: 1.15,
        relatedVideos: [
          { title: "세계의 유명 거리", embedId: "X7YK8G7d_2c" },
          { title: "도시의 다양한 모습", embedId: "pJ6QrYbIn1s" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      }
    ]
  },
  {otate: -2,
        left: "15%",
        top: "10%",
        keywords: ["피자", "이탈리안", "맛집", "미식", "요리"],
        sizeWeight: 1.2,
        relatedVideos: [
          { title: "이탈리아 현지 피자 장인의 피자 만들기", embedId: "8Q_9h6VKm9c" },
          { title: "나폴리 피자의 역사", embedId: "v7yj2p8Wm9g" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "food-2",
        src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        main_keyword: "샐러드",
        sub_keyword: "건강식",
        mood_keyword: "신선함",
        description: "신선한 재료로 만든 컬러풀한 샐러드",
        category: "food",
        width: 500,
        height: 380,
        rotate: 3,
        left: "45%",
        top: "25%",
        keywords: ["샐러드", "건강", "채소", "비건", "컬러풀"],
        sizeWeight: 0.5,
        relatedVideos: [
          { title: "영양만점 샐러드 레시피", embedId: "gJZGLZxVeJw" },
          { title: "홈메이드 드레싱 만들기", embedId: "bH7zPvTP5Jc" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      }
    ]
  },
  {
    id: 4,
    nickname: "예술 탐험가",
    description: "현대 미술과 디자인에 매료된 예술 애호가입니다. 갤러리와 전시회를 돌아다니며 새로운 예술적 영감을 얻습니다.",
    images: [
      {
        id: "art-1",
        src: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07",
        main_keyword: "현대미술",
        sub_keyword: "갤러리",
        mood_keyword: "영감",
        description: "현대 미술관에서 만난 추상적인 작품",
        category: "art",
        width: 600,
        height: 420,
        rotate: 0,
        left: "20%",
        top: "15%",
        keywords: ["미술", "갤러리", "전시", "현대미술", "추상"],
        sizeWeight: 0.3,
        relatedVideos: [
          { title: "현대 미술의 이해", embedId: "ZwXzL6h6rS0" },
          { title: "유명 작가들의 작품 해설", embedId: "dK9QLhAEJvM" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      },
      {
        id: "art-2",
        src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
        main_keyword: "디자인",
        sub_keyword: "건축",
        mood_keyword: "미니멀",
        description: "미니멀한 디자인의 현대 건축물",
        category: "art",
        width: 550,
        height: 400,
        rotate: -1,
        left: "55%",
        top: "35%",
        keywords: ["디자인", "건축", "미니멀", "모던", "구조"],
        sizeWeight: 0.8,
        relatedVideos: [
          { title: "현대 건축의 트렌드", embedId: "kH2vB1TkB9U" },
          { title: "미니멀리즘 디자인의 특징", embedId: "9XzqTzxQzpE" }
        ],
        created_at: new Date().toISOString(),
        desired_self: false,
        metadata: {},
        desired_self_profile: null
      }
    ]
  }
]; 