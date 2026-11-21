import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export function OffboardingView() {
  const [rows,setRows]=useState<Array<Record<string,unknown>>>([]);
  const [employeeId,setEmployeeId]=useState('1');
  const [reason,setReason]=useState('DEMISSION');
  const [noticeDays,setNoticeDays]=useState('30');
  const [error,setError]=useState('');

  // TypeScript-safe local initialization
  const [date,setDate]=useState('2026-12-31');
  const refresh=async()=>{try{setRows(await apiGet<Array<Record<string,unknown>>>('/offboarding'));}catch(e){setError(e instanceof Error?e.message:'Chargement impossible');}};
  useEffect(()=>{void refresh();},[]);
  const submit=async()=>{try{await apiPost('/offboarding',{employeeId:Number(employeeId),reason,exitDate:date,noticeDays:Number(noticeDays)});await refresh();}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible');}};

  return <main className="mx-auto w-full max-w-7xl p-6 md:p-8">
    <p className="text-sm text-slate-500">Bloc 12</p><h1 className="text-2xl font-bold">Rupture & offboarding</h1>
    {error&&<p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="mt-6 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-5">
      <input className="rounded border px-3 py-2" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="ID employe"/>
      <select className="rounded border px-3 py-2" value={reason} onChange={e=>setReason(e.target.value)}><option>DEMISSION</option><option>LICENCEMENT</option><option>FIN_CDD</option><option>RETRAITE</option><option>RUPTURE_CONVENTIONNELLE</option></select>
      <input className="rounded border px-3 py-2" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" value={noticeDays} onChange={e=>setNoticeDays(e.target.value)} placeholder="Preavis (jours)" />
      <button onClick={()=>void submit()} className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Ouvrir offboarding</button>
    </section>
    <section className="mt-4 overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Employe</th><th className="p-3">Motif</th><th className="p-3">Sortie</th><th className="p-3">Preavis</th><th className="p-3">Statut</th></tr></thead>
      <tbody>{rows.map(r=><tr key={String(r.id)} className="border-t"><td className="p-3">{String(r.employee_name??r.employee_id)}</td><td className="p-3">{String(r.motif)}</td><td className="p-3">{String(r.date_sortie)}</td><td className="p-3">{String(r.duree_preavis_jours)} j</td><td className="p-3">{String(r.statut)}</td></tr>)}</tbody></table>
      {rows.length===0&&<p className="p-6 text-center text-slate-500">Aucune rupture.</p>}
    </section>
  </main>;
}
