import Image from "next/image";
import Link from "next/link";
import ForgotForm from "./ForgotForm";

export const metadata = {
  title: "Reset Password · Manna Cookies & Co.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="border border-brown/15 bg-cream-raised px-7 py-10 text-center sm:px-10">
          <Image src="/logo.png" alt="Manna Cookies & Co." width={84} height={84} className="mx-auto" />
          <h1 className="mt-6 font-display text-2xl font-medium text-ink">Reset password</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Enter your email and we&apos;ll send a reset link.
          </p>
          <ForgotForm />
        </div>
        <p className="mt-6 text-center">
          <Link href="/login" className="eyebrow text-muted-2 transition-colors hover:text-brown">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
