
"use client";

import React, { useMemo, useState } from 'react';
import type { ParsedSchema, ParsedFD } from '@/lib/db-types';
import type { DisplayMode } from '@/contexts/DisplayModeContext';
import { calculateMinimalCover } from '@/lib/db-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sigma } from 'lucide-react';
import { useDisplayMode } from '@/contexts/DisplayModeContext';
import { formatFDListForDisplay } from '@/lib/display-utils';

interface MinimalCoverDisplayProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
  allAttributes: Set<string>;
}

export default function MinimalCoverDisplay({ schema, fds, allAttributes }: MinimalCoverDisplayProps) {
  const { attributeMap } = useDisplayMode();
  const [componentDisplayMode, setComponentDisplayMode] = useState<DisplayMode>('text');

  const toggleDisplayMode = () => {
    setComponentDisplayMode(prevMode => prevMode === 'text' ? 'numeric' : 'text');
  };

  const minimalCoverFds = useMemo(() => {
    if (schema && allAttributes.size > 0 && fds.length > 0) {
      return calculateMinimalCover(fds, allAttributes);
    }
    return [];
  }, [schema, fds, allAttributes]);

  const formattedMinimalCover = useMemo(() => {
    return formatFDListForDisplay(minimalCoverFds, componentDisplayMode, attributeMap);
  }, [minimalCoverFds, componentDisplayMode, attributeMap]);

  if (!schema || allAttributes.size === 0 ) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Minimal Cover</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please define a schema with attributes.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (fds.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Minimal Cover</CardTitle>
           <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
            <Sigma className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No FDs defined. Minimal cover is an empty set.</p>
          <div className="mt-4 p-4 text-center border rounded-md bg-secondary/30 shadow-sm">
            <code className="text-lg font-medium text-primary">{formatFDListForDisplay([], componentDisplayMode, attributeMap)}</code>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Minimal Cover</CardTitle>
          <CardDescription>
            A minimal set of functional dependencies equivalent to the original set.
          </CardDescription>
        </div>
        <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
          <Sigma className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="p-4 text-center border rounded-md bg-secondary/30 shadow-sm">
          <code className="text-lg font-medium text-primary">{formattedMinimalCover}</code>
        </div>
      </CardContent>
    </Card>
  );
}

