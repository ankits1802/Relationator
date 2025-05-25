'use server';
/**
 * @fileOverview Translates Relational Algebra (RA) queries to SQL.
 *
 * - raToSql - A function that handles the RA to SQL translation.
 * - RaToSqlInput - The input type for the raToSql function.
 * - RaToSqlOutput - The return type for the raToSql function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RaToSqlInputSchema = z.object({
  raQuery: z.string().describe('The Relational Algebra query to translate.'),
  databaseSchema: z
    .string()
    .describe(
      'The database schema context (e.g., R(A,B), S(B,C)) for the RA query.'
    ),
});
export type RaToSqlInput = z.infer<typeof RaToSqlInputSchema>;

const RaToSqlOutputSchema = z.object({
  sqlQuery: z.string().describe('The translated SQL query.'),
  explanation: z
    .string()
    .optional()
    .describe('An optional explanation or notes about the translation.'),
  error: z.string().optional().describe('Any error message if translation failed.'),
});
export type RaToSqlOutput = z.infer<typeof RaToSqlOutputSchema>;

export async function raToSql(input: RaToSqlInput): Promise<RaToSqlOutput> {
  return raToSqlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'raToSqlPrompt',
  input: {schema: RaToSqlInputSchema},
  output: {schema: RaToSqlOutputSchema},
  prompt: `You are an expert in database systems and query languages.
Translate the following Relational Algebra (RA) query into an equivalent SQL query.
Use the provided database schema as context.

Database Schema:
{{{databaseSchema}}}

Relational Algebra Query:
{{{raQuery}}}

Standard RA operators to consider:
- Π (Projection): e.g., Π_{Attr1,Attr2}(Relation)
- σ (Selection): e.g., σ_{Condition}(Relation)
- ρ (Rename): e.g., ρ_{NewName}(Relation) or ρ_{NewAttr/OldAttr}(Relation)
- ⋈ (Natural Join): e.g., Relation1 ⋈ Relation2
- × (Cartesian Product): e.g., Relation1 × Relation2
- ∪ (Union): e.g., Relation1 ∪ Relation2
- ∩ (Intersection): e.g., Relation1 ∩ Relation2
- − (Set Difference): e.g., Relation1 − Relation2
- ← (Assignment) can be ignored for direct translation to a single SQL query.
- Joins with conditions: Relation1 ⋈_{Condition} Relation2

Provide only the SQL query in the 'sqlQuery' field.
If there are ambiguities or assumptions made, briefly note them in the 'explanation' field.
If the RA query is invalid or cannot be reasonably translated, set an error message in the 'error' field and leave 'sqlQuery' empty.
Do not produce DDL (CREATE TABLE) statements.
Assume standard SQL syntax (compatible with PostgreSQL or MySQL).
For table and attribute names from the RA query, use them directly in the SQL query, quoting if necessary (e.g., if they contain spaces or are keywords, though prefer unquoted if simple).
Example: RA: Π_{name, age} (σ_{status='active'} (Employee))
SQL: SELECT name, age FROM Employee WHERE status = 'active';
`,
});

const raToSqlFlow = ai.defineFlow(
  {
    name: 'raToSqlFlow',
    inputSchema: RaToSqlInputSchema,
    outputSchema: RaToSqlOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output || (!output.sqlQuery && !output.error)) {
        return {
          sqlQuery: '',
          error: 'Failed to generate SQL: No output from AI model or invalid output structure.',
        };
      }
      // Ensure we return a valid RaToSqlOutput structure, even if AI omits optional fields
      return {
        sqlQuery: output.sqlQuery || '',
        explanation: output.explanation,
        error: output.error,
      };
    } catch (e) {
      console.error('Error in raToSqlFlow:', e);
      return {
        sqlQuery: '',
        error:
          e instanceof Error
            ? e.message
            : 'An unknown error occurred during SQL translation.',
      };
    }
  }
);
