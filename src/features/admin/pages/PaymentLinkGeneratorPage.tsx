import React from 'react';
import PaymentLinkGenerator from '../components/PaymentLinkGenerator';
import { useRole } from '../../../hooks/useRole';
import AccessDenied from '../../../components/AccessDenied';

const PaymentLinkGeneratorPage: React.FC = () => {
  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Payment Links</h1>
        <p className="mt-2 text-gray-600">
          Create secure, time-limited payment links for students to make partial payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentLinkGenerator />
        
        {/* Instructions Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Payment Link Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Links are encrypted and cannot be tampered with</li>
                <li>Each link expires after 30 minutes</li>
                <li>Links are tracked with admin information for audit</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Usage Instructions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Select the appropriate program type</li>
                <li>Enter the payment amount</li>
                <li>Generate and copy the secure payment link</li>
                <li>Share the link with the student immediately</li>
                <li>Remind students that links expire in 30 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkGeneratorPage; 