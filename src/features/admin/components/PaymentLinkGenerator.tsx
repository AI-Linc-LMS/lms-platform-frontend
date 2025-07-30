import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { generateEncodedPaymentLink } from '../../../utils/paymentLinkUtils';
import { useSelector } from 'react-redux';
import { UserState } from '../../learn/components/assessment/types/assessmentTypes';
import AccessDenied from '../../../components/AccessDenied';
import { useRole } from '../../../hooks/useRole';

const PaymentLinkGenerator: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [programType, setProgramType] = useState<'flagship-program' | 'nanodegree-program'>('flagship-program');
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const { isSuperAdmin } = useRole();
  const user = useSelector((state: { user: UserState }) => state.user);


  const handleGenerateLink = () => {
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const link = generateEncodedPaymentLink({
      amount: numericAmount,
      programType,
      timestamp: Date.now(),
      generatedBy: user?.email || 'admin'
    });

    setGeneratedLink(link);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Generate Payment Link</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Program Type
          </label>
          <select
            value={programType}
            onChange={(e) => setProgramType(e.target.value as 'flagship-program' | 'nanodegree-program')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="flagship-program">Flagship Career Launchpad</option>
            <option value="nanodegree-program">Nanodegree Program</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
        </div>

        <button
          onClick={handleGenerateLink}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Link
        </button>

        {generatedLink && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Payment Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 font-mono break-all">
                {generatedLink}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                title={copied ? 'Copied!' : 'Copy URL'}
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This link will expire in 30 minutes. Share it with the student to complete the payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinkGenerator; 