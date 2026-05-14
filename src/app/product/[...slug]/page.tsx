import { ClientOnly } from './client';

type ProductCatchAllPageProps = {
  params: Promise<{ id: string; slug: string[] }>;
};

export default async function Page({ params }: ProductCatchAllPageProps) {
  await params;

  return <ClientOnly />;
}
