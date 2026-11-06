import { refresh } from "next/cache";
import { actingUserId } from "./actor";

export function revalidate() {
  if (!actingUserId()) refresh();
}
