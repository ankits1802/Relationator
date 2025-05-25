
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  Play,
  Download,
  History,
  TableIcon,
  CalendarDays,
  Pencil,
  LayoutGrid,
  Upload,
  Check,
  X,
  PlusCircle,
  Trash2,
  AlertCircle,
  Loader2, 
  Lightbulb, 
  Wand2,     
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { raToSql, type RaToSqlOutput } from '@/ai/flows/ra-to-sql-flow';
import { explainRaQuery, type RaExplanationOutput } from '@/ai/flows/ra-explanation-flow';


interface ToolbarItem {
  symbol?: string;
  label: string;
  icon?: React.ElementType;
  example?: string;
  description?: string;
  buttonVariant?: ButtonProps['variant'];
}

const raToolbarNewRow1: ToolbarItem[] = [
  { symbol: "Π", label: "Projection (Π)", example: "Π_{Attr1,Attr2}(Relation)", buttonVariant: "ghost" },
  { symbol: "σ", label: "Selection (σ)", example: "σ_{Attr1='val'}(Relation)", buttonVariant: "ghost" },
  { symbol: "ρ", label: "Rename Operator (ρ)", example: "ρ_{NewRel(A1,A2)}(OldRelation) OR ρ_{NewAttr/OldAttr}(Relation)", buttonVariant: "ghost" },
  { symbol: "←", label: "Assignment (←)", example: "NewRelation ← Π_{...}", buttonVariant: "ghost" },
  { symbol: "→", label: "Functional Dependency (→)", example: "A,B → C (A, B determine C)", buttonVariant: "ghost" },
  { symbol: "τ", label: "Sorting / Order-By (τ)", example: "τ_{Attr1 ASC}(Relation)", buttonVariant: "ghost" },
  { symbol: "γ", label: "Aggregation / Group-By (γ)", example: "γ_{GroupAttr; AggFunc(Attr)}(Relation)", buttonVariant: "ghost" },
  { symbol: "∧", label: "Logical AND (∧)", example: "Cond1 ∧ Cond2", buttonVariant: "ghost" },
  { symbol: "∨", label: "Logical OR (∨)", example: "Cond1 ∨ Cond2", buttonVariant: "ghost" },
  { symbol: "¬", label: "Logical NOT (¬)", example: "¬(Cond1)", buttonVariant: "ghost" },
  { symbol: "=", label: "Equals (=)", example: "Attr1 = Attr2 or Attr1 = 'value'", buttonVariant: "ghost" },
  { symbol: "≠", label: "Not Equals (≠)", example: "Attr1 ≠ Attr2", buttonVariant: "ghost" },
  { symbol: "≥", label: "Greater Than or Equal (≥)", example: "Attr1 ≥ 10", buttonVariant: "ghost" },
  { symbol: "≤", label: "Less Than or Equal (≤)", example: "Attr1 ≤ 10", buttonVariant: "ghost" },
  { symbol: "∩", label: "Intersection (∩)", example: "Relation1 ∩ Relation2", buttonVariant: "ghost" },
  { symbol: "∪", label: "Union (∪)", example: "Relation1 ∪ Relation2", buttonVariant: "ghost" },
  { symbol: "÷", label: "Division (÷)", example: "Relation1 ÷ Relation2", buttonVariant: "ghost" },
];

const raToolbarNewRow2: ToolbarItem[] = [
  { symbol: "−", label: "Set Difference (−)", example: "Relation1 − Relation2", buttonVariant: "ghost" },
  { symbol: "×", label: "Cartesian Product (×)", example: "Relation1 × Relation2", buttonVariant: "ghost" },
  { symbol: "⋈", label: "Natural Join (⋈)", example: "Relation1 ⋈ Relation2", buttonVariant: "ghost" },
  { symbol: "⋉", label: "Left Semijoin (⋉)", example: "Relation1 ⋉ Relation2", buttonVariant: "ghost" },
  { symbol: "⋊", label: "Right Semijoin (⋊)", example: "Relation1 ⋊ Relation2", buttonVariant: "ghost" },
  { symbol: "⟕", label: "Left Outer Join (⟕)", example: "Relation1 ⟕_{Cond} Relation2", buttonVariant: "ghost" },
  { symbol: "⟖", label: "Right Outer Join (⟖)", example: "Relation1 ⟖_{Cond} Relation2", buttonVariant: "ghost" },
  { symbol: "⟗", label: "Full Outer Join (⟗)", example: "Relation1 ⟗_{Cond} Relation2", buttonVariant: "ghost" },
  { symbol: "▷", label: "Antijoin (▷)", example: "Relation1 ▷ Relation2", buttonVariant: "ghost" },
  { symbol: "{}", label: "Relation Constant / Tuple Definition ({})", example: "{{(colA: val1, colB: val2), (colA: val3, colB: val4)}}", buttonVariant: "ghost" },
  { symbol: "*", label: "Wildcard (*)", example: "Π_{*}(Relation) or σ_{*}(...)", buttonVariant: "ghost" },
  { symbol: "--", label: "Line Comment (--)", example: "-- This is a comment", buttonVariant: "ghost" },
  { symbol: "/* */", label: "Comment Block (/* */)", example: "/* Multi-line \\n comment */", buttonVariant: "ghost" },
  { icon: TableIcon, label: "Input Table", example: "RELATION_NAME(Attr1, Attr2)", symbol: "RELATION_NAME(Attr1, Attr2)", buttonVariant: "ghost" },
  { icon: CalendarDays, label: "Date/Time Function", example: "σ_{date_attr > CURRENT_DATE()}(Rel)", symbol: "CURRENT_DATE()", buttonVariant: "ghost" },
  { icon: Pencil, label: "operator replacement", description: "automatically replace operators", symbol: "/* AUTO_OP_REPLACE */", buttonVariant: "ghost" },
];
const raToolbarSymbolGroups = [raToolbarNewRow1, raToolbarNewRow2];


const trcSymbolsToolbar: ToolbarItem[] = [
  { symbol: "{}", label: "Braces ({})", example: "{ t | Relation(t) }", buttonVariant: "ghost" },
  { symbol: "∈", label: "Element Of (∈)", example: "t ∈ Relation", buttonVariant: "ghost" },
  { symbol: "←", label: "Defines (←)", example: "Can be used for variable assignment if syntax supports", buttonVariant: "ghost" },
  { symbol: "→", label: "Implies (→)", example: "P → Q (If P then Q)", buttonVariant: "ghost" },
  { symbol: "∧", label: "AND (∧)", example: "P ∧ Q", buttonVariant: "ghost" },
  { symbol: "∨", label: "OR (∨)", example: "P ∨ Q", buttonVariant: "ghost" },
  { symbol: "¬", label: "NOT (¬)", example: "¬P", buttonVariant: "ghost" },
  { symbol: "⇒", label: "Implies (⇒)", example: "P ⇒ Q", buttonVariant: "ghost" },
  { symbol: "⇔", label: "If and only if (⇔)", example: "P ⇔ Q", buttonVariant: "ghost" },
  { symbol: "=", label: "Equals (=)", example: "t.Attr = 'value'", buttonVariant: "ghost" },
  { symbol: "≠", label: "Not Equals (≠)", example: "t.Attr ≠ 'value'", buttonVariant: "ghost" },
  { symbol: "<", label: "Less Than (<)", example: "t.Attr < 10", buttonVariant: "ghost" },
  { symbol: ">", label: "Greater Than (>)", example: "t.Attr > 10", buttonVariant: "ghost" },
  { symbol: "≤", label: "Less Than or Equal (≤)", example: "t.Attr ≤ 10", buttonVariant: "ghost" },
  { symbol: "≥", label: "Greater Than or Equal (≥)", example: "t.Attr ≥ 10", buttonVariant: "ghost" },
  { symbol: "∃", label: "Exists (∃)", example: "∃t (Relation(t) ∧ t.Attr = 'val')", buttonVariant: "ghost" },
  { symbol: "∀", label: "For All (∀)", example: "∀t (Relation(t) → t.Attr > 0)", buttonVariant: "ghost" },
  { symbol: "−", label: "Set Difference (−)", example: "Not typically used directly in TRC predicates", buttonVariant: "ghost" },
  { symbol: "/* */", label: "Comment Block (/* */)", example: "/* Comment */", buttonVariant: "ghost" },
  { icon: CalendarDays, label: "Date/Time Function", example: "t.date_attr > CURRENT_DATE()", symbol: "CURRENT_DATE()", buttonVariant: "ghost" },
];
const trcToolbarSymbolGroup = [trcSymbolsToolbar];

type DialogAttribute = {
  id: string;
  name: string;
  type: string;
};

const attributeTypes = ["string", "number", "integer", "boolean", "date"];

type Attribute = { name: string; type: string };
type Schema = { name: string; attributes: Attribute[] };
type Database = { id: string; name: string; schemas: Schema[] };
type QueryHistoryEntry = { query: string; timestamp: Date; type: 'RA' | 'MSA' | 'TRC' };


const sampleDatabases: Database[] = [
    {
    id: 'university_db',
    name: 'University DB',
    schemas: [
      {
        name: "Student",
        attributes: [
          { name: "StudentID", type: "integer" },
          { name: "FirstName", type: "string" },
          { name: "LastName", type: "string" },
          { name: "Major", type: "string" },
        ],
      },
      {
        name: "Course",
        attributes: [
          { name: "CourseID", type: "string" },
          { name: "CourseName", type: "string" },
          { name: "Credits", type: "integer" },
        ],
      },
      {
        name: "Enrollment",
        attributes: [
          { name: "StudentID", type: "integer" },
          { name: "CourseID", type: "string" },
          { name: "Grade", type: "string" },
        ],
      },
    ],
  },
  {
    id: 'company_db',
    name: 'Company DB',
    schemas: [
        {
            name: "Employee",
            attributes: [
                { name: "EmpID", type: "integer" },
                { name: "EmpName", type: "string" },
                { name: "DeptID", type: "integer" },
                { name: "Salary", type: "number" },
            ],
        },
        {
            name: "Department",
            attributes: [
                { name: "DeptID", type: "integer" },
                { name: "DeptName", type: "string" },
                { name: "Location", type: "string" },
            ],
        },
        {
            name: "Project",
            attributes: [
                { name: "ProjectID", type: "string" },
                { name: "ProjectName", type: "string" },
                { name: "LeadEmpID", type: "integer" },
            ],
        }
    ]
  },
  {
    id: 'ecommerce_db',
    name: 'E-commerce DB',
    schemas: [
      {
        name: "Product",
        attributes: [
          { name: "ProductID", type: "integer" },
          { name: "ProductName", type: "string" },
          { name: "Category", type: "string" },
          { name: "Price", type: "number" },
          { name: "StockQuantity", type: "integer" },
        ],
      },
      {
        name: "Customer",
        attributes: [
          { name: "CustomerID", type: "integer" },
          { name: "FirstName", type: "string" },
          { name: "LastName", type: "string" },
          { name: "Email", type: "string" },
          { name: "Address", type: "string" },
        ],
      },
      {
        name: "Order",
        attributes: [
          { name: "OrderID", type: "integer" },
          { name: "CustomerID", type: "integer" },
          { name: "OrderDate", type: "date" },
          { name: "TotalAmount", type: "number" },
        ],
      },
      {
        name: "OrderItem",
        attributes: [
          { name: "OrderItemID", type: "integer" },
          { name: "OrderID", type: "integer" },
          { name: "ProductID", type: "integer" },
          { name: "Quantity", type: "integer" },
          { name: "UnitPrice", type: "number" },
        ],
      },
    ],
  },
  {
    id: 'library_db',
    name: 'Library DB',
    schemas: [
      {
        name: "Book",
        attributes: [
          { name: "BookID", type: "integer" },
          { name: "Title", type: "string" },
          { name: "Author", type: "string" },
          { name: "ISBN", type: "string" },
          { name: "PublishedYear", type: "integer" },
          { name: "Genre", type: "string" },
        ],
      },
      {
        name: "Member",
        attributes: [
          { name: "MemberID", type: "integer" },
          { name: "FirstName", type: "string" },
          { name: "LastName", type: "string" },
          { name: "JoinDate", type: "date" },
          { name: "Email", type: "string" },
        ],
      },
      {
        name: "Loan",
        attributes: [
          { name: "LoanID", type: "integer" },
          { name: "BookID", type: "integer" },
          { name: "MemberID", type: "integer" },
          { name: "LoanDate", type: "date" },
          { name: "DueDate", type: "date" },
          { name: "ReturnDate", type: "date" },
        ],
      },
    ],
  },
];

const raMsAllowedPattern = /^[a-zA-Z0-9_Πσρ←→τγ∧∨¬=≠≥≤<>∩∪÷−×⋈⋉⋊⟕⟖⟗▷{}()*'",.:;\s\-\/\\]+$/u;
const trcAllowedPattern = /^[a-zA-Z0-9_∈←→∧∨¬⇒⇔=≠≥≤<>{}().,:'"\s\-\/\\]+$/u; 


const validateQuerySyntax = (query: string, pattern: RegExp, queryTypeName: string): string | null => {
  if (!query.trim()) return null; 
  const disallowedChars = query.split('').filter(char => !pattern.test(char) && char.trim() !== '');

  if (disallowedChars.length > 0) {
    if (!pattern.test(query)) {
        const uniqueDisallowed = Array.from(new Set(disallowedChars));
        return `Query for ${queryTypeName} contains invalid characters: ${uniqueDisallowed.slice(0, 5).join(', ')}${uniqueDisallowed.length > 5 ? '...' : ''}. Please use only valid symbols and identifiers.`;
    }
  }
  return null;
};


export default function RelationalAlgebraPage() {
  const [raQuery, setRaQuery] = useState<string>("Π_{CourseName, Credits} (σ_{Major='CS'} (Student ⋈ Enrollment ⋈ Course))");
  const queryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [raValidationError, setRaValidationError] = useState<string | null>(null);
  const [raIsLoading, setRaIsLoading] = useState(false);
  const [raTranslationResult, setRaTranslationResult] = useState<RaToSqlOutput | null>(null);
  const [raExplainIsLoading, setRaExplainIsLoading] = useState(false);
  const [raExplanationResult, setRaExplanationResult] = useState<RaExplanationOutput | null>(null);


  const [multisetQuery, setMultisetQuery] = useState<string>("Π_{Major} (Student) ∪ ALL Π_{Major} (Student)");
  const multisetQueryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [msValidationError, setMsValidationError] = useState<string | null>(null);

  const [trcQuery, setTrcQuery] = useState<string>("{ t | Student(s) ∧ s.Major = 'CS' ∧ Enrollment(e) ∧ e.StudentID = s.StudentID ∧ Course(c) ∧ c.CourseID = e.CourseID ∧ t.sname = s.FirstName ∧ t.cname = c.CourseName }");
  const trcQueryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [trcValidationError, setTrcValidationError] = useState<string | null>(null);

  const [groupEditorQuery, setGroupEditorQuery] = useState<string>("Group Editor Query Placeholder");
  const groupEditorQueryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [groupEditorUserRelations, setGroupEditorUserRelations] = useState<Schema[]>([]);


  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false);
  const [dialogRelationName, setDialogRelationName] = useState("");
  const [dialogAttributes, setDialogAttributes] = useState<DialogAttribute[]>([
    { id: Date.now().toString(), name: "", type: "string" },
  ]);

  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>(sampleDatabases[0].id);

  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const currentSelectedDatabase = useMemo(() => {
    return sampleDatabases.find(db => db.id === selectedDatabaseId) || sampleDatabases[0];
  }, [selectedDatabaseId]);

  const currentSchemas = useMemo(() => {
    return currentSelectedDatabase.schemas;
  }, [currentSelectedDatabase]);


  const handleDialogAttributeChange = (id: string, field: 'name' | 'type', value: string) => {
    setDialogAttributes(prevAttrs =>
      prevAttrs.map(attr => (attr.id === id ? { ...attr, [field]: value } : attr))
    );
  };

  const handleAddDialogAttribute = () => {
    setDialogAttributes(prevAttrs => [
      ...prevAttrs,
      { id: Date.now().toString(), name: "", type: "string" },
    ]);
  };

  const handleRemoveDialogAttribute = (id: string) => {
     setDialogAttributes(prevAttrs => {
        if (prevAttrs.length === 1 && prevAttrs[0].id === id) {
             if(prevAttrs[0].name === "" && prevAttrs[0].type === "string") return prevAttrs; 
        }
        const filtered = prevAttrs.filter(attr => attr.id !== id);
        return filtered.length === 0 ? [{ id: Date.now().toString(), name: "", type: "string" }] : filtered;
    });
  };

  const resetDialogState = () => {
    setDialogRelationName("");
    setDialogAttributes([{ id: Date.now().toString(), name: "", type: "string" }]);
  };

  const handleDialogOnOpenChange = (open: boolean) => {
    setIsRelationDialogOpen(open);
    if (open) {
      resetDialogState();
    }
  };

  const handleDialogOk = () => {
    console.log("Relation Editor: OK clicked. Relation Name:", dialogRelationName, "Attributes:", dialogAttributes);
    if (dialogRelationName.trim() && dialogAttributes.some(attr => attr.name.trim())) {
      const newSchema: Schema = {
        name: dialogRelationName.trim(),
        attributes: dialogAttributes
          .filter(attr => attr.name.trim())
          .map(attr => ({ name: attr.name.trim(), type: attr.type })),
      };
      setGroupEditorUserRelations(prev => [...prev, newSchema]);
      resetDialogState();
      setIsRelationDialogOpen(false);
    } else {
      console.warn("Relation name and at least one attribute name are required.");
    }
  };
  
  const handleDownloadFileContent = (content: string, filename: string, contentType: string = 'text/plain;charset=utf-8') => {
    if (!content.trim()) {
      console.log("Content is empty, nothing to download for:", filename);
      return;
    }
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Attempted to download ${filename}`);
  };

  const handleUploadCSV = () => {
    console.log("Upload CSV button clicked (Dialog)");
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log("CSV File selected:", file.name, "Type:", file.type, "Size:", file.size, "bytes");
      }
    };
    input.click();
  };

  const handleDownloadCSVTemplate = () => {
     console.log("Download CSV Template button clicked (Dialog)");
    if (dialogAttributes.length === 0 || dialogAttributes.every(attr => !attr.name.trim())) {
        console.log("No attributes defined in dialog to create CSV template.");
        return;
    }
    const headers = dialogAttributes.map(attr => attr.name.trim()).filter(Boolean).join(',');
    const filename = dialogRelationName.trim() ? `${dialogRelationName.trim()}_template.csv` : 'relation_template.csv';
    handleDownloadFileContent(headers, filename, 'text/csv;charset=utf-8');
  };


  const addQueryToHistory = (query: string, type: 'RA' | 'MSA' | 'TRC') => {
    const newEntry = { query, timestamp: new Date(), type };
    setQueryHistory(prev => [newEntry, ...prev.slice(0, 19)]); 
  };

  const handleHistoryItemClick = (item: QueryHistoryEntry) => {
    switch (item.type) {
      case 'RA':
        setRaQuery(item.query);
        break;
      case 'MSA':
        setMultisetQuery(item.query);
        break;
      case 'TRC':
        setTrcQuery(item.query);
        break;
    }
    setIsHistoryDialogOpen(false);
  };


  const handleSymbolClick = (symbolToInsertArg: string, targetRef?: React.RefObject<HTMLTextAreaElement>, targetSetter?: React.Dispatch<React.SetStateAction<string>>) => {
    const textarea = targetRef?.current;
    const setter = targetSetter;
    const symbolToInsert = symbolToInsertArg || "";

    if (textarea && setter && (symbolToInsert.trim() !== "" || symbolToInsert.length > 0 || symbolToInsert === " ") ) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      const isSingleCharOperator = symbolToInsert.length === 1 && !['{', '}', '(', ')', ',', ';', ':','*','/','\\'].includes(symbolToInsert) && !symbolToInsert.match(/[a-zA-Z0-9]/);
      const isPlaceholderOrComment = symbolToInsert.includes("(") || symbolToInsert.includes("/*") || symbolToInsert.includes("--");
      
      let spacedSymbol = symbolToInsert;
      if (isSingleCharOperator && !isPlaceholderOrComment) {
          spacedSymbol = ` ${symbolToInsert} `;
      } else if (!isPlaceholderOrComment && symbolToInsert.length > 0 && symbolToInsert.trim().length > 0 && !symbolToInsert.startsWith("/*") && !symbolToInsert.startsWith("--")) {
          const beforeChar = text.substring(start - 1, start);
          const afterChar = text.substring(end, end + 1);
          if (start > 0 && beforeChar !== ' ' && beforeChar !== '\n' && beforeChar !== '(' && beforeChar !== '{' && beforeChar !== '_') {
              spacedSymbol = ' ' + spacedSymbol;
          }
          if (end < text.length && afterChar !== ' ' && afterChar !== '\n' && afterChar !== ')' && afterChar !== '}' && afterChar !== ',' && afterChar !== ';') {
              spacedSymbol = spacedSymbol + ' ';
          }
      }

      const newText = text.substring(0, start) + spacedSymbol + text.substring(end);
      setter(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + spacedSymbol.length, start + spacedSymbol.length);
      }, 0);
    }
  };

  const renderToolbar = (
    symbolGroups: ToolbarItem[][],
    targetRef: React.RefObject<HTMLTextAreaElement>,
    targetSetter: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="border-b pb-2 mb-2">
      {symbolGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={`flex flex-wrap gap-1 ${groupIndex < symbolGroups.length - 1 ? 'mb-1' : ''}`}>
          {group.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Button
                  variant={item.buttonVariant || 'ghost'}
                  size="sm"
                  onClick={() => handleSymbolClick(item.symbol ?? (item.icon ? item.symbol || item.label : ''), targetRef, targetSetter)}
                  className={cn(!item.icon && 'text-base')}
                  aria-label={item.label}
                >
                  {item.icon ? <item.icon className="h-4 w-4" /> : item.symbol}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{item.label}</p>
                {item.example && <p className="text-xs text-muted-foreground">Example: {item.example}</p>}
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );

  const clearResultsAndErrors = () => {
    setRaTranslationResult(null);
    setRaExplanationResult(null);
    setRaValidationError(null);
    setMsValidationError(null);
    setTrcValidationError(null);
    setRaIsLoading(false);
    setRaExplainIsLoading(false);
  };

  const handleExecuteRA = async () => {
    const error = validateQuerySyntax(raQuery, raMsAllowedPattern, "Relational Algebra");
    setRaValidationError(error);
    setRaTranslationResult(null); 

    if (!error && raQuery.trim()) {
      setRaIsLoading(true);
      let schemaString = "No schema selected or schema is empty.";
      if (currentSelectedDatabase && currentSelectedDatabase.schemas.length > 0) {
        schemaString = currentSelectedDatabase.schemas
          .map(s => `${s.name}(${s.attributes.map(a => `${a.name}:${a.type}`).join(', ')})`)
          .join('; ');
      }
      try {
        const result = await raToSql({ raQuery, databaseSchema: schemaString });
        setRaTranslationResult(result);
        addQueryToHistory(raQuery, 'RA');
      } catch (e) {
        console.error("Error translating RA to SQL:", e);
        setRaTranslationResult({
          sqlQuery: '',
          error: e instanceof Error ? e.message : "An unexpected error occurred during SQL translation."
        });
      } finally {
        setRaIsLoading(false);
      }
    } else if (!raQuery.trim()){
      setRaValidationError("Query cannot be empty.");
    }
  };

  const handleExplainRAQuery = async () => {
    const error = validateQuerySyntax(raQuery, raMsAllowedPattern, "Relational Algebra");
    setRaValidationError(error); 
    setRaExplanationResult(null);

    if (!error && raQuery.trim()) {
      setRaExplainIsLoading(true);
      let schemaString = "No schema selected or schema is empty.";
      if (currentSelectedDatabase && currentSelectedDatabase.schemas.length > 0) {
        schemaString = currentSelectedDatabase.schemas
          .map(s => `${s.name}(${s.attributes.map(a => `${a.name}:${a.type}`).join(', ')})`)
          .join('; ');
      }

      try {
        const result = await explainRaQuery({ raQuery, databaseSchema: schemaString });
        setRaExplanationResult(result);
      } catch (e) {
        console.error("Error explaining RA query:", e);
        setRaExplanationResult({
          explanation: '',
          error: e instanceof Error ? e.message : "An unexpected error occurred while explaining the query."
        });
      } finally {
        setRaExplainIsLoading(false);
      }
    } else if (!raQuery.trim()){
        setRaValidationError("Query cannot be empty to explain.");
    }
  };


  const handleExecuteMS = () => {
    const error = validateQuerySyntax(multisetQuery, raMsAllowedPattern, "Multiset Algebra");
    setMsValidationError(error);
    if (!error && multisetQuery.trim()) {
      console.log("Execute Multiset Query:", multisetQuery);
      addQueryToHistory(multisetQuery, 'MSA');
    } else if (!multisetQuery.trim()){
      setMsValidationError("Query cannot be empty.");
    }
  };

  const handleExecuteTRC = () => {
    const error = validateQuerySyntax(trcQuery, trcAllowedPattern, "TRC");
    setTrcValidationError(error);
    if (!error && trcQuery.trim()) {
      console.log("Execute TRC Query:", trcQuery);
       addQueryToHistory(trcQuery, 'TRC');
    } else if (!trcQuery.trim()){
      setTrcValidationError("Query cannot be empty.");
    }
  };


  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="w-full md:w-1/4 space-y-4 p-4 border rounded-lg shadow-sm bg-card overflow-y-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {currentSelectedDatabase.name} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Available Databases</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sampleDatabases.map(db => (
              <DropdownMenuItem key={db.id} onSelect={() => setSelectedDatabaseId(db.id)}>
                {db.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => console.log("Create New Database clicked (placeholder)")}>
               <PlusCircle className="mr-2 h-4 w-4" /> Create New Database...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="space-y-3 overflow-y-auto">
          {currentSchemas.map((schema) => (
            <div key={schema.name}>
              <h3 className="font-semibold text-lg text-primary">{schema.name}</h3>
              <ul className="ml-2 text-sm text-muted-foreground">
                {schema.attributes.map((attr) => (
                  <li key={attr.name} className="flex justify-between">
                    <span>{attr.name}</span>
                    <span className="text-xs italic">{attr.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-3/4 flex flex-col border rounded-lg shadow-sm bg-card p-2">
        <Tabs defaultValue="relational-algebra" className="flex-grow flex flex-col" onValueChange={clearResultsAndErrors}>
          <TabsList className="grid w-full grid-cols-4 gap-1">
            <TabsTrigger value="relational-algebra">Relational Algebra</TabsTrigger>
            <TabsTrigger value="multiset-algebra">Multiset Algebra</TabsTrigger>
            <TabsTrigger value="trc">TRC</TabsTrigger>
            <TabsTrigger value="group-editor">Group Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="relational-algebra" className="flex-grow flex flex-col px-4 pb-4 space-y-2">
            {renderToolbar(raToolbarSymbolGroups, queryTextareaRef, setRaQuery)}
            <Textarea
              ref={queryTextareaRef}
              value={raQuery}
              onChange={(e) => setRaQuery(e.target.value)}
              className="flex-grow text-sm font-mono h-full min-h-[200px] resize-none"
              placeholder="Π_{CourseName} (σ_{Major='CS'} (Student))"
            />
            {raValidationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{raValidationError}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between items-center pt-2 border-t mt-auto">
              <div className="flex gap-2">
                <Button size="lg" onClick={handleExecuteRA} variant="default" disabled={raIsLoading || raExplainIsLoading}>
                  {raIsLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                  Execute Query
                </Button>
                <Button size="lg" onClick={handleExplainRAQuery} variant="default" disabled={raIsLoading || raExplainIsLoading}>
                  {raExplainIsLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lightbulb className="mr-2 h-5 w-5" />}
                  Explain Query
                </Button>
              </div>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadFileContent(raQuery, 'ra_query.txt')}>
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryDialogOpen(true)}>
                  <History className="mr-1 h-4 w-4" /> History
                </Button>
              </div>
            </div>
             {raTranslationResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                     <Wand2 className="h-5 w-5 mr-2 text-primary" />
                    AI-Powered SQL Translation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {raTranslationResult.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Translation Error</AlertTitle>
                      <AlertDescription>{raTranslationResult.error}</AlertDescription>
                    </Alert>
                  )}
                  {raTranslationResult.sqlQuery && (
                    <>
                      <Label htmlFor="ra-sql-output" className="text-sm font-medium">Translated SQL Query:</Label>
                      <ScrollArea className="h-[150px] w-full rounded-md border p-2 mt-1 bg-background">
                        <pre id="ra-sql-output" className="text-sm p-1 whitespace-pre-wrap font-mono">{raTranslationResult.sqlQuery}</pre>
                      </ScrollArea>
                    </>
                  )}
                  {raTranslationResult.explanation && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Note:</strong> {raTranslationResult.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {raExplanationResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                    AI-Powered Query Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {raExplanationResult.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Explanation Error</AlertTitle>
                      <AlertDescription>{raExplanationResult.error}</AlertDescription>
                    </Alert>
                  )}
                  {raExplanationResult.explanation && (
                     <>
                      <Label htmlFor="ra-explanation-output" className="text-sm font-medium">Query Explanation:</Label>
                      <ScrollArea className="h-[150px] w-full rounded-md border p-2 mt-1 bg-background">
                        <div
                            id="ra-explanation-output"
                            className="text-sm p-1"
                            dangerouslySetInnerHTML={{ __html: raExplanationResult.explanation }}
                        />
                      </ScrollArea>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="multiset-algebra" className="flex-grow flex flex-col px-4 pb-4 space-y-2">
            {renderToolbar(raToolbarSymbolGroups, multisetQueryTextareaRef, setMultisetQuery)}
            <Textarea
              ref={multisetQueryTextareaRef}
              value={multisetQuery}
              onChange={(e) => setMultisetQuery(e.target.value)}
              className="flex-grow text-sm font-mono h-full min-h-[200px] resize-none"
              placeholder="Π_{Major} (Student) ∪ ALL Π_{Major} (Student)"
            />
            {msValidationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{msValidationError}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between items-center pt-2 border-t mt-auto">
              <Button size="lg" onClick={handleExecuteMS} variant="default">
                <Play className="mr-2 h-5 w-5" /> Execute Query
              </Button>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadFileContent(multisetQuery, 'multiset_query.txt')}>
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryDialogOpen(true)}>
                  <History className="mr-1 h-4 w-4" /> History
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trc" className="flex-grow flex flex-col px-4 pb-4 space-y-2">
            {renderToolbar(trcToolbarSymbolGroup, trcQueryTextareaRef, setTrcQuery)}
            <Textarea
              ref={trcQueryTextareaRef}
              value={trcQuery}
              onChange={(e) => setTrcQuery(e.target.value)}
              className="flex-grow text-sm font-mono h-full min-h-[200px] resize-none"
              placeholder="{ t | Student(s) ∧ s.Major = 'CS' }"
            />
            {trcValidationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{trcValidationError}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between items-center pt-2 border-t mt-auto">
              <Button size="lg" onClick={handleExecuteTRC} variant="default">
                <Play className="mr-2 h-5 w-5" /> Execute Query
              </Button>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadFileContent(trcQuery, 'trc_query.txt')}>
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryDialogOpen(true)}>
                  <History className="mr-1 h-4 w-4" /> History
                </Button>
              </div>
            </div>
          </TabsContent>

           <TabsContent value="group-editor" className="flex-grow flex flex-col px-4 pt-2 pb-4 space-y-4">
            <Dialog open={isRelationDialogOpen} onOpenChange={handleDialogOnOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" className="self-start">
                  <LayoutGrid className="mr-2 h-4 w-4" /> add new relation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Relation Editor</DialogTitle>
                  <DialogDescription>
                    Define the name and attributes for your new relation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="relation-name" className="text-right">
                      Relation Name
                    </Label>
                    <Input
                      id="relation-name"
                      placeholder="Enter relation name"
                      className="col-span-3"
                      value={dialogRelationName}
                      onChange={(e) => setDialogRelationName(e.target.value)}
                    />
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium mb-2 text-sm">Attributes</h4>
                    <div className="border rounded-md p-2 space-y-2 max-h-60 overflow-y-auto">
                      {dialogAttributes.map((attr, index) => (
                        <div key={attr.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 p-2 border-b last:border-b-0">
                          <Input
                            placeholder={`Attribute ${index + 1} Name`}
                            value={attr.name}
                            onChange={(e) => handleDialogAttributeChange(attr.id, 'name', e.target.value)}
                            className="text-sm"
                          />
                          <Select
                            value={attr.type}
                            onValueChange={(value) => handleDialogAttributeChange(attr.id, 'type', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {attributeTypes.map(type => (
                                <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDialogAttribute(attr.id)}
                            disabled={dialogAttributes.length <= 1 && attr.name === "" && attr.type === "string"}
                            className="text-destructive hover:bg-destructive/10"
                            aria-label="Remove attribute"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                       {dialogAttributes.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No attributes defined. Click "Add Attribute" to start.</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddDialogAttribute}
                      className="mt-2"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Attribute
                    </Button>
                  </div>
                </div>
                <DialogFooter className="justify-between sm:justify-between pt-4 border-t">
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleDownloadCSVTemplate}><Download className="mr-2 h-4 w-4" />Download CSV</Button>
                     <Button variant="outline" size="sm" onClick={handleUploadCSV}><Upload className="mr-2 h-4 w-4" />Upload CSV</Button>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => setIsRelationDialogOpen(false)}>
                        <X className="mr-2 h-4 w-4" />Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleDialogOk}>
                        <Check className="mr-2 h-4 w-4" />Ok
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

             {groupEditorUserRelations.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Defined Relations:</h3>
                {groupEditorUserRelations.map((schema, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-md">{schema.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm">
                        {schema.attributes.map((attr, attrIdx) => (
                          <li key={attrIdx}>{attr.name}: <span className="text-xs italic text-muted-foreground">{attr.type}</span></li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}


            <Textarea
              ref={groupEditorQueryTextareaRef}
              value={groupEditorQuery}
              onChange={(e) => setGroupEditorQuery(e.target.value)}
              className="flex-grow text-sm font-mono h-full min-h-[200px] resize-none border rounded-md"
              placeholder="Group Editor Query Placeholder..."
            />
            <div className="flex justify-between items-center pt-4 border-t mt-auto">
              <Button size="lg" variant="default" onClick={() => console.log("Preview Group Editor clicked")}>
                <Play className="mr-2 h-5 w-5" /> Preview
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadFileContent(groupEditorQuery, 'group_editor_query.txt')}>
                <Download className="mr-1 h-4 w-4" /> Download
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Query History</DialogTitle>
              <DialogDescription>
                Recently executed queries. Click an item to load it into the respective editor.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {queryHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No query history yet.</p>
              ) : (
                <div className="space-y-2">
                  {queryHistory.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()} [{item.type}]
                        </div>
                        <div className="text-sm font-mono truncate max-w-full">
                          {item.query}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">
                  <X className="mr-2 h-4 w-4" /> Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
