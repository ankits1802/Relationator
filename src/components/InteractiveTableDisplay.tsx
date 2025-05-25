
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertTriangle, Sigma } from 'lucide-react';
import type { ParsedFD } from '@/lib/db-types';
import { cn } from '@/lib/utils';
import { useDisplayMode, type DisplayMode } from '@/contexts/DisplayModeContext';
import { formatFDForDisplay } from '@/lib/display-utils';
import { Button } from '@/components/ui/button';


interface InteractiveTableDisplayProps {
  title?: string;
  data: Array<Record<string, any>>;
  caption?: string;
  fds: ParsedFD[];
  allAttributes: Set<string>;
}

export default function InteractiveTableDisplay({ 
  title = "Relation Data", 
  data, 
  caption,
  fds,
  allAttributes
}: InteractiveTableDisplayProps) {
  
  const headers = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]).sort() : [];
  }, [data]);

  const [violatedCells, setViolatedCells] = useState<Set<string>>(new Set());
  const [violatedFdsList, setViolatedFdsList] = useState<ParsedFD[]>([]);

  const { attributeMap } = useDisplayMode();
  const [componentDisplayMode, setComponentDisplayMode] = useState<DisplayMode>('text');

  const toggleDisplayMode = () => {
    setComponentDisplayMode(prevMode => prevMode === 'text' ? 'numeric' : 'text');
  };
  
  useEffect(() => {
    const newViolatedCells = new Set<string>();
    const newViolatedFdsList: ParsedFD[] = [];

    if (data.length > 0 && fds && fds.length > 0 && headers.length > 0) {
      fds.forEach(fd => {
        let fdIsViolatedThisIteration = false;
        const lhsKeys = fd.lhs;
        const rhsKeys = fd.rhs;

        // Skip if FD involves attributes not in the current table display
        const fdAttributes = new Set([...lhsKeys, ...rhsKeys]);
        if (!Array.from(fdAttributes).every(attr => headers.includes(attr))) {
          return;
        }

        const groups = new Map<string, Array<{row: Record<string, any>, index: number}>>();
        data.forEach((row, rowIndex) => {
          const lhsValueString = lhsKeys.map(key => String(row[key])).join('||');
          if (!groups.has(lhsValueString)) {
            groups.set(lhsValueString, []);
          }
          groups.get(lhsValueString)!.push({row, index: rowIndex});
        });

        groups.forEach(groupRows => {
          if (groupRows.length < 2) return;

          for (let i = 0; i < groupRows.length; i++) {
            for (let j = i + 1; j < groupRows.length; j++) {
              const row1 = groupRows[i].row;
              const row1Index = groupRows[i].index;
              const row2 = groupRows[j].row;
              const row2Index = groupRows[j].index;

              let rhsMismatch = false;
              for (const rhsKey of rhsKeys) {
                if (String(row1[rhsKey]) !== String(row2[rhsKey])) {
                  rhsMismatch = true;
                  break;
                }
              }

              if (rhsMismatch) {
                fdIsViolatedThisIteration = true;
                [row1Index, row2Index].forEach(rIdx => {
                  lhsKeys.forEach(key => newViolatedCells.add(`${rIdx}-${key}`));
                  rhsKeys.forEach(key => newViolatedCells.add(`${rIdx}-${key}`));
                });
              }
            }
          }
        });
        if (fdIsViolatedThisIteration) {
            if (!newViolatedFdsList.some(vfd => vfd.original === fd.original)) {
                 newViolatedFdsList.push(fd);
            }
        }
      });
    }
    setViolatedCells(newViolatedCells);
    setViolatedFdsList(newViolatedFdsList);
  }, [data, fds, headers]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Database className="mr-2 h-5 w-5" />
              {title}
            </CardTitle>
            {caption && <CardDescription className="mt-1">{caption}</CardDescription>}
          </div>
           <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format for violated FDs">
             <Sigma className="h-4 w-4" />
           </Button>
        </CardHeader>
        <CardContent>
          {data.length > 0 && headers.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map(header => (
                      <TableHead key={header} className="font-semibold">{header.toUpperCase()}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map(header => {
                        const cellKey = `${rowIndex}-${header}`;
                        const isViolated = violatedCells.has(cellKey);
                        return (
                          <TableCell 
                            key={cellKey} 
                            className={cn(
                              "text-sm", 
                              isViolated ? "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive-foreground/80" : ""
                            )}
                          >
                            {String(row[header])}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">
              No attributes defined or schema is empty.
            </p>
          )}
        </CardContent>
      </Card>

      {violatedFdsList.length > 0 && (
        <Card className="shadow-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              FD Violations in Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The following functional dependencies are violated by the current sample data. 
              Cells involved in these violations are highlighted in the table above.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {violatedFdsList.map((fd, index) => (
                <li key={index}>
                  <code>{formatFDForDisplay(fd, componentDisplayMode, attributeMap)}</code>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

