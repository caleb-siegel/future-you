import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-8 animate-dialog-in max-w-2xl pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
          Settings
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Account information and storage configuration.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
        <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
          <User className="w-4 h-4 text-stone-600" />
          Account Details
        </h2>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between py-2 border-b border-stone-100 text-sm">
            <span className="text-stone-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-stone-400" />
              Email address
            </span>
            <span className="font-medium text-stone-800">{user?.email || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-stone-100 text-sm">
            <span className="text-stone-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-400" />
              Account ID (UID)
            </span>
            <code className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
              {user?.uid || 'N/A'}
            </code>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign out of Future You
          </Button>
        </div>
      </div>

      {/* Storage & Firebase Connection */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-4">
        <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-stone-600" />
          Storage & Privacy
        </h2>

        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2 text-xs text-stone-600 leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cloud Firestore Connected</span>
          </div>
          <p>
            Your memories, preferences, and plans are stored privately under your authenticated UID in Google Cloud Firestore.
          </p>
          <p className="text-[11px] text-stone-500">
            Firestore Security Rules ensure no other user can read or write your private documents. No memory content is sent to third parties or AI models.
          </p>
        </div>
      </div>
    </div>
  );
};
