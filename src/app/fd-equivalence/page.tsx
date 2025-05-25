
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseSchemaString, parseDependenciesString, checkFdEquivalence } from '@/lib/db-utils';
import type { ParsedFD } from '@/lib/db-types';
import { Lightbulb, AlertCircle, Info } from 'lucide-react';

export default function FdEquivalencePage() {
  const [schemaInput, setSchemaInput] = useState<string>("A,B,C,D");
  const [fds1Input, setFds1Input] = useState<string>("A -> B; B -> C");
  const [fds2Input, setFds2Input] = useState<string>("A -> B,C");
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fds1InputRef = useRef<HTMLTextAreaElement>(null);
  const fds2InputRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertSymbolToFdInput = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    targetSetter: React.Dispatch<React.SetStateAction<string>>,
    symbol: string
  ) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      const formattedSymbol = `${symbol}`; // e.g., " \u2192 "
      const newValue =
        currentValue.substring(0, start) +
        formattedSymbol +
        currentValue.substring(end);
      targetSetter(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formattedSymbol.length,
          start + formattedSymbol.length
        );
      }, 0);
    }
  };

  const handleCheckEquivalence = () => {
    setResult(null);
    setErrors([]);
    let currentErrors: string[] = [];

    const parsedSchema = parseSchemaString(schemaInput);
    if (parsedSchema.allAttributes.size === 0) {
      currentErrors.push("Schema must be defined and contain attributes.");
    }

    // parseDependenciesString already handles '->' and '→', and optional braces {LHS} -> {RHS}
    const { fds: fds1, errors: fds1Errors } = parseDependenciesString(fds1Input, parsedSchema.allAttributes);
    currentErrors.push(...fds1Errors.map(e => `FD Set 1: ${e}`));

    const { fds: fds2, errors: fds2Errors } = parseDependenciesString(fds2Input, parsedSchema.allAttributes);
    currentErrors.push(...fds2Errors.map(e => `FD Set 2: ${e}`));

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      return;
    }
    
    if (fds1.length === 0 && fds2.length === 0) {
        setResult("Both FD sets are empty, thus they are equivalent by definition.");
        return;
    }

    const equivalenceResult = checkFdEquivalence(parsedSchema.allAttributes, fds1, fds2);
    setResult(equivalenceResult);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Functional Dependency Set Equivalence</CardTitle>
          <CardDescription>
            Enter a schema (e.g., A,B,C,D) and two sets of functional dependencies.
            The tool will determine if the two FD sets are equivalent.
            <br />
            FDs format: A,B -&gt; C; D -&gt; E (or use A → C). Attributes can be optionally wrapped in braces, e.g., {'{A,B}'} -&gt; {'{C}'}.
            <br />
            Use semicolons or newlines to separate FDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="schema-eq-input" className="block text-sm font-medium mb-1">Schema Attributes:</label>
            <Textarea
              id="schema-eq-input"
              value={schemaInput}
              onChange={(e) => setSchemaInput(e.target.value)}
              placeholder="e.g., A,B,C,D,E"
              rows={1}
              className="text-sm border-input focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="fds1-input" className="block text-sm font-medium mb-1">FD Set 1:</label>
            <Textarea
              id="fds1-input"
              ref={fds1InputRef}
              value={fds1Input}
              onChange={(e) => setFds1Input(e.target.value)}
              placeholder="e.g., A -> B; B,C -> D"
              rows={3}
              className="text-sm border-input focus:border-primary"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleInsertSymbolToFdInput(fds1InputRef, setFds1Input, " \u2192 ")}
              aria-label="Insert Functional Dependency arrow into FD Set 1"
            >
              Insert FD (→)
            </Button>
          </div>
          <div>
            <label htmlFor="fds2-input" className="block text-sm font-medium mb-1">FD Set 2:</label>
            <Textarea
              id="fds2-input"
              ref={fds2InputRef}
              value={fds2Input}
              onChange={(e) => setFds2Input(e.target.value)}
              placeholder="e.g., A -> B,D; D -> C"
              rows={3}
              className="text-sm border-input focus:border-primary"
            />
             <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleInsertSymbolToFdInput(fds2InputRef, setFds2Input, " \u2192 ")}
              aria-label="Insert Functional Dependency arrow into FD Set 2"
            >
              Insert FD (→)
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Input Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCheckEquivalence} className="w-full mt-4 py-3 text-base" variant="default" size="lg">
            <Lightbulb className="mr-2 h-5 w-5" /> Check Equivalence
          </Button>

          {result && errors.length === 0 && (
            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Equivalence Check Result</AlertTitle>
              <AlertDescription>
                <pre className="whitespace-pre-wrap font-sans text-sm">{result}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
