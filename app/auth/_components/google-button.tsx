"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { GoogleMark, Loader } from "./icons";
import { authErrorMessage } from "./errors";

export default function GoogleButton({
  next,
  label,
  note,
  onError,
}: {
  next: string | null;
  label: string;
  note?: React.ReactNode;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: next ?? "/",
      errorCallbackURL: "/auth",
    });
    if (error) {
      setLoading(false);
      onError(
        authErrorMessage(error, "Não deu pra entrar com o Google agora."),
      );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="w-full h-12 rounded-[10px] bg-white text-(--ink-2) text-[14px] font-semibold border border-[rgba(67,62,18,0.18)] flex items-center justify-center gap-2.5 transition-[transform,box-shadow] duration-100 hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_20px_-14px_rgba(67,62,18,0.5)] disabled:opacity-60 cursor-pointer [&_svg]:w-4.5 [&_svg]:h-4.5"
      >
        {loading ? <Loader className="animate-spin" /> : <GoogleMark />}
        {label}
      </button>
      {note && (
        <p className="m-0 mt-2.5 text-center text-[11.5px] text-(--ink-4) leading-normal">
          {note}
        </p>
      )}
      <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
        <span className="h-px flex-1 bg-[rgba(67,62,18,0.12)]" />
        ou com e-mail
        <span className="h-px flex-1 bg-[rgba(67,62,18,0.12)]" />
      </div>
    </>
  );
}
