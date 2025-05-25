
'use server';

/**
 * @fileOverview A flow that generates natural language explanations of database normalization steps.
 *
 * - aiNormalize - A function that handles the normalization explanation process.
 * - AiNormalizeInput - The input type for the aiNormalize function.
 * - AiNormalizeOutput - The return type for the aiNormalize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiNormalizeInputSchema = z.object({
  schemaDefinition: z
    .string()
    .describe('The database schema definition, including tables and attributes.'),
  functionalDependencies: z
    .string()
    .describe('The set of functional dependencies for the schema.'),
  targetNormalForm: z
    .enum(['1NF', '2NF', '3NF', 'BCNF', '4NF', '5NF'])
    .describe('The target normal form to achieve.'),
});
export type AiNormalizeInput = z.infer<typeof AiNormalizeInputSchema>;

const AiNormalizeOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A natural language explanation of the normalization steps, including identifying violations and suggesting decompositions, formatted as simple HTML.'
    ),
});
export type AiNormalizeOutput = z.infer<typeof AiNormalizeOutputSchema>;

export async function aiNormalize(input: AiNormalizeInput): Promise<AiNormalizeOutput> {
  return aiNormalizeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiNormalizePrompt',
  input: {schema: AiNormalizeInputSchema},
  output: {schema: AiNormalizeOutputSchema},
  prompt: `You are an expert database designer.

You will analyze the provided database schema and functional dependencies and explain the steps required to normalize the database to the specified normal form.

Specifically, you will:
1. Identify the highest normal form the current schema satisfies.
2. Point out any functional dependencies that violate the target normal form.
3. Provide a step-by-step decomposition to achieve the target normal form, ensuring dependency preservation and lossless join properties where possible.

Format your entire explanation using simple HTML tags such as <p>, <strong>, <em>, <ul>, <li>, and <br /> for line breaks. Do not include any CSS or <script> tags. Ensure the HTML is well-formed.

Schema Definition: {{{schemaDefinition}}}
Functional Dependencies: {{{functionalDependencies}}}
Target Normal Form: {{{targetNormalForm}}}

Explanation (as HTML):`,
});

const aiNormalizeFlow = ai.defineFlow(
  {
    name: 'aiNormalizeFlow',
    inputSchema: AiNormalizeInputSchema,
    outputSchema: AiNormalizeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
