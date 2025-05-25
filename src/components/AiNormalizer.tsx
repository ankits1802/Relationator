
"use client";

import { aiNormalize, type AiNormalizeInput } from '@/ai/flows/ai-normalizer';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiNormalizerProps {
  initialSchema?: string;
  initialFds?: string;
}

export default function AiNormalizer({ initialSchema = "R(A,B,C,D)", initialFds = "A->B,C; C->D" }: AiNormalizerProps) {
  const [schemaDefinition, setSchemaDefinition] = useState(initialSchema);
  const [functionalDependencies, setFunctionalDependencies] = useState(initialFds);
  const [targetNormalForm, setTargetNormalForm] = useState<AiNormalizeInput['targetNormalForm']>("BCNF");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchemaDefinition(initialSchema);
  }, [initialSchema]);

  useEffect(() => {
    setFunctionalDependencies(initialFds);
  }, [initialFds]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const result = await aiNormalize({
        schemaDefinition,
        functionalDependencies,
        targetNormalForm,
      });
      setExplanation(result.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const normalForms: AiNormalizeInput['targetNormalForm'][] = ['1NF', '2NF', '3NF', 'BCNF', '4NF', '5NF'];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">AI Database Normalizer</CardTitle>
        <CardDescription>
          Get AI-powered explanations for normalizing your database schema to a target normal form. Provide the schema and FDs below, or use the ones from the main input.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="ai-schema-def" className="font-medium text-sm">Schema Definition:</label>
          <Textarea
            id="ai-schema-def"
            value={schemaDefinition}
            onChange={(e) => setSchemaDefinition(e.target.value)}
            placeholder="e.g., Student(StudentID, Name, CourseID, CourseName)"
            rows={3}
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="ai-fds" className="font-medium text-sm">Functional Dependencies:</label>
          <Textarea
            id="ai-fds"
            value={functionalDependencies}
            onChange={(e) => setFunctionalDependencies(e.target.value)}
            placeholder="e.g., StudentID -> Name; CourseID -> CourseName"
            rows={3}
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="ai-target-nf" className="font-medium text-sm">Target Normal Form:</label>
          <Select
            value={targetNormalForm}
            onValueChange={(value) => setTargetNormalForm(value as AiNormalizeInput['targetNormalForm'])}
          >
            <SelectTrigger id="ai-target-nf" className="w-full sm:w-[200px] text-sm">
              <SelectValue placeholder="Select Normal Form" />
            </SelectTrigger>
            <SelectContent>
              {normalForms.map(nf => (
                <SelectItem key={nf} value={nf} className="text-sm">{nf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate Explanation
        </Button>

        {error && (
           <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md flex items-center">
             <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
           </div>
        )}

        {explanation && (
          <div className="p-4 border rounded-md bg-accent/10">
            <h3 className="font-semibold text-md text-accent-foreground flex items-center">
              <Wand2 className="h-5 w-5 mr-2 shrink-0 text-accent" />
              Normalization Explanation:
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
