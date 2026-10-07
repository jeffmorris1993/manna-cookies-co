import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Owner Login · Manna Cookies & Co.", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="border border-brown/15 bg-cream-raised px-7 py-10 text-center sm:px-10">
          <Image src="/logo.png" alt="Manna Cookies & Co." width={84} height={84} className="mx-auto" />
          <h1 className="mt-6 font-display text-2xl font-medium text-ink">Owner Dashboard</h1>
          <p className="eyebrow mt-2 text-muted-2">Private · Sign in to continue</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <Link
            href="/forgot-password"
            className="eyebrow mt-6 inline-block text-muted-2 transition-colors hover:text-brown"
          >
            Forgot password
          </Link>
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="eyebrow text-muted-2 transition-colors hover:text-brown">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
