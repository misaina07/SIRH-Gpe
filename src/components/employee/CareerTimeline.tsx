import React, { useState } from 'react';
import { apiPost } from '../../services/api';
import { EmployeeCareerEvent } from '../../types/employee';
import { UserRole } from '../../types/sirh';

interface Props { employeeId: number; events: EmployeeCareerEvent[]; role: UserRole; onCreated: () => Promise<void>; }

export const CareerTimeline: React.FC<Props> = ({ employeeId, events, role, onCreated }) => {
  const [type,setType]=useState('PROMOTION'); const [eventDate,setEventDate]=useState(new Date().toISOString().slice(0,10));
  const [title,setTitle]=useState(''); const [description,setDescription]=useState(''); const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const create=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError(null);try{await apiPost(`/employees/${employeeId}/career`,{type,eventDate,title,description:description||null});setTitle('');setDescription('');await onCreated();}catch(cause){setError(cause instanceof Error?cause.message:'Enregistrement de l’événement impossible.');}finally{setBusy(false);}};
  return <section className="flex flex-col gap-4"><div><h3 className="text-lg font-semibold text-slate-900">Historique de carrière</h3><p className="text-sm text-slate-500">Les événements sont ajoutés au journal immuable du dossier.</p></div>
    {role==='RH'&&<form onSubmit={create} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Type<select value={type} onChange={e=>setType(e.target.value)} className="rounded-lg border p-2">{['PROMOTION','MOBILITE','CHANGEMENT_MANAGER','AVENANT','PERIODE_ESSAI','FORMATION','AUTRE'].map(item=><option key={item}>{item}</option>)}</select></label><label className="flex flex-col gap-1 text-sm">Date<input type="date" required value={eventDate} onChange={e=>setEventDate(e.target.value)} className="rounded-lg border p-2" /></label><label className="flex flex-col gap-1 text-sm md:col-span-2">Intitulé<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="rounded-lg border p-2" /></label><label className="flex flex-col gap-1 text-sm md:col-span-2">Détails<textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} className="rounded-lg border p-2" /></label>{error&&<p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}<button disabled={busy} className="justify-self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Ajouter à l’historique</button></form>}
    <ol className="flex flex-col gap-3">{events.map(item=><li key={item.id} className="relative border-l-2 border-blue-200 pb-2 pl-5"><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600"/><p className="font-semibold text-slate-900">{item.title}</p><p className="text-xs uppercase tracking-wide text-blue-700">{item.type} · {item.eventDate}</p>{item.description&&<p className="mt-1 text-sm text-slate-600">{item.description}</p>}</li>)}</ol>
  </section>;
};
