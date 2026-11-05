import 'dotenv/config';
import { PrismaService } from './prisma/prisma.service';
import { hashPassword } from './auth/password';

async function seed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'O catálogo de demonstração só pode ser criado em desenvolvimento.',
    );
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const passwordHash = await hashPassword(
      process.env.DEMO_PASSWORD || 'Cinema123!',
    );
    const names = [
      'Drama',
      'Aventura',
      'Ficção científica',
      'Romance',
      'Suspense',
      'Comédia',
      'Animação',
      'Documentário',
    ];
    const genres = await Promise.all(
      names.map((name, index) =>
        prisma.genre.upsert({
          where: { name },
          create: { id: 'demo-genre-' + index, name },
          update: {},
        }),
      ),
    );
    const people = [
      ['ana_martins', 'Ana Martins', 'ana.martins@example.com'],
      ['bruno_costa', 'Bruno Costa', 'bruno.costa@example.com'],
      ['carla_nunes', 'Carla Nunes', 'carla.nunes@example.com'],
      ['diego_lima', 'Diego Lima', 'diego.lima@example.com'],
      ['elisa_rocha', 'Elisa Rocha', 'elisa.rocha@example.com'],
      ['felipe_alves', 'Felipe Alves', 'felipe.alves@example.com'],
    ];
    const users = [];
    for (const [index, [username, displayName, email]] of people.entries()) {
      users.push(
        await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            id: 'demo-user-' + index,
            username,
            displayName,
            email,
            passwordHash,
            role: index === 5 ? 'ADMIN' : 'USER',
          },
        }),
      );
    }
    const films: {
      title: string;
      year: number;
      director: string;
      duration: number;
      genres: number[];
      synopsis?: string;
    }[] = [
      {
        title: 'Entre marés',
        year: 2025,
        director: 'Clara Viana',
        duration: 108,
        genres: [0, 1],
        synopsis:
          'Após anos longe, Lia retorna à pequena cidade onde cresceu para cuidar da antiga casa da família. Entre encontros inesperados e passeios pela costa, ela descobre que algumas partidas também podem ser um caminho de volta.',
      },
      {
        title: 'A última estação',
        year: 2024,
        director: 'Rafael Neri',
        duration: 102,
        genres: [0, 3],
      },
      {
        title: 'Órbita silenciosa',
        year: 2025,
        director: 'Luísa Prado',
        duration: 118,
        genres: [2],
      },
      {
        title: 'Dias de setembro',
        year: 2023,
        director: 'Caio Motta',
        duration: 96,
        genres: [0],
      },
      {
        title: 'O jardim de vidro',
        year: 2024,
        director: 'Helena Duarte',
        duration: 110,
        genres: [4],
      },
      {
        title: 'Quase domingo',
        year: 2025,
        director: 'Pedro Leme',
        duration: 92,
        genres: [5],
      },
      {
        title: 'Pequenos planetas',
        year: 2024,
        director: 'Nina Fontes',
        duration: 89,
        genres: [6, 1],
      },
      {
        title: 'Cartas do norte',
        year: 2023,
        director: 'Tomás Reis',
        duration: 104,
        genres: [7],
      },
      {
        title: 'Depois da chuva',
        year: 2025,
        director: 'Marina Vale',
        duration: 105,
        genres: [0, 3],
      },
      {
        title: 'A casa do vento',
        year: 2022,
        director: 'Bento Sá',
        duration: 98,
        genres: [],
      },
      {
        title: 'Horizonte comum',
        year: 2024,
        director: 'Lara Melo',
        duration: 94,
        genres: [7],
      },
      {
        title: 'Cidade em pausa',
        year: 2023,
        director: 'André Luz',
        duration: 100,
        genres: [],
      },
    ];
    const movies = [];
    for (const [index, film] of films.entries()) {
      movies.push(
        await prisma.movie.upsert({
          where: { id: 'demo-movie-' + index },
          update: {},
          create: {
            id: 'demo-movie-' + index,
            title: film.title,
            releaseYear: film.year,
            director: film.director,
            duration: film.duration,
            synopsis: film.synopsis,
            createdAt: new Date(Date.UTC(2026, 9, 1, 0, index)),
            genres: { connect: film.genres.map((g) => ({ id: genres[g].id })) },
          },
        }),
      );
    }
    const opinions = [
      {
        user: 0,
        movie: 0,
        rating: 5,
        day: 20,
        comment:
          'Um filme delicado sobre voltar e pertencer. A fotografia transforma o cotidiano em memória.',
      },
      {
        user: 1,
        movie: 0,
        rating: 4,
        day: 19,
        comment:
          'O ritmo pede calma, mas a travessia vale a pena. O encontro final fica com a gente.',
      },
      {
        user: 0,
        movie: 1,
        rating: 4,
        day: 18,
        comment:
          'Encontros simples, personagens que ficam. Gostei especialmente do último ato.',
      },
      {
        user: 1,
        movie: 2,
        rating: 4,
        day: 17,
        comment:
          'Uma viagem inventiva e silenciosa, com uma ótima construção de atmosfera.',
      },
      {
        user: 0,
        movie: 3,
        rating: 3,
        day: 16,
        comment:
          'Bons personagens, embora algumas cenas pudessem respirar menos.',
      },
      {
        user: 2,
        movie: 4,
        rating: 4,
        day: 15,
        comment:
          'O suspense cresce aos poucos. Os detalhes do cenário fazem toda a diferença.',
      },
      {
        user: 3,
        movie: 5,
        rating: 4,
        day: 14,
        comment: 'Um domingo que dá vontade de repetir.',
      },
      {
        user: 4,
        movie: 6,
        rating: 5,
        day: 13,
        comment: 'Uma pequena aventura cheia de imaginação.',
      },
    ];
    for (const opinion of opinions) {
      const userId = users[opinion.user].id,
        movieId = movies[opinion.movie].id;
      const watchedAt = new Date(Date.UTC(2026, 9, opinion.day, 12));
      await prisma.review.upsert({
        where: { userId_movieId: { userId, movieId } },
        update: {},
        create: {
          userId,
          movieId,
          rating: opinion.rating,
          comment: opinion.comment,
          watchedAt,
        },
      });
      await prisma.watchedMovie.upsert({
        where: { userId_movieId: { userId, movieId } },
        update: {},
        create: { userId, movieId, watchedAt },
      });
    }
    for (const movie of [movies[2], movies[4]]) {
      await prisma.watchlistItem.upsert({
        where: { userId_movieId: { userId: users[0].id, movieId: movie.id } },
        update: {},
        create: {
          userId: users[0].id,
          movieId: movie.id,
          addedAt: new Date(
            movie.id === movies[2].id
              ? '2026-10-21T12:00:00Z'
              : '2026-10-20T12:00:00Z',
          ),
        },
      });
    }
    console.log(
      'Catálogo de demonstração disponível. Dados existentes foram preservados.',
    );
    console.log(
      'Usuário: ana.martins@example.com | Admin: felipe.alves@example.com',
    );
    console.log(
      'Senha: use DEMO_PASSWORD ou a senha de demonstração descrita no README.',
    );
  } finally {
    await prisma.$disconnect();
  }
}
void seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
