import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface StructureRecord {
  id: string;
  structureId: string;
  renderer: string;
  skeleton: string;
  status: 'Proposed' | 'Approved' | 'Pending' | 'Declined';
  rewardEstimate: number;
  parentStructure: string;
  approvedAt: string;
  declinedAt?: string;
  createdAt: string;
  rating?: number; // User rating 1-5 stars
}

const mockHistory: StructureRecord[] = [
  {
    id: '001',
    structureId: '67',
    renderer: 'Recraft',
    skeleton: '[Garment Type] stunning luxury [Category]::5 [Modeled by three stunningly beautiful supermodels]::4.5...',
    status: 'Approved',
    rewardEstimate: 4.3,
    parentStructure: '-',
    approvedAt: '2025-11-20',
    createdAt: '2025-11-18',
    rating: 5,
  },
  {
    id: '002',
    structureId: '89',
    renderer: 'ImageFX',
    skeleton: '[Designer Brand] [Garment] Collection::5 [Seasonal Theme] [Model Count and Description]::4.5...',
    status: 'Approved',
    rewardEstimate: 4.7,
    parentStructure: '001',
    approvedAt: '2025-11-21',
    createdAt: '2025-11-19',
    rating: 4,
  },
  {
    id: '003',
    structureId: '102',
    renderer: 'Midjourney',
    skeleton: '[Minimalist/Maximalist] [Garment Category] Collection [Season/Year]::5 [Technical Specifications]::4.5...',
    status: 'Pending',
    rewardEstimate: 4.1,
    parentStructure: '-',
    approvedAt: '-',
    createdAt: '2025-11-22',
    rating: 3,
  },
  {
    id: '004',
    structureId: '115',
    renderer: 'DALL-E',
    skeleton: '[Urban/Rural] fashion photography [Garment Focus]::5 [Model demographics and pose]::4.5...',
    status: 'Declined',
    rewardEstimate: 4.5,
    parentStructure: '001',
    approvedAt: '-',
    declinedAt: '2025-11-22',
    createdAt: '2025-11-22',
    rating: 2,
  },
  {
    id: '005',
    structureId: '128',
    renderer: 'Recraft',
    skeleton: '[Color palette] [Garment] editorial shoot::5 [Fabric details and textures]::5 [Background and setting]::4.5...',
    status: 'Approved',
    rewardEstimate: 4.8,
    parentStructure: '002',
    approvedAt: '2025-11-23',
    createdAt: '2025-11-21',
    rating: 5,
  },
  {
    id: '006',
    structureId: '134',
    renderer: 'Midjourney',
    skeleton: '[Avant-garde] [Material/Fabric] fashion collection::5 [Architectural elements and structure]::4.5 [Artistic vision and concept]::4...',
    status: 'Declined',
    rewardEstimate: 3.9,
    parentStructure: '-',
    approvedAt: '-',
    declinedAt: '2025-11-23',
    createdAt: '2025-11-23',
    rating: 1,
  },
];

export function StructureHistoryPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Proposed' | 'Pending' | 'Approved' | 'Declined'>('All');

  // Sort history by createdAt in descending order (latest first)
  const sortedHistory = [...mockHistory].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filter history by status
  const filteredHistory = statusFilter === 'All' 
    ? sortedHistory 
    : sortedHistory.filter(record => record.status === statusFilter);

  // Group records by week
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as start of week
    return new Date(d.setDate(diff));
  };

  // Group history by weeks
  const weekGroups: StructureRecord[][] = [];
  const weekMap = new Map<string, StructureRecord[]>();

  filteredHistory.forEach(record => {
    const weekStart = getWeekStart(new Date(record.createdAt));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(record);
  });

  // Convert map to array and sort by week start date (descending)
  const sortedWeeks = Array.from(weekMap.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([_, records]) => records);

  const currentWeekRecords = sortedWeeks[currentPage] || [];
  const totalPages = sortedWeeks.length;

  // Get date range for current week
  const getWeekRange = () => {
    if (currentWeekRecords.length === 0) return '';
    const dates = currentWeekRecords.map(r => new Date(r.createdAt));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900">Structure History</h2>
            <p className="text-gray-600 mt-1">
              View all AI-generated prompt structures and their performance history
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-600">
              {getWeekRange()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-gray-700 min-w-[80px] text-center">
                Week {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Filters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              statusFilter === 'All'
                ? 'bg-[#525866] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Proposed')}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              statusFilter === 'Proposed'
                ? 'bg-[#525866] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            Proposed
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              statusFilter === 'Pending'
                ? 'bg-[#525866] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              statusFilter === 'Approved'
                ? 'bg-[#525866] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('Declined')}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              statusFilter === 'Declined'
                ? 'bg-[#525866] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            Declined
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-gray-700">Structure ID</th>
              <th className="px-6 py-4 text-left text-gray-700">Renderer</th>
              <th className="px-6 py-4 text-left text-gray-700">Skeleton</th>
              <th className="px-6 py-4 text-left text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-gray-700">Reward</th>
              <th className="px-6 py-4 text-left text-gray-700">Rating</th>
              <th className="px-6 py-4 text-left text-gray-700">Parent</th>
              <th className="px-6 py-4 text-left text-gray-700">Approved At</th>
              <th className="px-6 py-4 text-left text-gray-700">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentWeekRecords.map((record) => {
              const isExpanded = expandedRows.has(record.id);
              return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">#{record.id}</td>
                  <td className="px-6 py-4 text-gray-700">{record.structureId}</td>
                  <td className="px-6 py-4">
                    <Badge variant="renderer">{record.renderer}</Badge>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-gray-700">
                      {isExpanded ? record.skeleton : `${record.skeleton.slice(0, 60)}...`}
                    </div>
                    <button
                      onClick={() => toggleRow(record.id)}
                      className="flex items-center gap-1 text-[#525866] text-sm mt-1 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Expand
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        record.status === 'Approved' ? 'success' : 
                        record.status === 'Pending' ? 'warning' : 
                        record.status === 'Declined' ? 'declined' : 
                        'default'
                      }
                    >
                      {record.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-700">★ {record.rewardEstimate}</td>
                  <td className="px-6 py-4">
                    {record.rating ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: record.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-gray-700 ml-1">({record.rating})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{record.parentStructure}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.status === 'Declined' && record.declinedAt ? record.declinedAt : record.approvedAt}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{record.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}