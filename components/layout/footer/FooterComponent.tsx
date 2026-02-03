// components/footer.tsx
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function FooterComponent() {
    return (
        <footer className="w-full border-t bg-background">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left */}
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} MyCompany. All rights reserved.
                    </p>

                    {/* Right */}
                    <div className="flex items-center gap-4 text-sm">
                        <Link href="/about" className="hover:underline">
                            Giới thiệu
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <Link href="/privacy" className="hover:underline">
                            Chính sách
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <Link href="/contact" className="hover:underline">
                            Liên hệ
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
