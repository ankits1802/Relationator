
"use client";

import { fdExplanationGenerator } from '@/ai/flows/fd-explanation-generator';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, HelpCircle, AlertCircle, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FdExplanationProps {
  initialSchema?: string;
  initialFds?: string;
}

export default function FdExplanation({ initialSchema = "R(A,B,C,D)", initialFds = "A->B; B->C"}: FdExplanationProps) {
  const [concept, setConcept] = useState("Attribute Closure");
  const [schema, setSchema] = useState(initialSchema);
  const [fds, setFds] = useState(initialFds);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchema(initialSchema);
  }, [initialSchema]);

  useEffect(() => {
    setFds(initialFds);
  }, [initialFds]);


  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const result = await fdExplanationGenerator({ concept, schema, fds });
      setExplanation(result.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred while generating explanation.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">FD Explanation Bot</CardTitle>
        <CardDescription>
          Get AI-generated explanations for functional dependency concepts. Provide the concept, and optionally schema and FDs for context (or use the main inputs).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="fd-concept" className="font-medium text-sm">Concept to Explain:</label>
          <Input
            id="fd-concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="e.g., Candidate Keys, BCNF, Minimal Cover"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fd-schema-context" className="font-medium text-sm">Schema Context (Optional):</label>
          <Textarea
            id="fd-schema-context"
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            placeholder="e.g., Student(SID, Name, CID); Course(CID, CName)"
            rows={2}
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fd-fds-context" className="font-medium text-sm">FDs Context (Optional):</label>
          <Textarea
            id="fd-fds-context"
            value={fds}
            onChange={(e) => setFds(e.target.value)}
            placeholder="e.g., SID -> Name; CID -> CName"
            rows={2}
            className="text-sm"
          />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-2 h-4 w-4" />}
          Explain Concept
        </Button>

        {error && (
           <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md flex items-center">
             <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
           </div>
        )}

        {explanation && (
          <div className="p-4 border rounded-md bg-accent/10">
            <h3 className="font-semibold text-md text-accent-foreground flex items-center">
              <BookOpen className="h-5 w-5 mr-2 shrink-0 text-accent" />
              Explanation for "{concept}":
            </h3>
            <ScrollArea className="h-[200px] mt-2">
               <div 
                className="text-sm p-1 bg-background rounded"
                dangerouslySetInnerHTML={{ __html: explanation }} 
              />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
