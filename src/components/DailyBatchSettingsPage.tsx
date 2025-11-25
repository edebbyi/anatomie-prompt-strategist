import { useState } from 'react';
import { Button } from './ui/Button';
import { Star } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function DailyBatchSettingsPage() {
  const [batchEnabled, setBatchEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('shawn@promptstrategist.com');

  const availableEmails = [
    'shawn@promptstrategist.com',
    'admin@promptstrategist.com',
    'team@promptstrategist.com',
    'notifications@promptstrategist.com',
  ];

  const nextBatchTime = '2025-11-25 at 9:00 AM EST';

  const handleRunBatch = async () => {
    setIsRunning(true);
    // Simulate batch run
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
    alert('Batch generation started! 3 new ideas will be created.');
  };

  const handleEmailChange = (email: string) => {
    setSelectedEmail(email);
    toast.success(`Notification email updated to ${email}`);
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
              onClick={() => setBatchEnabled(!batchEnabled)}
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
              onClick={() => setEmailNotifications(!emailNotifications)}
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
              <select
                id="email-select"
                value={selectedEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#525866] focus:border-transparent transition-all"
              >
                {availableEmails.map((email) => (
                  <option key={email} value={email}>
                    {email}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-2">
                Notifications will be sent to the selected email address when new batches are ready
              </p>
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