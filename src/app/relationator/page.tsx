
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AttributeClosureDisplay from '@/components/AttributeClosureDisplay';
import FdClosureDisplay from '@/components/FdClosureDisplay';
import MinimalCoverDisplay from '@/components/MinimalCoverDisplay';
import NormalFormsDisplay from '@/components/NormalFormsDisplay';
import AiNormalizer from '@/components/AiNormalizer';
import NaturalLanguageQuery from '@/components/NaturalLanguageQuery';
import FdExplanation from '@/components/FdExplanation';
import InteractiveTableDisplay from '@/components/InteractiveTableDisplay';
import type { ParsedSchema, ParsedFD, ParsedMVD, ParsedJD } from '@/lib/db-types';
import { parseSchemaString, parseDependenciesString, parseJdString } from '@/lib/db-utils';
import { useDisplayMode } from '@/contexts/DisplayModeContext'; 

export default function RelationatorPage() {
  const [schemaInputString, setSchemaInputString] = useState<string>("R(A,B,C,D,E)"); 
  const [depInputString, setDepInputString] = useState<string>("A -> B,C; C -> D; A \u21A0 D,E");    
  const depInputRef = useRef<HTMLTextAreaElement>(null);

  const [jdInputString, setJdInputString] = useState<string>("A,B,C; C,D,E");
  const [showJdInput, setShowJdInput] = useState<boolean>(false);
  const jdInputRef = useRef<HTMLTextAreaElement>(null);


  const [schema, setSchema] = useState<ParsedSchema | null>(null);
  const [fds, setFds] = useState<ParsedFD[]>([]);
  const [mvds, setMvds] = useState<ParsedMVD[]>([]);
  const [parsedJd, setParsedJd] = useState<ParsedJD | null>(null);
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  
  const { setAttributeMap } = useDisplayMode(); 

  const handleRunAnalysis = () => {
    const currentParsedSchema = parseSchemaString(schemaInputString);
    setSchema(currentParsedSchema); 
    
    const allCurrentErrors: string[] = [];

    const { fds: parsedFDs, mvds: parsedMVDs, errors: depErrors } = parseDependenciesString(depInputString, currentParsedSchema.allAttributes);
    allCurrentErrors.push(...depErrors);

    if (depErrors.length > 0) {
      setFds([]); 
      setMvds([]);
    } else {
      setFds(parsedFDs);
      setMvds(parsedMVDs);
    }
    
    if (showJdInput && jdInputString.trim()) {
        const { jd, error: jdParseError } = parseJdString(jdInputString, currentParsedSchema.allAttributes);
        setParsedJd(jd);
        if (jdParseError) {
            allCurrentErrors.push(jdParseError);
        }
    } else {
        setParsedJd(null);
    }

    setInputErrors(allCurrentErrors);
    
    if (currentParsedSchema.allAttributes.size > 0) {
      const newMap = new Map<string, number>();
      Array.from(currentParsedSchema.allAttributes).sort().forEach((attr, index) => {
        newMap.set(attr, index + 1);
      });
      setAttributeMap(newMap);
    } else {
      setAttributeMap(null); 
    }
  };
  
  useEffect(() => { // Run analysis on initial load with default values
    handleRunAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const allAttributes = useMemo(() => {
    return schema?.allAttributes ?? new Set<string>();
  }, [schema]);

  const attributesForTable = useMemo((): string[] => {
    if (!schema) return [];
    const namedRelations = Object.keys(schema.relations).filter(name => name !== "DEFAULT_RELATION");

    if (namedRelations.length > 0) {
      const firstRelationName = namedRelations[0];
      return Array.from(schema.relations[firstRelationName]).sort();
    } else if (schema.relations["DEFAULT_RELATION"] && schema.relations["DEFAULT_RELATION"].size > 0) {
      return Array.from(schema.relations["DEFAULT_RELATION"]).sort();
    } else if (schema.allAttributes.size > 0 && Object.keys(schema.relations).length === 0) {
      return Array.from(schema.allAttributes).sort();
    }
    return [];
  }, [schema]);

  const tableData = useMemo(() => {
    if (attributesForTable.length > 0) {
      return Array.from({ length: 4 }).map((_, rowIndex) => {
        const row: Record<string, any> = {};
        attributesForTable.forEach((attr, colIndex) => {
          const attrStr = String(attr);
          if (attrStr === 'A') row[attrStr] = `A${rowIndex === 2 ? 1 : rowIndex + 1}`;
          else if (attrStr === 'B') row[attrStr] = `B${rowIndex +1}`;
          else if (attrStr === 'C') row[attrStr] = `C${rowIndex < 2 ? 1 : 2}`;
          else if (attrStr === 'D') row[attrStr] = `D${rowIndex + 1}`;
          else row[attrStr] = `${attrStr}${rowIndex + 1}`; 
        });
        return row;
      });
    }
    return [];
  }, [attributesForTable]);

  const tableTitle = useMemo(() => {
    if (!schema) return "Sample Relation Data";
    const namedRelations = Object.keys(schema.relations).filter(name => name !== "DEFAULT_RELATION");

    if (namedRelations.length > 0) {
      return `Sample Data for Relation: ${namedRelations[0]}`;
    } else if (schema.relations["DEFAULT_RELATION"] && schema.relations["DEFAULT_RELATION"].size > 0) {
      return `Sample Data for Attributes`;
    } else if (schema.allAttributes.size > 0 && Object.keys(schema.relations).length === 0) {
      return `Sample Data for Attributes`;
    }
    return "Sample Relation Data";
  }, [schema]);

  const captionText = useMemo(() => {
    if (attributesForTable.length > 0) {
        const namedRelationKeys = schema ? Object.keys(schema.relations).filter(name => name !== "DEFAULT_RELATION") : [];
        let titlePart = "attributes";
        
        if (namedRelationKeys.length > 0) {
            titlePart = `relation ${namedRelationKeys[0]}`;
        } else if (schema?.relations?.["DEFAULT_RELATION"]) {
             titlePart = "defined attributes";
        } else if (schema?.allAttributes.size > 0) {
            titlePart = "defined attributes";
        }
        return `Displaying sample rows for the ${titlePart}: (${attributesForTable.join(', ')}). Violated FDs will highlight relevant cells. Click 'Run Analysis' after changing inputs.`;
    }
    return "Define a schema (e.g., R(A,B,C) or {{A,B,C}}) and dependencies, then click 'Run Analysis' to visualize its structure and check for FD violations.";
  }, [attributesForTable, schema]);

  const handleInsertSymbol = (symbol: string, targetRef: React.RefObject<HTMLTextAreaElement>, targetSetter: (value: string | ((prev: string) => string)) => void) => {
    const textarea = targetRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      const formattedSymbol = `${symbol}`; 
      const newValue = currentValue.substring(0, start) + formattedSymbol + currentValue.substring(end);
      targetSetter(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formattedSymbol.length, start + formattedSymbol.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Enter Schema & Dependencies</CardTitle>
          <CardDescription>
            Schema: e.g., R(A,B,C,D), {`{{A,B,C,D}}`}, or A,B,C,D. Current Schema (after analysis): R({Array.from(allAttributes).sort().join(',') || '...'}).
            <br />
            FDs: LHS &rarr; RHS (or LHS -&gt; RHS).
            <br/>
            MVDs: LHS &↠; RHS (or LHS -&gt;-&gt; RHS).
            <br/>
            JDs (optional): R1; R2; ... (e.g. A,B,C; C,D,E or {`{{A,B,C}}; {{C,D,E}}`}).
            <br/>
            Separate multiple dependencies/components by semicolons or newlines. Click 'Run Analysis' to update results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="schema-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schema:</label>
            <Textarea
              id="schema-input"
              value={schemaInputString}
              onChange={(e) => setSchemaInputString(e.target.value)}
              placeholder="e.g., R(A,B,C,D)"
              rows={1}
              className="text-sm border-input focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="dep-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Functional & Multi-Valued Dependencies (FDs/MVDs):</label>
            <Textarea
              id="dep-input"
              ref={depInputRef}
              value={depInputString}
              onChange={(e) => setDepInputString(e.target.value)}
              placeholder="e.g., A,B -> C; D -> A; A ->-> B (or use newlines)"
              rows={3}
              className="text-sm border-input focus:border-primary"
            />
             <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInsertSymbol(" \u2192 ", depInputRef, setDepInputString)} // →
                aria-label="Insert Functional Dependency arrow"
              >
                Insert FD (→)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInsertSymbol(" \u21A0 ", depInputRef, setDepInputString)} // ↠
                aria-label="Insert Multi-Valued Dependency arrow"
              >
                Insert MVD (↠)
              </Button>
               <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowJdInput(!showJdInput)}
                aria-label={showJdInput ? "Hide Join Dependency Input" : "Define Join Dependency"}
              >
                {showJdInput ? "Hide JD Input" : "Define Join Dependency"}
              </Button>
            </div>
          </div>

          {showJdInput && (
            <div>
              <label htmlFor="jd-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Dependency (JD):</label>
              <Textarea
                id="jd-input"
                ref={jdInputRef}
                value={jdInputString}
                onChange={(e) => setJdInputString(e.target.value)}
                placeholder="e.g., A,B,C; C,D,E (meaning *({{A,B,C}}, {{C,D,E}}))"
                rows={2}
                className="text-sm border-input focus:border-primary"
              />
              <div className="mt-2 flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertSymbol("A,B,C; C,D,E", jdInputRef, setJdInputString)}
                    aria-label="Insert Join Dependency template"
                >
                    Insert JD Template
                </Button>
              </div>
            </div>
          )}

           {inputErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Input Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {inputErrors.map((error, index) => (
                    <li key={index}>{error}</li> 
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={handleRunAnalysis} className="w-full mt-6 py-3 text-base" variant="default" size="lg">
            Run Analysis
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="attributeClosure" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 mb-6">
          <TabsTrigger value="attributeClosure">Attribute Closure</TabsTrigger>
          <TabsTrigger value="fdClosure">FD Closure (F⁺)</TabsTrigger>
          <TabsTrigger value="minimalCover">Minimal Cover</TabsTrigger>
          <TabsTrigger value="normalForms">Normal Forms</TabsTrigger>
          <TabsTrigger value="aiNormalizer">AI Normalizer</TabsTrigger>
          <TabsTrigger value="aiTranslator">AI NL Query</TabsTrigger>
          <TabsTrigger value="aiExplainer">AI FD Explainer</TabsTrigger>
          <TabsTrigger value="interactiveTable">Interactive Table</TabsTrigger>
        </TabsList>

        <TabsContent value="attributeClosure">
          {schema && fds.length >= 0 && inputErrors.length === 0 ? ( 
            <AttributeClosureDisplay schema={schema} fds={fds} allAttributes={allAttributes} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  {inputErrors.length > 0 ? "Please correct the errors above and click 'Run Analysis'." : "Click 'Run Analysis' to see attribute closures for the default schema and dependencies, or define your own."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fdClosure">
           {schema && fds.length >= 0 && inputErrors.length === 0 && allAttributes.size > 0 ? ( 
            <FdClosureDisplay schema={schema} fds={fds} allAttributes={allAttributes} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  {inputErrors.length > 0 ? "Please correct the errors above and click 'Run Analysis'." : (allAttributes.size === 0 ? "Please define a schema with attributes and click 'Run Analysis'." : "Click 'Run Analysis' to see F⁺ for the current inputs.")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="minimalCover">
          {schema && fds.length >=0 && inputErrors.length === 0 && allAttributes.size > 0 ? ( 
            <MinimalCoverDisplay schema={schema} fds={fds} allAttributes={allAttributes} />
          ) : (
             <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                {inputErrors.length > 0 ? "Please correct the errors above and click 'Run Analysis'." : (allAttributes.size === 0 ? "Please define a schema with attributes and click 'Run Analysis'." : "Click 'Run Analysis' to see the minimal cover for the current inputs.")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="normalForms">
           {schema && fds.length >= 0 && mvds.length >= 0 && inputErrors.length === 0 && allAttributes.size > 0 ? ( 
            <NormalFormsDisplay schema={schema} fds={fds} mvds={mvds} parsedJd={parsedJd} allAttributes={allAttributes} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  {inputErrors.length > 0 ? "Please correct the errors above and click 'Run Analysis'." : (allAttributes.size === 0 ? "Please define a schema with attributes and click 'Run Analysis'." : "Click 'Run Analysis' for normal form analysis of the current inputs.")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="aiNormalizer">
          <AiNormalizer initialSchema={schemaInputString} initialFds={depInputString} />
        </TabsContent>
        
        <TabsContent value="aiTranslator">
          <NaturalLanguageQuery />
        </TabsContent>

        <TabsContent value="aiExplainer">
          <FdExplanation initialSchema={schemaInputString} initialFds={depInputString} />
        </TabsContent>

        <TabsContent value="interactiveTable">
          <InteractiveTableDisplay 
            title={tableTitle}
            data={tableData}
            caption={captionText}
            fds={inputErrors.length === 0 ? fds : []}
            allAttributes={allAttributes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

