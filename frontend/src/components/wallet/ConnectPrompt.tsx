'use client';

/**
 * Full-screen landing page for disconnected users
 * Prompts wallet connection before accessing the app
 */

import { WalletButton } from './WalletButton';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export function ConnectPrompt() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Algorand Prediction Market
          </h1>
          <p className="text-xl text-gray-600">
            Decentralized prediction markets powered by Algorand blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Trade Predictions</h3>
            <p className="text-sm text-gray-600">
              Bet on future outcomes and earn rewards when you're right
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Trustless & Secure</h3>
            <p className="text-sm text-gray-600">
              Smart contracts ensure fair and transparent market resolution
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast & Low Cost</h3>
            <p className="text-sm text-gray-600">
              Powered by Algorand's high-speed, low-fee blockchain
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <WalletButton />
          <p className="text-sm text-gray-500">
            Connect your Pera Wallet to start trading predictions
          </p>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Running on Algorand TestNet • Smart contracts verified on LORA Explorer
          </p>
        </div>
      </div>
    </div>
  );
}
