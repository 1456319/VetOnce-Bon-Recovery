import "./globals.css";

export const metadata = {
  title: "Best-of-N Typescript RNG Error proof",
  description: "Generate N variants and pick the best",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}
