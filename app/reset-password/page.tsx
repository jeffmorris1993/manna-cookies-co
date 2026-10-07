import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { OWNER_EMAIL } from "@/lib/auth";
import ResetForm from "./ResetForm";

export const metadata = {
  title: "Set New Password · Manna Cookies & Co.",
  robots: { index: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await supabaseServer();

  // The email link lands here with ?code= — exchange it for a recovery session.
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const validSession = !!user && user.email?.toLowerCase() === OWNER_EMAIL;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="border border-brown/15 bg-cream-raised px-7 py-10 text-center sm:px-10">
          <Image src="/logo.png" alt="Manna Cookies & Co." width={84} height={84} className="mx-auto" />
          <h1 className="mt-6 font-display text-2xl font-medium text-ink">Set a new password</h1>
          {validSession ? (
            <ResetForm />
          ) : (
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-muted">
                This reset link is invalid or expired. Links must be opened in the same browser
                that requested them.
              </p>
              <Link
                href="/forgot-password"
                className="eyebrow mt-6 inline-block border-b border-brown/40 pb-1 text-brown"
              >
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
