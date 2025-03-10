import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Twitter Clone',
  description: 'Twitter Clone MVP avec Next.js et FastAPI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}