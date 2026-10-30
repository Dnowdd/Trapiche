import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canSeeTicket } from "@/lib/queries/support";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const { id } = await params;
  const attachment = await db.supportAttachment.findUnique({
    where: { id },
    select: {
      data: true,
      mimeType: true,
      message: { select: { ticket: { select: { userId: true } } } },
    },
  });
  if (
    !attachment ||
    !(await canSeeTicket(attachment.message.ticket.userId, session.user.id))
  )
    return new Response(null, { status: 404 });
  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
