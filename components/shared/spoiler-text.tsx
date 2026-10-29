"use client";

import { useState } from "react";

export default function SpoilerText({
  spoiler,
  className,
  children,
}: {
  spoiler: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  if (!spoiler || shown) return <p className={className}>{children}</p>;
  return (
    <div className="relative">
      <p aria-hidden className={`${className ?? ""} blur-sm select-none`}>
        {children}
      </p>
      <button
        type="button"
        onClick={() => setShown(true)}
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
      >
        <span className="bg-(--ink) text-(--cream) text-[12px] font-semibold rounded-full px-3.5 py-1.5 shadow-sm">
          Contém spoiler · mostrar
        </span>
      </button>
    </div>
  );
}
