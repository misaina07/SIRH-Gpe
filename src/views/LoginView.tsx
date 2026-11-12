import React, { useState, useEffect, useRef } from 'react';
import { SavedLoginEmail, UserProfile } from '../types/sirh';
import { SAVED_LOGIN_PRESETS, USER_PROFILES } from '../data/mockData';
import { apiPost } from '../services/api';

interface LoginViewProps {
  onLogin: (user: UserProfile, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const localDemoPasswords: Record<string, string> = import.meta.env.DEV
    ? { 'usr-1': 'rh', 'usr-2': 'manager', 'usr-3': 'finance', 'usr-4': 'codir', 'usr-5': 'manager' }
    : {};
  const [savedLogins, setSavedLogins] = useState<SavedLoginEmail[]>(() => {
    try {
      const stored = localStorage.getItem('sirh_saved_login_emails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SAVED_LOGIN_PRESETS;
    } catch {
      return SAVED_LOGIN_PRESETS;
    }
  });

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveLoginEmailOnly = (user: UserProfile) => {
    try {
      const existing = savedLogins.filter((s) => s.email.toLowerCase() !== user.email.toLowerCase());
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const updated: SavedLoginEmail[] = [
        {
          email: user.email,
          name: user.name,
          role: user.role,
          roleType: user.roleType,
          avatar: user.avatar,
          department: user.department,
          lastLoginAt: `Aujourd'hui à ${nowStr}`,
        },
        ...existing,
      ];
      setSavedLogins(updated);
      localStorage.setItem('sirh_saved_login_emails', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save login history', e);
    }
  };

  const handleSelectSavedLogin = (saved: SavedLoginEmail) => {
    setEmail(saved.email);
    // Explicit User Requirement: "qui se souvient de tous les login precedent sans les mots de pass seulement"
    setPassword(''); // Strictly clear password to enforce manual entry without saving password!
    setErrorMessage(null);
    setInfoMessage(`Compte sélectionné : ${saved.name} (${saved.role}). Par sécurité, aucun mot de passe n'est mémorisé.`);
    setIsDropdownOpen(false);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
  };

  const handleRemoveSavedLogin = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = savedLogins.filter((s) => s.email.toLowerCase() !== emailToRemove.toLowerCase());
    setSavedLogins(updated);
    try {
      localStorage.setItem('sirh_saved_login_emails', JSON.stringify(updated));
    } catch {}
    if (email === emailToRemove) {
      setEmail('');
      setPassword('');
      setInfoMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const result = await apiPost<{ token: string; user: UserProfile }>('/auth/login', { email, password });
      saveLoginEmailOnly(result.user);
      onLogin(result.user, result.token);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: UserProfile) => {
    setEmail(user.email);
    const localPassword = localDemoPasswords[user.id];
    if (!localPassword) {
      setPassword('');
      setInfoMessage('Saisissez le mot de passe de votre compte pour vous connecter.');
      return;
    }
    setPassword(localPassword);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await apiPost<{ token: string; user: UserProfile }>('/auth/login', {
        email: user.email,
        password: localPassword,
      });
      saveLoginEmailOnly(result.user);
      onLogin(result.user, result.token);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden font-body-default text-text-primary">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-info-sky/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand Bar */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-slate-800 relative z-10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            alt="Logo SIRH"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WGo5K86fGA261TLWE2cszuh0E5VQNByaEplC_7oIXgWjsz0TcQH1ZRe3c929_HaeIpBACBqXsxkNhguMLMIpQGshT0U3McPeMvNxAeJsLhKPharNCMxE878ce9JKczrz0csLE4jRJkKKM3tWDUcgjHB3aB9OO06v-85SNt1ZD82DNuVf9y62gozmsJthRe7GbyxeF5CTKrQ2RZjMlStX7Dn1weDnEPQ5aO4Yyh6yLQ3dmboX0UuPg7Z6Q"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-white font-bold tracking-wide">
              SIRH Entreprise
            </span>
            <span className="text-[10px] text-slate-400">Portail Opérationnel & Arbitrage Budgétaire</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Système sécurisé · Version 2026.4</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 my-4">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Login Form (6 cols) */}
          <div className="lg:col-span-7 bg-surface-card rounded-2xl p-8 shadow-2xl border border-border-default flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-full bg-primary-subtle text-primary font-caption-medium text-xs font-semibold">
                  Espace d'authentification
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  SSO v3.8
                </span>
              </div>

              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Connexion au portail SIRH
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Accédez à votre espace selon vos habilitations professionnelles (RH, Manager, Contrôle Finance, Direction Générale).
              </p>

              {errorMessage && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-danger-red text-xs flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">shield_lock</span>
                  <div className="flex-1">
                    <span>{infoMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Remembered logins dropdown (Without passwords) */}
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-primary">
                      Historique des identifiants mémorisés
                    </label>
                    <span className="text-[10px] text-primary flex items-center gap-1 font-medium bg-primary-subtle/50 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[12px]">security</span>
                      Sans mot de passe
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-11 px-3 bg-bg-canvas hover:bg-slate-50 border border-border-default rounded-lg text-xs text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="material-symbols-outlined text-primary text-[19px]">
                        history_toggle_off
                      </span>
                      {email ? (
                        <div className="truncate">
                          <span className="font-semibold text-text-primary">
                            {savedLogins.find((s) => s.email.toLowerCase() === email.toLowerCase())?.name || email}
                          </span>
                          <span className="text-text-muted text-[11px] ml-1.5 font-mono">({email})</span>
                        </div>
                      ) : (
                        <span className="text-text-muted">
                          Sélectionnez un identifiant récent ({savedLogins.length} mémorisés)...
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-text-muted text-[18px]">
                      {isDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-surface-card rounded-xl border border-border-default shadow-2xl z-30 overflow-hidden divide-y divide-border-default/60 animate-in fade-in slide-in-from-top-1">
                      <div className="p-2.5 bg-slate-50/90 text-[11px] text-text-secondary flex items-center justify-between">
                        <span className="font-semibold">Comptes utilisés récemment sur ce poste</span>
                        <span className="text-[10px] font-mono text-text-muted">0 mot de passe stocké</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {savedLogins.map((saved) => (
                          <div
                            key={saved.email}
                            onClick={() => handleSelectSavedLogin(saved)}
                            className={`p-2.5 hover:bg-slate-100 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                              email.toLowerCase() === saved.email.toLowerCase() ? 'bg-primary-subtle/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                saved.roleType === 'Manager'
                                  ? 'bg-blue-100 text-blue-700'
                                  : saved.roleType === 'Finance'
                                  ? 'bg-amber-100 text-amber-700'
                                  : saved.roleType === 'Direction'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {saved.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-text-primary text-xs truncate">{saved.name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-surface-container-high text-text-secondary">
                                    {saved.roleType}
                                  </span>
                                </div>
                                <div className="text-[11px] text-text-muted truncate">{saved.email}</div>
                                {saved.roleType === 'Manager' && (
                                  <div className="text-[10px] text-blue-600 font-medium">
                                    ★ Responsable de 3 départements (Infra, Cyber, Archi)
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {saved.lastLoginAt && (
                                <span className="text-[10px] text-text-muted hidden sm:inline">{saved.lastLoginAt}</span>
                              )}
                              <button
                                type="button"
                                title="Oublier cet identifiant"
                                onClick={(e) => handleRemoveSavedLogin(e, saved.email)}
                                className="p-1 text-slate-400 hover:text-danger-red rounded hover:bg-slate-200 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 bg-slate-50 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('');
                            setPassword('');
                            setInfoMessage(null);
                            setIsDropdownOpen(false);
                          }}
                          className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                        >
                          + Réinitialiser ou saisir un autre email
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1" htmlFor="email-input">
                    Adresse e-mail professionnelle saisie
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                      mail
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.fr"
                      className="w-full h-10 pl-9 pr-3 bg-bg-canvas border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-primary" htmlFor="password-input">
                      Mot de passe <span className="text-danger-red">*</span>
                    </label>
                    <span className="text-[11px] text-text-muted">
                      Toujours requis (non mémorisé)
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                      lock
                    </span>
                    <input
                      ref={passwordInputRef}
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Saisissez votre mot de passe..."
                      className="w-full h-10 pl-9 pr-10 bg-bg-canvas border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[18px] flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember me & Security */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-text-secondary select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-container focus:ring-primary-container"
                    />
                    <span>Mémoriser ma session</span>
                  </label>
                  <span className="text-text-muted text-[11px]">Audit CNIL n°2026-B</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary-container hover:bg-primary-hover text-white rounded-lg font-body-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Vérification des droits...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Se connecter au portail</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-border-default/60 flex items-center justify-between text-[11px] text-text-muted">
              <span>Connexion chiffrée SSL / TLS 1.3</span>
              <span className="flex items-center gap-1 text-success-dark font-medium">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Serveurs Hébergés France
              </span>
            </div>
          </div>

          {/* Right Column: 1-Click Role Accounts (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 backdrop-blur-md text-white">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-info-sky text-[20px]">admin_panel_settings</span>
                <h3 className="font-body-semibold text-sm text-white">Accès Rapide par Rôle (RBAC)</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Cliquez sur un profil pour vous connecter instantanément et tester les habilitations et fonctionnalités dédiées :
              </p>

              {/* Persona Cards */}
              <div className="space-y-2.5">
                {USER_PROFILES.map((u) => {
                  const isCurrent = email === u.email;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 group ${
                        isCurrent
                          ? 'bg-slate-700/90 border-primary-container shadow-md ring-2 ring-primary-container/40'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700/60 hover:border-slate-500'
                      }`}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-600 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${
                          u.roleType === 'Manager'
                            ? 'bg-blue-600 text-white'
                            : u.roleType === 'Finance'
                            ? 'bg-amber-600 text-white'
                            : 'bg-purple-600 text-white'
                        }`}>
                          {u.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white group-hover:text-primary-fixed truncate">
                            {u.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.roleType === 'RH'
                              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700'
                              : u.roleType === 'Manager'
                              ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                              : u.roleType === 'Finance'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          }`}>
                            {u.roleType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate mt-0.5">{u.role}</div>
                        {u.managedDepartmentNames && u.managedDepartmentNames.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {u.managedDepartmentNames.map((dName, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-700/80 text-[9px] text-blue-200 border border-slate-600 font-medium">
                                🏢 {dName.split('(')[0].trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                          {u.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RBAC Matrix info pill */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-slate-400 space-y-1">
              <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-info-sky">security</span>
                Règles de séparation des pouvoirs
              </div>
              <p className="leading-tight">
                • <strong>Manager</strong> : saisit et chiffre le besoin initial (pas de visa RH).<br />
                • <strong>RH</strong> : valide la fiche & convention (pas d'arbitrage budget).<br />
                • <strong>Finance</strong> : autorise la dérogation budgétaire.<br />
                • <strong>Direction</strong> : signature exécutive finale obligatoire.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="h-12 px-8 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-500 relative z-10 bg-slate-900/60">
        <div>© 2026 Entreprise SA — Système d'Information Ressources Humaines (SIRH).</div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Conditions d'Utilisation</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Politique RGPD</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Support Helpdesk DSI</span>
        </div>
      </footer>
    </div>
  );
};
