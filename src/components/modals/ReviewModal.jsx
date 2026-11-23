import React, { useState } from 'react';
import { RatingStars } from '../common/RatingStars';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ReviewModal = ({ isOpen, onClose, onSubmit, recipientAddress, recipientName, txId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit({ stars: rating, comment });
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // confetti is decorative only
      }
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 mb-2 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Rate Counterparty Reputation</h3>
          <p className="text-xs text-slate-400 mt-1">
            Settlement complete for <span className="font-mono text-cyan-400">{txId}</span>
          </p>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Rating: <span className="text-white">{recipientName || recipientAddress}</span>
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="text-emerald-400 font-bold text-sm">Rating Anchored On-Chain!</div>
            <p className="text-xs text-slate-400 mt-1">Reputation score updated in protocol registry.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Overall Experience Rating
              </label>
              <div className="flex justify-center">
                <RatingStars rating={rating} interactive={true} onRate={setRating} size="lg" />
              </div>
              <div className="text-xs font-mono font-bold text-amber-400 mt-2">
                {rating === 5 && 'Outstanding (5/5)'}
                {rating === 4 && 'Very Good (4/5)'}
                {rating === 3 && 'Average (3/5)'}
                {rating === 2 && 'Below Expectations (2/5)'}
                {rating === 1 && 'Unsatisfactory (1/5)'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Review / Feedback Comment
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe communication, quality of delivery, and adherence to milestones..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {submitError && (
              <p className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-50"
              >
                Skip For Now
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Verified Rating'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
