import About from "./_components/about";
import BookHero from "./_components/book-hero";
import ByAuthor from "./_components/by-author";
import InLists from "./_components/in-lists";
import MyReading from "./_components/my-reading";
import MyReviewBlock from "./_components/my-review-block";
import OtherReviews from "./_components/other-reviews";
import RatingBlock from "./_components/rating-block";
import Related from "./_components/related";
import TechDetails from "./_components/tech-details";
import { BOOK_DETAIL } from "./mock-book";

const BookPage = () => {
  return (
    <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
      <div className="pt-12.5 px-18.75 pb-15">
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <a
            href="index.html"
            className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
          >
            Trapiche
          </a>
          <span className="text-(--ink-5)">/</span>
          <a
            href="#"
            className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
          >
            Livros
          </a>
          <span className="text-(--ink-5)">/</span>
          <a
            href="#"
            className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
          >
            Jorge Amado
          </a>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">{BOOK_DETAIL.title}</span>
        </div>

        <BookHero />
        <MyReading />
        <About />
        <RatingBlock />
        <MyReviewBlock />
        <OtherReviews />
        <InLists />
        <Related />
        <ByAuthor />
        <TechDetails />
      </div>
    </div>
  );
};

export default BookPage;
