import { Star, X, Check, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { FeedbackModal } from './ui/FeedbackModal';
import { TestRatingModal } from './ui/TestRatingModal';

interface PromptIdea {
  id: string;
  renderer: string;
  rewardEstimate: number;
  title: string;
  preview: string;
  status: 'Proposed' | 'Approved' | 'Pending';
  parentStructureId?: string;
}

interface PromptCardProps {
  idea: PromptIdea;
  onTestLive: () => void;
  onRemove?: () => void;
  onApprove?: () => void;
  onStatusChange?: (newStatus: 'Pending') => void;
}

export function PromptCard({ idea, onTestLive, onRemove, onApprove, onStatusChange }: PromptCardProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [showFullIdea, setShowFullIdea] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTestRatingModal, setShowTestRatingModal] = useState(false);

  const handleApprove = () => {
    // Handle the approval logic here
    console.log('Approved idea:', idea.id);
    setShowConfirmation(false);
    if (onApprove) {
      onApprove();
    }
  };

  const handleRemove = () => {
    // Handle the removal logic here
    console.log('Removed idea:', idea.id);
    setShowRemoveConfirmation(false);
    // You could add a toast notification here or update the status
    if (onRemove) {
      onRemove();
    }
  };

  const handleTestClick = () => {
    // First execute the test
    onTestLive();
  };

  const handleFeedbackSubmit = (feedback: string) => {
    console.log('Feedback submitted:', feedback);
    setShowFeedbackModal(false);
    // Handle feedback submission logic
  };

  const handleRatingSubmit = (rating: number, notes?: string) => {
    console.log('Rating submitted:', rating, notes);
    setShowTestRatingModal(false);
    // Handle rating submission logic
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Badge variant="renderer">{idea.renderer}</Badge>
          <Badge variant={idea.status === 'Approved' ? 'success' : idea.status === 'Pending' ? 'warning' : 'default'}>
            {idea.status}
          </Badge>
        </div>

        <div className="mb-4 flex-grow">
          <h2 className="mb-2 text-gray-900">{idea.id}</h2>
          <p className={`text-gray-600 text-sm leading-relaxed mb-2 ${!showFullIdea ? 'line-clamp-3' : ''}`}>
            {idea.preview}
          </p>
          <button 
            onClick={() => setShowFullIdea(!showFullIdea)}
            className="text-[#525866] text-sm hover:underline"
          >
            {showFullIdea ? 'Show less ←' : 'Show full idea →'}
          </button>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleTestClick}
          >
            Test
          </Button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
            aria-label="Add feedback"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback</span>
          </button>
        </div>
      </div>

      {showConfirmation && (
        <ConfirmationModal
          title="Approve Prompt Structure"
          message={`Are you sure you want to approve "${idea.title}" and add it to the active prompt structures?`}
          confirmText="Approve & Add"
          cancelText="Cancel"
          onConfirm={handleApprove}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showRemoveConfirmation && (
        <ConfirmationModal
          title="Remove Prompt Structure"
          message={`Are you sure you want to remove "${idea.title}" from the active prompt structures?`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleRemove}
          onCancel={() => setShowRemoveConfirmation(false)}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          promptId={idea.id}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setShowFeedbackModal(false)}
        />
      )}

      {showTestRatingModal && (
        <TestRatingModal
          promptId={idea.id}
          onSubmit={handleRatingSubmit}
          onCancel={() => setShowTestRatingModal(false)}
        />
      )}
    </>
  );
}