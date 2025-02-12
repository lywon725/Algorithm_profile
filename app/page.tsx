import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex flex-col items-center space-y-4 text-center relative z-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Create my own algorithm profile
          </h1>          
        </div>
        <div className="w-full max-w-[897px] p-4">
          <div className="relative w-full rounded-[20px] bg-white/80 backdrop-blur-sm p-4 shadow-[3px_3px_27.4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-white/90">
            <input
              type="text"
              placeholder="https://youtube.com/playlist?list=..."
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex gap-4">
        </div>
        <div className="flex gap-4 mt-8">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-all px-16 py-8 text-2xl font-semibold rounded-full shadow-xl hover:scale-105"
          >
            <Link href="/login">
              Create Profile
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
