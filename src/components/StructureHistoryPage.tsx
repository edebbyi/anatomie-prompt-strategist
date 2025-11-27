import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { fetchPromptIdeasByDate, fetchPromptStructures } from '../services/airtable';
import { PromptIdea } from '../types/airtable';
import { format } from 'date-fns';

type FilterStatus = 'All' | 'Approved' | 'Declined' | 'Pending' | 'Proposed';

interface HistoryRecord {
  id: string;
  structureId?: number;
  structureRecordId?: string;
  structureNumber?: number;
  parentRecordId?: string;
  parentNumber?: number;
  renderer: string;
  skeleton: string;
  status: 'Approved' | 'Declined' | 'Pending' | 'Proposed';
  rating?: number;
  parentStructure?: string;
  approvedAt?: string;
  declinedAt?: string;
  createdAt?: string;
  feedback?: string;
  ideaId?: number;
}

export function StructureHistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);

      const [allIdeas, allStructures] = await Promise.all([
        fetchPromptIdeasByDate(import.meta.env.VITE_VIEW_IDEAS_ALL),
        fetchPromptStructures(import.meta.env.VITE_VIEW_STRUCTURES_ALL)
      ]);

      const structureIdMap = new Map<string, number>();
      allStructures.forEach(struct => {
        if (struct.id && struct.structureId !== undefined) {
          structureIdMap.set(struct.id, struct.structureId);
        }
      });

      const mapped: HistoryRecord[] = flattenIdeas(allIdeas)
        .map(record => ({
          ...record,
          structureNumber:
            record.structureId ||
            (record.structureRecordId ? structureIdMap.get(record.structureRecordId) : undefined),
          parentNumber: record.parentRecordId ? structureIdMap.get(record.parentRecordId) : undefined
        }))
        .sort((a, b) => {
          const aDate = a.approvedAt || a.declinedAt || a.createdAt || '';
          const bDate = b.approvedAt || b.declinedAt || b.createdAt || '';
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

      setHistory(mapped);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load history from Airtable.');
    } finally {
      setLoading(false);
    }
  }

  function flattenIdeas(byDate: Record<string, PromptIdea[]>) {
    const list: HistoryRecord[] = [];
    Object.values(byDate).forEach((ideas) => {
      ideas.forEach((idea) => {
        list.push({
          id: idea.id,
          ideaId: idea.ideaId,
          structureId: idea.structureId,
          structureRecordId: idea.structureRecordId,
          renderer: idea.renderer,
          skeleton: idea.skeleton,
          status: idea.status as HistoryRecord['status'],
          rating: idea.rating,
          parentStructure: idea.parent?.[0],
          parentRecordId: idea.parentRecordId,
          approvedAt: idea.approvedAt,
          declinedAt: idea.declinedAt,
          createdAt: idea.createdAt,
          feedback: idea.feedback,
        });
      });
    });
    return list;
  }

  const filteredHistory = useMemo(() => {
    if (filterStatus === 'All') return history;
    return history.filter((item) => item.status === filterStatus);
  }, [history, filterStatus]);

  const toggleRow = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d, yyyy');
  };

  const displayId = (ideaId?: number) => (ideaId !== undefined ? `#${String(ideaId).padStart(3, '0')}` : '—');

  // Group by week (Sunday start) for navigation similar to the reference UI
  const weekGroups = useMemo(() => {
    const map = new Map<string, HistoryRecord[]>();
    filteredHistory.forEach(record => {
      const baseDate = record.createdAt ? new Date(record.createdAt) : new Date();
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() - baseDate.getDay()); // Sunday start
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString();
      const bucket = map.get(key) || [];
      bucket.push(record);
      map.set(key, bucket);
    });

    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, records]) => ({
        weekStart: new Date(key),
        records: records.sort((a, b) => {
          const aDate = a.createdAt || '';
          const bDate = b.createdAt || '';
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
      }));
  }, [filteredHistory]);

  const currentWeek = weekGroups[currentWeekIndex] || { records: [], weekStart: new Date() };
  const totalWeeks = weekGroups.length || 1;

  const weekRangeLabel = useMemo(() => {
    if (!currentWeek.records.length) return '';
    const dates = currentWeek.records
      .map(r => r.createdAt ? new Date(r.createdAt) : null)
      .filter(Boolean) as Date[];
    if (dates.length === 0) return '';
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    return `${format(minDate, 'MMM d, yyyy')} - ${format(maxDate, 'MMM d, yyyy')}`;
  }, [currentWeek]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <Button variant="ghost" className="mt-2" onClick={loadHistory}>
          Retry
        </Button>
      </div>
    );
  }

  const statusFilters: FilterStatus[] = ['All', 'Proposed', 'Pending', 'Approved', 'Declined'];

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
          <div className="flex items-center gap-3">
            <div className="text-gray-600 text-sm">{weekRangeLabel || 'No data'}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                disabled={currentWeekIndex === 0}
                className="px-3"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-gray-700 min-w-[80px] text-center text-sm">
                Week {Math.min(currentWeekIndex + 1, totalWeeks)} of {totalWeeks}
              </span>
              <Button
                variant="ghost"
                onClick={() => setCurrentWeekIndex(Math.min(totalWeeks - 1, currentWeekIndex + 1))}
                disabled={currentWeekIndex >= totalWeeks - 1}
                className="px-3"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-3">
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentWeekIndex(0);
              }}
              className={`px-5 py-2 rounded-full transition-all duration-200 ${
                filterStatus === status
                  ? 'bg-[#525866] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {status}
            </button>
          ))}
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
              <th className="px-6 py-4 text-left text-gray-700">Rating</th>
              <th className="px-6 py-4 text-left text-gray-700">Parent</th>
              <th className="px-6 py-4 text-left text-gray-700">Approved At</th>
              <th className="px-6 py-4 text-left text-gray-700">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentWeek.records.map((record) => {
              const isExpanded = expanded.has(record.id);
              const isApproved = record.status === 'Approved';
              const isDeclined = record.status === 'Declined';
          const parentDisplay =
            record.parentNumber !== undefined
              ? `#${record.parentNumber}`
              : record.parentStructure && !record.parentStructure.startsWith('rec')
                ? record.parentStructure
                : '-';

          return (
            <tr key={record.id} className="hover:bg-gray-50 transition-colors align-middle">
              <td className="px-6 py-4 text-gray-900">{displayId(record.ideaId)}</td>
              <td className="px-6 py-4 text-gray-900">
                    {isApproved && (record.structureNumber !== undefined)
                      ? `#${record.structureNumber}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="renderer">{record.renderer}</Badge>
                  </td>
                <td className="px-6 py-4 max-w-md">
                  <div className="text-gray-900">
                    {isExpanded ? record.skeleton || '—' : `${(record.skeleton || '—').slice(0, 120)}${record.skeleton && record.skeleton.length > 120 ? '...' : ''}`}
                  </div>
                  {record.skeleton && record.skeleton.length > 120 && (
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
                    )}
                    {isExpanded && record.feedback && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="font-medium text-gray-900 mb-1">Feedback</div>
                        <p className="leading-relaxed">{record.feedback}</p>
                      </div>
                    )}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      isApproved
                          ? 'success'
                          : isDeclined
                          ? 'declined'
                          : 'warning'
                      }
                    >
                      {record.status}
                    </Badge>
                </td>
                <td className="px-6 py-4">
                  {record.rating ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.round(record.rating) }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-gray-700 ml-1">({record.rating.toFixed(1)})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{parentDisplay}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.status === 'Declined' && record.declinedAt ? formatDate(record.declinedAt) : formatDate(record.approvedAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(record.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {currentWeek.records.length === 0 && (
          <div className="text-center text-gray-500 py-10">No history found for this filter.</div>
        )}
      </div>
    </div>
  );
}
