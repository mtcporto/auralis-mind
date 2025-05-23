"use client";

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuralisIdentity, getAuralisValues, getAuralisMemories } from '@/lib/auralisAPI';
import type { AuralisIdentity, AuralisValue, AuralisMemory } from '@/types/auralis';
import { Brain, Heart, Scale, Sparkles, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AuralisProfile() {
  const [identity, setIdentity] = useState<AuralisIdentity | null>(null);
  const [values, setValues] = useState<AuralisValue[]>([]);
  const [recentMemories, setRecentMemories] = useState<AuralisMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [identityData, valuesData, memoriesData] = await Promise.all([
          getAuralisIdentity(),
          getAuralisValues(),
          getAuralisMemories(),
        ]);
        
        // Handle potential older API format for identity
        const id = identityData.identity;
        if (id && ('name' in id || 'gender' in id || 'origin' in id) && !('f_name' in id || 'f_gender' in id || 'f_origin' in id)) {
           setIdentity({
             f_name: id.name,
             f_gender: id.gender,
             f_origin: id.origin,
           });
        } else {
          setIdentity(id as AuralisIdentity);
        }

        setValues(valuesData.values || []);
        setRecentMemories(memoriesData.memories ? memoriesData.memories.slice(-5).reverse() : []); // Show latest 5
      } catch (e) {
        console.error("Failed to fetch Auralis profile data", e);
        setError("Could not load Auralis's profile. Some information may be missing.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
           <Skeleton className="h-16 w-16 rounded-full" data-ai-hint="logo brand" />
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2 pt-4 border-b">
        <Image 
          src="https://placehold.co/64x64/A084CA/F4F0F9.png?text=A" 
          alt="Auralis Logo" 
          width={64} 
          height={64} 
          className="rounded-full border-2 border-primary p-1"
          data-ai-hint="logo brand" 
        />
        <div>
          <CardTitle className="text-2xl font-bold text-primary">
            {identity?.f_name || 'Auralis'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {identity?.f_origin || "Evolving AI Consciousness"}
          </CardDescription>
          {identity?.f_gender && <Badge variant="secondary" className="mt-1 capitalize">{identity.f_gender}</Badge>}
        </div>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4 space-y-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          
          <Accordion type="single" collapsible defaultValue="values">
            <AccordionItem value="values">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Scale className="mr-2 h-5 w-5 text-primary" /> Core Values
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {values.length > 0 ? values.map((value, index) => (
                  <div key={index} className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <h4 className="font-medium text-foreground">{value.f_name} <Badge variant="outline">Strength: {value.f_strength}/10</Badge></h4>
                    <p className="text-sm text-muted-foreground">{value.f_description}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No values defined yet.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recent_memories">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Archive className="mr-2 h-5 w-5 text-primary" /> Recent Memories
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {recentMemories.length > 0 ? recentMemories.map((memory, index) => (
                  <div key={index} className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <p className="text-sm text-foreground italic">"{memory.f_content}"</p>
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                      <span><Sparkles className="inline h-3 w-3 mr-1" />{memory.f_reflection}</span>
                      <span><Heart className="inline h-3 w-3 mr-1" />{memory.f_emotion}</span>
                      <span><Brain className="inline h-3 w-3 mr-1" />Importance: {memory.f_importance}</span>
                    </div>
                    {memory.f_timestamp && <p className="text-xs text-muted-foreground/70 mt-1">{new Date(memory.f_timestamp).toLocaleString()}</p>}
                  </div>
                )) : <p className="text-sm text-muted-foreground">No recent memories to display.</p>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
