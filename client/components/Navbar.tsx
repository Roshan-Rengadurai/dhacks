"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight text-foreground"
        >
          <Image
            src="/terrain-logo.png"
            alt="Terrain logo"
            width={36}
            height={36}
            priority
          />
          <span>Terrain</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="cursor-pointer">
                  Dashboard
                </Button>
              </Link>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="cursor-pointer"
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="cursor-pointer">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  className="cursor-pointer"
                  style={{ background: "var(--color-cta)", color: "white" }}
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
