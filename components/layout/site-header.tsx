import { getSession } from "@/lib/session";
import { assistantEnabled } from "@/lib/assistant/config";
import { db } from "@/lib/db";
import AssistantLauncher from "@/components/assistant/assistant-launcher";
import Header from "./header";

export default async function SiteHeader() {
  const session = await getSession();
  const u = session?.user;
  const assistant = Boolean(u) && assistantEnabled();
  const prefs =
    u && assistant
      ? await db.user.findUnique({
          where: { id: u.id },
          select: { assistantShareData: true },
        })
      : null;
  return (
    <>
      <Header
        assistant={assistant}
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
      {u && assistant && (
        <AssistantLauncher
          firstName={u.name.split(" ")[0] || u.name}
          shareData={prefs?.assistantShareData ?? false}
        />
      )}
    </>
  );
}
