import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';

// Google Cloud Vision 클라이언트 초기화
const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
    }

    // 이미지 분석 수행
    const [result] = await client.webDetection({
      image: {
        source: {
          imageUri: imageUrl
        }
      }
    });

    const webDetection = result.webDetection;

    // 유사한 이미지 및 관련 검색어 추출
    const similarImages = webDetection?.visuallySimilarImages?.map(img => ({
      url: img.url,
      score: img.score
    })) || [];

    const labels = webDetection?.webEntities?.map(entity => ({
      description: entity.description,
      score: entity.score
    })) || [];

    return NextResponse.json({
      similarImages,
      labels
    });

  } catch (error) {
    console.error('Google Vision API 에러:', error);
    return NextResponse.json({ error: '이미지 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 