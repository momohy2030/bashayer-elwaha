import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بشاير الواحة للإستثمار الزراعي",
    short_name: "بشاير الواحة",
    description: "نظام إدارة مشاتل النخيل والمخزون والعملاء والخزينة",
    start_url: "/",
    display: "standalone",
    background_color: "#0d211a",
    theme_color: "#0d211a",
    dir: "rtl",
    lang: "ar",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}