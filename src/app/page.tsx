
"use client"; // Adicionar "use client" porque vamos usar useState

import { useState } from 'react'; // Importar useState
import { AuralisProfile } from '@/components/AuralisProfile';
import { ChatWindow } from '@/components/ChatWindow';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Importar ícones
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AuralisMindPage() {
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="p-3 border-b shadow-sm bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsProfileCollapsed(!isProfileCollapsed)}
              className="mr-1"
              aria-label={isProfileCollapsed ? "Expandir perfil" : "Recolher perfil"}
            >
              {isProfileCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
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
                  Depurar Memórias
                </a>
              </Button>
            </Link>
            <ThemeToggleButton />
          </div>
        </div>
      </header>
      
      <main className={cn(
        "flex-grow container mx-auto py-4 md:py-6 grid grid-cols-1 gap-4 md:gap-6 overflow-hidden",
        isProfileCollapsed ? "md:grid-cols-[auto,1fr]" : "md:grid-cols-[minmax(300px,1fr),2fr]"
      )}>
        <aside className={cn(
          "md:col-span-1 h-full min-h-[300px] md:min-h-0 md:max-h-[calc(100vh-100px)] transition-all duration-300 ease-in-out",
          isProfileCollapsed && "hidden" // Simplesmente oculta em vez de tentar colapsar com largura zero
        )}>
          {!isProfileCollapsed && <AuralisProfile />}
        </aside>
        <section className={cn(
          "h-full min-h-[400px] md:min-h-0 md:max-h-[calc(100vh-100px)] transition-all duration-300 ease-in-out",
          isProfileCollapsed ? "md:col-span-2" : "md:col-span-1" // Ajustado para ocupar o espaço
        )}>
          <ChatWindow />
        </section>
      </main>
    </div>
  );
}
