import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/AuthButtons";

export async function NavBar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-pitch">
          <span className="text-xl">⚽</span>
          <span>Quiniela Mundial</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Mi quiniela
          </Link>
          <Link
            href="/posiciones"
            className="rounded-md px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Posiciones
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 font-medium text-pitch transition hover:bg-emerald-50"
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
                className="rounded-full"
              />
            )}
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
