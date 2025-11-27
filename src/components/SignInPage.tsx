import { useState } from 'react';
import { Button } from './ui/Button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SignInPageProps {
  onSignIn: () => void;
}

export function SignInPage({ onSignIn }: SignInPageProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'anatomie1') {
      setIsLoading(true);
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
      onSignIn();
      toast.success('Welcome back, Shawn!');
    } else {
      toast.error('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#525866] rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Anatomie Prompt Hub</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent transition-all"
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            variant="filled"
            className="w-full"
            disabled={isLoading || !password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-6">
          Enter your password to access the dashboard
        </p>
      </div>
    </div>
  );
}
