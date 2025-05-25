"use client";

import type { ParsedFD, ParsedSchema } from '@/lib/db-types';
import { _calculateCandidateKeys } from '@/lib/db-utils'; // Renamed to avoid conflict
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyRound, AlertCircle } from 'lucide-react';

interface CandidateKeysProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
}

export default function CandidateKeys({ schema, fds }: CandidateKeysProps) {
  const [candidateKeysResult, setCandidateKeysResult] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);

  const handleIdentifyKeys = () => {
    setError(null);
    setCandidateKeysResult(null);
    setIsLoading(true);

    if (!schema || schema.allAttributes.size === 0) {
      setError("Schema must be defined first.");
      setIsLoading(false);
      return;
    }
    if (fds.length === 0 && schema.allAttributes.size > 0) {
      // If no FDs, all attributes together form the only candidate key (if relation is not empty)
      // Or each attribute is a key if it's a relation with single attributes and no FDs.
      // For simplicity, let's say all attributes form a key.
      setCandidateKeysResult([Array.from(schema.allAttributes)]);
      setIsLoading(false);
      return;
    }
     if (fds.length === 0 && schema.allAttributes.size === 0) {
      setError("No attributes defined in schema.");
      setIsLoading(false);
      return;
    }


    // Simulate API call or heavy computation
    setTimeout(() => {
      const keys = _calculateCandidateKeys(schema.allAttributes, fds);
      setCandidateKeysResult(keys);
      setIsLoading(false);
    }, 500); // Mock delay
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Candidate Key Identification</CardTitle>
        <CardDescription>
          Determine candidate keys from the given schema and FDs.
          <span className="block text-xs mt-1 text-muted-foreground">(Note: Full candidate key algorithm is complex; this provides a simplified identification.)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleIdentifyKeys} disabled={isLoading || !schema || schema.allAttributes.size === 0} className="w-full sm:w-auto">
          {isLoading ? 'Calculating...' : 'Identify Candidate Keys'}
        </Button>

        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
          </div>
        )}

        {candidateKeysResult && (
          <div className="p-4 border rounded-md bg-primary/5">
            <h3 className="font-semibold text-md text-primary flex items-center">
              <KeyRound className="h-5 w-5 mr-2 shrink-0" />
              Identified Candidate Keys:
            </h3>
            {candidateKeysResult.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {candidateKeysResult.map((key, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2 text-sm">Key {index + 1}:</span>
                    {key.map(attr => (
                       <Badge key={attr} variant="default" className="mr-1 my-1 text-sm px-2 py-0.5">{attr}</Badge>
                    ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No candidate keys found or schema not sufficiently defined for identification.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
