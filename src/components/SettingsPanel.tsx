
"use client";
// This file is no longer used and can be safely deleted.
// The display mode toggle has been moved into individual component cards.

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
// import { useDisplayMode } from '@/contexts/DisplayModeContext'; // No longer used here
import { Separator } from '@/components/ui/separator';

export default function SettingsPanel() {
  // const { displayMode, setDisplayMode } = useDisplayMode(); // No longer used here

  // const handleModeChange = (checked: boolean) => {
    // setDisplayMode(checked ? 'numeric' : 'text'); // No longer used here
  // };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Display Settings</h3>
      <Separator />
      <div className="flex items-center justify-between space-x-2 py-2">
        <Label htmlFor="numerical-mode-switch" className="text-sm font-medium">
          Numerical Representation (Global - DEPRECATED)
          <p className="text-xs text-muted-foreground">This global toggle is deprecated. Use toggles in individual cards.</p>
        </Label>
        <Switch
          id="numerical-mode-switch"
          // checked={displayMode === 'numeric'} // No longer used here
          // onCheckedChange={handleModeChange} // No longer used here
          disabled={true} // Disabled as it's deprecated
          aria-label="Toggle numerical representation (Deprecated)"
        />
      </div>
       {/* Future settings can be added here */}
    </div>
  );
}

