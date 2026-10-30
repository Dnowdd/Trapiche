import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import { requireSession } from "@/lib/session";
import React from "react";

export const dynamic = "force-dynamic";

const SecureLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireSession();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
};

export default SecureLayout;
