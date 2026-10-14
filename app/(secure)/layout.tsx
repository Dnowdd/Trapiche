import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { requireSession } from "@/lib/session";
import React from "react";

export const dynamic = "force-dynamic";

const SecureLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireSession();

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default SecureLayout;
