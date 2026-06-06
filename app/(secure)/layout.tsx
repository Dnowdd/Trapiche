import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import React from "react";

const SecureLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default SecureLayout;
