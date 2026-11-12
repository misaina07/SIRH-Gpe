/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DocumentModal } from './components/DocumentModal';
import { ScheduleInterviewModal } from './components/ScheduleInterviewModal';
import { SearchModal } from './components/SearchModal';
import { AccessDeniedView } from './components/AccessDeniedView';
import { DashboardView } from './views/DashboardView';
import { NewRequisitionView } from './views/NewRequisitionView';
import { HrQualificationView } from './views/HrQualificationView';
import { FinanceValidationView } from './views/FinanceValidationView';
import { ExecutiveApprovalView } from './views/ExecutiveApprovalView';
import { RecruitmentKanbanView } from './views/RecruitmentKanbanView';
import { DemandesListView } from './views/DemandesListView';
import { OnboardingView } from './views/OnboardingView';
import { ReferentielsAdminView } from './views/ReferentielsAdminView';
import { LoginView } from './views/LoginView';
import { CANDIDATES_DATA, USER_PROFILES } from './data/mockData';
import { UserProfile, ViewMode } from './types/sirh';
import { apiGet } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0]);

  useEffect(() => {
    if (!sessionStorage.getItem('sirh_access_token')) return;
    apiGet<UserProfile>('/auth/me').then((profile) => {
      setCurrentUser(profile);
      setIsAuthenticated(true);
    }).catch(() => sessionStorage.removeItem('sirh_access_token'));
  }, []);

  const [currentView, setCurrentView] = useState<ViewMode>('tableau-de-bord');
  const [candidates, setCandidates] = useState(CANDIDATES_DATA);
  const [notificationCount, setNotificationCount] = useState(3);

  // Modals
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Keyboard shortcut Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('sirh_access_token', token);
    } catch {}

    const primaryView = user.allowedViews.includes('tableau-de-bord')
      ? 'tableau-de-bord'
      : user.allowedViews[0] || 'mes-demandes';
    setCurrentView(primaryView);
    showToast(`Connexion réussie : Bienvenue ${user.name} (${user.role})`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('sirh_access_token');
    } catch {}
    setCurrentView('connexion');
    showToast('Vous avez été déconnecté avec succès.');
  };

  const handleScheduled = (candidateName: string, dateStr: string, type: string) => {
    showToast(`Entretien "${type}" planifié pour ${candidateName} (${dateStr}). Invitation envoyée.`);
    setNotificationCount((prev) => prev + 1);
  };

  // If unauthenticated or in connexion view, render the dedicated login screen
  if (!isAuthenticated || currentView === 'connexion') {
    return (
      <LoginView
        onLogin={(user, token) => {
          handleLogin(user, token);
        }}
      />
    );
  }

  // Check RBAC permission for current view
  const isViewAllowed = currentUser.allowedViews?.includes(currentView) ?? true;

  return (
    <div className="bg-bg-canvas min-h-screen text-text-primary antialiased font-body-default flex">
      {/* Sidebar Navigation with active user permissions */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingCount={5}
      />

      {/* Main View Area */}
      <div className="pl-64 flex flex-col flex-1 min-h-screen w-full">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          onSelectUser={(u) => {
            if (u.id !== currentUser.id) {
              handleLogout();
              showToast(`Reconnectez-vous avec le compte ${u.email} pour changer de rôle.`);
            }
          }}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onLogout={handleLogout}
          notificationCount={notificationCount}
        />

        {/* Dynamic View Component with RBAC Guard */}
        <main className="w-full pt-16 bg-bg-canvas flex-1 flex flex-col">
          {!isViewAllowed ? (
            <AccessDeniedView
              currentUser={currentUser}
              attemptedView={currentView}
              onNavigate={setCurrentView}
              onSwitchUserPrompt={() => {
                handleLogout();
              }}
            />
          ) : (
            <>
              {currentView === 'tableau-de-bord' && (
                <DashboardView
                  onNavigate={setCurrentView}
                  onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'nouvelle-demande' && (
                <NewRequisitionView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                />
              )}

              {currentView === 'qualification-rh' && (
                <HrQualificationView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'validation-finance' && (
                <FinanceValidationView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'approbation-direction' && (
                <ExecutiveApprovalView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'recrutement' && (
                <RecruitmentKanbanView
                  onNavigate={setCurrentView}
                  onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                />
              )}

              {currentView === 'mes-demandes' && (
                <DemandesListView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  currentUser={currentUser}
                />
              )}

              {currentView === 'onboarding' && (
                <OnboardingView onNavigate={setCurrentView} />
              )}

              {currentView === 'referentiels-admin' && (
                <ReferentielsAdminView onNavigate={setCurrentView} />
              )}

              {currentView === 'employes-contrats' && (
                <DemandesListView
                  onNavigate={setCurrentView}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Document Viewer Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documentTitle="Fiche_Poste_DevSecOps_G5.pdf"
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        candidates={candidates}
        onScheduled={handleScheduled}
      />

      {/* Global Quick Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 text-xs">
          <span className="material-symbols-outlined text-success-emerald text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
