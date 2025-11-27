import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

interface AddNewIdeaPageProps {
  onBack: () => void;
  onSubmit: (renderer: string, skeleton: string) => void;
}

export function AddNewIdeaPage({ onBack, onSubmit }: AddNewIdeaPageProps) {
  const [renderer, setRenderer] = useState('');
  const [skeleton, setSkeleton] = useState('');
  const [notes, setNotes] = useState('');
  const [proposedBy, setProposedBy] = useState('AI System');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(renderer, skeleton);
    onBack();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Ideas
        </button>

        <h2 className="text-gray-900">Add New Prompt Structure Idea</h2>
        <p className="text-gray-600 mt-1">
          Create a new AI-generated prompt structure for testing and approval
        </p>
      </div>

      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700">
              Renderer <span className="text-red-500">*</span>
            </label>
            <select
              value={renderer}
              onChange={(e) => setRenderer(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent"
            >
              <option value="">Select renderer...</option>
              <option value="ImageFX">ImageFX</option>
              <option value="Recraft">Recraft</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">
              Prompt Skeleton <span className="text-red-500">*</span>
            </label>
            <textarea
              value={skeleton}
              onChange={(e) => setSkeleton(e.target.value)}
              required
              rows={8}
              placeholder="Enter your prompt structure using placeholders like [Garment Type], [Designer], etc..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent resize-none"
            />
            <p className="mt-2 text-sm text-gray-500">
              Use [Placeholder] syntax for variables and ::weight for emphasis weights
            </p>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">
              Proposed By <span className="text-red-500">*</span>
            </label>
            <select
              value={proposedBy}
              onChange={(e) => setProposedBy(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent"
            >
              <option value="">Select who proposed this idea...</option>
              <option value="Shawn">Shawn</option>
              <option value="Design Team">Design Team</option>
              <option value="AI System">AI System</option>
              <option value="Marketing Team">Marketing Team</option>
              <option value="External Partner">External Partner</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional context or notes about this structure..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="filled" className="flex-1">
              Submit Idea
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
