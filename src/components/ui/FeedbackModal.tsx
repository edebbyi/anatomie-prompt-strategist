import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { toast } from 'sonner@2.0.3';

interface FeedbackModalProps {
  promptId: string;
  onSubmit: (feedback: string) => void;
  onCancel: () => void;
}

export function FeedbackModal({ promptId, onSubmit, onCancel }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (feedback.trim()) {
      const feedbackText = feedback;
      setFeedback('');
      onCancel(); // Close modal first
      onSubmit(feedbackText);
      // Show toast after a brief delay to ensure modal is closed
      setTimeout(() => {
        toast.success('Feedback submitted successfully!');
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Add Feedback</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Share your thoughts about this prompt structure
        </p>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your feedback, suggestions, or notes..."
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent resize-none mb-4"
          autoFocus
        />

        <div className="flex gap-3">
          <Button
            variant="filled"
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            className="flex-1"
          >
            Submit Feedback
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}