import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "بشاير الواحة | إدارة مشاتل النخيل",
  description: "نظام إدارة المخزون والعملاء والعمالة والخزينة لمشاتل بشاير الواحة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-stone-50 text-stone-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}