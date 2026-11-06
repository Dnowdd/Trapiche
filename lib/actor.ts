import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<{ userId: string }>();

export function runAs<T>(userId: string, fn: () => Promise<T>) {
  return store.run({ userId }, fn);
}

export function actingUserId() {
  return store.getStore()?.userId ?? null;
}
