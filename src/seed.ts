import 'dotenv/config';
import { PrismaService } from './prisma/prisma.service';
import { hashPassword } from './auth/password';
import { synchronizeMovieCatalog } from './movies/movie-posters';

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
    await Promise.all(
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
    for (const [index, [username, displayName, email]] of people.entries()) {
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
      });
    }
    const catalog = await synchronizeMovieCatalog(prisma);
    console.log(
      `Catálogo sincronizado: ${catalog.total} cartazes, ${catalog.created} filmes criados e ${catalog.removed} sem cartaz removidos.`,
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
