import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'RPL CENTER - SMK Sangkuriang 1 Cimahi',
  description:
    'Sistem Informasi Inventaris, Peminjaman Laptop, Peralatan & Workstation PC Workshop RPL SMK Sangkuriang 1 Cimahi',
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full dark" style={{ colorScheme: 'dark' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');try{localStorage.setItem('rpl_theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#070a0f] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black relative">
        {/* Subtle Ambient Gaming Green Grid & Top Radial Aura */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent_70%)]" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 min-h-0 w-full max-w-[1850px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
