"use client";

import type { ParsedFD, ParsedSchema } from '@/lib/db-types';
import { _attributeClosure } from '@/lib/db-utils'; // Renamed to avoid conflict
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AttributeClosureProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
}

export default function AttributeClosure({ schema, fds }: AttributeClosureProps) {
  const [attributesToClose, setAttributesToClose] = useState('');
  const [closureResult, setClosureResult] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateClosure = () => {
    setError(null);
    setClosureResult(null);

    if (!schema || schema.allAttributes.size === 0) {
      setError("Schema must be defined first.");
      return;
    }
    if (fds.length === 0) {
      setError("Functional Dependencies must be defined first.");
      return;
    }

    const inputAttrs = attributesToClose.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
    if (inputAttrs.length === 0) {
      setError("Please enter attributes to calculate closure for.");
      return;
    }

    const invalidAttrs = inputAttrs.filter(attr => !schema.allAttributes.has(attr));
    if (invalidAttrs.length > 0) {
      setError(`Attributes [${invalidAttrs.join(', ')}] not found in schema.`);
      return;
    }
    
    const result = _attributeClosure(new Set(inputAttrs), fds);
    setClosureResult(result);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Attribute Closure (X⁺)</CardTitle>
        <CardDescription>
          Compute the closure of a set of attributes based on the defined FDs.
          Enter attributes separated by commas (e.g., A,B).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Input
            type="text"
            value={attributesToClose}
            onChange={(e) => setAttributesToClose(e.target.value)}
            placeholder="e.g., A,B"
            className="flex-grow text-sm"
            aria-label="Attributes for closure"
          />
          <Button onClick={handleCalculateClosure} className="w-full sm:w-auto">
            Calculate Closure
          </Button>
        </div>

        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
          </div>
        )}

        {closureResult && (
          <div className="p-4 border rounded-md bg-primary/5">
            <h3 className="font-semibold text-md text-primary flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 shrink-0" />
              Closure of <span className="font-bold mx-1">{`{${attributesToClose.split(',').map(a => a.trim().toUpperCase()).filter(Boolean).join(', ')}}`}</span>:
            </h3>
            <div className="mt-2">
              {Array.from(closureResult).map(attr => (
                <Badge key={attr} variant="default" className="mr-2 my-1 text-sm px-3 py-1">{attr}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
