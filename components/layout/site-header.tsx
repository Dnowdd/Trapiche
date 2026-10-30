import { getSession } from "@/lib/session";
import Header from "./header";

export default async function SiteHeader() {
  const session = await getSession();
  const u = session?.user;
  return (
    <Header
      initialUser={
        u
          ? {
              name: u.name,
              email: u.email,
              handle: u.handle,
              image: u.image,
              isAdmin: u.isAdmin,
            }
          : null
      }
    />
  );
}
