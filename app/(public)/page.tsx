import Hero from "./_components/hero";
import HowItWorks from "./_components/how-it-works";
import IASection from "./_components/ia-section";
import Lists from "./_components/lists";
import Popular from "./_components/popular";
import Quote from "./_components/quote";
import Reviews from "./_components/reviews";
import { getBooks } from "@/app/catalog";

export default async function Home() {
  const books = await getBooks();

  return (
    <div className="w-360 mx-auto bg-(--yellow) relative">
      <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
        <Hero books={books} />
        <HowItWorks />
        <div className="h-20" />
        <Lists />
        <div className="h-20" />
        <IASection />
        <div className="h-20" />
        <Popular />
        <div className="h-20" />
        <Reviews />
        <Quote />
      </div>
    </div>
  );
}
