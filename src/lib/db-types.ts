
export type ParsedFD = {
  lhs: string[];
  rhs: string[];
  original: string; // To display back to user
};

export type ParsedMVD = {
  lhs: string[];
  rhs: string[];
  original: string; // To display back to user
};

export type ParsedJD = {
  components: Set<string>[]; // Each Set<string> is a component like R1, R2
  original: string;
}

export type RelationSchema = {
  name: string;
  attributes: Set<string>;
};

export type ParsedSchema = {
  relations: Record<string, Set<string>>; // RelationName -> Set<Attributes>
  allAttributes: Set<string>;
};

export type KeyAnalysis = {
  candidateKeys: Set<string>[];
  primeAttributes: Set<string>;
};

export type NormalFormViolation = {
  fd?: ParsedFD;
  mvd?: ParsedMVD;
  jd?: ParsedJD;
  reason: string;
};

export type NormalFormAnalysisResult = {
  name: string;
  isSatisfied: boolean;
  violations: NormalFormViolation[]; // List of FDs/MVDs/JDs violating this normal form
  explanation?: string; // General explanation or reason for status
  id: string; // for accordion key
};

export type FdPlusItem = {
  lhs: Set<string>;
  rhs: Set<string>;
  isTrivial: boolean;
  violatesBCNF: boolean;
  violates3NF: boolean;
  violates2NF: boolean;
};

