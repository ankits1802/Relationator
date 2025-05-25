
import type { ParsedSchema, ParsedFD, ParsedMVD, ParsedJD, RelationSchema, KeyAnalysis, NormalFormAnalysisResult, NormalFormViolation, FdPlusItem } from './db-types';

// Helper to remove optional {} around attribute strings
function preprocessAttributeString(attrStr: string): string {
  const trimmed = attrStr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.substring(1, trimmed.length - 1).trim();
  }
  return trimmed;
}

// Parses schema string like "R(A,B,C); S(D,E)" or "A,B,C" or "{A,B,C}"
export function parseSchemaString(schemaStr: string): ParsedSchema {
  const relations: Record<string, Set<string>> = {};
  let allAttributes = new Set<string>();

  if (!schemaStr.trim()) {
    return { relations, allAttributes };
  }

  const relationDefinitions = schemaStr.includes(';') ? schemaStr.split(';').map(s => s.trim()).filter(Boolean) : [schemaStr.trim()];

  relationDefinitions.forEach(def => {
    const match = def.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/); 
    if (match) {
      const name = match[1].trim();
      const attrsString = preprocessAttributeString(match[2]);
      const attrs = attrsString.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
      if (attrs.length > 0) {
        relations[name] = new Set(attrs);
        attrs.forEach(attr => allAttributes.add(attr));
      }
    } else {
        const singleRelationMatch = def.match(/^\s*\(([^)]+)\)\s*$/); 
        let attrsToParse = singleRelationMatch ? singleRelationMatch[1] : def;
        attrsToParse = preprocessAttributeString(attrsToParse);

        if (/^[a-zA-Z0-9_,\s]+$/.test(attrsToParse) && !attrsToParse.includes('(') && !attrsToParse.includes(')')) {
            const attrs = attrsToParse.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
            if (attrs.length > 0) {
                 const currentDefaultAttrs = relations["DEFAULT_RELATION"] || new Set<string>();
                 attrs.forEach(attr => {
                    currentDefaultAttrs.add(attr);
                    allAttributes.add(attr);
                 });
                 relations["DEFAULT_RELATION"] = currentDefaultAttrs;
            }
        }
    }
  });

  const namedRelationKeys = Object.keys(relations).filter(key => key !== "DEFAULT_RELATION");
  if (namedRelationKeys.length > 0) {
    const attributesFromNamedRelations = new Set<string>();
    namedRelationKeys.forEach(key => {
        relations[key].forEach(attr => attributesFromNamedRelations.add(attr));
    });
    allAttributes = attributesFromNamedRelations;
  } else if (relations["DEFAULT_RELATION"]) {
    allAttributes = new Set(relations["DEFAULT_RELATION"]);
  }

  return { relations, allAttributes };
}

// Parses FD and MVD string
export function parseDependenciesString(depStr: string, allAttributes: Set<string>): { fds: ParsedFD[]; mvds: ParsedMVD[]; errors: string[] } {
  const fds: ParsedFD[] = [];
  const mvds: ParsedMVD[] = [];
  const errors: string[] = [];

  if (!depStr.trim()) {
    return { fds, mvds, errors };
  }

  const definitions = depStr.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);

  definitions.forEach(def => {
    let lhsStrRaw: string;
    let rhsStrRaw: string;
    let isMvd = false;

    if (def.includes("->->") || def.includes("↠")) {
      isMvd = true;
      const parts = def.includes("->->") ? def.split("->->") : def.split("↠");
      if (parts.length !== 2) {
        errors.push(`Invalid MVD format: "${def}". Use "LHS ->-> RHS" or "LHS ↠ RHS".`);
        return;
      }
      [lhsStrRaw, rhsStrRaw] = parts;
    } else if (def.includes("->") || def.includes("→")) {
      const parts = def.includes("->") ? def.split("->") : def.split("→");
      if (parts.length !== 2) {
        errors.push(`Invalid FD format: "${def}". Use "LHS -> RHS" or "LHS → RHS".`);
        return;
      }
      [lhsStrRaw, rhsStrRaw] = parts;
    } else {
      errors.push(`Unknown dependency format: "${def}". Use "->" or "→" for FDs, "->->" or "↠" for MVDs.`);
      return;
    }

    const lhsStrProcessed = preprocessAttributeString(lhsStrRaw);
    const rhsStrProcessed = preprocessAttributeString(rhsStrRaw);

    const lhs = lhsStrProcessed.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
    const rhs = rhsStrProcessed.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);

    if (lhs.length === 0 || rhs.length === 0) {
      errors.push(`LHS and RHS cannot be empty in dependency: "${def}".`);
      return;
    }

    const currentDepAttributes = new Set([...lhs, ...rhs]);
    if (allAttributes && allAttributes.size > 0) {
        currentDepAttributes.forEach(attr => {
            if (!allAttributes.has(attr)) {
                errors.push(`Attribute "${attr}" in dependency "${def}" is not defined in the schema (${Array.from(allAttributes).join(', ')}).`);
            }
        });
    }

    if (isMvd) {
      mvds.push({ lhs: lhs.sort(), rhs: rhs.sort(), original: def });
    } else {
      fds.push({ lhs: lhs.sort(), rhs: rhs.sort(), original: def });
    }
  });

  return { fds, mvds, errors };
}

export function parseJdString(jdStr: string, allAttributes: Set<string>): { jd: ParsedJD | null; error: string | null } {
  if (!jdStr.trim()) {
    return { jd: null, error: null };
  }

  const componentsStrRaw = jdStr.split(';').map(s => s.trim()).filter(Boolean);
  if (componentsStrRaw.length < 2) {
    return { jd: null, error: "A Join Dependency must have at least two components." };
  }

  const components: Set<string>[] = [];
  const unionOfAllComponentAttrs = new Set<string>();

  for (const compStrRaw of componentsStrRaw) {
    const compStrProcessed = preprocessAttributeString(compStrRaw);
    const attrs = compStrProcessed.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
    if (attrs.length === 0) {
      return { jd: null, error: `Component "${compStrRaw}" in JD is empty or invalid.` };
    }
    const componentSet = new Set<string>();
    for (const attr of attrs) {
      if (allAttributes.size > 0 && !allAttributes.has(attr)) {
        return { jd: null, error: `Attribute "${attr}" in JD component "${compStrRaw}" is not defined in the schema.` };
      }
      componentSet.add(attr);
      unionOfAllComponentAttrs.add(attr);
    }
    components.push(componentSet);
  }

  if (allAttributes.size > 0) {
    if (unionOfAllComponentAttrs.size !== allAttributes.size || !Array.from(allAttributes).every(attr => unionOfAllComponentAttrs.has(attr))) {
      return { jd: null, error: `The union of attributes in JD components (${Array.from(unionOfAllComponentAttrs).join(',')}) does not match all schema attributes (${Array.from(allAttributes).join(',')}).` };
    }
  }

  return { jd: { components, original: jdStr }, error: null };
}


export function _attributeClosure(attributesToClose: Set<string>, fds: ParsedFD[]): Set<string> {
  const closure = new Set(attributesToClose);
  let changed = true;

  while (changed) {
    changed = false;
    for (const fd of fds) {
      const lhsIsSubset = fd.lhs.every(attr => closure.has(attr));
      if (lhsIsSubset) {
        for (const rhsAttr of fd.rhs) {
          if (!closure.has(rhsAttr)) {
            closure.add(rhsAttr);
            changed = true;
          }
        }
      }
    }
  }
  return closure;
}

export function _calculateCandidateKeys(allAttributes: Set<string>, fds: ParsedFD[]): Set<string>[] {
  if (allAttributes.size === 0) return [];

  const superKeys: Set<string>[] = [];
  const powerSetOfAttributes = getPowerSet(Array.from(allAttributes));

  for (const subsetArray of powerSetOfAttributes) {
    if (subsetArray.length === 0 && allAttributes.size > 0) continue;
    if (subsetArray.length === 0 && allAttributes.size === 0) {
        superKeys.push(new Set<string>());
        continue;
    }
    const subset = new Set(subsetArray);
    const closure = _attributeClosure(subset, fds);
    if (Array.from(allAttributes).every(attr => closure.has(attr))) {
      superKeys.push(subset);
    }
  }

  if (fds.length === 0 && allAttributes.size > 0 && superKeys.length === 0) {
      superKeys.push(new Set(allAttributes));
  }

  const candidateKeysSet: Set<string>[] = [];
  superKeys.sort((a,b) => a.size - b.size);

  for (const sk of superKeys) {
    let isMinimal = true;
    for (const ck of candidateKeysSet) {
      if (Array.from(ck).every(attr => sk.has(attr)) && ck.size < sk.size) {
        isMinimal = false;
        break;
      }
    }
    if (isMinimal) {
      const skSortedArray = Array.from(sk).sort();
      if (!candidateKeysSet.some(existingCk =>
          Array.from(existingCk).sort().join(',') === skSortedArray.join(',')
        )) {
        candidateKeysSet.push(new Set(skSortedArray));
      }
    }
  }
  return candidateKeysSet;
}

export function getPowerSet<T>(arr: T[]): T[][] {
  const result = arr.reduce(
    (subsets, value) => subsets.concat(subsets.map(set => [value, ...set])),
    [[]] as T[][]
  );
  return result.sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    const aStr = [...a].sort().join(',');
    const bStr = [...b].sort().join(',');
    return aStr.localeCompare(bStr);
  });
}

export function _isSuperKey(attributes: Set<string>, allAttributes: Set<string>, fds: ParsedFD[]): boolean {
  if (attributes.size === 0 || allAttributes.size === 0) return false;
  if (fds.length === 0) { 
    return attributes.size === allAttributes.size && Array.from(allAttributes).every(attr => attributes.has(attr));
  }
  const closure = _attributeClosure(attributes, fds);
  return allAttributes.size === closure.size && Array.from(allAttributes).every(attr => closure.has(attr));
}

export function calculateFdClosure(allAttributes: Set<string>, fds: ParsedFD[]): FdPlusItem[] {
  const fdPlus: FdPlusItem[] = [];
  if (allAttributes.size === 0) {
    return fdPlus;
  }

  const attributeArray = Array.from(allAttributes);
  const allSubsetsOfAttributes = getPowerSet(attributeArray).filter(subset => subset.length > 0);
  const keyAnalysis = getKeyAnalysis(allAttributes, fds);

  for (const lhsArray of allSubsetsOfAttributes) {
    const lhsSet = new Set(lhsArray);
    const closureOfLhs = _attributeClosure(lhsSet, fds);
    const allSubsetsOfClosure = getPowerSet(Array.from(closureOfLhs)).filter(subset => subset.length > 0);

    for (const rhsArray of allSubsetsOfClosure) {
      const rhsSet = new Set(rhsArray);
      const isTrivial = Array.from(rhsSet).every(attr => lhsSet.has(attr));
      let currentViolatesBCNF = false;
      let currentViolates3NF = false;
      let currentViolates2NF = false;

      if (!isTrivial) {
        const isLhsSuperKey = _isSuperKey(lhsSet, allAttributes, fds);
        currentViolatesBCNF = !isLhsSuperKey;

        if (!isLhsSuperKey) {
            const rhsOnlyAttrs = Array.from(rhsSet).filter(attr => !lhsSet.has(attr));
            if (rhsOnlyAttrs.some(attr => !keyAnalysis.primeAttributes.has(attr))) {
                currentViolates3NF = true;
            }
        }
        
        const rhsOnlyAttrsNonPrime = Array.from(rhsSet).filter(attr => !lhsSet.has(attr) && !keyAnalysis.primeAttributes.has(attr));
        if (rhsOnlyAttrsNonPrime.length > 0) {
            const effectiveCandidateKeys = keyAnalysis.candidateKeys.length > 0 ? keyAnalysis.candidateKeys : (allAttributes.size > 0 ? [new Set(allAttributes)] : []);
            for (const ck of effectiveCandidateKeys) {
                if (lhsSet.size < ck.size && Array.from(lhsSet).every(lhsAttr => ck.has(lhsAttr))) {
                    currentViolates2NF = true;
                    break;
                }
            }
        }
      }

      const existingFdIndex = fdPlus.findIndex(fdItem =>
        fdItem.lhs.size === lhsSet.size && Array.from(lhsSet).every(attr => fdItem.lhs.has(attr)) &&
        fdItem.rhs.size === rhsSet.size && Array.from(rhsSet).every(attr => fdItem.rhs.has(attr))
      );

      if (existingFdIndex === -1) {
        fdPlus.push({
          lhs: lhsSet,
          rhs: rhsSet,
          isTrivial,
          violatesBCNF: currentViolatesBCNF,
          violates3NF: currentViolates3NF,
          violates2NF: currentViolates2NF,
        });
      }
    }
  }
  return fdPlus.sort((a, b) => {
    if (a.lhs.size !== b.lhs.size) return a.lhs.size - b.lhs.size;
    const aLhsStr = Array.from(a.lhs).sort().join(',');
    const bLhsStr = Array.from(b.lhs).sort().join(',');
    if (aLhsStr !== bLhsStr) return aLhsStr.localeCompare(bLhsStr);
    if (a.rhs.size !== b.rhs.size) return a.rhs.size - b.rhs.size;
    const aRhsStr = Array.from(a.rhs).sort().join(',');
    const bRhsStr = Array.from(b.rhs).sort().join(',');
    return aRhsStr.localeCompare(bRhsStr);
  });
}

function cloneFds(fds: ParsedFD[]): ParsedFD[] {
  return fds.map(fd => ({ ...fd, lhs: [...fd.lhs].sort(), rhs: [...fd.rhs].sort(), original: fd.original }));
}

function decomposeRHS(fds: ParsedFD[]): ParsedFD[] {
  const result: ParsedFD[] = [];
  fds.forEach(fd => {
    if (fd.rhs.length > 1) {
      fd.rhs.forEach(attr => {
        result.push({ lhs: [...fd.lhs].sort(), rhs: [attr], original: `${fd.lhs.join(',')}->${attr}` });
      });
    } else {
      result.push({ lhs: [...fd.lhs].sort(), rhs: [...fd.rhs], original: fd.original });
    }
  });
  return result;
}

function sortFds(fds: ParsedFD[]): ParsedFD[] {
  return fds.sort((a, b) => {
    const aLhsStr = a.lhs.sort().join(',');
    const bLhsStr = b.lhs.sort().join(',');
    if (aLhsStr !== bLhsStr) return aLhsStr.localeCompare(bLhsStr);
    const aRhsStr = a.rhs.sort().join(',');
    const bRhsStr = b.rhs.sort().join(',');
    return aRhsStr.localeCompare(bRhsStr);
  });
}

function uniqueFds(fds: ParsedFD[]): ParsedFD[] {
  const unique = new Map<string, ParsedFD>();
  fds.forEach(fd => {
    const key = `${fd.lhs.sort().join(',')}|${fd.rhs.sort().join(',')}`;
    if (!unique.has(key)) {
      unique.set(key, fd);
    }
  });
  return Array.from(unique.values());
}

export function calculateMinimalCover(originalFds: ParsedFD[], allAttributes: Set<string>): ParsedFD[] {
  if (!originalFds || originalFds.length === 0 || allAttributes.size === 0) {
    return [];
  }

  let fds = cloneFds(originalFds);
  fds = decomposeRHS(fds);
  fds = uniqueFds(sortFds(fds));

  let fdsAfterLhsMin = cloneFds(fds);
  let changedInLhsMin;
  do {
    changedInLhsMin = false;
    let fdsBeforeThisIteration = cloneFds(fdsAfterLhsMin);
    for (let i = 0; i < fdsAfterLhsMin.length; i++) {
      const fd = fdsAfterLhsMin[i];
      if (fd.lhs.length <= 1) continue;

      let currentLhs = [...fd.lhs];
      for (const attrToRemove of [...fd.lhs]) {
        if (currentLhs.length <= 1) break;
        const tempLhsArray = currentLhs.filter(a => a !== attrToRemove);
        if (tempLhsArray.length === 0) continue;

        const tempLhsSet = new Set(tempLhsArray);
        const closure = _attributeClosure(tempLhsSet, fdsBeforeThisIteration);

        if (fd.rhs.every(rhsAttr => closure.has(rhsAttr))) {
          currentLhs = tempLhsArray;
          fdsAfterLhsMin[i].lhs = currentLhs.sort();
          changedInLhsMin = true;
        }
      }
    }
    if (changedInLhsMin) {
        fdsAfterLhsMin = uniqueFds(sortFds(fdsAfterLhsMin));
    }
  } while (changedInLhsMin);
  fds = fdsAfterLhsMin;

  let fdsAfterRedundantRemoval = cloneFds(fds);
  let changedInRedundantRemoval;
  do {
      changedInRedundantRemoval = false;
      for (let i = 0; i < fdsAfterRedundantRemoval.length; i++) {
          const fdToCheck = fdsAfterRedundantRemoval[i];
          const otherFds = fdsAfterRedundantRemoval.filter((_, index) => index !== i);
          if (otherFds.length === 0 && fdsAfterRedundantRemoval.length === 1 && fdsAfterRedundantRemoval[0].lhs.length > 0) break; 

          const closure = _attributeClosure(new Set(fdToCheck.lhs), otherFds);
          if (fdToCheck.rhs.every(attr => closure.has(attr))) {
              fdsAfterRedundantRemoval.splice(i, 1);
              changedInRedundantRemoval = true;
              break;
          }
      }
      if (changedInRedundantRemoval) {
          fdsAfterRedundantRemoval = uniqueFds(sortFds(fdsAfterRedundantRemoval));
      }
  } while (changedInRedundantRemoval);
  fds = fdsAfterRedundantRemoval;

  return uniqueFds(sortFds(fds));
}

export function getKeyAnalysis(allAttributes: Set<string>, fds: ParsedFD[]): KeyAnalysis {
  const candidateKeys = _calculateCandidateKeys(allAttributes, fds);
  const primeAttributes = new Set<string>();
  candidateKeys.forEach(ckSet => ckSet.forEach(attr => primeAttributes.add(attr)));
  return { candidateKeys, primeAttributes };
}

export function check1NF(): NormalFormAnalysisResult {
  return {
    id: "1nf",
    name: "First Normal Form (1NF)",
    isSatisfied: true,
    violations: [],
    explanation: "1NF requires all attribute values to be atomic and single-valued. This is assumed to be true based on the schema representation. Multi-valued attributes or repeating groups would violate 1NF.",
  };
}

export function checkBCNF(allAttributes: Set<string>, fds: ParsedFD[], keyAnalysis: KeyAnalysis): NormalFormAnalysisResult {
  const violations: NormalFormViolation[] = [];
  if (allAttributes.size === 0) {
     return { id: "bcnf", name: "Boyce-Codd Normal Form (BCNF)", isSatisfied: true, violations: [], explanation: "No attributes defined." };
  }

  const processedFds = decomposeRHS(uniqueFds(sortFds(fds)));

  for (const fd of processedFds) {
    const lhsSet = new Set(fd.lhs);
    const rhsSet = new Set(fd.rhs);
    if (Array.from(rhsSet).every(attr => lhsSet.has(attr))) continue; 
    if (!_isSuperKey(lhsSet, allAttributes, fds)) {
      violations.push({ fd, reason: `LHS {${fd.lhs.join(',')}} is not a superkey.` });
    }
  }
  return {
    id: "bcnf",
    name: "Boyce-Codd Normal Form (BCNF)",
    isSatisfied: violations.length === 0,
    violations,
    explanation: violations.length > 0 ? "BCNF is violated if for any non-trivial FD X → Y, X is not a superkey." : "All non-trivial FDs have a superkey as their determinant. Relation is in BCNF."
  };
}

export function check3NF(allAttributes: Set<string>, fds: ParsedFD[], keyAnalysis: KeyAnalysis): NormalFormAnalysisResult {
  const violations: NormalFormViolation[] = [];
   if (allAttributes.size === 0) {
     return { id: "3nf", name: "Third Normal Form (3NF)", isSatisfied: true, violations: [], explanation: "No attributes defined." };
  }
  const { primeAttributes } = keyAnalysis;
  const processedFds = decomposeRHS(uniqueFds(sortFds(fds)));

  for (const fd of processedFds) {
    const lhsSet = new Set(fd.lhs);
    const rhsSet = new Set(fd.rhs);
    if (Array.from(rhsSet).every(attr => lhsSet.has(attr))) continue;
    if (_isSuperKey(lhsSet, allAttributes, fds)) continue;

    const nonLhsRhsAttrs = Array.from(rhsSet).filter(attr => !lhsSet.has(attr));
    if (nonLhsRhsAttrs.every(attr => primeAttributes.has(attr))) continue;

    const violatingRhsAttrs = nonLhsRhsAttrs.filter(attr => !primeAttributes.has(attr));
    if (violatingRhsAttrs.length > 0) {
        violations.push({ fd: {lhs: fd.lhs, rhs: violatingRhsAttrs, original: fd.original}, reason: `LHS is not a superkey, and attribute(s) {${violatingRhsAttrs.join(',')}} in RHS-LHS are non-prime (transitive dependency).` });
    }
  }
  return {
    id: "3nf",
    name: "Third Normal Form (3NF)",
    isSatisfied: violations.length === 0,
    violations,
    explanation: violations.length > 0 ? "3NF is violated if for any non-trivial FD X → Y, X is not a superkey AND some attribute in Y-X is non-prime." : "All non-trivial FDs satisfy 3NF conditions. Relation is in 3NF."
  };
}

export function check2NF(allAttributes: Set<string>, fds: ParsedFD[], keyAnalysis: KeyAnalysis): NormalFormAnalysisResult {
  const violations: NormalFormViolation[] = [];
  if (allAttributes.size === 0) {
     return { id: "2nf", name: "Second Normal Form (2NF)", isSatisfied: true, violations: [], explanation: "No attributes defined." };
  }
  const { candidateKeys, primeAttributes } = keyAnalysis;
  let effectiveCandidateKeys = candidateKeys.length > 0 ? candidateKeys : (allAttributes.size > 0 ? [new Set(allAttributes)] : []);
  const processedFds = decomposeRHS(uniqueFds(sortFds(fds)));

  for (const fd of processedFds) {
    const lhsSet = new Set(fd.lhs);
    const rhsAttr = fd.rhs[0]; 
    if (lhsSet.has(rhsAttr) || primeAttributes.has(rhsAttr)) continue;

    for (const ck of effectiveCandidateKeys) {
      if (lhsSet.size < ck.size && Array.from(lhsSet).every(attr => ck.has(attr))) {
        violations.push({ fd, reason: `Non-prime attribute {${rhsAttr}} is partially dependent on candidate key {${Array.from(ck).join(',')}} via LHS {${fd.lhs.join(',')}}. ` });
        break; 
      }
    }
  }
  const uniqueViolationsMap = new Map<string, NormalFormViolation>();
  violations.forEach(v => {
      const violationKey = `${v.fd!.lhs.sort().join(',')}|${v.fd!.rhs.sort().join(',')}|${v.reason}`;
      if (!uniqueViolationsMap.has(violationKey)) uniqueViolationsMap.set(violationKey, v);
  });
  return {
    id: "2nf",
    name: "Second Normal Form (2NF)",
    isSatisfied: uniqueViolationsMap.size === 0,
    violations: Array.from(uniqueViolationsMap.values()),
    explanation: uniqueViolationsMap.size > 0 ? "2NF is violated if a non-prime attribute is partially dependent on any candidate key." : "No partial dependencies of non-prime attributes on candidate keys exist. Relation is in 2NF."
  };
}

export function check4NF( allAttributes: Set<string>, fds: ParsedFD[], mvds: ParsedMVD[], keyAnalysis: KeyAnalysis, bcnfStatus?: NormalFormAnalysisResult ): NormalFormAnalysisResult {
  const violations: NormalFormViolation[] = [];
  if (allAttributes.size === 0) {
     return { id: "4nf", name: "Fourth Normal Form (4NF)", isSatisfied: true, violations: [], explanation: "No attributes defined." };
  }
  if (!mvds || mvds.length === 0) {
    return {
      id: "4nf", name: "Fourth Normal Form (4NF)", isSatisfied: true, violations: [],
      explanation: `No Multi-Valued Dependencies (MVDs) defined. If BCNF is satisfied (${bcnfStatus?.isSatisfied ? 'Yes' : 'No, or not checked'}) and no non-trivial MVDs exist, then 4NF is typically satisfied. To fully assess 4NF, define any MVDs.`,
    };
  }
  for (const mvd of mvds) {
    const lhsSet = new Set(mvd.lhs);
    const rhsSet = new Set(mvd.rhs);
    const isRhsSubsetLhs = Array.from(rhsSet).every(attr => lhsSet.has(attr));
    const unionXY = new Set([...lhsSet, ...rhsSet]);
    const isUnionXYallAttributes = unionXY.size === allAttributes.size && Array.from(allAttributes).every(attr => unionXY.has(attr));
    if (isRhsSubsetLhs || isUnionXYallAttributes) continue; 
    if (!_isSuperKey(lhsSet, allAttributes, fds)) { 
      violations.push({ mvd, reason: `LHS {${mvd.lhs.join(',')}} is not a superkey (based on FDs).` });
    }
  }
  return {
    id: "4nf", name: "Fourth Normal Form (4NF)", isSatisfied: violations.length === 0, violations,
    explanation: violations.length > 0 ? "4NF is violated if for any non-trivial MVD X ↠ Y, X is not a superkey." : "All non-trivial MVDs have a superkey as their determinant. Relation is in 4NF."
  };
}

export function check5NF( allAttributes: Set<string>, keyAnalysis: KeyAnalysis, parsedJd: ParsedJD | null, fourNfStatus?: NormalFormAnalysisResult ): NormalFormAnalysisResult {
  const violations: NormalFormViolation[] = [];
  let explanation = "";
  let isSatisfied = true;

  if (allAttributes.size === 0) {
    return { id: "5nf", name: "Fifth Normal Form (5NF) / PJNF", isSatisfied: true, violations: [], explanation: "No attributes defined." };
  }
  if (!parsedJd) {
    explanation = `No Join Dependency (JD) defined. 5NF (Project-Join Normal Form) requires every JD to be implied by the candidate keys. If 4NF is satisfied (${fourNfStatus?.isSatisfied ? 'Yes' : 'No, or not checked'}) and no JDs exist (or all are implied by candidate keys), the relation is in 5NF. To fully assess 5NF, define any JDs.`;
    isSatisfied = true; 
  } else {
    const isTrivialJD = parsedJd.components.some(compSet => compSet.size === allAttributes.size && Array.from(allAttributes).every(attr => compSet.has(attr)));
    if (isTrivialJD) {
      explanation = "The provided Join Dependency is trivial. Trivial JDs do not violate 5NF.";
      isSatisfied = true;
    } else {
      explanation = `A non-trivial Join Dependency *(${parsedJd.components.map(c => `{${Array.from(c).join(',')}}`).join(', ')}) exists. For 5NF to be satisfied, this JD must be implied by the candidate keys of the relation. This tool flags its presence; full verification is complex.`;
      violations.push({ jd: parsedJd, reason: "Non-trivial Join Dependency found. It must be implied by candidate keys for 5NF." });
      isSatisfied = false; 
    }
  }
  return { id: "5nf", name: "Fifth Normal Form (5NF) / PJNF", isSatisfied, violations, explanation, };
}

function checkFdCoverage( fdsToCover: ParsedFD[], fdsProvidingCover: ParsedFD[], schemaAttributes: Set<string> ): { isCovered: boolean; firstUncoveredFd?: ParsedFD, exampleLhsClosure?: Set<string> } {
  if (fdsToCover.length === 0) return { isCovered: true };
  if (fdsProvidingCover.length === 0 && fdsToCover.length > 0) {
    const firstFd = fdsToCover[0];
    return { isCovered: false, firstUncoveredFd: firstFd, exampleLhsClosure: _attributeClosure(new Set(firstFd.lhs), []) };
  }
  for (const fd of fdsToCover) {
    const lhsClosure = _attributeClosure(new Set(fd.lhs), fdsProvidingCover);
    const rhsIsCovered = fd.rhs.every(attr => lhsClosure.has(attr));
    if (!rhsIsCovered) return { isCovered: false, firstUncoveredFd: fd, exampleLhsClosure: lhsClosure };
  }
  return { isCovered: true };
}

export function checkFdEquivalence(schemaAttributes: Set<string>, fds1: ParsedFD[], fds2: ParsedFD[]): string {
  if (schemaAttributes.size === 0) return "Schema attributes must be defined.";
  if (fds1.length === 0 && fds2.length === 0) return "Both FD sets are empty, thus they are equivalent.";

  const fds1CoversFds2Result = checkFdCoverage(fds2, fds1, schemaAttributes);
  const fds2CoversFds1Result = checkFdCoverage(fds1, fds2, schemaAttributes);
  let explanation = "";

  if (fds1CoversFds2Result.isCovered && fds2CoversFds1Result.isCovered) {
    explanation = "The two FD sets are equivalent (F₁ ≡ F₂).\nF₁ implies all FDs in F₂, and F₂ implies all FDs in F₁.";
  } else if (fds1CoversFds2Result.isCovered && !fds2CoversFds1Result.isCovered) {
    explanation = "FD Set 1 properly covers FD Set 2 (F₁ ⊃ F₂).\nF₁ implies all FDs in F₂, but F₂ does not imply all FDs in F₁.\n";
    if (fds2CoversFds1Result.firstUncoveredFd) {
      const {lhs, rhs} = fds2CoversFds1Result.firstUncoveredFd;
      const closure = fds2CoversFds1Result.exampleLhsClosure;
      explanation += `For example, FD {${lhs.join(',')}} → {${rhs.join(',')}} from F₁ is not covered by F₂. The closure of {${lhs.join(',')}}⁺ w.r.t F₂ is {${Array.from(closure || new Set()).sort().join(',')}}, which does not include all attributes from {${rhs.join(',')}}.`;
    }
  } else if (!fds1CoversFds2Result.isCovered && fds2CoversFds1Result.isCovered) {
    explanation = "FD Set 2 properly covers FD Set 1 (F₂ ⊃ F₁).\nF₂ implies all FDs in F₁, but F₁ does not imply all FDs in F₂.\n";
    if (fds1CoversFds2Result.firstUncoveredFd) {
      const {lhs, rhs} = fds1CoversFds2Result.firstUncoveredFd;
      const closure = fds1CoversFds2Result.exampleLhsClosure;
      explanation += `For example, FD {${lhs.join(',')}} → {${rhs.join(',')}} from F₂ is not covered by F₁. The closure of {${lhs.join(',')}}⁺ w.r.t F₁ is {${Array.from(closure || new Set()).sort().join(',')}}, which does not include all attributes from {${rhs.join(',')}}.`;
    }
  } else {
    explanation = "The two FD sets are not equivalent, and neither properly covers the other.\n";
    if (fds1CoversFds2Result.firstUncoveredFd) {
      const {lhs, rhs} = fds1CoversFds2Result.firstUncoveredFd;
      const closure = fds1CoversFds2Result.exampleLhsClosure;
      explanation += `FD {${lhs.join(',')}} → {${rhs.join(',')}} from F₂ is not covered by F₁. Closure of {${lhs.join(',')}}⁺ w.r.t F₁ is {${Array.from(closure || new Set()).sort().join(',')}}.\n`;
    }
    if (fds2CoversFds1Result.firstUncoveredFd) {
      const {lhs, rhs} = fds2CoversFds1Result.firstUncoveredFd;
      const closure = fds2CoversFds1Result.exampleLhsClosure;
      explanation += `FD {${lhs.join(',')}} → {${rhs.join(',')}} from F₁ is not covered by F₂. Closure of {${lhs.join(',')}}⁺ w.r.t F₂ is {${Array.from(closure || new Set()).sort().join(',')}}.`;
    }
  }
  return explanation;
}

// --- Decomposition Property Checks ---
export function checkLosslessJoin(
  originalAttributes: Set<string>,
  originalFds: ParsedFD[],
  decomposedRelations: ParsedSchema[]
): { isLossless: boolean; explanation: string; tableau?: string[][] | null } {
  if (decomposedRelations.length === 0 || originalAttributes.size === 0) {
    return { isLossless: false, explanation: "Cannot check lossless join: Original attributes or decomposed relations are not defined.", tableau: null };
  }

  const attributesArray = Array.from(originalAttributes).sort();
  const numCols = attributesArray.length;
  const attributeIndexMap = new Map(attributesArray.map((attr, i) => [attr, i]));

  let tableau = decomposedRelations.map((relation, relIdx) => {
    const row = new Array(numCols).fill(null);
    relation.allAttributes.forEach(attr => {
      const colIndex = attributeIndexMap.get(attr);
      if (colIndex !== undefined) {
        row[colIndex] = `a${colIndex + 1}`;
      }
    });
    for (let j = 0; j < numCols; j++) {
      if (row[j] === null) {
        row[j] = `b${relIdx + 1},${j + 1}`;
      }
    }
    return row;
  });

  let changedInIteration;
  let iterationCount = 0;
  const MAX_ITERATIONS = (numCols * decomposedRelations.length * originalFds.length) + 5; // Heuristic safety net

  do {
    changedInIteration = false;
    if (iterationCount++ > MAX_ITERATIONS) {
      return { isLossless: false, explanation: "Lossless join check exceeded maximum iterations (possible issue with FD application or complex case).", tableau };
    }

    for (const fd of originalFds) {
      const lhsIndices = fd.lhs.map(attr => attributeIndexMap.get(attr)).filter(idx => idx !== undefined) as number[];
      const rhsIndices = fd.rhs.map(attr => attributeIndexMap.get(attr)).filter(idx => idx !== undefined) as number[];

      if (lhsIndices.length !== fd.lhs.length || rhsIndices.length !== fd.rhs.length) continue;

      for (let i = 0; i < tableau.length; i++) {
        for (let k = 0; k < tableau.length; k++) { // Check each row against all other rows (including itself for single row application)
          // if (i === k) continue; // No need to compare a row with itself unless FD LHS is empty (not typical)

          const row1 = tableau[i];
          const row2 = tableau[k];
          let agreeOnLHS = true;
          for (const idx of lhsIndices) {
            if (row1[idx] !== row2[idx]) {
              agreeOnLHS = false;
              break;
            }
          }

          if (agreeOnLHS) {
            for (const rhsIdx of rhsIndices) {
              const val1 = row1[rhsIdx];
              const val2 = row2[rhsIdx];
              if (val1 !== val2) {
                let valToPropagate: string | null = null;
                let oldValToReplace: string | null = null;

                if (val1.startsWith('a') && !val2.startsWith('a')) {
                  valToPropagate = val1;
                  oldValToReplace = val2;
                } else if (!val1.startsWith('a') && val2.startsWith('a')) {
                  valToPropagate = val2;
                  oldValToReplace = val1;
                } else if (!val1.startsWith('a') && !val2.startsWith('a')) { // Both are 'b' symbols
                  // Prefer b with smaller row index, then smaller col index if tied (for consistency)
                  if (val1 < val2) { // lexicographical comparison of b_ij strings
                     valToPropagate = val1;
                     oldValToReplace = val2;
                  } else {
                     valToPropagate = val2;
                     oldValToReplace = val1;
                  }
                }
                
                if (valToPropagate && oldValToReplace) {
                    for(let r=0; r < tableau.length; r++) {
                        for(let c=0; c < tableau[r].length; c++) {
                            if (tableau[r][c] === oldValToReplace) {
                                tableau[r][c] = valToPropagate;
                                changedInIteration = true;
                            }
                        }
                    }
                }
              }
            }
          }
        }
      }
    }
  } while (changedInIteration);

  const isLossless = tableau.some(row => row.every(cell => cell && cell.startsWith('a')));
  return {
    isLossless,
    explanation: isLossless ? "Decomposition is lossless-join." : "Decomposition is potentially lossy.",
    tableau
  };
}

export function checkDependencyPreservation(
  originalFds: ParsedFD[],
  decomposedRelations: ParsedSchema[],
  allOriginalAttributes: Set<string> // used for _attributeClosure context
): { preservedFds: ParsedFD[]; lostFds: ParsedFD[]; allPreserved: boolean, explanation: string } {
  
  const preservedFds: ParsedFD[] = [];
  const lostFds: ParsedFD[] = [];

  if (originalFds.length === 0) {
    return { preservedFds, lostFds, allPreserved: true, explanation: "No original FDs to check for preservation." };
  }
  if (decomposedRelations.length === 0) {
    return { preservedFds, lostFds: [...originalFds], allPreserved: false, explanation: "No decomposed relations provided; all FDs are considered lost." };
  }

  for (const fd of originalFds) {
    const X = new Set(fd.lhs);
    const Y = new Set(fd.rhs);
    let Z = new Set(X);
    let prevZSize = 0;
    let iterations = 0;
    const MAX_ITERATIONS_DP = allOriginalAttributes.size * decomposedRelations.length + 5;


    while(Z.size > prevZSize && iterations < MAX_ITERATIONS_DP) {
      prevZSize = Z.size;
      iterations++;
      for (const r_i_schema of decomposedRelations) {
        const R_i_attrs = r_i_schema.allAttributes;
        const Z_intersect_Ri = new Set([...Z].filter(attr => R_i_attrs.has(attr)));
        
        // Closure of (Z ∩ R_i) under F (original FDs)
        const closure_Z_intersect_Ri_under_F = _attributeClosure(Z_intersect_Ri, originalFds);
        
        closure_Z_intersect_Ri_under_F.forEach(attr => {
          if (R_i_attrs.has(attr)) { // Only add if the attribute is in R_i
            Z.add(attr);
          }
        });
      }
    }
    if (iterations >= MAX_ITERATIONS_DP) {
        // If max iterations reached, assume lost for safety, could be a very complex case or cycle
        lostFds.push(fd);
        continue;
    }


    if (Array.from(Y).every(attr => Z.has(attr))) {
      preservedFds.push(fd);
    } else {
      lostFds.push(fd);
    }
  }

  const allPreserved = lostFds.length === 0;
  let explanation = "";
  if (allPreserved && originalFds.length > 0) {
    explanation = "All original functional dependencies are preserved by the decomposition.";
  } else if (originalFds.length > 0) {
    explanation = "Not all original functional dependencies are preserved. ";
    if (preservedFds.length > 0) {
      explanation += `Preserved FDs: ${preservedFds.map(f => `{${f.lhs.join(',')}} → {${f.rhs.join(',')}}`).join('; ')}. `;
    }
    if (lostFds.length > 0) {
      explanation += `Lost FDs: ${lostFds.map(f => `{${f.lhs.join(',')}} → {${f.rhs.join(',')}}`).join('; ')}.`;
    }
  } else {
     explanation = "No original FDs to check."
  }

  return { preservedFds, lostFds, allPreserved, explanation };
}


    