import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import React from "react";

export const dynamic = "force-dynamic";

const SecureLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
};

export default SecureLayout;
