
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, FilePenLine, CheckCircle, XCircle, Play } from 'lucide-react';

const MAX_TRANSACTIONS = 10;
const MAX_VARIABLES = 10;

const generateVariableNames = (count: number): string[] => {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push(String.fromCharCode(65 + i)); // A, B, C, ...
  }
  return names;
};

export default function TransactionAnalyzer() {
  const [numTransactions, setNumTransactions] = useState<number>(2);
  const [numVariables, setNumVariables] = useState<number>(1);
  const [scheduleInput, setScheduleInput] = useState<string>("R1(X); W1(X); R2(X); W2(X); C1; C2");

  const [toolboxSelectedT, setToolboxSelectedT] = useState<string>("T1");
  const [toolboxSelectedVar, setToolboxSelectedVar] = useState<string>("A"); // Default to 'A' or first variable

  const [transactionOptions, setTransactionOptions] = useState<string[]>([]);
  const [variableOptions, setVariableOptions] = useState<string[]>([]);

  useEffect(() => {
    const tOptions = Array.from({ length: numTransactions }, (_, i) => `T${i + 1}`);
    setTransactionOptions(tOptions);
    if (!tOptions.includes(toolboxSelectedT)) {
      setToolboxSelectedT(tOptions[0] || "T1");
    }
  }, [numTransactions, toolboxSelectedT]);

  useEffect(() => {
    const vOptions = generateVariableNames(numVariables);
    setVariableOptions(vOptions);
     // If current selected var is not in new options (e.g. reduced numVariables), or if it's 'A' and 'A' is still valid.
    if (!vOptions.includes(toolboxSelectedVar) || vOptions[0]) {
      setToolboxSelectedVar(vOptions[0] || "A");
    }
  }, [numVariables, toolboxSelectedVar]);


  const handleAddOperation = (operationType: 'R' | 'W' | 'C' | 'A') => {
    let operationString = "";
    const currentTransaction = toolboxSelectedT.substring(1); // Get number from T1, T2 etc.

    switch (operationType) {
      case 'R':
        operationString = `R${currentTransaction}(${toolboxSelectedVar})`;
        break;
      case 'W':
        operationString = `W${currentTransaction}(${toolboxSelectedVar})`;
        break;
      case 'C':
        operationString = `C${currentTransaction}`;
        break;
      case 'A':
        operationString = `A${currentTransaction}`;
        break;
    }

    setScheduleInput((prev) => {
      if (prev.trim() === "") return operationString;
      if (prev.endsWith(";") || prev.endsWith("; ")) return `${prev}${operationString}`;
      return `${prev}; ${operationString}`;
    });
  };

  const handleRunAnalyzer = () => {
    // Placeholder for actual analysis logic
    console.log("Running analyzer with schedule:", scheduleInput);
    // You would typically call an API or a local processing function here
  };

  const transactionNumberArray = Array.from({ length: MAX_TRANSACTIONS }, (_, i) => i + 1);
  const variableNumberArray = Array.from({ length: MAX_VARIABLES }, (_, i) => i + 1);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Transaction Input</CardTitle>
        <CardDescription>
          Define your transaction schedule. Use R1(A), W2(B), C1, A2 format. Then click "Run Analyzer".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transactions-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transactions (1-{MAX_TRANSACTIONS})
            </label>
            <Select
              value={String(numTransactions)}
              onValueChange={(val) => setNumTransactions(Number(val))}
            >
              <SelectTrigger id="transactions-select">
                <SelectValue placeholder="Select number of transactions" />
              </SelectTrigger>
              <SelectContent>
                {transactionNumberArray.map(num => (
                  <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="variables-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variables (1-{MAX_VARIABLES})
            </label>
            <Select
              value={String(numVariables)}
              onValueChange={(val) => setNumVariables(Number(val))}
            >
              <SelectTrigger id="variables-select">
                <SelectValue placeholder="Select number of variables" />
              </SelectTrigger>
              <SelectContent>
                {variableNumberArray.map(num => (
                  <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="schedule-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Schedule
          </label>
          <Textarea
            id="schedule-input"
            value={scheduleInput}
            onChange={(e) => setScheduleInput(e.target.value)}
            placeholder="e.g., R1(X); W1(X); R2(X); W2(X); C1; C2"
            rows={4}
            className="text-sm border-input focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate operations with semicolons or spaces. Changes will require re-running the analyzer.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Operation Toolbox</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={toolboxSelectedT} onValueChange={setToolboxSelectedT}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="T" />
              </SelectTrigger>
              <SelectContent>
                {transactionOptions.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={toolboxSelectedVar} onValueChange={setToolboxSelectedVar}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Var" />
              </SelectTrigger>
              <SelectContent>
                {variableOptions.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleAddOperation('R')}><Eye className="mr-2" /> Read</Button>
            <Button variant="outline" onClick={() => handleAddOperation('W')}><FilePenLine className="mr-2" /> Write</Button>
            <Button variant="outline" onClick={() => handleAddOperation('C')}><CheckCircle className="mr-2" /> Commit</Button>
            <Button variant="outline" onClick={() => handleAddOperation('A')}><XCircle className="mr-2" /> Abort</Button>
          </div>
        </div>

        <Button onClick={handleRunAnalyzer} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Play className="mr-2" /> Run Analyzer
        </Button>
      </CardContent>
    </Card>
  );
}

