import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RQVEN — AI Geolocation Intelligence',
  description:
    'Advanced AI-powered OSINT image geolocation platform. Upload any image and discover where it was taken.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Cesium CSS */}
        <link
          href="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased noise-overlay">{children}</body>
    </html>
  );
}
