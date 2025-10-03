import "./globals.css";

export const metadata = {
  title: "PC Parts Checklist",
  description:
    "Complete interactive checklist for building your PC - track all components, peripherals, and tools needed for your build",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body  suppressHydrationWarning={true}
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
