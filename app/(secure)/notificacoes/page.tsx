import type { Metadata } from "next";
import NotificationRow from "@/components/notifications/notification-row";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/queries/notifications";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const { items } = await getNotifications(session.user.id, 100);
  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="max-w-180 pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
          Sua conta
        </div>
        <h1 className="m-0 mt-2 mb-6 text-[28px] md:text-[36px] font-extrabold tracking-[-0.025em] text-(--ink)">
          Notificações
        </h1>
        {items.length === 0 ? (
          <p className="text-[14px] text-(--ink-3)">
            Nada por aqui ainda. Quando alguém curtir ou comentar suas resenhas,
            seguir suas listas ou te convidar para uma lista, aparece aqui.
          </p>
        ) : (
          <ul className="m-0 p-1.5 list-none bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[14px]">
            {items.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
