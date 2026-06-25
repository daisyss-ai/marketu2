import Footer from '@/components/layout/Footer';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
