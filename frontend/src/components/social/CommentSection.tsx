'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

interface Comment {
  userAddress: string;
  content: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  createdAt: string;
}

interface CommentSectionProps {
  marketId: number;
}

export function CommentSection({ marketId }: CommentSectionProps) {
  const { activeAccount } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sentiment, setSentiment] = useState<'BULLISH'|'BEARISH'|'NEUTRAL'>('NEUTRAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch initial comments from backend
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/markets/${marketId}/meta`)
      .then(res => res.json())
      .then(data => {
        if (data.comments) setComments(data.comments.reverse());
      })
      .catch(console.error);
      
    // Optionally setup Socket.io to listen for 'new_comment' event here
  }, [marketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/markets/${marketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: activeAccount,
          content: newComment,
          sentiment
        })
      });
      const data = await res.json();
      if (data.comments) setComments((data.comments as Comment[]).reverse());
      setNewComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Discussion</h3>
      
      {activeAccount ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Share your thoughts or research on this market..."
            rows={3}
            required
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button type="button" onClick={() => setSentiment('BULLISH')} className={`px-3 py-1 rounded text-sm ${sentiment === 'BULLISH' ? 'bg-green-100 text-green-800 font-bold' : 'bg-gray-100'}`}>🚀 Bullish</button>
              <button type="button" onClick={() => setSentiment('BEARISH')} className={`px-3 py-1 rounded text-sm ${sentiment === 'BEARISH' ? 'bg-red-100 text-red-800 font-bold' : 'bg-gray-100'}`}>🐻 Bearish</button>
              <button type="button" onClick={() => setSentiment('NEUTRAL')} className={`px-3 py-1 rounded text-sm ${sentiment === 'NEUTRAL' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-gray-100'}`}>😐 Neutral</button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 text-gray-600 text-sm mb-6 rounded">
          Please connect your wallet to participate in the discussion.
        </div>
      )}

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="font-mono text-xs text-gray-500 w-24 shrink-0 truncate">
              {c.userAddress.slice(0, 6)}...{c.userAddress.slice(-4)}
            </div>
            <div className="flex-1">
              <div className="text-gray-900 text-sm">{c.content}</div>
            </div>
            <div className="shrink-0 text-sm">
              {c.sentiment === 'BULLISH' ? '🚀' : c.sentiment === 'BEARISH' ? '🐻' : '😐'}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 text-center py-4">No comments yet. Be the first!</p>}
      </div>
    </div>
  );
}
