import { useState } from 'react';
import { PromptCard } from './PromptCard';
import { TestLiveModal } from './TestLiveModal';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { updatePromptIdea, createPromptStructure } from '../services/airtable';
import { SYSTEM_PROMPT } from '../services/openai';
import { toast } from 'sonner@2.0.3';

type TabView = 'proposed' | 'pending' | 'approved';

interface TodaysIdeasPageProps {
  currentTab: TabView;
  ideasByDay: Record<string, PromptIdea[]>;
  setIdeasByDay: React.Dispatch<React.SetStateAction<Record<string, PromptIdea[]>>>;
  onRefresh: () => void;
}

interface PromptIdea {
  id: string;
  recordId?: string; // Airtable record ID for API calls
  renderer: string;
  rewardEstimate: number;
  title: string;
  preview: string;
  status: 'Proposed' | 'Approved' | 'Pending' | 'Declined';
  parentStructureId?: string;
  parentRecordId?: string;
  date: string;
  proposedBy?: string;
  testImageUrl?: string;
  feedback?: string;
  rating?: number;
}

export function TodaysIdeasPage({ currentTab, ideasByDay, setIdeasByDay, onRefresh }: TodaysIdeasPageProps) {
  // Get current week (Mon-Sun) using local timezone
  const getWeekDays = () => {
    const today = new Date();
    const days = [];
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const mondayOffset = (dayOfWeek + 6) % 7; // convert to Monday-start
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(today.getDate() - mondayOffset);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const weekDays = getWeekDays();
  const today = new Date();
  const mondayIndex = (today.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday

  const [showModal, setShowModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<PromptIdea | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(mondayIndex);

  const currentDate = weekDays[currentDayIndex];
  // Format date in local timezone as YYYY-MM-DD
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const currentDateKey = `${year}-${month}-${day}`;
  const ideas = ideasByDay[currentDateKey] || [];

  const handleTestLive = (idea: PromptIdea) => {
    setSelectedIdea(idea);
    setShowModal(true);
  };

  const handleTestImageSave = (recordId: string, imageUrl: string) => {
    setIdeasByDay(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(dayKey => {
        next[dayKey] = next[dayKey].map(idea =>
          idea.recordId === recordId ? { ...idea, testImageUrl: imageUrl } : idea
        );
      });
      return next;
    });
  };

  const handleRatingSave = (recordId: string, rating: number) => {
    setIdeasByDay(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(dayKey => {
        next[dayKey] = next[dayKey].map(idea =>
          idea.recordId === recordId ? { ...idea, rating } : idea
        );
      });
      return next;
    });
  };

  const handleRemoveIdea = (ideaId: string) => {
    setIdeasByDay((prev) => ({
      ...prev,
      [currentDateKey]: prev[currentDateKey].filter((idea) => idea.id !== ideaId),
    }));
  };

  const handleApproveIdea = async (idea: PromptIdea) => {
    if (!idea.recordId) {
      toast.error('Cannot approve: missing record ID');
      return;
    }

    try {
      // Create structure linked to this idea
      const newStruct = await createPromptStructure({
        skeleton: idea.preview,
        renderer: idea.renderer,
        sourceIdeaRecordId: idea.recordId,
        aiScore: idea.rewardEstimate,
        modelUsed: import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.1',
        systemPrompt: SYSTEM_PROMPT,
      });

      // Update idea status in Airtable
      await updatePromptIdea(idea.recordId, {
        status: 'Approved',
        approvedAt: new Date().toISOString(),
        structureId: newStruct.structureId,
      });

      // Update local state
      setIdeasByDay((prev) => ({
        ...prev,
        [currentDateKey]: prev[currentDateKey].map((i) =>
          i.id === idea.id ? { ...i, status: 'Approved' as const } : i
        ),
      }));

      toast.success('Idea approved and moved to structures.');
      onRefresh?.();
    } catch (error) {
      console.error('Error approving idea:', error);
      toast.error('Failed to approve idea.');
    }
  };

  const handleStatusChange = async (ideaId: string, newStatus: 'Pending' | 'Approved' | 'Declined') => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea?.recordId) {
      toast.error('Cannot update status: missing record ID');
      return;
    }

    try {
      await updatePromptIdea(idea.recordId, { status: newStatus });
      setIdeasByDay((prev) => ({
        ...prev,
        [currentDateKey]: prev[currentDateKey].map((i) =>
          i.id === ideaId ? { ...i, status: newStatus } : i
        ),
      }));
      if (newStatus === 'Approved') {
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status in Airtable');
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    const status = idea.status.toLowerCase();
    if (currentTab === 'proposed') return status === 'proposed';
    if (currentTab === 'pending') return status === 'pending';
    if (currentTab === 'approved') return status === 'approved';
    return true;
  });

  const formatDateHeader = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex < weekDays.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-gray-600 text-lg mb-6">This week</p>
        
        {/* Day Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={goToPreviousDay}
            disabled={currentDayIndex === 0}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex-1 text-gray-600 text-lg">{formatDateHeader(currentDate)}</div>
          
          <button
            onClick={goToNextDay}
            disabled={currentDayIndex === weekDays.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredIdeas.map((idea) => (
          <PromptCard
            key={idea.id}
            idea={idea}
            onTestLive={() => handleTestLive(idea)}
            onRemove={() => handleRemoveIdea(idea.id)}
            onApprove={() => handleApproveIdea(idea)}
            onStatusChange={(newStatus) => handleStatusChange(idea.id, newStatus)}
            onDataChange={onRefresh}
          />
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <PartyPopper className="w-20 h-20 mb-4 text-[#525866]" />
          <p className="text-xl text-gray-700">All done for today!</p>
          <p className="text-sm mt-2">Great job reviewing all your prompt ideas.</p>
        </div>
      )}

      {showModal && selectedIdea && (
        <TestLiveModal
          idea={selectedIdea}
          onClose={() => setShowModal(false)}
          onStatusChange={(newStatus) => handleStatusChange(selectedIdea.id, newStatus)}
          onApprove={() => handleApproveIdea(selectedIdea)}
          onTestImageSave={handleTestImageSave}
          onRatingSave={handleRatingSave}
        />
      )}
    </>
  );
}
