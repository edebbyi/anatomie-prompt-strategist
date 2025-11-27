import { useEffect, useState } from 'react';
import { X, Loader2, Download, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'sonner@2.0.3';
import { generateImage } from '../services/replicate';
import { updatePromptIdea } from '../services/airtable';
import exampleImage from 'figma:asset/bc8e32439030c412c06f0354aa9c7aa02f8865df.png';

interface PromptIdea {
  id: string;
  recordId?: string; // Airtable record ID for API calls
  renderer: string;
  rewardEstimate: number;
  title: string;
  preview: string;
  status: 'Proposed' | 'Approved' | 'Pending';
  proposedBy?: string;
  createdAt?: string;
  testImageUrl?: string;
  rating?: number;
}

interface TestLiveModalProps {
  idea: PromptIdea;
  onClose: () => void;
  onStatusChange?: (newStatus: 'Pending' | 'Approved' | 'Declined') => void;
  onApprove?: () => void;
  onTestImageSave?: (recordId: string, imageUrl: string) => void;
  onRatingSave?: (recordId: string, rating: number) => void;
}

export function TestLiveModal({
  idea,
  onClose,
  onStatusChange,
  onApprove,
  onTestImageSave,
  onRatingSave
}: TestLiveModalProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(idea.testImageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seed, setSeed] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(idea.rating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDisapproveModal, setShowDisapproveModal] = useState(false);
  const isApproved = idea.status === 'Approved';

  // Keep local image in sync with Airtable's last saved test image
  useEffect(() => {
    setGeneratedImage(idea.testImageUrl || null);
  }, [idea.id, idea.testImageUrl]);

  // Keep local rating in sync with Airtable
  useEffect(() => {
    setRating(idea.rating || 0);
  }, [idea.id, idea.rating]);

  // Generate image using Replicate API
  const handleGenerateImage = async () => {
    setIsGenerating(true);

    // Change status to Pending when generation starts
    if (onStatusChange && !generatedImage) {
      onStatusChange('Pending');
    }

    try {
      // Call Replicate API based on renderer
      const prediction = await generateImage(idea.renderer, idea.preview);

      if (prediction.status === 'succeeded' && prediction.output) {
        // Get the image URL from the output
        const imageUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        setGeneratedImage(imageUrl);
        setSeed(Math.floor(Math.random() * 999999));
        toast.success('Image generated successfully!');
        await saveTestImage(imageUrl);
      } else if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Image generation failed');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');

      // Fallback to example image for demo purposes
      setGeneratedImage(exampleImage);
      setSeed(Math.floor(Math.random() * 999999));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // Fetch the image as a blob to avoid CORS issues
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${idea.title.replace(/\s+/g, '_')}_${seed}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image. Opening in new tab instead.');
      // Fallback: open in new tab
      window.open(generatedImage, '_blank');
    }
  };

  const handleRatingClick = (stars: number) => {
    setRating(stars);
    saveRating(stars);
  };

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleConfirmApprove = () => {
    if (onApprove) {
      onApprove();
    }
    setShowApproveModal(false);
    onClose();
    toast.success('Image approved successfully!');
  };

  const handleDisapproveClick = () => {
    setShowDisapproveModal(true);
  };

  const handleConfirmDisapprove = async () => {
    if (idea.recordId) {
      try {
        await updatePromptIdea(idea.recordId, { status: 'Declined' });
        onStatusChange?.('Declined');
      } catch (error) {
        console.error('Failed to decline idea', error);
        toast.error('Failed to update status to Declined');
      }
    }

    setShowDisapproveModal(false);
    onClose();
    toast.success('Feedback submitted successfully!');
  };

  const saveTestImage = async (imageUrl: string) => {
    if (!idea.recordId) {
      toast.error('Image generated but missing Airtable record ID to save it.');
      return;
    }

    try {
      await updatePromptIdea(idea.recordId, { testImageUrl: imageUrl });
      onTestImageSave?.(idea.recordId, imageUrl);
      toast.success('Saved test image to Airtable');
    } catch (error) {
      console.error('Failed to save test image to Airtable', error);
      toast.error('Image generated but could not be saved to Airtable');
    }
  };

  const saveRating = async (value: number) => {
    if (!idea.recordId) {
      toast.error('Cannot save rating: missing Airtable record ID.');
      return;
    }

    try {
      await updatePromptIdea(idea.recordId, { rating: value });
      onRatingSave?.(idea.recordId, value);
      toast.success('Rating saved');
    } catch (error) {
      console.error('Failed to save rating to Airtable', error);
      toast.error('Could not save rating');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl flex max-w-7xl w-full h-[90vh] overflow-hidden">
        {/* Left Column - Image (70% width) */}
        <div className="bg-gray-900 flex items-center justify-center p-8" style={{ width: '70%' }}>
          {!generatedImage && !isGenerating && (
            <div className="text-center">
              <p className="text-gray-400 mb-6">Click Generate to create an image</p>
              <Button
                variant="filled"
                onClick={handleGenerateImage}
              >
                Generate Image
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center text-white">
              <Loader2 className="w-16 h-16 mb-4 animate-spin" />
              <p className="text-lg">Generating with {idea.renderer}...</p>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={generatedImage}
                alt="Generated fashion image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Right Column - Details (30% width) */}
        <div className="flex-shrink-0 flex flex-col bg-white" style={{ width: '30%' }}>
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
            <h2 className="text-gray-900">Image Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Idea</label>
              <div className="text-gray-900 leading-relaxed">{idea.id}</div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Status</label>
              <span
                className={`inline-flex items-center justify-start text-xs font-semibold px-3 py-1 rounded-full border ${
                  idea.status === 'Approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : idea.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}
              >
                {idea.status}
              </span>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Created At</label>
              <div className="text-gray-900 leading-relaxed">
                {(() => {
                  if (!idea.createdAt) return 'Unknown';
                  const parsed = new Date(idea.createdAt);
                  return isNaN(parsed.getTime())
                    ? idea.createdAt
                    : parsed.toLocaleString();
                })()}
              </div>
            </div>

            {/* Prompt Section */}
            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Prompt</label>
              <div className="text-gray-900 leading-relaxed max-h-[200px] overflow-y-auto bg-gray-50 p-4 rounded-lg">
                {idea.preview}
              </div>
            </div>

            {/* Renderer Info */}
            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Renderer</label>
              <div className="text-gray-900">{idea.renderer}</div>
            </div>

            {/* Proposed By */}
            {idea.proposedBy && (
              <div className="mb-6">
                <label className="block mb-2 text-gray-700">Proposed By</label>
                <div className="text-gray-900">{idea.proposedBy}</div>
              </div>
            )}

            {/* Seed (only show after generation) */}
            {seed && (
              <div className="mb-6">
                <label className="block mb-2 text-gray-700">Seed</label>
                <div className="text-gray-900">{seed}</div>
              </div>
            )}

            {/* Rating Section - only show after image is generated */}
            {generatedImage && !isGenerating && (
              <div className="mb-6">
                <label className="block mb-2 text-gray-700">Rate this image</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    You rated this {rating} {rating === 1 ? 'star' : 'stars'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 border-t border-gray-200 space-y-3">
            {generatedImage && (
              <>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[#525866] hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
                <Button
                  variant="outline"
                  onClick={handleGenerateImage}
                  className="w-full"
                >
                  Regenerate
                </Button>
                {!isApproved && (
                  <>
                    <Button
                      variant="filled"
                      onClick={handleApproveClick}
                      className="w-full"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDisapproveClick}
                      className="w-full"
                    >
                      Disapprove
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="mb-3 text-gray-900">Approve Image</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to approve this image?</p>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowApproveModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="filled" onClick={handleConfirmApprove} className="flex-1">
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disapprove Confirmation Modal */}
      {showDisapproveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="mb-3 text-gray-900">Disapprove Image</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to disapprove this image?</p>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowDisapproveModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="filled" onClick={handleConfirmDisapprove} className="flex-1">
                Disapprove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
