"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { loginHref } from "@/lib/links";
import Link from "next/link";
import HeaderSearch from "./header-search";
import Avatar from "@/components/shared/avatar";
import NotificationBell from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemCls =
  "gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(67,62,18,0.06)] focus:text-(--ink-2)";

const Header = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session?.user;
  const profileHref = user?.handle ? `/u/${user.handle}` : "/profile";

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
  };

  return (
    <header
      className="flex flex-wrap md:flex-nowrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-8 md:h-19 md:py-0 lg:px-18.75 bg-(--yellow)"
      data-screen-label="00 Header"
    >
      <Link
        href="/"
        className="text-[24px] md:text-[30px] font-extrabold tracking-[-0.02em] text-(--ink-2) flex items-baseline gap-2"
      >
        Trapiche
      </Link>

      <HeaderSearch />

      <div className="flex items-center gap-4.5 md:order-last">
        {user ? (
          <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 cursor-pointer outline-none group/trigger">
                <Avatar
                  name={user.name}
                  image={user.image}
                  size={36}
                  className="transition-opacity duration-150 group-data-[popup-open]/trigger:opacity-70"
                />
                <div className="hidden sm:flex flex-col items-start">
                  <div className="text-[13px] font-semibold text-(--ink-2) leading-[1.2]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-(--ink-4) font-mono">
                    @{user.handle}
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
                  <Avatar name={user.name} image={user.image} size={40} />
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
                  className={itemCls}
                  onClick={() => router.push(profileHref)}
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

                <DropdownMenuItem
                  className={itemCls}
                  onClick={() => router.push("/suporte")}
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
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" />
                    <path d="M12 17h.01" />
                  </svg>
                  Suporte
                </DropdownMenuItem>

                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-[rgba(67,62,18,0.08)] -mx-1.5 my-1" />
                    <div className="px-3 pt-1.5 pb-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-(--ink-4)">
                      Administração
                    </div>
                    <DropdownMenuItem
                      className={itemCls}
                      onClick={() => router.push("/admin")}
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
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                      </svg>
                      Painel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={itemCls}
                      onClick={() => router.push("/admin/denuncias")}
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
                        <path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H5" />
                      </svg>
                      Denúncias
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={itemCls}
                      onClick={() => router.push("/admin/suporte")}
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Tickets de suporte
                    </DropdownMenuItem>
                  </>
                )}

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
              href={loginHref(pathname)}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-(--ink-3) hover:text-(--ink-2) transition-colors duration-150 flex items-center"
            >
              Entrar
            </Link>
            <Link
              href={loginHref(pathname, "register")}
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
