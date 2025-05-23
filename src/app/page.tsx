import { AuralisProfile } from '@/components/AuralisProfile';
import { ChatWindow } from '@/components/ChatWindow';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuralisMindPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="p-3 border-b shadow-sm bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image 
              src="https://placehold.co/32x32/A084CA/F4F0F9.png?text=A" 
              alt="Auralis Mind Logo" 
              width={32} 
              height={32} 
              className="rounded-md"
              data-ai-hint="logo brand"
            />
            <h1 className="text-2xl font-semibold text-primary">Auralis Mind</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/debug/memories" legacyBehavior passHref>
              <Button variant="outline" size="sm" asChild>
                <a>
                  <BookOpenCheck className="h-4 w-4 mr-2" />
                  Debug Memories
                </a>
              </Button>
            </Link>
            <ThemeToggleButton />
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-4 md:py-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 overflow-hidden">
        <aside className="md:col-span-1 h-full min-h-[300px] md:min-h-0 md:max-h-[calc(100vh-100px)]"> {/* Adjust max-h based on header */}
          <AuralisProfile />
        </aside>
        <section className="md:col-span-2 h-full min-h-[400px] md:min-h-0 md:max-h-[calc(100vh-100px)]"> {/* Adjust max-h based on header */}
          <ChatWindow />
        </section>
      </main>
    </div>
  );
}
