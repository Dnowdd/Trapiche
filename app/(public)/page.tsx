import { shuffle } from "@/lib/utils";
import Hero from "./_components/hero";
import HowItWorks from "./_components/how-it-works";
import Lists from "./_components/lists";
import Popular from "./_components/popular";
import Quote from "./_components/quote";
import Reviews from "./_components/reviews";
import { getFeaturedBooks } from "@/app/catalog";
import { getSession } from "@/lib/session";
import { getDashboard } from "@/lib/queries/dashboard";
import Dashboard from "./_components/dashboard";

const shell =
  "bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden";

export default async function Home() {
  const session = await getSession();

  if (session) {
    const data = await getDashboard(session.user.id);
    return (
      <div data-responsive className={`${shell} pb-16 md:pb-20`}>
        <Dashboard data={data} />
        <div className="flex flex-col gap-16 md:gap-20 mt-12 md:mt-16">
          <Popular />
          <Lists />
          <Reviews />
        </div>
      </div>
    );
  }

  const books = shuffle(await getFeaturedBooks());
  return (
    <div data-responsive className={shell}>
      <Hero books={books} />
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
