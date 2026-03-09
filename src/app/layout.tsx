import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import OnboardingGate from '@/components/OnboardingGate';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CheckMeIn Next',
  description: 'The Innovation Treehouse next-generation check-in system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <OnboardingGate>
            <NavBar />
            <div style={{ paddingTop: '70px', minHeight: '100vh' }}>
              {children}
            </div>
          </OnboardingGate>
        </AuthProvider>
      </body>
    </html>
  );
}
