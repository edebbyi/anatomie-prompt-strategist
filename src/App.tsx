import { useEffect, useState } from 'react';
import { SignInPage } from './components/SignInPage';
import { HeroSection } from './components/HeroSection';
import { TabNavigation } from './components/TabNavigation';
import { TodaysIdeasPage } from './components/TodaysIdeasPage';
import { AddNewIdeaPage } from './components/AddNewIdeaPage';
import { StructureHistoryPage } from './components/StructureHistoryPage';
import { DailyBatchSettingsPage } from './components/DailyBatchSettingsPage';
import { Toaster, toast } from 'sonner@2.0.3';
import { fetchPromptIdeasByDate } from './services/airtable';
import type { PromptIdea as AirtableIdea } from './types/airtable';

type PageView = 'today' | 'add-new' | 'history' | 'settings';
type TabView = 'proposed' | 'pending' | 'approved';

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
  createdAt?: string;
  date: string;
  proposedBy?: string;
  testImageUrl?: string;
  feedback?: string;
  rating?: number;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('today');
  const [currentTab, setCurrentTab] = useState<TabView>('proposed');
  const [ideasByDay, setIdeasByDay] = useState<Record<string, PromptIdea[]>>({});

  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    try {
      // Fetch each status view separately so filters align with the UI tabs
      const [proposed, pending, approved] = await Promise.all([
        fetchPromptIdeasByDate('Proposed'),
        fetchPromptIdeasByDate('Pending'),
        fetchPromptIdeasByDate('Approved'),
      ]);

      const merged: Record<string, PromptIdea[]> = {};

      const mergeIdeas = (ideasByDate: Record<string, AirtableIdea[]>, status: PromptIdea['status']) => {
        Object.entries(ideasByDate).forEach(([dateKey, ideas]) => {
          if (!merged[dateKey]) merged[dateKey] = [];
          ideas.forEach((idea) => {
            merged[dateKey].push(mapAirtableIdeaToUi(idea, status));
          });
        });
      };

      mergeIdeas(proposed, 'Proposed');
      mergeIdeas(pending, 'Pending');
      mergeIdeas(approved, 'Approved');

      setIdeasByDay(merged);
    } catch (error) {
      console.error('Failed to load ideas from Airtable', error);
      toast.error('Could not load today’s ideas from Airtable.');
    }
  }

  function mapAirtableIdeaToUi(idea: AirtableIdea, statusOverride?: PromptIdea['status']): PromptIdea {
    // Format date in local timezone as YYYY-MM-DD
    let dateKey: string;
    if (idea.createdAt) {
      const createdDate = new Date(idea.createdAt);
      const year = createdDate.getFullYear();
      const month = String(createdDate.getMonth() + 1).padStart(2, '0');
      const day = String(createdDate.getDate()).padStart(2, '0');
      dateKey = `${year}-${month}-${day}`;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateKey = `${year}-${month}-${day}`;
    }

    const friendlyId = idea.ideaId ? `#${String(idea.ideaId).padStart(3, '0')}` : idea.id;

    return {
      id: friendlyId,
      recordId: idea.id, // Keep Airtable record ID for API calls
      renderer: idea.renderer,
      rewardEstimate: idea.reward ?? 0,
      title: idea.notes || 'Prompt Idea',
      preview: idea.skeleton,
      status: statusOverride || normalizeStatus(idea.status),
      parentStructureId: idea.structureId ? String(idea.structureId) : undefined,
      parentRecordId: idea.parent?.[0],
      createdAt: idea.createdAt,
      date: dateKey,
      proposedBy: idea.proposedBy,
      testImageUrl: idea.testImageUrl,
      feedback: idea.feedback,
      rating: idea.rating,
    };
  }

  function normalizeStatus(status?: string) {
    if (!status) return 'Proposed';
    const clean = status.trim().toLowerCase();
    if (clean === 'approved') return 'Approved';
    if (clean === 'pending') return 'Pending';
    if (clean === 'declined') return 'Declined';
    return 'Proposed';
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <SignInPage onSignIn={() => setIsAuthenticated(true)} />
        <Toaster position="top-right" />
      </>
    );
  }

  const handleAddIdea = (renderer: string, skeleton: string) => {
    // Get today's date in local timezone (YYYY-MM-DD)
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    // Generate new ID
    const allIdeas = Object.values(ideasByDay).flat();
    const maxId = allIdeas.length > 0 
      ? Math.max(...allIdeas.map(idea => parseInt(idea.id.replace('#', ''))))
      : 0;
    const newId = `#${String(maxId + 1).padStart(3, '0')}`;
    
    const newIdea: PromptIdea = {
      id: newId,
      recordId: '', // Will be set when saved to Airtable
      renderer,
      rewardEstimate: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // Random 3.5-5.0
      title: `New Prompt Structure Idea ${newId}`,
      preview: skeleton,
      status: 'Proposed',
      date: today,
      proposedBy: 'AI System',
    };

    setIdeasByDay(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), newIdea],
    }));

    toast.success('Idea submitted successfully!', {
      description: 'Your new structure idea has been added to today\'s Proposed ideas.',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <div className="max-w-[1400px] mx-auto px-12 py-8">
        <HeroSection
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />

        {currentPage === 'today' && (
          <>
            <div className="mb-6">
              <h2 className="text-gray-900">Today's Ideas</h2>
            </div>
            <TabNavigation 
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            />
            <TodaysIdeasPage 
              currentTab={currentTab} 
              ideasByDay={ideasByDay}
              setIdeasByDay={setIdeasByDay}
              onRefresh={loadIdeas}
            />
          </>
        )}

        {currentPage === 'add-new' && (
          <AddNewIdeaPage 
            onBack={() => setCurrentPage('today')} 
            onSubmit={handleAddIdea}
          />
        )}
        {currentPage === 'history' && <StructureHistoryPage />}
        {currentPage === 'settings' && <DailyBatchSettingsPage />}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
