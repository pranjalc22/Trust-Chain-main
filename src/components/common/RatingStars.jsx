import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 5, max = 5, interactive = false, onRate = null, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = rating >= starValue;
        const isHalf = !isFilled && rating >= starValue - 0.5;

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate && onRate(starValue)}
            className={`${interactive ? 'cursor-pointer transition hover:scale-125 focus:outline-none' : 'cursor-default'}`}
          >
            <Star
              className={`${currentSize} ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : isHalf
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-slate-600 fill-transparent'
              } transition-colors`}
            />
          </button>
        );
      })}
      {!interactive && rating !== undefined && (
        <span className="ml-1 text-xs font-semibold text-slate-300 font-mono">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};
