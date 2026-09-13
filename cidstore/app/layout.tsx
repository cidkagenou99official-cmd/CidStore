import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/app/components/site-shell";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "@/app/lib/customer-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CID Store | Crypto Exchange",
  description: "CID Store is a premium demo crypto exchange experience built with Next.js and Tailwind CSS.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const session = verifyCustomerSession(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <SiteShell isCustomerLoggedIn={Boolean(session)}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
