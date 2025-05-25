
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, AlertCircle, CheckCircle2, XCircleIcon } from 'lucide-react';
import { parseSchemaString, parseDependenciesString, type ParsedFD, type ParsedSchema, checkLosslessJoin, checkDependencyPreservation } from '@/lib/db-utils';
import { formatFDForDisplay, formatAttributeSetForDisplay } from '@/lib/display-utils';
import { useDisplayMode } from '@/contexts/DisplayModeContext';

type DecompositionAnalysisResult = {
  isLossless?: boolean;
  losslessExplanation?: string;
  dependenciesPreserved?: boolean; // True if all original FDs are preserved
  preservedFds?: ParsedFD[];
  lostFds?: ParsedFD[];
  preservationExplanation?: string;
  errors?: string[];
  tableau?: string[][] | null;
};

export default function DecompositionCheckerPage() {
  const [originalSchemaString, setOriginalSchemaString] = useState<string>("A,B,C,D,E");
  const [originalFdString, setOriginalFdString] = useState<string>("A->B,C; C,D->E; B->D");
  const fdInputRef = useRef<HTMLTextAreaElement>(null);
  const [decomposedSchemaString, setDecomposedSchemaString] = useState<string>("R1(A,B,C); R2(C,D,E)");
  const [analysisResult, setAnalysisResult] = useState<DecompositionAnalysisResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { attributeMap } = useDisplayMode(); 

  const handleInsertSymbolToFdInput = (symbol: string) => {
    const textarea = fdInputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      const formattedSymbol = `${symbol}`;
      const newValue = currentValue.substring(0, start) + formattedSymbol + currentValue.substring(end);
      setOriginalFdString(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formattedSymbol.length, start + formattedSymbol.length);
      }, 0);
    }
  };

  const handleCheckDecomposition = () => {
    setAnalysisResult(null);
    setErrors([]);
    setIsLoading(true);
    let currentErrors: string[] = [];

    const parsedOriginalSchema = parseSchemaString(originalSchemaString);
    if (parsedOriginalSchema.allAttributes.size === 0) {
      currentErrors.push("Original schema must be defined and contain attributes.");
    }

    const { fds: parsedOriginalFds, errors: fdParseErrors } = parseDependenciesString(originalFdString, parsedOriginalSchema.allAttributes);
    currentErrors.push(...fdParseErrors.map(e => `Original FDs: ${e}`));

    const decomposedRelationsArray: ParsedSchema[] = [];
    if (decomposedSchemaString.trim()) {
      const decomposedParts = decomposedSchemaString.split(';').map(s => s.trim()).filter(Boolean);
      decomposedParts.forEach(part => {
        const parsedPart = parseSchemaString(part); 
        if (parsedPart.allAttributes.size > 0) {
            decomposedRelationsArray.push(parsedPart);
            parsedPart.allAttributes.forEach(attr => {
                if (!parsedOriginalSchema.allAttributes.has(attr)) {
                    currentErrors.push(`Attribute "${attr}" in decomposed relation "${part}" is not in the original schema.`);
                }
            });
        } else {
            currentErrors.push(`Invalid or empty decomposed relation part: "${part}". Each part should define attributes, e.g., R1(A,B).`);
        }
      });
      if (decomposedParts.length === 0 && decomposedSchemaString.trim()) {
          currentErrors.push("Decomposed schema string is not empty but no valid relations were parsed.");
      }
    } else {
        currentErrors.push("Decomposed schema must be defined and contain at least one relation.");
    }
    
    const unionOfDecomposedAttrs = new Set<string>();
    decomposedRelationsArray.forEach(rel => rel.allAttributes.forEach(attr => unionOfDecomposedAttrs.add(attr)));

    if (parsedOriginalSchema.allAttributes.size > 0 && decomposedRelationsArray.length > 0) {
        if (unionOfDecomposedAttrs.size !== parsedOriginalSchema.allAttributes.size ||
            !Array.from(parsedOriginalSchema.allAttributes).every(attr => unionOfDecomposedAttrs.has(attr))) {
            currentErrors.push(`The union of attributes in decomposed relations ({${Array.from(unionOfDecomposedAttrs).join(',')}}) does not match the original schema attributes ({${Array.from(parsedOriginalSchema.allAttributes).join(',')}}). Lossless-join property may not hold, or attributes are lost/gained.`);
        }
    }

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      setIsLoading(false);
      return;
    }

    // Ensure parsedOriginalFds is not undefined before passing
    const fdsForCheck = parsedOriginalFds || [];

    const losslessResult = checkLosslessJoin(parsedOriginalSchema.allAttributes, fdsForCheck, decomposedRelationsArray);
    const preservationResult = checkDependencyPreservation(fdsForCheck, decomposedRelationsArray, parsedOriginalSchema.allAttributes);

    setAnalysisResult({
      isLossless: losslessResult.isLossless,
      losslessExplanation: losslessResult.explanation,
      tableau: losslessResult.tableau,
      dependenciesPreserved: preservationResult.allPreserved,
      preservedFds: preservationResult.preservedFds,
      lostFds: preservationResult.lostFds,
      preservationExplanation: preservationResult.explanation,
    });

    setIsLoading(false);
  };
  
  const formatTableauForDisplay = (tableau: string[][] | null | undefined, originalAttributes: Set<string>): React.ReactNode => {
    if (!tableau) return <p>Tableau not available.</p>;
    const attributesArray = Array.from(originalAttributes).sort();
    if (attributesArray.length === 0 && tableau.length > 0 && tableau[0].length > 0) {
        // Fallback if originalAttributes is empty but tableau has columns
        // This case should ideally be prevented by input validation
        return <p>Tableau generated but original attributes are missing for headers.</p>;
    }
     if (tableau.length > 0 && attributesArray.length !== tableau[0].length) {
        return <p className="text-destructive">Tableau column count ({tableau[0].length}) does not match original attribute count ({attributesArray.length}). Please check inputs.</p>;
    }


    return (
      <div className="overflow-x-auto mt-2 border rounded-md">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {attributesArray.map(attr => (
                <th key={attr} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border-r">
                  {formatAttributeSetForDisplay(new Set([attr]), 'text', attributeMap, false)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {tableau.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r">
                    {cell ? (cell.startsWith('a') ? <strong>{cell}</strong> : cell) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Decomposition Property Checker</CardTitle>
          <CardDescription>
            Enter an original relation (attributes and FDs) and a set of decomposed relations.
            The tool will check for lossless-join and dependency preservation properties.
            Original Attributes: e.g., A,B,C,D,E or R(A,B,C,D,E)
            Original FDs: e.g., A -&gt; B; C -&gt; D (or use A → B)
            Decomposed Schema: e.g., R1(A,B,C); R2(C,D,E) - separate relations by semicolon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <CardTitle className="text-lg">Original Relation</CardTitle>
              <div>
                <label htmlFor="original-schema-input" className="block text-sm font-medium mb-1">Original Schema Attributes:</label>
                <Textarea
                  id="original-schema-input"
                  value={originalSchemaString}
                  onChange={(e) => setOriginalSchemaString(e.target.value)}
                  placeholder="e.g., A,B,C,D,E or R(A,B,C,D,E)"
                  rows={2}
                  className="text-sm border-input focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="original-fd-input" className="block text-sm font-medium mb-1">Original Functional Dependencies:</label>
                <Textarea
                  id="original-fd-input"
                  ref={fdInputRef}
                  value={originalFdString}
                  onChange={(e) => setOriginalFdString(e.target.value)}
                  placeholder="e.g., A -> B,C; C,D -> E"
                  rows={3}
                  className="text-sm border-input focus:border-primary"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleInsertSymbolToFdInput(" \u2192 ")}
                    aria-label="Insert Functional Dependency arrow"
                >
                    Insert FD (→)
                </Button>
              </div>
            </div>
            <div className="space-y-4">
                <CardTitle className="text-lg">Decomposed Schema</CardTitle>
                <div>
                    <label htmlFor="decomposed-schema-input" className="block text-sm font-medium mb-1">Decomposed Relations (e.g., R1(A,B); R2(B,C)):</label>
                    <Textarea
                    id="decomposed-schema-input"
                    value={decomposedSchemaString}
                    onChange={(e) => setDecomposedSchemaString(e.target.value)}
                    placeholder="e.g., R1(A,B,C); R2(C,D,E)"
                    rows={5} 
                    className="text-sm border-input focus:border-primary"
                    />
                </div>
            </div>
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

          <Button onClick={handleCheckDecomposition} disabled={isLoading} className="w-full mt-4 py-3 text-base" variant="default" size="lg">
            {isLoading ? <Lightbulb className="mr-2 h-5 w-5 animate-spin" /> : <Lightbulb className="mr-2 h-5 w-5" />}
            Check Decomposition Properties
          </Button>

          {analysisResult && errors.length === 0 && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    {analysisResult.isLossless ? <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> : <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />}
                    Lossless-Join Property
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={analysisResult.isLossless ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                    {analysisResult.losslessExplanation || "Analysis pending."}
                  </p>
                  {analysisResult.tableau && (
                    <>
                      <p className="mt-2 text-sm text-muted-foreground">Final Tableau State:</p>
                      {formatTableauForDisplay(analysisResult.tableau, parseSchemaString(originalSchemaString).allAttributes)}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    {analysisResult.dependenciesPreserved ? <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> : <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />}
                    Dependency Preservation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={analysisResult.dependenciesPreserved ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                    {analysisResult.preservationExplanation || "Analysis pending."}
                  </p>
                  {analysisResult.preservedFds && analysisResult.preservedFds.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Preserved FDs:</h4>
                      <ul className="list-disc list-inside text-sm">
                        {analysisResult.preservedFds.map((fd, i) => <li key={`p-${i}`}>{formatFDForDisplay(fd, 'text', attributeMap)}</li>)}
                      </ul>
                    </div>
                  )}
                  {analysisResult.lostFds && analysisResult.lostFds.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Lost FDs:</h4>
                      <ul className="list-disc list-inside text-sm">
                        {analysisResult.lostFds.map((fd, i) => <li key={`l-${i}`}>{formatFDForDisplay(fd, 'text', attributeMap)}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    