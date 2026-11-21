import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export function DisciplineView() {
  const [rows,setRows]=useState<Array<Record<string,unknown>>>([]);
  const [employeeId,setEmployeeId]=useState('1');
  const [subject,setSubject]=useState('Retard grave');
  const [description,setDescription]=useState('Description factuelle de l incident');
  const [error,setError]=useState('');

  const refresh=async()=>{try{setRows(await apiGet<Array<Record<string,unknown>>>('/discipline/incidents'));}catch(e){setError(e instanceof Error?e.message:'Chargement impossible');}};
  useEffect(()=>{void refresh();},[]);
  const submit=async()=>{try{await apiPost('/discipline/incidents',{employeeId:Number(employeeId),subject,description,date:'2026-11-20'});await refresh();}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible');}};

  return <main className="mx-auto w-full max-w-7xl p-6 md:p-8">
    <p className="text-sm text-slate-500">Bloc 11</p><h1 className="text-2xl font-bold">Discipline & sanctions</h1>
    {error&&<p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="mt-6 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-4">
      <input className="rounded border px-3 py-2" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="ID employe"/>
      <input className="rounded border px-3 py-2" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Objet"/>
      <input className="rounded border px-3 py-2 md:col-span-1" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description"/>
      <button onClick={()=>void submit()} className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Declarer incident</button>
    </section>
    <section className="mt-4 overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Employe</th><th className="p-3">Objet</th><th className="p-3">Date</th><th className="p-3">Statut</th></tr></thead>
      <tbody>{rows.map(r=><tr key={String(r.id)} className="border-t"><td className="p-3">{String(r.employee_name??r.employee_id)}</td><td className="p-3">{String(r.objet)}</td><td className="p-3">{String(r.date_incident)}</td><td className="p-3">{String(r.statut)}</td></tr>)}</tbody></table>
      {rows.length===0&&<p className="p-6 text-center text-slate-500">Aucun incident.</p>}
    </section>
  </main>;
}
