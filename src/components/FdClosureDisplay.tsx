
"use client";

import React, { useMemo, useState } from 'react';
import type { ParsedSchema, ParsedFD } from '@/lib/db-types';
import type { DisplayMode } from '@/contexts/DisplayModeContext';
import { calculateFdClosure, type FdPlusItem, getKeyAnalysis } from '@/lib/db-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sigma } from 'lucide-react';
import { useDisplayMode } from '@/contexts/DisplayModeContext';
import { formatAttributeSetForDisplay, formatFDForDisplay } from '@/lib/display-utils';

interface FdClosureDisplayProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
  allAttributes: Set<string>;
}

export default function FdClosureDisplay({ schema, fds, allAttributes }: FdClosureDisplayProps) {
  const { attributeMap } = useDisplayMode();
  const [componentDisplayMode, setComponentDisplayMode] = useState<DisplayMode>('text');

  const toggleDisplayMode = () => {
    setComponentDisplayMode(prevMode => prevMode === 'text' ? 'numeric' : 'text');
  };

  const fdPlus = useMemo(() => {
    if (schema && allAttributes.size > 0 && fds.length >= 0) { // Allow empty FDs for calculation
      return calculateFdClosure(allAttributes, fds);
    }
    return [];
  }, [schema, fds, allAttributes]);

  if (!schema || allAttributes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Functional Dependency Closure (F⁺)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Schema not defined or no attributes found. Please define a schema and FDs, then click 'Run Analysis'.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Functional Dependency Closure (F⁺)</CardTitle>
          <CardDescription>
            The following elements are in F⁺ for the attributes: {formatAttributeSetForDisplay(allAttributes, componentDisplayMode, attributeMap, false)}.
            <br /> An FD X &rarr; Y is <strong>Trivial</strong> if Y &sube; X.
            <br /> For non-trivial FDs, only the lowest normal form it primarily violates is indicated:
            <br /> - <strong>Violates 2NF</strong>: If some attribute in Y-X is non-prime AND X is a proper subset of a Candidate Key.
            <br /> - <strong>Violates 3NF</strong>: (If not violating 2NF) If X is not a Super Key AND some attribute in Y-X is non-prime.
            <br /> - <strong>Violates BCNF</strong>: (If not violating 2NF or 3NF) If X is not a Super Key.
            <br /> For overall 4NF/5NF status of the relation, please refer to the 'Normal Forms' tab, as these depend on MVDs and JDs.
          </CardDescription>
        </div>
        <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
          <Sigma className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {fdPlus.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-sm max-h-[600px] overflow-y-auto">
            {fdPlus.map((item, index) => (
              <li key={index}>
                <code>{formatFDForDisplay(item, componentDisplayMode, attributeMap)}</code>
                {item.isTrivial && (
                  <Badge variant="default" className="ml-2 bg-slate-700 hover:bg-slate-800 text-slate-50 text-xs">
                    Trivial
                  </Badge>
                )}
                {!item.isTrivial && (
                  <>
                    {item.violates2NF && (
                      <Badge variant="default" className="ml-2 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                        violates 2NF
                      </Badge>
                    )}
                    {!item.violates2NF && item.violates3NF && (
                      <Badge variant="default" className="ml-2 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                        violates 3NF
                      </Badge>
                    )}
                    {!item.violates2NF && !item.violates3NF && item.violatesBCNF && (
                      <Badge variant="destructive" className="ml-2 bg-red-600 hover:bg-red-700 text-red-50 text-xs">
                        violates BCNF
                      </Badge>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{fds.length === 0 && allAttributes.size > 0 ? "No FDs defined by user; F⁺ contains only trivial FDs (e.g., {A} → {A}) which are implicitly handled. Click 'Run Analysis' if you've defined FDs." : "Could not compute F⁺ or F⁺ is empty. Ensure schema and FDs are correctly defined and click 'Run Analysis'."}</p>
        )}
      </CardContent>
    </Card>
  );
}

