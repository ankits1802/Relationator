"use client";

import type { ParsedSchema, ParsedFD } from '@/lib/db-types';
import { parseSchemaString, parseFDsString } from '@/lib/db-utils';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

interface SchemaInputProps {
  onSchemaChange: (schema: ParsedSchema, fds: ParsedFD[]) => void;
  initialSchemaString?: string;
  initialFdString?: string;
}

export default function SchemaInput({ onSchemaChange, initialSchemaString = "R(A,B,C,D); S(C,E,F)", initialFdString = "A,B -> C; C -> D; E -> F" }: SchemaInputProps) {
  const [schemaString, setSchemaString] = useState(initialSchemaString);
  const [fdString, setFdString] = useState(initialFdString);
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema | null>(null);
  const [parsedFDs, setParsedFDs] = useState<ParsedFD[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleProcessSchema = () => {
    const currentParsedSchema = parseSchemaString(schemaString);
    setParsedSchema(currentParsedSchema);

    const { fds, errors: fdErrors } = parseFDsString(fdString, currentParsedSchema.allAttributes);
    setParsedFDs(fds);
    setErrors(fdErrors);

    if (fdErrors.length === 0) {
      onSchemaChange(currentParsedSchema, fds);
    } else {
      onSchemaChange(currentParsedSchema, []); // Pass empty FDs if errors
    }
  };
  
  useEffect(() => {
    handleProcessSchema();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Process on initial load

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Define Schema & Functional Dependencies</CardTitle>
        <CardDescription>
          Enter relation schemas (e.g., R(A,B,C); S(C,D)) and functional dependencies (e.g., A,B -> C; D -> E).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="schema-input" className="font-medium text-sm">Relation Schemas:</label>
          <Textarea
            id="schema-input"
            value={schemaString}
            onChange={(e) => setSchemaString(e.target.value)}
            placeholder="e.g., R(ID,Name,Dept); Department(DeptName,Head)"
            rows={3}
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fd-input" className="font-medium text-sm">Functional Dependencies (FDs):</label>
          <Textarea
            id="fd-input"
            value={fdString}
            onChange={(e) => setFdString(e.target.value)}
            placeholder="e.g., ID -> Name,Dept; DeptName -> Head"
            rows={4}
            className="text-sm"
          />
        </div>
        <Button onClick={handleProcessSchema} className="w-full sm:w-auto">
          <Lightbulb className="mr-2 h-4 w-4" /> Process Schema & FDs
        </Button>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {parsedSchema && errors.length === 0 && (
          <div className="mt-6 space-y-4 p-4 border rounded-md bg-secondary/30">
            <div>
              <h3 className="font-semibold text-md mb-2">Parsed Schema:</h3>
              {parsedSchema.allAttributes.size > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">All Attributes:</span> {Array.from(parsedSchema.allAttributes).map(attr => <Badge key={attr} variant="secondary" className="mr-1">{attr}</Badge>)}</p>
                  {Object.entries(parsedSchema.relations).map(([name, attrs]) => (
                    <p key={name} className="text-sm"><span className="font-medium">Relation {name}:</span> {Array.from(attrs).map(attr => <Badge key={attr} variant="outline" className="mr-1">{attr}</Badge>)}</p>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No schema defined or parsed.</p>}
            </div>
            <div>
              <h3 className="font-semibold text-md mb-2">Parsed Functional Dependencies:</h3>
              {parsedFDs.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {parsedFDs.map((fd, index) => (
                    <li key={index} className="text-sm">
                      {fd.lhs.map(attr => <Badge key={attr} variant="secondary" className="mr-1">{attr}</Badge>)}
                      <span className="font-semibold mx-1">&rarr;</span>
                      {fd.rhs.map(attr => <Badge key={attr} variant="secondary" className="mr-1">{attr}</Badge>)}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No functional dependencies defined or parsed correctly.</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
