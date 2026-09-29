import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, Star } from 'lucide-react';

interface EngineerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    confirmed_root_cause: string;
    verified_resolution: string;
    resolution_steps: string[];
    engineer_rating: number;
    engineer_notes: string;
    was_ai_helpful: boolean;
  }) => void;
  initialRootCause?: string;
  initialResolution?: string;
}

export const EngineerFeedbackModal: React.FC<EngineerFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRootCause = '',
  initialResolution = ''
}) => {
  const [rootCause, setRootCause] = useState(initialRootCause || 'Database HikariCP Connection Pool Exhaustion');
  const [resolution, setResolution] = useState(initialResolution || 'Increased max_connections to 200 and patched connection leakage in checkout repository.');
  const [stepsText, setStepsText] = useState('Adjust max connection pool size to 200\nPatched connection leak in TransactionRepository');
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [wasHelpful, setWasHelpful] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = stepsText.split('\n').map(s => s.trim()).filter(Boolean);
    onSubmit({
      confirmed_root_cause: rootCause,
      verified_resolution: resolution,
      resolution_steps: steps,
      engineer_rating: rating,
      engineer_notes: notes,
      was_ai_helpful: wasHelpful
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Confirm Resolution & Store Memory</h2>
            <p className="text-xs text-slate-400">
              Commit verified findings to Hindsight Persistent Memory so future investigations can reuse this knowledge.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Confirmed Root Cause</label>
            <textarea
              rows={2}
              required
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-sans"
            ></textarea>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Verified Resolution Description</label>
            <textarea
              rows={2}
              required
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-sans"
            ></textarea>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Key Fix Steps (One per line)</label>
            <textarea
              rows={3}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-300 font-medium">Rate AI Investigation Relevance:</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Engineer Feedback Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. AI correctly identified HikariCP pool starvation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-bold shadow-lg flex items-center space-x-2"
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Commit to Hindsight Memory</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
