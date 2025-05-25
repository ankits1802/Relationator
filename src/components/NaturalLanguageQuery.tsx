"use client";

import { naturalLanguageToRaSql } from '@/ai/flows/natural-language-to-ra-sql';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Languages, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NaturalLanguageQuery() {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("Find all students in the 'CS' department.");
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setTranslatedQuery(null);
    try {
      const result = await naturalLanguageToRaSql({ naturalLanguageQuery });
      setTranslatedQuery(result.translatedQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred during translation.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Natural Language to RA/SQL</CardTitle>
        <CardDescription>
          Convert your natural language questions into Relational Algebra or SQL queries using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="nl-query-input" className="font-medium text-sm">Enter Natural Language Query:</label>
          <Textarea
            id="nl-query-input"
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            placeholder="e.g., Show names of employees hired after 2020."
            rows={3}
            className="text-sm"
          />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
          Translate Query
        </Button>

        {error && (
           <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md flex items-center">
             <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
           </div>
        )}

        {translatedQuery && (
          <div className="p-4 border rounded-md bg-accent/10">
            <h3 className="font-semibold text-md text-accent-foreground flex items-center">
              <Languages className="h-5 w-5 mr-2 shrink-0 text-accent" />
              Translated Query (RA/SQL):
            </h3>
            <ScrollArea className="h-[150px] mt-2">
              <pre className="text-sm whitespace-pre-wrap font-sans p-2 bg-background rounded">
                {translatedQuery}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
