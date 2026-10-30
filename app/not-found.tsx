import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import NotFoundContent from "@/components/shared/not-found-content";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
