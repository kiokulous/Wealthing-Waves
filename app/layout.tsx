import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Using the same font as GAS app
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Wealthing Waves",
    description: "Personal Fund Manager",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className={font.className}>{children}</body>
        </html>
    );
}
