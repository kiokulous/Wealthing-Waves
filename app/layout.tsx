import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import AppLayout from "@/components/AppLayout";

const font = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
    title: "Wealthing Waves - Quản lý Danh mục",
    description: "Theo dõi tài sản và tối ưu hóa lợi nhuận",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className={font.className}>
                <AuthProvider>
                    <AppLayout>
                        {children}
                    </AppLayout>
                </AuthProvider>
            </body>
        </html>
    );
}
