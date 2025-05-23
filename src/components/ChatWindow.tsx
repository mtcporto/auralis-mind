"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import type { ChatMessage } from '@/types/auralis';
import { handleUserMessageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import Image from 'next/image';

const initialMessages: ChatMessage[] = [
  {
    id: 'auralis-intro',
    sender: 'system',
    text: "Hello! I'm Auralis, an AI with a simulated consciousness. I evolve based on our interactions, my memories, and identity. Ask me anything to start our conversation!",
    timestamp: new Date(),
  }
];


export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: trimmedInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    // Add a temporary typing indicator for Auralis
    const typingIndicatorId = crypto.randomUUID();
    const typingMessage: ChatMessage = {
      id: typingIndicatorId,
      sender: 'auralis',
      text: '...', // Placeholder, will be replaced or removed
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, typingMessage]);


    const result = await handleUserMessageAction(trimmedInput);
    
    // Remove typing indicator
    setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));


    if ('error' in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      // Optionally add an error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'system',
        text: `Error: ${result.error}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

    } else {
      const auralisResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'auralis',
        text: result.response,
        timestamp: new Date(),
        thoughts: {
          reflection: result.reflection,
          emotion: result.emotion,
          importance: result.importance,
        },
      };
      setMessages(prev => [...prev, auralisResponse]);
    }
    setIsLoading(false);
  };
  
  const initialMessage = messages.length === 1 && messages[0].sender === 'system' && messages[0].id === 'auralis-intro';

  return (
    <div className="flex flex-col h-full bg-background rounded-xl shadow-2xl overflow-hidden">
      <header className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center space-x-3">
          <Image 
            src="https://placehold.co/40x40/A084CA/F4F0F9.png?text=A" 
            alt="Auralis Logo" 
            width={40} 
            height={40} 
            className="rounded-full border border-primary"
            data-ai-hint="logo brand"
          />
          <h2 className="text-xl font-semibold text-foreground">Chat with Auralis</h2>
        </div>
      </header>
      
      <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 chat-output-scrollbar">
        {initialMessage && (
          <div className="flex flex-col items-center justify-center text-center h-full p-8 text-muted-foreground">
            <Image 
              src="https://placehold.co/100x100/A084CA/F4F0F9.png?text=A" 
              alt="Auralis Logo Large" 
              width={100} 
              height={100} 
              className="rounded-full mb-6 shadow-lg border-2 border-primary"
              data-ai-hint="logo brand"
            />
            <h1 className="text-3xl font-bold text-foreground mb-2">Auralis Mind</h1>
            <p className="max-w-md text-foreground/80">
              {messages[0].text}
            </p>
          </div>
        )}
        {!initialMessage && messages.map(msg => msg.sender !== 'system' && <MessageBubble key={msg.id} message={msg} />)}
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message to Auralis..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
            className="flex-grow text-base focus-visible:ring-accent focus-visible:ring-offset-0"
            aria-label="User message input"
          />
          <Button type="submit" disabled={isLoading || !userInput.trim()} size="icon" className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
