/**
 * LORA Explorer link components
 * Provides convenient links to transactions, accounts, and apps
 */

import { lora, truncateAddress } from '@/lib/algorand';
import { ExternalLink } from 'lucide-react';

interface TxLinkProps {
  txId: string;
  children?: React.ReactNode;
  className?: string;
}

export function TxLink({ txId, children, className = '' }: TxLinkProps) {
  return (
    <a
      href={lora.tx(txId)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      {children || truncateAddress(txId, 6)}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

interface AccountLinkProps {
  address: string;
  children?: React.ReactNode;
  truncate?: boolean;
  className?: string;
}

export function AccountLink({ 
  address, 
  children, 
  truncate = true, 
  className = '' 
}: AccountLinkProps) {
  return (
    <a
      href={lora.account(address)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      {children || (truncate ? truncateAddress(address) : address)}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

interface AppLinkProps {
  appId: number | string;
  children?: React.ReactNode;
  className?: string;
}

export function AppLink({ appId, children, className = '' }: AppLinkProps) {
  return (
    <a
      href={lora.app(appId)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      {children || `App #${appId}`}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
