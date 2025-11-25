import { Button } from './ui/Button';

type PageView = 'today' | 'add-new' | 'history' | 'settings';

interface HeroSectionProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export function HeroSection({ currentPage, onNavigate }: HeroSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h1 className="mb-2">Welcome back, Shawn</h1>
        <p className="text-gray-600">
          Explore and evolve your next generation of prompts
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant={currentPage === 'today' ? 'primary' : 'outline'}
          onClick={() => onNavigate('today')}
        >
          Today's Ideas
        </Button>
        <Button 
          variant="filled"
          onClick={() => onNavigate('add-new')}
        >
          Add New Idea
        </Button>
        <Button 
          variant="outline"
          onClick={() => onNavigate('history')}
        >
          History
        </Button>
        <Button 
          variant="outline"
          onClick={() => onNavigate('settings')}
        >
          Settings
        </Button>
      </div>
    </div>
  );
}