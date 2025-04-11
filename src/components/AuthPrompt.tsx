import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface AuthPromptProps {
  onContinueAsGuest: () => void;
}

export function AuthPrompt({ onContinueAsGuest }: AuthPromptProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold text-center mb-4">Sign in to save your booking</h2>
      <p className="text-gray-600 text-center mb-6">
        Sign in to save your booking history and access it later.
      </p>
      <div className="space-y-4">
        <Link
          to="/auth/signin"
          className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
        <button
          onClick={onContinueAsGuest}
          className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
} 