import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'RQVEN — AI Geolocation Intelligence',
  description: 'Advanced AI-powered OSINT image geolocation platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased noise-overlay">
        {children}
        <Script
          src="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
