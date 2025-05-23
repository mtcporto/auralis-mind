import { DebugMemoryView } from '@/components/DebugMemoryView';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DebugMemoriesPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="p-3 border-b shadow-sm bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <Link href="/" legacyBehavior passHref>
                <Button variant="outline" size="icon" className="mr-2" asChild>
                  <a><ArrowLeft className="h-5 w-5" /></a>
                </Button>
            </Link>
            <Image 
              src="https://placehold.co/32x32/A084CA/F4F0F9.png?text=A" 
              alt="Auralis Mind Logo" 
              width={32} 
              height={32} 
              className="rounded-md"
              data-ai-hint="logo brand"
            />
            <h1 className="text-2xl font-semibold text-primary">Auralis Memories (Debug)</h1>
          </div>
          <ThemeToggleButton />
        </div>
      </header>
      <main className="flex-grow container mx-auto overflow-hidden">
        <DebugMemoryView />
      </main>
    </div>
  );
}

export const metadata = {
  title: "Auralis Debug Memories | Auralis Mind",
  description: "Debug view for Auralis's segmented memories.",
};
