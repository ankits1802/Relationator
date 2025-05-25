
'use server';

/**
 * @fileOverview An AI agent that generates natural language explanations of functional dependency concepts.
 *
 * - fdExplanationGenerator - A function that generates explanations for FD concepts.
 * - FdExplanationGeneratorInput - The input type for the fdExplanationGenerator function.
 * - FdExplanationGeneratorOutput - The return type for the fdExplanationGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FdExplanationGeneratorInputSchema = z.object({
  concept: z
    .string()
    .describe(
      'The functional dependency concept to explain, such as closure, key discovery, or normalization.'
    ),
  schema: z.string().optional().describe('The database schema to use as context.'),
  fds: z.string().optional().describe('The functional dependencies to use as context.'),
});
export type FdExplanationGeneratorInput = z.infer<typeof FdExplanationGeneratorInputSchema>;

const FdExplanationGeneratorOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A natural language explanation of the functional dependency concept, formatted as simple HTML.'),
});
export type FdExplanationGeneratorOutput = z.infer<typeof FdExplanationGeneratorOutputSchema>;

export async function fdExplanationGenerator(
  input: FdExplanationGeneratorInput
): Promise<FdExplanationGeneratorOutput> {
  return fdExplanationGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fdExplanationGeneratorPrompt',
  input: {schema: FdExplanationGeneratorInputSchema},
  output: {schema: FdExplanationGeneratorOutputSchema},
  prompt: `You are an expert database consultant specializing in explaining functional dependency concepts to students.

You will use this information to explain the concept to the student. Provide a clear and concise explanation, using examples where appropriate.
Format your entire explanation using simple HTML tags such as <p>, <strong>, <em>, <ul>, <li>, and <br /> for line breaks. Do not include any CSS or <script> tags. Ensure the HTML is well-formed.

Concept: {{{concept}}}

{{#if schema}}
Schema: {{{schema}}}
{{/if}}

{{#if fds}}
Functional Dependencies: {{{fds}}}
{{/if}}

Explanation (as HTML):
`,
});

const fdExplanationGeneratorFlow = ai.defineFlow(
  {
    name: 'fdExplanationGeneratorFlow',
    inputSchema: FdExplanationGeneratorInputSchema,
    outputSchema: FdExplanationGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
