import Navbar from "../components/layout/Navbar";
import Hero from "../components/Hero";
import Card from "../components/Card";
import Categoria from "../components/Categoria";
import Explica from "../components/Explica";
import Funciona from "../components/Funciona";
import Vantagens from "../components/Vantagens";
import Founder from "../components/Founder";
import Footer from "../components/layout/Footer";

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Card />
      <Categoria />
      <Explica />
      <Funciona />
      <Vantagens />
      <Founder />
      <Footer />
    </>
  );
}
