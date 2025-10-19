export const metadata = {
  title: "Best-of-N Prompt Jailbreaker",
  description: "Generate N variants and pick the best",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}