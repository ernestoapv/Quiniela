import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/AuthButtons";
import { LogoMark } from "@/components/Logo";
import { APP_BRAND } from "@/lib/matches";

export async function NavBar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          <LogoMark className="h-7 w-7" />
          <span className="hidden sm:inline">{APP_BRAND}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/">Mi quiniela</NavLink>
          <NavLink href="/posiciones">Posiciones</NavLink>
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="rounded-md px-2.5 py-1.5 font-medium text-pitch transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              Admin
            </Link>
          )}
        </nav>

        {user && (
          <div className="flex items-center gap-2">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? "Usuario"}
                width={28}
                height={28}
                className="rounded-full ring-1 ring-slate-200 dark:ring-slate-700"
              />
            )}
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-2.5 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
