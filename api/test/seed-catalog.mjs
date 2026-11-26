import { PrismaService } from '../dist/prisma/prisma.service.js';

// Catálogo fixo para os bancos temporários dos testes, sem depender do TMDB
// nem voltar a sincronizar cartazes ao iniciar a aplicação.
if (process.env.NODE_ENV !== 'test') {
  throw new Error('O catálogo de teste só pode ser criado com NODE_ENV=test.');
}

const titles = [
  'Bons para cachorro',
  'Emily',
  'Gente Grande',
  'Harry Potter Pedra Filosofal 2001',
  'Hellboy',
  'Shrek',
  'Paddington 2',
  'Terrifier',
];

const prisma = new PrismaService();
try {
  await prisma.movie.createMany({
    data: titles.map((title, index) => ({
      id: 'test-movie-' + index,
      title,
      posterUrl: '/posters?title=' + encodeURIComponent(title),
    })),
  });
} finally {
  await prisma.$disconnect();
}
