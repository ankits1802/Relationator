
import { Github, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="bg-muted text-muted-foreground py-4 px-6 mt-auto border-t">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm">
        <div className="mb-2 sm:mb-0">
          <p>
            &copy; {new Date().getFullYear()} Relationator. All rights reserved.
          </p>
        </div>
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <p>Version 1.0.0</p>
          <div className="flex items-center space-x-1">
            <span>Made with</span>
            <span className="inline-block transition-all duration-300 hover:filter hover:drop-shadow-[0_0_4px_rgba(239,68,68,1)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-red-500" 
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </span>
            <span>by AutoSQL Team</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="https://github.com/ankits1802/" passHref legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </a>
          </Link>
          <Link href="https://ankits1802-autosql.vercel.app/" passHref legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" aria-label="External Link" className="hover:text-primary transition-colors">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}
