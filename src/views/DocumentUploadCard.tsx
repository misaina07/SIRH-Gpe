import React, { DragEvent, useRef, useState } from 'react';
import {
  EmployeeDocument,
  EmployeeDocumentStatus,
} from '../types/employee';

interface DocumentUploadCardProps {
  employeeId: number;
  documents: EmployeeDocument[];
  onDocumentAdded?: (document: EmployeeDocument) => void;
}

type UploadState = 'ready' | 'uploading' | 'success' | 'error';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const statusLabel: Record<EmployeeDocumentStatus, string> = {
  valid: 'Valide',
  expiring: 'Expire bientôt',
  expired: 'Expiré',
  unknown: 'Sans échéance',
};

const statusClass: Record<EmployeeDocumentStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-700',
  expiring: 'bg-amber-50 text-amber-700',
  expired: 'bg-red-50 text-red-700',
  unknown: 'bg-slate-100 text-slate-600',
};

function formatFileSize(size: number): string {
  return `${(size / 1024 / 1024).toFixed(2)} Mo`;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  employeeId,
  documents,
  onDocumentAdded,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectFile = (file: File) => {
    setErrorMessage(null);
    setUploadState('ready');

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setUploadState('error');
      setErrorMessage('Format refusé. Utilisez un PDF, une image JPG ou PNG.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setUploadState('error');
      setErrorMessage('Fichier trop volumineux. La taille maximale est de 5 Mo.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = Array.from(event.dataTransfer.files);
    if (file) selectFile(file);
  };

  const uploadFile = () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage(null);

    window.setTimeout(() => {
      const document: EmployeeDocument = {
        id: `local-${employeeId}-${Date.now()}`,
        employeeId,
        name: selectedFile.name,
        documentType: 'AUTRE',
        fileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        status: 'unknown',
      };

      onDocumentAdded?.(document);
      setUploadState('success');
      setSelectedFile(null);
    }, 500);
  };

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-bold text-text-primary">Documents administratifs</h2>
        <p className="mt-1 text-xs text-text-muted">
        </p>
      </div>

      <ul className="mb-5 space-y-2">
        {documents.length === 0 ? (
          <li className="text-sm text-text-muted">Aucun document enregistré.</li>
        ) : (
          documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-default px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {document.name}
                </p>
                {document.expiresAt && (
                  <p className="text-xs text-text-muted">
                    Expire le {document.expiresAt}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass[document.status]}`}>
                {statusLabel[document.status]}
              </span>
            </li>
          ))
        )}
      </ul>

      {documents.some((document) => document.status === 'expiring') && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Attention : un document arrive à expiration dans les 30 jours.
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
          isDragging
            ? 'border-primary bg-primary-subtle'
            : 'border-border-default hover:border-primary'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => {
            const [file] = Array.from(event.target.files ?? []);
            if (file) selectFile(file);
            event.target.value = '';
          }}
        />
        <p className="text-sm font-semibold text-text-primary">
          Déposez un fichier ici ou cliquez pour le sélectionner
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Le fichier est préparé localement pour cette version frontend.
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {selectedFile.name}
            </p>
            <p className="text-xs text-text-muted">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={uploadFile}
            disabled={uploadState === 'uploading'}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {uploadState === 'uploading' ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      )}

      {uploadState === 'success' && (
        <p className="mt-3 text-sm text-emerald-700">Document ajouté avec succès.</p>
      )}
      {errorMessage && <p className="mt-3 text-sm text-red-700">{errorMessage}</p>}
    </section>
  );
};
