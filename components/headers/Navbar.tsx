"use client";

import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Menu, HelpCircle, Youtube, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function Navbar() {
  const pathname = usePathname();
  const isMainPage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="w-full flex h-14 items-center justify-between backdrop-blur-sm bg-white/10">
        <div className="pl-[20px] flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Youtube className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              TubeLens
            </span>
          </Link>
          {isMainPage && (
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <span className="text-sm font-medium">TubeReframe이 궁금하신가요?</span>
                <HelpCircle className="w-5 h-5" />
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-[600px] p-8 backdrop-blur-sm bg-white/95 border-t-0 rounded-t-none shadow-2xl"
                style={{
                  position: 'fixed',
                  top: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderTop: '1px solid transparent',
                  marginTop: '-1px',
                  borderRadius: '25px',
                }}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <Youtube className="w-8 h-8 text-blue-500" />
                    <h4 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      TubeReframe이란?
                    </h4>
                  </div>
                  <div className="space-y-6 px-2">
                    <p className="text-xl leading-relaxed text-gray-700">
                      유튜브 시청 기록을 기반으로 사용자의 관심사와 성향을 분석하여 
                      새로운 관점의 프로필을 제공하는 서비스입니다.
                    </p>
                    <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <p className="text-xl font-medium text-primary">
                        당신의 시청 기록이 말해주는 숨겨진 이야기를 발견해보세요.
                      </p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>

        <nav className="hidden md:flex pr-[20px]">
          {!isMainPage && (
            <>
              <Button asChild variant="ghost" size="sm" className="text-base font-medium hover:text-primary">
                <Link href="/my_profile">
                  마이페이지
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-base font-medium hover:text-primary">
                <Link href="/watch-history">
                  시청기록
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-base font-medium hover:text-primary">
                <Link href="/login">
                  로그인
                </Link>
              </Button>
            </>
          )}
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden pr-[20px]">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-l border-primary/10">
            <nav className="flex flex-col space-y-4 mt-4">
              <div className="text-6xl font-medium">
                {isMainPage ? (
                  <div className="px-4 flex items-center gap-2 text-gray-500">
                    <span className="text-xl">TubeReframe이 궁금하신가요?</span>
                    <HelpCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
} 