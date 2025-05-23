import React from 'react';
import type { ChatMessage } from '@/types/auralis';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, Brain, Heart, TrendingUp, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isAuralis = message.sender === 'auralis';

  return (
    <div className={cn("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      <Card 
        className={cn(
          "max-w-md md:max-w-lg lg:max-w-xl shadow-md rounded-xl",
          isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none",
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start space-x-2">
            {!isUser && (
              <div className="flex-shrink-0 p-1.5 bg-primary/10 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
             {isUser && (
              <div className="flex-shrink-0 p-1.5 bg-background/80 rounded-full order-2 ml-2">
                <User className="h-5 w-5 text-foreground/80" />
              </div>
            )}
            <div className={cn("flex-grow", isUser ? "order-1" : "")}>
              <div className="prose prose-sm dark:prose-invert max-w-none message-text break-words">
                 <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-0" {...props} />, // Remove default bottom margin for p in markdown
                    }}
                 >
                    {message.text}
                 </ReactMarkdown>
              </div>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {isAuralis && message.thoughts && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center">
                  <Brain className="h-3.5 w-3.5 mr-1.5" /> Reflexão de Auralis
                </summary>
                <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                  <p className="flex items-center"><MessageSquare className="h-3 w-3 mr-1.5 text-accent" /> Reflexão: <span className="italic ml-1">{message.thoughts.reflection}</span></p>
                  <p className="flex items-center"><Heart className="h-3 w-3 mr-1.5 text-destructive/70" /> Emoção: <span className="font-medium ml-1">{message.thoughts.emotion}</span></p>
                  <p className="flex items-center"><TrendingUp className="h-3 w-3 mr-1.5 text-primary/80" /> Importância: <span className="font-medium ml-1">{message.thoughts.importance}/10</span></p>
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
