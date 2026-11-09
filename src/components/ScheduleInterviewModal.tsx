import React, { useState } from 'react';
import { Candidate } from '../types/sirh';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onScheduled: (candidateName: string, date: string, type: string) => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidates,
  onScheduled,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]?.name || 'Julien Vasseur');
  const [interviewType, setInterviewType] = useState('Technique & Live Coding');
  const [date, setDate] = useState('2026-10-24');
  const [time, setTime] = useState('14:30');
  const [interviewer, setInterviewer] = useState('Marc Lefebvre (Engineering Manager)');
  const [notes, setNotes] = useState('Évaluation approfondie Kubernetes Security, Vault et architecture Zero Trust.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduled(selectedCandidate, `${date} à ${time}`, interviewType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card rounded-2xl shadow-2xl max-w-lg w-full border border-border-default overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-canvas">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-info-sky flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">video_call</span>
            </div>
            <div>
              <h3 className="font-body-semibold text-text-primary text-base">Planifier un entretien</h3>
              <p className="text-xs text-text-muted">Synchronisation automatique avec Google Calendar / Meet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-body-default">
          {/* Candidate selector */}
          <div>
            <label className="font-body-semibold text-text-primary block mb-1">
              Candidat à auditionner <span className="text-danger-red">*</span>
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} — {c.roleTitle} (Note: {c.score}/5)
                </option>
              ))}
            </select>
          </div>

          {/* Type of Interview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body-semibold text-text-primary block mb-1">Type d'entretien</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="Qualification RH">Qualification RH</option>
                <option value="Technique & Live Coding">Technique & Live Coding</option>
                <option value="Debrief Manager">Debrief Manager</option>
                <option value="Entretien Direction / Offre">Entretien Direction / Offre</option>
              </select>
            </div>
            <div>
              <label className="font-body-semibold text-text-primary block mb-1">Évaluateur principal</label>
              <input
                type="text"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body-semibold text-text-primary block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div>
              <label className="font-body-semibold text-text-primary block mb-1">Heure (Paris)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-body-semibold text-text-primary block mb-1">Objectifs et notes préparatoires</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container leading-relaxed"
            />
          </div>

          {/* Video meeting toggle notice */}
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-sky-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            <span>Un lien de visioconférence sécurisé sera généré et inséré dans les invitations.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-border-default bg-white text-text-secondary hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary-container text-white font-body-semibold hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Confirmer la planification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
