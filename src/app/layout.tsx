import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgriSensa Garden Studio — Spatial Layout & Yield Optimizer',
  description: 'Interactive 2D and 3D garden layout planner with real-time spatial validation and agronomic yield estimation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-gray-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
