import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiniela Mundial",
  description: "Llena tu quiniela del Mundial, guarda y consulta resultados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
