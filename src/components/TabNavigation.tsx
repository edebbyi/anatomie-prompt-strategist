type TabView = 'proposed' | 'pending' | 'approved';

interface TabNavigationProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

export function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabView; label: string }[] = [
    { id: 'proposed', label: 'Proposed' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
  ];

  return (
    <div className="flex gap-3 mb-8 pb-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2 rounded-full transition-all duration-200 ${
            currentTab === tab.id
              ? 'bg-[#525866] text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
