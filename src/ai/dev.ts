
import { config } from 'dotenv';
config();

import '@/ai/flows/natural-language-to-ra-sql.ts';
import '@/ai/flows/fd-explanation-generator.ts';
import '@/ai/flows/ai-normalizer.ts';
import '@/ai/flows/ra-to-sql-flow.ts';
import '@/ai/flows/ra-explanation-flow.ts';
