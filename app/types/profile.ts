export interface ImageData {
  id: string;
  src: string;
  main_keyword: string;
  sub_keyword: string;
  mood_keyword: string;
  description: string;
  category: string;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  keywords: string[];
  sizeWeight: number;
  relatedVideos: {
    title: string;
    embedId: string;
  }[];
  created_at: string;
  desired_self: boolean;
  metadata: any;
  desired_self_profile: any;
} 