"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setLoading(false);
      setError("Auth is not configured yet. Add Supabase env vars to continue.");
      return;
    }

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Wrong email or password — double-check and try again"
          : authError.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-2xl font-bold">
            {isLogin ? "Welcome back" : "Create your account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to access your energy dashboard"
              : "Start tracking your business energy footprint"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              {loading
                ? "Hang on..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                No account yet?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
