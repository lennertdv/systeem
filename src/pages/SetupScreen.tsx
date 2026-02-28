import { AlertCircle } from 'lucide-react';

export default function SetupScreen() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6 mx-auto">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
          Firebase Setup Required
        </h1>
        <p className="text-neutral-600 text-center mb-6">
          This application requires a Firebase project to function. Please configure your environment variables.
        </p>
        
        <div className="bg-neutral-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-neutral-700 mb-2">Required Variables:</h3>
          <ul className="text-xs font-mono text-neutral-600 space-y-1">
            <li>VITE_FIREBASE_API_KEY</li>
            <li>VITE_FIREBASE_AUTH_DOMAIN</li>
            <li>VITE_FIREBASE_PROJECT_ID</li>
            <li>VITE_FIREBASE_STORAGE_BUCKET</li>
            <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>VITE_FIREBASE_APP_ID</li>
          </ul>
        </div>
        
        <div className="text-sm text-neutral-500 text-center">
          Add these to your AI Studio Secrets panel and restart the server.
        </div>
      </div>
    </div>
  );
}
