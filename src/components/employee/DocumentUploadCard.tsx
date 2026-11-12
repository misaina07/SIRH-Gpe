import React, { useEffect, useState } from 'react';
import { apiBlob, apiGet, apiPatch, apiUpload } from '../../services/api';
import { EmployeeDocument } from '../../types/employee';
import { UserRole } from '../../types/sirh';

const documentTypes: Array<[EmployeeDocument['documentType'], string]> = [
  ['CNI', 'Carte nationale d’identite'], ['TITRE_SEJOUR', 'Titre de sejour'], ['RIB', 'RIB'],
  ['PERMIS_CONDUIRE', 'Permis de conduire'], ['VISITE_MEDICALE', 'Attestation aptitude'],
  ['DIPLOME', 'Diplome'], ['CONTRAT_SIGNE', 'Contrat signe'],
];
const badgeStyle: Record<EmployeeDocument['validity'], string> = {
  valide: 'bg-emerald-100 text-emerald-800', en_attente: 'bg-slate-100 text-slate-700',
  expire_bientot: 'bg-amber-100 text-amber-900', expire: 'bg-red-100 text-red-800', rejete: 'bg-rose-100 text-rose-800',
};

interface Props { employeeId: number; role: UserRole; }

export const DocumentUploadCard: React.FC<Props> = ({ employeeId, role }) => {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentType, setDocumentType] = useState<EmployeeDocument['documentType']>('CNI');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUpload = role === 'RH' || role === 'Employee';
  const canVerify = role === 'RH';
  const canRead = ['RH', 'Direction', 'Employee'].includes(role);

  const refresh = async () => setDocuments(await apiGet<EmployeeDocument[]>(`/employees/${employeeId}/documents`));
  useEffect(() => { if (canRead) refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement GED impossible.')); }, [employeeId, canRead]);

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      form.append('documentType', documentType);
      if (expirationDate) form.append('expirationDate', expirationDate);
      form.append('file', file);
      await apiUpload<EmployeeDocument>(`/employees/${employeeId}/documents`, form);
      setFile(null); setExpirationDate('');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Televersement impossible.'); }
    finally { setBusy(false); }
  };

  const download = async (document: EmployeeDocument) => {
    try {
      const content = await apiBlob(`/employees/${employeeId}/documents/${document.id}/content`);
      const url = URL.createObjectURL(content);
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = document.filename; anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Telechargement impossible.'); }
  };

  const verify = async (document: EmployeeDocument, status: 'valide' | 'rejete') => {
    setBusy(true); setError(null);
    try { await apiPatch(`/employees/${employeeId}/documents/${document.id}/verification`, { status, note }); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Verification impossible.'); }
    finally { setBusy(false); }
  };

  if (!canRead) return <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Les documents personnels et médicaux ne sont pas accessibles aux managers.</p>;

  return <section className="flex flex-col gap-4">
    <div><h3 className="text-lg font-semibold text-slate-900">GED administrative</h3><p className="text-sm text-slate-500">Les fichiers sont verifies, chiffrés au stockage et accessibles selon les habilitations.</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {canUpload && <form onSubmit={upload} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">Type de document<select value={documentType} onChange={(e) => setDocumentType(e.target.value as EmployeeDocument['documentType'])} className="rounded-lg border border-slate-300 bg-white p-2">{documentTypes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm">Date d’expiration{documentType==='TITRE_SEJOUR'&&<span className="text-red-600"> requise</span>}<input type="date" required={documentType==='TITRE_SEJOUR'} value={expirationDate} onChange={(e)=>setExpirationDate(e.target.value)} className="rounded-lg border border-slate-300 bg-white p-2" /></label>
      <label className="flex flex-col gap-1 text-sm md:col-span-2">Fichier PDF, JPG ou PNG (8 Mo max)<input type="file" accept="application/pdf,image/jpeg,image/png" required onChange={(e)=>setFile(e.target.files?.[0]??null)} className="rounded-lg border border-slate-300 bg-white p-2" /></label>
      <button disabled={busy||!file} className="justify-self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Envoi…':'Deposer le document'}</button>
    </form>}
    {canVerify && <label className="flex flex-col gap-1 text-sm">Note de validation RH<input value={note} onChange={(e)=>setNote(e.target.value)} maxLength={500} placeholder="Motif en cas de rejet" className="rounded-lg border border-slate-300 p-2" /></label>}
    {documents.length===0 ? <p className="rounded-lg bg-white p-4 text-sm text-slate-500">Aucun document dans le dossier.</p> : <div className="flex flex-col gap-2">{documents.map((doc) => <article key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div><p className="font-semibold text-slate-800">{documentTypes.find(([type])=>type===doc.documentType)?.[1]??doc.documentType} · {doc.filename}</p><p className="text-xs text-slate-500">{doc.expirationDate?`Expire le ${doc.expirationDate}`:'Sans date d’expiration'} · {Math.ceil(doc.fileSizeBytes/1024)} Ko</p>{doc.verificationNote&&<p className="mt-1 text-xs text-rose-700">Note RH : {doc.verificationNote}</p>}</div>
      <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle[doc.validity]}`}>{doc.validity==='expire_bientot'?'Expire dans 30 j':doc.validity}</span><button onClick={()=>download(doc)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Telecharger</button>{canVerify&&doc.verificationStatus==='en_attente'&&<><button disabled={busy} onClick={()=>verify(doc,'valide')} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">Valider</button><button disabled={busy} onClick={()=>verify(doc,'rejete')} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Rejeter</button></>}</div>
    </article>)}</div>}
  </section>;
};
