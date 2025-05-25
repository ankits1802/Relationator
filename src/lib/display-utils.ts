
import type { ParsedFD, ParsedMVD, ParsedJD } from './db-types';
import type { DisplayMode, AttributeMap } from '@/contexts/DisplayModeContext';

function getDisplayAttribute(attribute: string, mode: DisplayMode, map: AttributeMap): string {
  if (mode === 'numeric' && map && map.has(attribute)) {
    return map.get(attribute)!.toString();
  }
  return attribute;
}

export function formatAttributeSetForDisplay(
  attributes: Set<string> | string[],
  mode: DisplayMode,
  map: AttributeMap,
  useBraces: boolean = true
): string {
  const attrsArray = Array.from(attributes);
  if (attrsArray.length === 0) return useBraces ? '\u2205' : ''; // Empty set symbol or empty string

  const formattedAttrs = attrsArray
    .map(attr => getDisplayAttribute(attr, mode, map))
    .sort((a, b) => {
      // If numeric, sort numerically, otherwise alphabetically
      if (mode === 'numeric') {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
      }
      return a.localeCompare(b);
    })
    .join(', ');

  return useBraces ? `{${formattedAttrs}}` : formattedAttrs;
}

export function formatFDForDisplay(
  fd: ParsedFD | { lhs: Set<string>; rhs: Set<string> },
  mode: DisplayMode,
  map: AttributeMap
): string {
  const lhsFormatted = formatAttributeSetForDisplay(fd.lhs, mode, map);
  const rhsFormatted = formatAttributeSetForDisplay(fd.rhs, mode, map);
  return `${lhsFormatted} \u2192 ${rhsFormatted}`; // Unicode RIGHTWARDS ARROW
}

export function formatMVDForDisplay(
  mvd: ParsedMVD | { lhs: Set<string>; rhs: Set<string> },
  mode: DisplayMode,
  map: AttributeMap
): string {
  const lhsFormatted = formatAttributeSetForDisplay(mvd.lhs, mode, map);
  const rhsFormatted = formatAttributeSetForDisplay(mvd.rhs, mode, map);
  return `${lhsFormatted} \u21A0 ${rhsFormatted}`; // Unicode RIGHTWARDS TWO HEADED ARROW
}

export function formatJDForDisplay(
  jd: ParsedJD,
  mode: DisplayMode,
  map: AttributeMap
): string {
  const componentsFormatted = jd.components
    .map(compSet => formatAttributeSetForDisplay(compSet, mode, map, true))
    .join(', ');
  return `* ( ${componentsFormatted} )`;
}


export function formatFDListForDisplay(
  fds: ParsedFD[],
  mode: DisplayMode,
  map: AttributeMap
): string {
  if (!fds || fds.length === 0) return "{}";
  return `{${fds.map(fd => formatFDForDisplay(fd, mode, map)).join('; ')}}`;
}

