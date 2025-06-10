// D:\ExpenseSplitter\frontend\src\App.jsx
import React from 'react';
// Import the Shadcn Button component using the configured alias
import { Button } from '@/components/ui/button';

function App() {
  // You can add your state and API call logic here later
  // For now, let's keep it simple to demonstrate the button

  const handleButtonClick = (variant) => {
    alert(`You clicked the ${variant} button!`);
  };

  return (
    // Applying basic Tailwind classes for centering and background/text colors
    // bg-background and text-foreground come from Shadcn's CSS variables for theming
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 space-y-4">
      <h1 className="text-4xl font-bold mb-4">Expense Splitter Frontend</h1>
      <p className="text-lg">This is your MERN app with Shadcn UI!</p>

      {/* Default Button */}
      <Button onClick={() => handleButtonClick('default')}>
        Default Button
      </Button>

      {/* Outline Button */}
      <Button variant="outline" onClick={() => handleButtonClick('outline')}>
        Outline Button
      </Button>

      {/* Secondary Button */}
      <Button variant="secondary" onClick={() => handleButtonClick('secondary')}>
        Secondary Button
      </Button>

      {/* Destructive Button */}
      <Button variant="destructive" onClick={() => handleButtonClick('destructive')}>
        Destructive Button
      </Button>

      {/* Ghost Button */}
      <Button variant="ghost" onClick={() => handleButtonClick('ghost')}>
        Ghost Button
      </Button>

      {/* Link Button */}
      <Button variant="link" onClick={() => handleButtonClick('link')}>
        Link Button
      </Button>

      {/* Button with an icon (you'd need to install an icon library like lucide-react for this)
      <Button>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </Button>
      */}

      <p className="mt-8 text-sm text-muted-foreground">
        Explore Shadcn UI components for your application.
      </p>
    </div>
  );
}

export default App;