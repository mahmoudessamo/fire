import React from 'react';
import { Star } from 'lucide-react';

export function StarRow({ count, size = 22 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}
