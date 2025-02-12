"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="w-full flex h-20 items-center justify-between">
        <div className="pl-[20px]">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-[21px] h-[24px]">
              <div className="absolute top-0 left-0 w-[15px] h-[15px] bg-[#5156FF]" />
              <div className="absolute top-[9px] left-[6px] w-[15px] h-[15px] bg-[#5156FF]" />
            </div>
            <span className="text-3xl font-semibold">
              Algorithm Profile
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex pr-[20px]">
          <Button asChild variant="ghost" size="lg" className="text-2xl font-medium hover:text-primary">
            <Link href="/my_profile">
              마이페이지
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-2xl font-medium hover:text-primary">
            <Link href="/watch-history">
              시청기록
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-2xl font-medium hover:text-primary">
            <Link href="/login">
              로그인
            </Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden pr-[20px]">
            <Button variant="ghost" size="icon">
              <Menu className="h-10 w-10" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-l border-primary/10">
            <nav className="flex flex-col space-y-4 mt-4">
              <div className="text-6xl font-medium">
                <Button asChild variant="ghost" size="lg" className="w-full h-auto py-8 text-2xl font-medium justify-start">
                  <Link href="/my_profile">
                    마이페이지
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full h-auto py-8 text-2xl font-medium justify-start">
                  <Link href="/watch-history">
                    시청기록
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full h-auto py-8 text-2xl font-medium justify-start">
                  <Link href="/login">
                    로그인
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
} 