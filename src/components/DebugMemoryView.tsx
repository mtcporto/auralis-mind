
"use client";

import React, { useState, useEffect } from 'react';
import { getAuralisMemorySegments } from '@/lib/auralisAPI';
import type { AuralisMemorySegment } from '@/types/auralis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Clock, BarChartBig, Tag, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type SegmentedMemories = {
  short_term: AuralisMemorySegment[];
  medium_term: AuralisMemorySegment[];
  long_term: AuralisMemorySegment[];
};

export function DebugMemoryView() {
  const [memories, setMemories] = useState<SegmentedMemories>({ short_term: [], medium_term: [], long_term: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAuralisMemorySegments();
        const segmented: SegmentedMemories = { short_term: [], medium_term: [], long_term: [] };
        (data.memory_segments || []).forEach(mem => {
          if (mem.f_segment_type === "short_term") segmented.short_term.push(mem);
          else if (mem.f_segment_type === "medium_term") segmented.medium_term.push(mem);
          else if (mem.f_segment_type === "long_term") segmented.long_term.push(mem);
        });
        // Sort by timestamp if available, or by ID as a fallback
        Object.keys(segmented).forEach(key => {
          segmented[key as keyof SegmentedMemories].sort((a, b) => {
            if (a.f_timestamp && b.f_timestamp) return new Date(b.f_timestamp).getTime() - new Date(a.f_timestamp).getTime();
            return (b.id || 0) - (a.id || 0); // Newest first
          });
        });
        setMemories(segmented);
      } catch (e) {
        console.error("Failed to fetch memory segments", e);
        setError("Could not load memory segments. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const renderMemoryList = (segmentType: keyof SegmentedMemories, title: string) => (
    <TabsContent value={segmentType} className="mt-0">
      <Card className="border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-xl flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" /> {title}</CardTitle>
          <CardDescription>Displaying {memories[segmentType].length} memories.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)] p-4 pt-0"> {/* Adjust height as needed */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full mb-3 rounded-lg" />)
            ) : error ? (
              <p className="text-destructive p-4">{error}</p>
            ) : memories[segmentType].length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Info className="w-12 h-12 mb-4 text-primary/50" />
                <p>No {segmentType.replace('_', ' ')} memories found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories[segmentType].map(mem => (
                  <Card key={mem.id || crypto.randomUUID()} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium text-foreground mb-1 break-words">"{mem.f_content}"</p>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                        <div className="flex items-center"><Tag className="h-3 w-3 mr-1.5 text-accent" /> Emotion: <Badge variant="outline" className="ml-1">{mem.f_emotion || 'N/A'}</Badge></div>
                        <div className="flex items-center"><BarChartBig className="h-3 w-3 mr-1.5 text-primary/80" /> Importance: <Badge variant="secondary" className="ml-1">{mem.f_importance || 'N/A'}/10</Badge></div>
                        {mem.f_timestamp && (
                          <div className="flex items-center mt-1"><Clock className="h-3 w-3 mr-1.5" /> Timestamp: {new Date(mem.f_timestamp).toLocaleString()}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </TabsContent>
  );

  return (
    <div className="p-4 md:p-6 h-full">
      <Tabs defaultValue="short_term" className="w-full h-full flex flex-col bg-background rounded-xl shadow-xl overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted/30 p-0 h-14">
          <TabsTrigger value="short_term" className="h-full rounded-none text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner">Short-Term</TabsTrigger>
          <TabsTrigger value="medium_term" className="h-full rounded-none text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner">Medium-Term</TabsTrigger>
          <TabsTrigger value="long_term" className="h-full rounded-none text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner">Long-Term</TabsTrigger>
        </TabsList>
        <div className="flex-grow overflow-hidden">
          {renderMemoryList("short_term", "Short-Term Memories")}
          {renderMemoryList("medium_term", "Medium-Term Memories")}
          {renderMemoryList("long_term", "Long-Term Memories")}
        </div>
      </Tabs>
    </div>
  );
}
