import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CampusMart — Student Marketplace',
    template: '%s | CampusMart',
  },
  description: 'The student marketplace for your campus. Find beauty, food, tech & services from fellow students.',
  keywords: ['student marketplace', 'campus', 'Kenya', 'university', 'buy sell', 'beauty', 'food'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusMart',
  },
  openGraph: {
    type: 'website',
    siteName: 'CampusMart',
    title: 'CampusMart — Student Marketplace',
    description: 'Buy and sell with your fellow students.',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-2">
        {/* Skip-to-content for keyboard/AT users */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              {/* Offline detection banner */}
              <OfflineBanner />

              {/* Main app content */}
              <main
                id="main-content"
                className="max-w-lg mx-auto min-h-screen"
              >
                {children}
              </main>

              {/* Persistent bottom navigation */}
              <BottomNav />
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>

        {/* PWA service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
