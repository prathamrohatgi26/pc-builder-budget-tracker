import "./globals.css";
import localFont from "next/font/local";

// Load your custom TTF font
// Replace 'YourFontName' with your actual font file name (without .ttf extension)
// Example: if your file is 'CustomFont.ttf', use 'CustomFont'
const customFont = localFont({
  src: "./fonts/Spiderdead-Regular.ttf", // Update this with your actual font file name
  variable: "--font-custom",
  display: "swap",
});

export const metadata = {
  title: "PC Parts Checklist",
  description:
    "Complete interactive checklist for building your PC - track all components, peripherals, and tools needed for your build",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${customFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
