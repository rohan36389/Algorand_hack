'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Market } from '@/types/market';

interface OrderbookProps {
  market: Market;
}

interface Order {
  price: number;
  size: number;
  total: number;
}

export function Orderbook({ market }: OrderbookProps) {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    // Connect to the new backend WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');
    
    socket.emit('join_market', market.id);
    
    // For MVP hackathon wow-factor, since we use Parimutuel pools, 
    // we simulate realistic orderbook depth based on total pool size
    const simulateDepth = () => {
      const generatedBids = [];
      const generatedAsks = [];
      
      const probIndex0 = market.totalPool > 0 ? (market.pools[0] / market.totalPool) : 0.5;
      const basePrice = Math.max(0.01, Math.min(0.99, probIndex0));

      let totalBidAccum = 0;
      let totalAskAccum = 0;
      for (let i = 1; i <= 5; i++) {
        const bidSize = Math.floor(Math.random() * 50) + 10;
        totalBidAccum += bidSize;
        generatedBids.push({
          price: Math.max(0.01, parseFloat((basePrice - (i * 0.02)).toFixed(2))),
          size: bidSize,
          total: totalBidAccum
        });

        const askSize = Math.floor(Math.random() * 50) + 10;
        totalAskAccum += askSize;
        generatedAsks.push({
          price: Math.min(0.99, parseFloat((basePrice + (i * 0.02)).toFixed(2))),
          size: askSize,
          total: totalAskAccum
        });
      }
      setBids(generatedBids);
      setAsks(generatedAsks.reverse());
    };

    simulateDepth();

    // Listen for live trades
    socket.on('live_trade', (tradeData) => {
      // Flash animation logic could be here
      simulateDepth();
    });

    return () => {
      socket.disconnect();
    };
  }, [market.id, market.totalPool, market.pools]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex justify-between">
        Live Orderbook
        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded animate-pulse">Live</span>
      </h3>
      
      <div className="grid grid-cols-3 text-xs text-gray-500 font-medium mb-2 border-b pb-2">
        <div>Price (ALGO)</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto min-h-[100px] mb-2">
        {asks.map((ask, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-3 text-sm relative group cursor-pointer hover:bg-red-50 py-1">
            {/* Depth bar visual */}
            <div className="absolute top-0 right-0 h-full bg-red-100/50" style={{ width: `${Math.min(100, (ask.total / 300) * 100)}%` }}></div>
            <div className="text-red-600 font-medium z-10">{ask.price.toFixed(2)}</div>
            <div className="text-right z-10">{ask.size}</div>
            <div className="text-right z-10">{ask.total}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-1.5 border-t border-b mb-2">
        <span className="text-gray-500 text-sm">Spread</span>
        <span className="font-semibold text-gray-900">
          {asks.length > 0 && bids.length > 0 ? (asks[asks.length-1].price - bids[0].price).toFixed(2) : '-'}
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto min-h-[100px]">
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-3 text-sm relative group cursor-pointer hover:bg-green-50 py-1">
            <div className="absolute top-0 right-0 h-full bg-green-100/50" style={{ width: `${Math.min(100, (bid.total / 300) * 100)}%` }}></div>
            <div className="text-green-600 font-medium z-10">{bid.price.toFixed(2)}</div>
            <div className="text-right z-10">{bid.size}</div>
            <div className="text-right z-10">{bid.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
