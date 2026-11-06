"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { loginHref } from "@/lib/links";
import Link from "next/link";
import {
  CodeXml,
  Flag,
  Import,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessagesSquare,
  ShipWheel,
  UserRound,
} from "lucide-react";
import ThemeToggle from "./theme-toggle";
import AssistantLauncher from "@/components/assistant/assistant-launcher";
import HeaderSearch from "./header-search";
import Avatar from "@/components/shared/avatar";
import NotificationBell from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemCls =
  "gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(var(--ink-rgb),0.06)] focus:text-(--ink-2)";

const sepCls = "bg-[rgba(var(--ink-rgb),0.08)] -mx-1.5 my-1.5";
const labelCls =
  "px-3 pt-1 pb-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-(--ink-4)";

export interface HeaderUser {
  name: string;
  email: string;
  handle: string;
  image?: string | null;
  isAdmin?: boolean | null;
}

const Header = ({
  initialUser,
  assistant = false,
}: {
  initialUser: HeaderUser | null;
  assistant?: boolean;
}) => {
  const { data: session } = useSession();
  const [signedOut, setSignedOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const user: HeaderUser | null = signedOut
    ? null
    : (session?.user ?? initialUser);
  const profileHref = user?.handle ? `/u/${user.handle}` : "/profile";

  const handleLogout = async () => {
    await signOut();
    setSignedOut(true);
    router.push("/auth");
    router.refresh();
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

      <div className="flex items-center gap-3 md:gap-4 md:order-last">
        <ThemeToggle />
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
                  <div className="text-[10px] text-(--ink-3) font-mono">
                    @{user.handle}
                  </div>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="min-w-60 p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(var(--ink-rgb),0.10)] shadow-[0_16px_40px_-8px_rgba(var(--shadow-rgb),0.22),0_2px_8px_-2px_rgba(var(--shadow-rgb),0.10)]"
              >
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

                <DropdownMenuSeparator className={sepCls} />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className={itemCls}
                    onClick={() => router.push(profileHref)}
                  >
                    <UserRound size={15} aria-hidden />
                    Meu perfil
                  </DropdownMenuItem>
                  {assistant && (
                    <DropdownMenuItem
                      className={itemCls}
                      onClick={() => router.push("/assistente")}
                    >
                      <ShipWheel size={15} aria-hidden />
                      <span className="flex-1">Prático</span>
                      <span className="rounded-full bg-(--yellow) px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-(--on-accent)">
                        IA
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className={itemCls}
                    onClick={() => router.push("/importar")}
                  >
                    <Import size={15} aria-hidden />
                    Importar livros
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className={sepCls} />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className={labelCls}>
                    Ajuda e ferramentas
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className={itemCls}
                    onClick={() => router.push("/suporte")}
                  >
                    <LifeBuoy size={15} aria-hidden />
                    Suporte
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={itemCls}
                    onClick={() => router.push("/desenvolvedores")}
                  >
                    <CodeXml size={15} aria-hidden />
                    Desenvolvedores
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator className={sepCls} />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className={labelCls}>
                        Administração
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className={itemCls}
                        onClick={() => router.push("/admin")}
                      >
                        <LayoutDashboard size={15} aria-hidden />
                        Painel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={itemCls}
                        onClick={() => router.push("/admin/denuncias")}
                      >
                        <Flag size={15} aria-hidden />
                        Denúncias
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={itemCls}
                        onClick={() => router.push("/admin/suporte")}
                      >
                        <MessagesSquare size={15} aria-hidden />
                        Tickets de suporte
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}

                <DropdownMenuSeparator className={sepCls} />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2.5 cursor-pointer px-3 py-2 text-[13px] rounded-[8px]"
                  onClick={handleLogout}
                >
                  <LogOut size={15} aria-hidden />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
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
              className="h-9 px-4 rounded-lg bg-(--ink-2) text-(--cream) text-[13px] font-semibold flex items-center transition-[transform,box-shadow] duration-120 hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(var(--shadow-rgb),0.4)]"
            >
              Criar conta
            </Link>
          </div>
        )}
      </div>
      {user && assistant && (
        <AssistantLauncher firstName={user.name.split(" ")[0] || user.name} />
      )}
    </header>
  );
};

export default Header;
