import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { AuthProvider } from './components/AuthProvider';
export const metadata: Metadata = {
  title: { default: 'Catálogo de filmes', template: '%s · Catálogo de filmes' },
  description:
    'Um lugar para descobrir, assistir e registrar. Explore filmes, compartilhe avaliações e organize sua Watchlist.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
