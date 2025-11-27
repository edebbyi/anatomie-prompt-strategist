import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { toast } from 'sonner@2.0.3';
import { runDailyBatch } from '../services/batchGenerator';
import { fetchSettings, updateSettings } from '../services/airtable';

export function DailyBatchSettingsPage() {
  const [batchEnabled, setBatchEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [nextBatchTime, setNextBatchTime] = useState<string>('Loading...');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsRecordId, setSettingsRecordId] = useState<string>('');
  const [emailOptions, setEmailOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoadingSettings(true);
        const settings = await fetchSettings();
        setBatchEnabled(settings.batchEnabled ?? true);
        setEmailNotifications(settings.emailNotifications ?? true);
        const options = Array.isArray(settings.notificationEmail)
          ? settings.notificationEmail
          : settings.notificationEmail
          ? [settings.notificationEmail]
          : [];
        // Load available choices from Airtable schema; fall back to current value(s)
        const schemaOptions = await loadNotificationEmailOptions();
        const merged = Array.from(
          new Set([...(schemaOptions || []), ...options].filter(Boolean))
        );
        setEmailOptions(merged);
        if (merged.length > 0) {
          setSelectedEmail(options[0] || merged[0]);
        }
        setSettingsRecordId(settings.id);
        setNextBatchTime(formatNextBatchTime(settings.nextBatchTime));
      } catch (error) {
        console.error('Failed to load batch settings', error);
        toast.error('Could not load batch settings');
        setNextBatchTime('Not scheduled');
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, []);

  const loadNotificationEmailOptions = async (): Promise<string[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableId = import.meta.env.VITE_AIRTABLE_SETTINGS_TABLE;
    const fieldName = import.meta.env.VITE_COL_NOTIFICATION_EMAIL;
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    if (!baseId || !tableId || !fieldName || !apiKey) return [];

    try {
      const resp = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      const table = data.tables?.find((t: any) => t.id === tableId);
      if (!table) return [];
      const field = table.fields?.find((f: any) => f.name === fieldName);
      if (!field?.options?.choices) return [];
      return field.options.choices.map((c: any) => c.name).filter(Boolean);
    } catch (error) {
      console.error('Failed to load notification email options', error);
      return [];
    }
  };

  const formatNextBatchTime = (value?: string) => {
    if (!value) return 'Not scheduled';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  const handleRunBatch = async () => {
    try {
      setIsRunning(true);
      const result = await runDailyBatch();
      toast.success(`Batch complete`, {
        description: `Generated ${result.totalGenerated} ideas`,
      });
    } catch (err: any) {
      toast.error('Batch failed', {
        description: err?.message || 'Could not run batch.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const persistSettings = async (updates: Parameters<typeof updateSettings>[1]) => {
    if (!settingsRecordId) return;
    try {
      await updateSettings(settingsRecordId, updates);
    } catch (error) {
      console.error('Failed to update settings', error);
      toast.error('Could not save settings to Airtable');
      throw error;
    }
  };

  const handleToggleBatchEnabled = async () => {
    const nextValue = !batchEnabled;
    setBatchEnabled(nextValue);
    try {
      await persistSettings({ batchEnabled: nextValue });
    } catch {
      setBatchEnabled(!nextValue);
    }
  };

  const handleToggleEmailNotifications = async () => {
    const nextValue = !emailNotifications;
    setEmailNotifications(nextValue);
    try {
      await persistSettings({ emailNotifications: nextValue });
    } catch {
      setEmailNotifications(!nextValue);
    }
  };

  const handleEmailChange = (email: string) => {
    const previousEmail = selectedEmail;
    setSelectedEmail(email);
    persistSettings({ notificationEmail: email })
      .then(() => {
        toast.success(`Notification email updated to ${email}`);
      })
      .catch(() => {
        setSelectedEmail(previousEmail);
      });
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-gray-900">Daily Batch Settings</h2>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">Generate Daily Batch</h3>
              <p className="text-gray-600">
                Automatically generate 3 new prompt structure ideas every day
              </p>
            </div>
            <button
              onClick={handleToggleBatchEnabled}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                batchEnabled ? 'bg-[#525866]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  batchEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {batchEnabled && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-gray-900">Next Scheduled Batch</h4>
                  <p className="text-gray-600 mt-1">{nextBatchTime}</p>
                </div>
              </div>
              <Button
                variant="filled"
                onClick={handleRunBatch}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Batch...' : 'Run Batch Now'}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">Email Notifications</h3>
              <p className="text-gray-600">
                Send admin email when new batch is ready for review
              </p>
            </div>
            <button
              onClick={handleToggleEmailNotifications}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                emailNotifications ? 'bg-[#525866]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {emailNotifications && (
            <div className="bg-gray-50 rounded-lg p-6">
              <label htmlFor="email-select" className="block text-gray-900 mb-2">
                Notification Email Address
              </label>
              {emailOptions.length > 0 ? (
                <>
                  <select
                    id="email-select"
                    value={selectedEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent transition-all"
                  >
                    {emailOptions.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-500 text-sm mt-2">
                    Notifications will be sent to the selected email address when new batches are ready
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">No notification email configured in Airtable.</p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-gray-900 mb-2">Batch Generation Info</h4>
            <ul className="text-gray-600 space-y-2">
              <li>• Each batch generates 3 unique prompt structure ideas</li>
              <li>• All generated ideas start with "Proposed" status</li>
              <li>• Approved structures are actively used in the system to generate prompts</li>
              <li>• View all structure activity and performance in History</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
