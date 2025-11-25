import { useState } from 'react';
import { PromptCard } from './PromptCard';
import { TestLiveModal } from './TestLiveModal';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';

type TabView = 'proposed' | 'pending' | 'approved';

interface TodaysIdeasPageProps {
  currentTab: TabView;
  ideasByDay: Record<string, PromptIdea[]>;
  setIdeasByDay: React.Dispatch<React.SetStateAction<Record<string, PromptIdea[]>>>;
}

interface PromptIdea {
  id: string;
  renderer: string;
  rewardEstimate: number;
  title: string;
  preview: string;
  status: 'Proposed' | 'Approved' | 'Pending';
  parentStructureId?: string;
  date: string;
}

export function TodaysIdeasPage({ currentTab, ideasByDay, setIdeasByDay }: TodaysIdeasPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<PromptIdea | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Get week days
  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(2025, 10, 24); // Nov 24, 2025 (months are 0-indexed)
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  const currentDate = weekDays[currentDayIndex];
  const currentDateKey = currentDate.toISOString().split('T')[0];
  const ideas = ideasByDay[currentDateKey] || [];

  const handleTestLive = (idea: PromptIdea) => {
    setSelectedIdea(idea);
    setShowModal(true);
  };

  const handleRemoveIdea = (ideaId: string) => {
    setIdeasByDay((prev) => ({
      ...prev,
      [currentDateKey]: prev[currentDateKey].filter((idea) => idea.id !== ideaId),
    }));
  };

  const handleApproveIdea = (ideaId: string) => {
    setIdeasByDay((prev) => ({
      ...prev,
      [currentDateKey]: prev[currentDateKey].map((idea) =>
        idea.id === ideaId ? { ...idea, status: 'Approved' as const } : idea
      ),
    }));
  };

  const handleStatusChange = (ideaId: string, newStatus: 'Pending') => {
    setIdeasByDay((prev) => ({
      ...prev,
      [currentDateKey]: prev[currentDateKey].map((idea) =>
        idea.id === ideaId ? { ...idea, status: newStatus } : idea
      ),
    }));
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (currentTab === 'proposed') return idea.status === 'Proposed';
    if (currentTab === 'pending') return idea.status === 'Pending';
    if (currentTab === 'approved') return idea.status === 'Approved';
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
        <p className="text-gray-600 text-lg mb-6">For the week of 11/24-11/30</p>
        
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
            onApprove={() => handleApproveIdea(idea.id)}
            onStatusChange={(newStatus) => handleStatusChange(idea.id, newStatus)}
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
          onApprove={() => handleApproveIdea(selectedIdea.id)}
        />
      )}
    </>
  );
}