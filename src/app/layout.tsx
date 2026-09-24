import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Link from "next/link";
import { isViewer } from "@/lib/role";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "מחלקת משק - חלוקת ציוד",
  description: "מערכת למעקב אחר חלוקת ציוד ואספקה למחלקות",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await isViewer();

  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="bg-slate-900 text-white shadow">
          <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <span className="font-bold text-lg">מחלקת משק - חלוקת ציוד</span>
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm font-medium">
              <Link href="/" className="hover:text-amber-300 transition-colors">
                חלוקה והיסטוריה
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-amber-300 transition-colors"
              >
                דשבורד
              </Link>
              {!viewer && (
                <>
                  <Link
                    href="/departments"
                    className="hover:text-amber-300 transition-colors"
                  >
                    מחלקות
                  </Link>
                  <Link
                    href="/items"
                    className="hover:text-amber-300 transition-colors"
                  >
                    פריטים
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full flex flex-col">{children}</main>
        <footer className="bg-slate-900 text-center text-xs text-slate-400 py-2">
          <p>מערכת ניהול חלוקת ציוד פנימית - מחלקת משק</p>
          <p>נבנה ע&quot;י גיל בן-יהודה</p>
        </footer>
      </body>
    </html>
  );
}
