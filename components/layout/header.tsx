"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderSearch from "./header-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const Header = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
  };

  return (
    <header
      className="h-19 flex items-center justify-between px-18.75 bg-(--yellow)"
      data-screen-label="00 Header"
    >
      <Link
        href="/"
        className="text-[30px] font-extrabold tracking-[-0.02em] text-(--ink-2) flex items-baseline gap-2"
      >
        Trapiche
      </Link>

      <HeaderSearch />

      <div className="flex items-center gap-4.5">
        {user ? (
          <>
            <button
              className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-(--ink-2) transition-[background] duration-150 hover:bg-[rgba(67,62,18,0.06)]"
              aria-label="Notificações"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 cursor-pointer outline-none group/trigger">
                <div className="w-9 h-9 rounded-full bg-(--cream-deep) flex items-center justify-center text-[13px] font-bold text-(--ink-2) border-[1.5px] border-(--ink-2) select-none transition-opacity duration-150 group-data-[popup-open]/trigger:opacity-70">
                  {initials(user.name)}
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[13px] font-semibold text-(--ink-2) leading-[1.2]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-(--ink-4) font-mono">
                    @{(user as { handle?: string }).handle ?? ""}
                  </div>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="min-w-56 p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(67,62,18,0.10)] shadow-[0_16px_40px_-8px_rgba(67,62,18,0.22),0_2px_8px_-2px_rgba(67,62,18,0.10)]"
              >
                {/* Identity header */}
                <div className="px-3 py-2.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-(--cream-deep) flex items-center justify-center text-[14px] font-bold text-(--ink-2) border-[1.5px] border-(--ink-2) select-none shrink-0">
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-(--ink-2) leading-[1.2] truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-(--ink-4) truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-[rgba(67,62,18,0.08)] -mx-1.5 my-1" />

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(67,62,18,0.06)] focus:text-(--ink-2)"
                  onClick={() => router.push("/profile")}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Meu perfil
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[rgba(67,62,18,0.08)] -mx-1.5 my-1" />

                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2.5 cursor-pointer px-3 py-2 text-[13px] rounded-[8px] focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : isPending ? (
          <div className="w-9 h-9 rounded-full bg-(--cream-deep) animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-(--ink-3) hover:text-(--ink-2) transition-colors duration-150 flex items-center"
            >
              Entrar
            </Link>
            <Link
              href="/auth?mode=register"
              className="h-9 px-4 rounded-lg bg-(--ink-2) text-(--cream) text-[13px] font-semibold flex items-center transition-[transform,box-shadow] duration-120 hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(67,62,18,0.4)]"
            >
              Criar conta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
