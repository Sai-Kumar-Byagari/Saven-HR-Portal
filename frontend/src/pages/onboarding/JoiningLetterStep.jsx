import { useEffect } from 'react';
import Button from '../../components/ui/Button';

export default function JoiningLetterStep({ draft, update, user, onNext, saving }) {
  // Auto-fill letter_date to today if not set
  useEffect(() => {
    if (!draft.letter_date) {
      update({ letter_date: new Date().toISOString().slice(0, 10) });
    }
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Joining Letter</h2>
        <p className="text-sm text-gray-500 mt-0.5">Fill your acceptance letter details as per company records</p>
      </div>

      {/* Letter preview */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 text-sm text-gray-700 space-y-4 font-serif leading-relaxed">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-400 mb-1">Date</p>
            <input type="date" value={draft.letter_date || ''} onChange={e => update({ letter_date: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <div className="space-y-1">
          <p>From,</p>
          <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
          <textarea rows={3} value={draft.joining_address || ''} onChange={e => update({ joining_address: e.target.value })}
            placeholder="Your address..."
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none mt-1" />
        </div>

        <div className="space-y-1">
          <p className="font-semibold">Subject: Joining Letter</p>
          <div className="mt-3 space-y-2">
            <p>To,</p>
            <p className="font-medium">Saven Technologies Limited,</p>
            <p className="text-xs text-gray-600">First Floor, Level-1, Block 2, Cyber Pearl, Hi-Tech City, Madhapur, Hyderabad-500081.</p>
          </div>
        </div>

        <div className="space-y-2">
          <p>I am pleased to accept your offer and I have honour to inform you that I am joining the company from{' '}
            <input type="date" value={draft.joining_date || ''} onChange={e => update({ joining_date: e.target.value })}
              className="border-b border-gray-400 bg-transparent text-sm focus:outline-none mx-1" />
            {' '}as{' '}
            <input type="text" value={draft.joining_designation || ''} onChange={e => update({ joining_designation: e.target.value })}
              placeholder="Designation"
              className="border-b border-gray-400 bg-transparent text-sm focus:outline-none mx-1 w-40" />
            {' '}in respect to your Offer.
          </p>
          <p>The position is ideally suited to my educational background and interests. I confidently feel that I can make a significant contribution to your company and I am grateful for the opportunity you have given me.</p>
          <p>I humbly request you to accept my joining / acceptance letter.</p>
        </div>

        <div className="mt-6">
          <p>Regards,</p>
          <div className="mt-4 border-b border-gray-400 w-48" />
          <p className="text-xs text-gray-500 mt-0.5">Employee Signature</p>
          <input type="text" value={draft.signature_name || ''} onChange={e => update({ signature_name: e.target.value })}
            placeholder={`${user?.firstName || ''} ${user?.lastName || ''}`}
            className="mt-1 border-b border-gray-300 bg-transparent text-sm font-semibold focus:outline-none focus:border-blue-500 w-48" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} loading={saving} disabled={!draft.letter_date || !draft.joining_date || !draft.joining_designation}>
          Save & Continue →
        </Button>
      </div>
    </div>
  );
}
