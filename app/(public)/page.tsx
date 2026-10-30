import { shuffle } from "@/lib/utils";
import Hero from "./_components/hero";
import HowItWorks from "./_components/how-it-works";
import Lists from "./_components/lists";
import Popular from "./_components/popular";
import Quote from "./_components/quote";
import Reviews from "./_components/reviews";
import { getFeaturedBooks } from "@/app/catalog";
import { getSession } from "@/lib/session";

export default async function Home() {
  const [featured, session] = await Promise.all([
    getFeaturedBooks(),
    getSession(),
  ]);
  const books = shuffle(featured);

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <Hero books={books} handle={session?.user.handle ?? null} />
      <div className="flex flex-col gap-16 md:gap-20">
        <HowItWorks />
        <Lists />
        <Popular />
        <Reviews />
      </div>
      <Quote />
    </div>
  );
}
