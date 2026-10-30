import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import NotFoundContent from "@/components/shared/not-found-content";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
