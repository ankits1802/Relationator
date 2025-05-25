
"use client";

import React, { useState } from 'react';
import type { ParsedSchema, ParsedFD } from '@/lib/db-types';
import type { DisplayMode } from '@/contexts/DisplayModeContext';
import { _attributeClosure, getPowerSet } from '@/lib/db-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sigma } from 'lucide-react';
import { useDisplayMode } from '@/contexts/DisplayModeContext';
import { formatAttributeSetForDisplay } from '@/lib/display-utils';

interface AttributeClosureDisplayProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
  allAttributes: Set<string>;
}

export default function AttributeClosureDisplay({ schema, fds, allAttributes }: AttributeClosureDisplayProps) {
  const { attributeMap } = useDisplayMode();
  const [componentDisplayMode, setComponentDisplayMode] = useState<DisplayMode>('text');

  const toggleDisplayMode = () => {
    setComponentDisplayMode(prevMode => prevMode === 'text' ? 'numeric' : 'text');
  };

  if (!schema || allAttributes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribute Closures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Schema not defined or no attributes found. Please define a schema and FDs.</p>
        </CardContent>
      </Card>
    );
  }

  const attributesArray = Array.from(allAttributes);
  const allSubsets = getPowerSet(attributesArray);

  const closures = allSubsets.map(subsetArray => {
    const subset = new Set(subsetArray);
    const closure = _attributeClosure(subset, fds);
    return {
      subsetDisplay: formatAttributeSetForDisplay(subset, componentDisplayMode, attributeMap),
      closureDisplay: formatAttributeSetForDisplay(closure, componentDisplayMode, attributeMap),
      originalSubset: subset,
      originalClosure: closure,
    };
  });

  const superKeys: Set<string>[] = [];
  closures.forEach(item => {
    if (item.originalClosure.size === allAttributes.size && Array.from(allAttributes).every(attr => item.originalClosure.has(attr))) {
      superKeys.push(item.originalSubset);
    }
  });

  const candidateKeys: Set<string>[] = [];
  superKeys.sort((a,b) => a.size - b.size).forEach(sk => {
    let isMinimal = true;
    for (const ck of candidateKeys) {
      if (Array.from(ck).every(attr => sk.has(attr)) && ck.size < sk.size) {
        isMinimal = false;
        break;
      }
    }
    if (isMinimal) {
      candidateKeys.push(sk);
    }
  });
  
  const isSuperKey = (subset: Set<string>): boolean => {
    return superKeys.some(sk => sk.size === subset.size && Array.from(sk).every(attr => subset.has(attr)));
  };

  const isCandidateKey = (subset: Set<string>): boolean => {
    return candidateKeys.some(ck => ck.size === subset.size && Array.from(ck).every(attr => subset.has(attr)));
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Attribute Closures (X⁺)</CardTitle>
          <CardDescription>
            Closures for all subsets of attributes: {formatAttributeSetForDisplay(allAttributes, componentDisplayMode, attributeMap, false)}.
            <br/>A set X is a <strong>Super Key</strong> if X⁺ contains all attributes.
            <br/>A <strong>Candidate Key</strong> is a minimal Super Key.
          </CardDescription>
        </div>
        <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
          <Sigma className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {closures.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-sm max-h-[600px] overflow-y-auto">
            {closures.map((item, index) => (
              <li key={index}>
                <code>{`${item.subsetDisplay}⁺ = ${item.closureDisplay}`}</code>
                {isCandidateKey(item.originalSubset) && (
                  <Badge variant="default" className="ml-2 bg-green-500 hover:bg-green-600 text-white text-xs">
                    Candidate Key
                  </Badge>
                )}
                {!isCandidateKey(item.originalSubset) && isSuperKey(item.originalSubset) && (
                  <Badge variant="default" className="ml-2 bg-blue-500 hover:bg-blue-600 text-white text-xs">
                    Super Key
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No closures to display. Ensure schema and FDs are correctly defined.</p>
        )}
      </CardContent>
    </Card>
  );
}

