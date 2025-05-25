
"use client";

import React, { useMemo, useState } from 'react';
import type { ParsedSchema, ParsedFD, ParsedMVD, ParsedJD, NormalFormAnalysisResult } from '@/lib/db-types';
import type { DisplayMode } from '@/contexts/DisplayModeContext';
import {
  getKeyAnalysis,
  check1NF,
  check2NF,
  check3NF,
  checkBCNF,
  check4NF,
  check5NF,
} from '@/lib/db-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDisplayMode } from '@/contexts/DisplayModeContext';
import { formatAttributeSetForDisplay, formatFDForDisplay, formatMVDForDisplay, formatJDForDisplay } from '@/lib/display-utils';

interface NormalFormsDisplayProps {
  schema: ParsedSchema | null;
  fds: ParsedFD[];
  mvds: ParsedMVD[];
  parsedJd: ParsedJD | null; 
  allAttributes: Set<string>;
}

export default function NormalFormsDisplay({ schema, fds, mvds, parsedJd, allAttributes }: NormalFormsDisplayProps) {
  const { attributeMap } = useDisplayMode();
  const [componentDisplayMode, setComponentDisplayMode] = useState<DisplayMode>('text');

  const toggleDisplayMode = () => {
    setComponentDisplayMode(prevMode => prevMode === 'text' ? 'numeric' : 'text');
  };

  const analysisResults = useMemo((): NormalFormAnalysisResult[] => {
    if (!schema || allAttributes.size === 0) {
      const defaultExplanation = "Schema or attributes not defined.";
      return ['1NF', '2NF', '3NF', 'BCNF', '4NF', '5NF'].map(nf => ({
        id: nf.toLowerCase(),
        name: nf.replace(/(\\d)/, '$1st ').replace('BCNF', 'Boyce-Codd NF').replace('NF', 'Normal Form'),
        isSatisfied: false,
        violations: [],
        explanation: defaultExplanation,
      }));
    }
    
    const keyInfo = getKeyAnalysis(allAttributes, fds);
    const oneNfResult = check1NF();
    const twoNfResult = check2NF(allAttributes, fds, keyInfo);
    const threeNfResult = check3NF(allAttributes, fds, keyInfo);
    const bcnfResult = checkBCNF(allAttributes, fds, keyInfo);
    const fourNfResult = check4NF(allAttributes, fds, mvds, keyInfo);
    const fiveNfResult = check5NF(allAttributes, keyInfo, parsedJd);


    return [
      oneNfResult,
      twoNfResult,
      threeNfResult,
      bcnfResult,
      fourNfResult, 
      fiveNfResult, 
    ];
  }, [schema, fds, mvds, parsedJd, allAttributes]);

  if (!schema || allAttributes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Normal Forms Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please define a schema with attributes and dependencies to see the normal form analysis.</p>
        </CardContent>
      </Card>
    );
  }
  
  const renderContentWithCurrentMode = (result: NormalFormAnalysisResult) => {
    const currentExplanation = result.explanation ? result.explanation : (result.isSatisfied ? "Satisfied." : "Violated.");
    return (
      <>
        {currentExplanation && <p className="mb-2 text-muted-foreground">{currentExplanation}</p>}
        {result.violations && result.violations.length > 0 && (
          <>
            <p className="font-semibold mb-1">Violations/Considerations:</p>
            <ul className="list-disc space-y-1 pl-5">
              {result.violations.map((violation, index) => (
                <li key={index}>
                  <code>
                    {violation.fd ? formatFDForDisplay(violation.fd, componentDisplayMode, attributeMap) : ''}
                    {violation.mvd ? formatMVDForDisplay(violation.mvd, componentDisplayMode, attributeMap) : ''}
                    {violation.jd ? formatJDForDisplay(violation.jd, componentDisplayMode, attributeMap) : ''}
                  </code>: {violation.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    );
  };
  
  if (fds.length === 0 && mvds.length === 0 && !parsedJd && allAttributes.size > 0) {
     const keyInfo = getKeyAnalysis(allAttributes, fds);
     const bcnfResultForNoDeps = { ...checkBCNF(allAttributes, fds, keyInfo), isSatisfied: true, violations: [], explanation: "No FDs to cause violations. Relation is in BCNF." };
     const fourNfResultForNoDeps = check4NF(allAttributes, fds, mvds, keyInfo); 
     const fiveNfResultForNoDeps = check5NF(allAttributes, keyInfo, null); 


     const satisfiedResults: NormalFormAnalysisResult[] = [
        check1NF(),
        { ...check2NF(allAttributes, fds, keyInfo), isSatisfied: true, violations: [], explanation: "No FDs to cause violations. Relation is in 2NF." },
        { ...check3NF(allAttributes, fds, keyInfo), isSatisfied: true, violations: [], explanation: "No FDs to cause violations. Relation is in 3NF." },
        bcnfResultForNoDeps,
        fourNfResultForNoDeps, 
        fiveNfResultForNoDeps,  
     ];
     return (
        <Card className="shadow-lg">
           <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Normal Forms Analysis</CardTitle>
              <CardDescription>Analysis for relation {formatAttributeSetForDisplay(allAttributes, componentDisplayMode, attributeMap, false)} with no dependencies defined.</CardDescription>
            </div>
            <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
              <Sigma className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-2">
              {satisfiedResults.map((result) => (
                <AccordionItem 
                  key={result.id} 
                  value={result.id} 
                  className={`rounded-md border px-4 ${result.isSatisfied ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'}`}
                >
                  <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      {result.isSatisfied ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                      {result.name} - {result.isSatisfied ? 'Satisfied' : 'Violated (or requires specific conditions)'}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-3 text-sm">
                     {renderContentWithCurrentMode(result)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
     )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Normal Forms Analysis</CardTitle>
          <CardDescription>
            Attributes: {formatAttributeSetForDisplay(allAttributes, componentDisplayMode, attributeMap, false)}.
            {mvds.length > 0 && ` MVDs: ${mvds.map(m => formatMVDForDisplay(m, componentDisplayMode, attributeMap)).join('; ')}.`}
            {parsedJd && ` JD: ${formatJDForDisplay(parsedJd, componentDisplayMode, attributeMap)}.`}
          </CardDescription>
        </div>
        <Button onClick={toggleDisplayMode} variant="outline" size="icon" aria-label="Toggle display format">
          <Sigma className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {analysisResults.map((result) => (
            <AccordionItem 
              key={result.id} 
              value={result.id} 
              className={`rounded-md border px-4 ${result.isSatisfied ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'}`}
            >
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  {result.isSatisfied ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  {result.name} - {result.isSatisfied ? 'Satisfied' : 'Violated (or requires specific conditions)'}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3 text-sm">
                {renderContentWithCurrentMode(result)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

