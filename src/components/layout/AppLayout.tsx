import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  Sparkles,
  Compass,
  Settings,
  Plus,
  LogOut,
  Brain,
  Menu,
  X,
} from 'lucide-react';
import { NavLink as RouterNavLink, Outlet as RouterOutlet, useNavigate as useRouterNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { QuickCapture } from '../memories/QuickCapture';

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useRouterNavigate();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Memories', path: '/memories', icon: BookOpen },
    { label: 'Preferences', path: '/preferences', icon: Sparkles },
    { label: 'Plans', path: '/plans', icon: Compass },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleCaptureSuccess = () => {
    setIsQuickCaptureOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row text-stone-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FAF8F5] border-r border-stone-200/80 px-4 py-6 justify-between shrink-0 fixed top-0 bottom-0 left-0 z-30">
        <div className="space-y-6">
          {/* Logo / Brand */}
          <div className="px-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center font-semibold text-sm shadow-xs">
              <Brain className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-stone-900 block leading-tight">
                Future You
              </span>
              <span className="text-[11px] text-stone-500 block">
                Personal Memory & Plans
              </span>
            </div>
          </div>

          {/* Quick Capture Primary Action */}
          <div className="px-1">
            <Button
              variant="primary"
              onClick={() => setIsQuickCaptureOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full justify-start py-2.5 px-4 shadow-sm"
            >
              Capture a thought
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <RouterNavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-stone-200/70 text-stone-900 shadow-2xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-stone-500" />
                  <span>{item.label}</span>
                </RouterNavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out at bottom of sidebar */}
        <div className="pt-4 border-t border-stone-200/80 space-y-2 px-1">
          <div className="px-2 py-1.5 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-medium text-stone-800 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[11px] text-stone-400 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign out"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xs border-b border-stone-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-semibold text-xs">
            <Brain className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="font-semibold text-stone-900 text-base">Future You</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsQuickCaptureOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Capture
          </Button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-[#FAF8F5] border-b border-stone-200 p-4 z-40 shadow-lg animate-dialog-in">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <RouterNavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-stone-200/70 text-stone-900 font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-stone-500" />
                  <span>{item.label}</span>
                </RouterNavLink>
              );
            })}
          </nav>
          <div className="pt-3 mt-3 border-t border-stone-200/80 flex items-center justify-between">
            <span className="text-xs text-stone-500 truncate max-w-[200px]">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 md:p-10 max-w-5xl mx-auto w-full min-h-screen">
        <RouterOutlet />
      </main>

      {/* Global Quick Capture Modal */}
      <Modal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        title="Capture a thought"
        description="Preserve what you observed, learned, or want your future self to remember."
        maxWidth="lg"
      >
        <QuickCapture onSuccess={handleCaptureSuccess} autoFocus={true} />
      </Modal>
    </div>
  );
};
