import { getSession } from "@/lib/session";
import { assistantEnabled } from "@/lib/assistant/config";
import Header from "./header";

export default async function SiteHeader() {
  const session = await getSession();
  const u = session?.user;
  return (
    <Header
      assistant={assistantEnabled()}
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
