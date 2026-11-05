import { GenreForm } from '../../../../views/AdminForms';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GenreForm id={id} />;
}
