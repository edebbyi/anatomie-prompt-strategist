import { useState } from 'react';
import { SignInPage } from './components/SignInPage';
import { HeroSection } from './components/HeroSection';
import { TabNavigation } from './components/TabNavigation';
import { TodaysIdeasPage } from './components/TodaysIdeasPage';
import { AddNewIdeaPage } from './components/AddNewIdeaPage';
import { StructureHistoryPage } from './components/StructureHistoryPage';
import { DailyBatchSettingsPage } from './components/DailyBatchSettingsPage';
import { Toaster, toast } from 'sonner@2.0.3';

type PageView = 'today' | 'add-new' | 'history' | 'settings';
type TabView = 'proposed' | 'pending' | 'approved';

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

// Mock ideas for different days
const mockIdeasByDay: Record<string, PromptIdea[]> = {
  '2025-11-24': [
    {
      id: '#001',
      renderer: 'Recraft',
      rewardEstimate: 4.3,
      title: 'New Prompt Structure Idea #001',
      preview: '[Garment Type] stunning luxury [Category]::5 [Modeled by three stunningly beautiful supermodels]::4.5 [Detail 1]::5 [Detail 2]::5...',
      status: 'Proposed',
      date: '2025-11-24',
    },
    {
      id: '#002',
      renderer: 'ImageFX',
      rewardEstimate: 4.7,
      title: 'New Prompt Structure Idea #002',
      preview: '[Designer Brand] [Garment] Collection::5 [Seasonal Theme] [Model Count and Description]::4.5 [Photography Style]...',
      status: 'Approved',
      date: '2025-11-24',
    },
    {
      id: '#003',
      renderer: 'Midjourney',
      rewardEstimate: 4.1,
      title: 'New Prompt Structure Idea #003',
      preview: '[Minimalist/Maximalist] [Garment Category] Collection [Season/Year]::5 [Technical Specifications]::4.5 [Artistic Direction]...',
      status: 'Pending',
      date: '2025-11-24',
    },
  ],
  '2025-11-25': [
    {
      id: '#004',
      renderer: 'DALL-E',
      rewardEstimate: 4.5,
      title: 'New Prompt Structure Idea #004',
      preview: '[Urban/Rural] fashion photography [Garment Focus]::5 [Model demographics and pose]::4.5 [Lighting and atmosphere]...',
      status: 'Proposed',
      date: '2025-11-25',
    },
    {
      id: '#005',
      renderer: 'Recraft',
      rewardEstimate: 4.8,
      title: 'New Prompt Structure Idea #005',
      preview: '[Color palette] [Garment] editorial shoot::5 [Fabric details and textures]::5 [Background and setting]::4.5...',
      status: 'Approved',
      date: '2025-11-25',
    },
    {
      id: '#006',
      renderer: 'ImageFX',
      rewardEstimate: 4.2,
      title: 'New Prompt Structure Idea #006',
      preview: '[Decade-inspired] [Category] collection::5 [Model styling and makeup]::4.5 [Accessories and props]::4...',
      status: 'Proposed',
      date: '2025-11-25',
    },
  ],
  '2025-11-26': [
    {
      id: '#007',
      renderer: 'Midjourney',
      rewardEstimate: 4.6,
      title: 'New Prompt Structure Idea #007',
      preview: '[Avant-garde] [Material/Fabric] fashion collection::5 [Architectural elements]::4.5 [Artistic vision]::4...',
      status: 'Pending',
      date: '2025-11-26',
    },
    {
      id: '#008',
      renderer: 'DALL-E',
      rewardEstimate: 4.4,
      title: 'New Prompt Structure Idea #008',
      preview: '[High fashion] runway presentation::5 [Model poses and expression]::4.5 [Venue and atmosphere]::4...',
      status: 'Approved',
      date: '2025-11-26',
    },
    {
      id: '#009',
      renderer: 'Recraft',
      rewardEstimate: 4.9,
      title: 'New Prompt Structure Idea #009',
      preview: '[Sustainable fashion] [Eco-friendly materials]::5 [Natural lighting]::4.5 [Outdoor setting]::4.5...',
      status: 'Proposed',
      date: '2025-11-26',
    },
  ],
  '2025-11-27': [
    {
      id: '#010',
      renderer: 'ImageFX',
      rewardEstimate: 4.3,
      title: 'New Prompt Structure Idea #010',
      preview: '[Street style] fashion editorial::5 [Urban backdrop]::4.5 [Candid poses]::4...',
      status: 'Pending',
      date: '2025-11-27',
    },
    {
      id: '#011',
      renderer: 'Midjourney',
      rewardEstimate: 4.7,
      title: 'New Prompt Structure Idea #011',
      preview: '[Monochrome] [Textile focus] lookbook::5 [Dramatic lighting]::5 [Minimalist composition]::4.5...',
      status: 'Approved',
      date: '2025-11-27',
    },
    {
      id: '#012',
      renderer: 'DALL-E',
      rewardEstimate: 4.5,
      title: 'New Prompt Structure Idea #012',
      preview: '[Vintage] [Era-specific] fashion shoot::5 [Period-accurate styling]::4.5 [Retro atmosphere]::4...',
      status: 'Proposed',
      date: '2025-11-27',
    },
  ],
  '2025-11-28': [
    {
      id: '#013',
      renderer: 'Recraft',
      rewardEstimate: 4.8,
      title: 'New Prompt Structure Idea #013',
      preview: '[Couture] [Handcrafted details] collection::5 [Luxury fabrics]::5 [Studio lighting]::4.5...',
      status: 'Approved',
      date: '2025-11-28',
    },
    {
      id: '#014',
      renderer: 'ImageFX',
      rewardEstimate: 4.2,
      title: 'New Prompt Structure Idea #014',
      preview: '[Athleisure] [Performance wear] campaign::5 [Active poses]::4.5 [Dynamic composition]::4...',
      status: 'Pending',
      date: '2025-11-28',
    },
    {
      id: '#015',
      renderer: 'Midjourney',
      rewardEstimate: 4.6,
      title: 'New Prompt Structure Idea #015',
      preview: '[Editorial] [Conceptual fashion] art piece::5 [Surreal elements]::4.5 [Bold styling]::4.5...',
      status: 'Proposed',
      date: '2025-11-28',
    },
  ],
  '2025-11-29': [
    {
      id: '#016',
      renderer: 'DALL-E',
      rewardEstimate: 4.4,
      title: 'New Prompt Structure Idea #016',
      preview: '[Formal wear] [Evening attire] collection::5 [Elegant poses]::4.5 [Sophisticated setting]::4...',
      status: 'Approved',
      date: '2025-11-29',
    },
    {
      id: '#017',
      renderer: 'Recraft',
      rewardEstimate: 4.9,
      title: 'New Prompt Structure Idea #017',
      preview: '[Resort wear] [Vacation styling]::5 [Tropical backdrop]::5 [Natural light]::4.5...',
      status: 'Pending',
      date: '2025-11-29',
    },
    {
      id: '#018',
      renderer: 'ImageFX',
      rewardEstimate: 4.3,
      title: 'New Prompt Structure Idea #018',
      preview: '[Accessories focus] [Detail shots] editorial::5 [Close-up composition]::4.5 [Texture emphasis]::4...',
      status: 'Proposed',
      date: '2025-11-29',
    },
  ],
  '2025-11-30': [
    {
      id: '#019',
      renderer: 'Midjourney',
      rewardEstimate: 4.7,
      title: 'New Prompt Structure Idea #019',
      preview: '[Gender-neutral] [Contemporary fashion]::5 [Diverse models]::4.5 [Modern aesthetic]::4.5...',
      status: 'Approved',
      date: '2025-11-30',
    },
    {
      id: '#020',
      renderer: 'DALL-E',
      rewardEstimate: 4.5,
      title: 'New Prompt Structure Idea #020',
      preview: '[Knitwear] [Cozy textures] collection::5 [Soft lighting]::4.5 [Intimate setting]::4...',
      status: 'Pending',
      date: '2025-11-30',
    },
    {
      id: '#021',
      renderer: 'Recraft',
      rewardEstimate: 4.6,
      title: 'New Prompt Structure Idea #021',
      preview: '[Bold prints] [Pattern mixing] editorial::5 [Vibrant colors]::5 [Creative styling]::4.5...',
      status: 'Proposed',
      date: '2025-11-30',
    },
  ],
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('today');
  const [currentTab, setCurrentTab] = useState<TabView>('proposed');
  const [ideasByDay, setIdeasByDay] = useState<Record<string, PromptIdea[]>>(mockIdeasByDay);

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
    // Get today's date (Nov 24, 2025)
    const today = '2025-11-24';
    
    // Generate new ID
    const allIdeas = Object.values(ideasByDay).flat();
    const maxId = allIdeas.length > 0 
      ? Math.max(...allIdeas.map(idea => parseInt(idea.id.replace('#', ''))))
      : 0;
    const newId = `#${String(maxId + 1).padStart(3, '0')}`;
    
    const newIdea: PromptIdea = {
      id: newId,
      renderer,
      rewardEstimate: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // Random 3.5-5.0
      title: `New Prompt Structure Idea ${newId}`,
      preview: skeleton,
      status: 'Proposed',
      date: today,
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