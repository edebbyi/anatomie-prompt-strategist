import { X, Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { toast } from 'sonner';

interface TestRatingModalProps {
  promptId: string;
  onSubmit: (rating: number, notes?: string) => void;
  onCancel: () => void;
}

export function TestRatingModal({ promptId, onSubmit, onCancel }: TestRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      const submittedRating = rating;
      const submittedNotes = notes;
      setRating(0);
      setNotes('');
      onCancel(); // Close modal first
      onSubmit(submittedRating, submittedNotes);
      // Show toast after a brief delay to ensure modal is closed
      setTimeout(() => {
        toast.success('Rating submitted successfully!');
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Rate Test Output</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          How would you rate the quality of the generated image?
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-gray-600 mb-4">
            {rating === 1 && "Poor - Significant issues"}
            {rating === 2 && "Fair - Some issues"}
            {rating === 3 && "Good - Acceptable quality"}
            {rating === 4 && "Very Good - High quality"}
            {rating === 5 && "Excellent - Perfect output"}
          </p>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: Add notes about the test output..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent resize-none mb-4"
        />

        <div className="flex gap-3">
          <Button
            variant="filled"
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1"
          >
            Submit Rating
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}