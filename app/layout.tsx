import "./globals.css";

export const metadata = {
  title: "Teleport Chess",
  description: "Two-player chess with a teleport variant: relocate a piece to the square your opponent just vacated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
