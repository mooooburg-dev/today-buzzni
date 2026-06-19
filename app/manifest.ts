import type { MetadataRoute } from "next";

// PWA/모바일 홈화면 아이콘용 매니페스트 (public/android-chrome-*.png 활용)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "오늘의 버즈니",
    short_name: "버즈니",
    description: "슬랙 채널의 하루를 신문 1면과 4컷 웹툰으로",
    start_url: "/",
    display: "standalone",
    background_color: "#ece5d8",
    theme_color: "#1c1917",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
