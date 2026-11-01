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
    <html lang="id" className="h-full light" style={{ colorScheme: 'light' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');try{localStorage.removeItem('rpl_theme');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 min-h-0 w-full max-w-[1850px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
