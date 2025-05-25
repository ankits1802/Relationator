
'use server';
/**
 * @fileOverview Generates natural language explanations for Relational Algebra (RA) queries.
 *
 * - explainRaQuery - A function that provides an explanation for an RA query.
 * - RaExplanationInput - The input type for the explainRaQuery function.
 * - RaExplanationOutput - The return type for the explainRaQuery function.
 */

import {ai} from '@/ai/genkit';
import {z}
from 'genkit';

const RaExplanationInputSchema = z.object({
    raQuery: z
        .string()
        .describe('The Relational Algebra query to explain.'),
    databaseSchema: z
        .string()
        .describe(
            'The database schema context (e.g., R(A,B), S(B,C)) for the RA query.'
        ),
});
export type RaExplanationInput = z.infer < typeof RaExplanationInputSchema > ;

const RaExplanationOutputSchema = z.object({
    explanation: z
        .string()
        .describe(
            'A natural language explanation of the RA query, detailing its operations and expected outcome, formatted as simple HTML.'
        ),
    error: z.string().optional().describe('Any error message if explanation failed.'),
});
export type RaExplanationOutput = z.infer < typeof RaExplanationOutputSchema > ;

export async function explainRaQuery(
    input: RaExplanationInput
): Promise < RaExplanationOutput > {
    return explainRaQueryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'explainRaQueryPrompt',
    input: {
        schema: RaExplanationInputSchema
    },
    output: {
        schema: RaExplanationOutputSchema
    },
    prompt: `You are an expert in Relational Algebra.
Given the following Relational Algebra (RA) query and the database schema, provide a clear, step-by-step natural language explanation of what the query does.
Describe each operation, what it achieves, and what the overall result of the query is expected to be.
Assume standard RA operators: Π (Projection), σ (Selection), ρ (Rename), ⋈ (Natural Join), × (Cartesian Product), ∪ (Union), ∩ (Intersection), − (Set Difference), ÷ (Division).

Format your entire explanation using simple HTML tags such as <p>, <strong>, <em>, <ul>, <li>, and <br /> for line breaks. Do not include any CSS or <script> tags. Ensure the HTML is well-formed.

Database Schema:
{{{databaseSchema}}}

Relational Algebra Query:
{{{raQuery}}}

Explanation (as HTML):
`,
});

const explainRaQueryFlow = ai.defineFlow({
    name: 'explainRaQueryFlow',
    inputSchema: RaExplanationInputSchema,
    outputSchema: RaExplanationOutputSchema,
},
async(input) => {
    try {
        const {
            output
        } = await prompt(input);
        if (!output || !output.explanation) {
            return {
                explanation: '',
                error: 'Failed to generate explanation: No output from AI model.'
            };
        }
        return {
            explanation: output.explanation,
            error: output.error
        };
    } catch (e) {
        console.error('Error in explainRaQueryFlow:', e);
        return {
            explanation: '',
            error: e instanceof Error ? e.message : 'An unknown error occurred during explanation generation.'
        };
    }
});

