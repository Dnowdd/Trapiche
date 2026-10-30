import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import React from "react";

export const dynamic = "force-dynamic";

const SecureLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
};

export default SecureLayout;
