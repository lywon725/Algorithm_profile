import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    // API 키 검증 로그 추가
    console.log('Checking API credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Naver API credentials');
      return NextResponse.json(
        { error: 'API 인증 정보가 없습니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const mood = searchParams.get('mood') || '';

    if (!query.trim()) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 검색 쿼리 최적화
    if (category) {
      query = `${query} ${category}`;
    }
    
    if (mood) {
      query = `${query} ${mood}`;
    }

    console.log('최종 검색 쿼리:', query);

    // 검색 필터 추가
    const searchOptions = new URLSearchParams({
      query: query,
      display: '10',
      filter: 'large',
      sort: 'sim'
    });

    const response = await fetch(
      `https://openapi.naver.com/v1/search/image?${searchOptions.toString()}`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Naver API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: `네이버 API 오류: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('검색 결과 수:', data.items?.length || 0);

    // 결과 필터링 및 정제
    if (data.items && data.items.length > 0) {
      // 부적절한 키워드가 포함된 결과 필터링
      const filteredItems = data.items.filter((item: any) => {
        const title = item.title.toLowerCase();
        const blacklist = ['성인', '19금', '섹시', '야한', 'adult', 'sexy'];
        return !blacklist.some(word => title.includes(word));
      });

      // 필터링된 결과가 있으면 반환
      if (filteredItems.length > 0) {
        return NextResponse.json({ ...data, items: filteredItems });
      }
    }

    // 검색 결과가 없는 경우
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: '검색 결과가 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Search image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 