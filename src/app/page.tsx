
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Binary, FunctionSquare, GitCompareArrows, GitMergeIcon } from 'lucide-react';

export default function DashboardPage() {
  // specialHoverClasses is no longer needed here, as it's applied in the base Card component

  return (
    <div className="space-y-8">
      <Card className="shadow-md"> {/* No need for specialHoverClasses here anymore */}
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Relationator</CardTitle>
          <CardDescription>
            Your central hub for database relation tools and analysis. Explore functional dependencies, relational algebra, normalization, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Navigate using the sidebar or use the quick links below to access available tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/relationator" passHref>
              <Card className="cursor-pointer h-full"> {/* Will get base hover from ui/card.tsx */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    FD & Normalization Tool
                  </CardTitle>
                  <Binary className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analyze FDs, attribute closures, normal forms, and more.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/relational-algebra" passHref>
              <Card className="cursor-pointer h-full"> {/* Will get base hover */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    RA Query Tool
                  </CardTitle>
                  <FunctionSquare className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Construct Relational Algebra, TRC, and other database queries.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/fd-equivalence" passHref>
              <Card className="cursor-pointer h-full"> {/* Will get base hover */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    FD Equivalence Checker
                  </CardTitle>
                  <GitCompareArrows className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Check if two sets of functional dependencies are equivalent.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/decomposition-checker" passHref>
              <Card className="cursor-pointer h-full"> {/* Will get base hover */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    Decomposition Checker
                  </CardTitle>
                  <GitMergeIcon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analyze decomposition properties like lossless-join and dependency preservation.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md"> {/* No need for specialHoverClasses here anymore */}
        <CardHeader>
            <CardTitle className="text-xl">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the <Link href="/relationator" className="text-primary hover:underline font-medium">FD & Normalization Tool</Link> to input your database schema and dependencies.</li>
                <li>Explore the <Link href="/relational-algebra" className="text-primary hover:underline font-medium">RA Query Tool</Link> for constructing algebraic queries.</li>
                <li>Check for <Link href="/fd-equivalence" className="text-primary hover:underline font-medium">FD Equivalence</Link> between two sets of dependencies.</li>
                <li>Analyze <Link href="/decomposition-checker" className="text-primary hover:underline font-medium">Decomposition Properties</Link> like lossless-join and dependency preservation.</li>
                <li>Utilize AI-powered features for explanations and query translations within the tools.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
