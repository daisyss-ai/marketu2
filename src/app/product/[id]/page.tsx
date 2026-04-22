import ProductPage from '../../../home/ProductPage';

interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PageProps) {
  return <ProductPage productId={params.id} />;
}
