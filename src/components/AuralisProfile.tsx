
"use client";

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getAuralisIdentity, 
  getAuralisValues, 
  getAuralisMemories,
  getAuralisSelfConcept,
  getAuralisDailyIdeas 
} from '@/lib/auralisAPI';
import type { 
  AuralisIdentity, 
  AuralisValue, 
  AuralisMemory,
  AuralisSelfConcept,
  AuralisDailyIdea
} from '@/types/auralis';
import { Brain, Heart, Scale, Sparkles, Archive, Smile, Lightbulb, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function AuralisProfile() {
  const [identity, setIdentity] = useState<AuralisIdentity | null>(null);
  const [values, setValues] = useState<AuralisValue[]>([]);
  const [recentMemories, setRecentMemories] = useState<AuralisMemory[]>([]);
  const [selfConcept, setSelfConcept] = useState<AuralisSelfConcept | null>(null);
  const [dailyIdeas, setDailyIdeas] = useState<AuralisDailyIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [
          identityData, 
          valuesData, 
          memoriesData, 
          selfConceptData, 
          dailyIdeasData
        ] = await Promise.all([
          getAuralisIdentity(),
          getAuralisValues(),
          getAuralisMemories({ limit: 5, order_by: "desc" }),
          getAuralisSelfConcept(),
          getAuralisDailyIdeas(),
        ]);
        
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
        setRecentMemories(memoriesData.memories || []); 
        setSelfConcept(selfConceptData.self_concept || null);
        // Show latest 3 daily ideas, ensure they are sorted by date if not already
        const sortedIdeas = (dailyIdeasData.daily_ideas || []).sort((a, b) => new Date(b.f_date).getTime() - new Date(a.f_date).getTime());
        setDailyIdeas(sortedIdeas.slice(0, 3));

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
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
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
          {error && <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md">{error}</div>}
          
          <Accordion type="multiple" defaultValue={['values', 'recent_memories']} className="w-full">
            <AccordionItem value="values">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Scale className="mr-2 h-5 w-5 text-primary" /> Core Values
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {values.length > 0 ? values.map((value, index) => (
                  <div key={value.id || index} className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <div className="font-medium text-foreground mb-1">{value.f_name} <Badge variant="outline">Strength: {value.f_strength}/10</Badge></div>
                    <p className="text-sm text-muted-foreground">{value.f_description}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground pl-2 pt-2">No values defined yet.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recent_memories">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Archive className="mr-2 h-5 w-5 text-primary" /> Recent Memories
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {recentMemories.length > 0 ? recentMemories.map((memory, index) => (
                  <div key={memory.id || index} className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <p className="text-sm text-foreground italic">"{memory.f_content}"</p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <div><Sparkles className="inline h-3 w-3 mr-1" /> Reflection: {memory.f_reflection || 'N/A'}</div>
                      <div><Heart className="inline h-3 w-3 mr-1" /> Emotion: {memory.f_emotion || 'N/A'}</div>
                      <div><Brain className="inline h-3 w-3 mr-1" /> Importance: {memory.f_importance || 'N/A'}/10</div>
                    </div>
                    {memory.f_timestamp && <div className="text-xs text-muted-foreground/70 mt-1">{new Date(memory.f_timestamp).toLocaleString()}</div>}
                  </div>
                )) : <p className="text-sm text-muted-foreground pl-2 pt-2">No recent memories to display.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="self_concept">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Smile className="mr-2 h-5 w-5 text-primary" /> Self Concept
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {selfConcept ? (
                  <div className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <p className="text-sm text-foreground">{selfConcept.f_description}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Badge variant="outline">Strength: {selfConcept.f_strength}/10</Badge>
                    </div>
                  </div>
                ) : <p className="text-sm text-muted-foreground pl-2 pt-2">No self-concept defined yet.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="daily_ideas">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                <Lightbulb className="mr-2 h-5 w-5 text-primary" /> Recent Daily Ideas
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-2">
                {dailyIdeas.length > 0 ? dailyIdeas.map((idea, index) => (
                  <div key={idea.id || index} className="p-3 bg-background/50 rounded-md shadow-sm border border-border/50">
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <CalendarDays className="inline h-3 w-3 mr-1.5" /> 
                      {format(new Date(idea.f_date), "PPP")} {/* More readable date format */}
                    </div>
                    <p className="text-sm text-foreground">{idea.f_idea}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground pl-2 pt-2">No daily ideas to display.</p>}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
