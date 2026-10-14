"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions/result";

export function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const run = <T>(
    fn: () => Promise<ActionResult<T>>,
    onOk?: (data: T | undefined) => void,
    onError?: (message: string) => void,
  ) =>
    start(async () => {
      setError("");
      const result = await fn();
      if (result.ok) onOk?.(result.data);
      else if (onError) onError(result.error);
      else setError(result.error);
    });

  return { pending, error, setError, run };
}
