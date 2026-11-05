import MovieDetail from '../../views/MovieDetail';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieDetail id={id} />;
}
