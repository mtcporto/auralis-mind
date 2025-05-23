import React, { useState } from 'react';
import type { ChatMessage } from '@/types/auralis';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, Bot, Brain, Heart, TrendingUp, MessageSquare, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  message: ChatMessage;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopied(true);
      toast({ title: "Copiado!", description: "O código foi copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Falha ao copiar: ', err);
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o código.", variant: "destructive" });
    });
  };

  const syntaxTheme = resolvedTheme === 'dark' ? oneDark : oneLight;

  return !inline && match ? (
    <div className="relative group my-2 text-sm">
      <SyntaxHighlighter
        style={syntaxTheme}
        language={match[1]}
        PreTag="div"
        {...props}
        className="!bg-background/30 rounded-md border" // Use ! to ensure background override if needed, adjust as per theme look
        customStyle={{ margin: 0, padding: '1rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }} // Use mono font
      >
        {codeString}
      </SyntaxHighlighter>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-muted/80"
        onClick={handleCopy}
        aria-label="Copiar código"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  ) : (
    <code className={cn(className, "bg-muted/50 text-foreground px-1 py-0.5 rounded-sm font-mono text-[0.9em]")} {...props}>
      {children}
    </code>
  );
};


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
                      p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                      code: CodeBlock,
                      // You can add more custom renderers here if needed for other markdown elements
                      // For example, to ensure links open in new tabs:
                      // a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />
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
