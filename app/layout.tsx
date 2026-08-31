import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js + Postgres",
  description: "Dockerized Next.js app with Postgres and pgAdmin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}