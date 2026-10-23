import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlyAqua ERP',
  description: 'PlyAqua Enterprise Resource Planning & Operations Platform',
  openGraph: {
    title: 'PlyAqua ERP',
    description: 'PlyAqua Enterprise Resource Planning & Operations Platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlyAqua ERP',
    description: 'PlyAqua Enterprise Resource Planning & Operations Platform',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
