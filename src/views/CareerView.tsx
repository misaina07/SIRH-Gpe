import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export function CareerView() {
  const [rows,setRows]=useState<Array<Record<string,unknown>>>([]);
  const [employeeId,setEmployeeId]=useState('1');
  const [position,setPosition]=useState('Chef de projet');
  const [department,setDepartment]=useState('DRH');
  const [date,setDate]=useState('2026-12-01');
  const [error,setError]=useState('');

  const refresh=async()=>{try{setRows(await apiGet<Array<Record<string,unknown>>>('/career'));}catch(e){setError(e instanceof Error?e.message:'Chargement impossible');}};
  useEffect(()=>{void refresh();},[]);
  const mutation=async()=>{try{await apiPost('/career/events',{employeeId:Number(employeeId),type:'MUTATION',date,department,position,comment:'Mutation creee depuis le portail'});await refresh();}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible');}};

  return <main className="mx-auto w-full max-w-7xl p-6 md:p-8">
    <p className="text-sm text-slate-500">Bloc 10</p><h1 className="text-2xl font-bold">Carriere & mobilite</h1>
    {error&&<p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="mt-6 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-5">
      <input className="rounded border px-3 py-2" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="ID employe"/>
      <input className="rounded border px-3 py-2" value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Departement"/>
      <input className="rounded border px-3 py-2" value={position} onChange={e=>setPosition(e.target.value)} placeholder="Poste"/>
      <input className="rounded border px-3 py-2" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <button onClick={()=>void mutation()} className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Proposer mutation</button>
    </section>
    <section className="mt-4 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Frise chronologique</h2>
      {rows.length===0?<p className="mt-3 text-sm text-slate-500">Aucun evenement d'affectation.</p>:<div className="mt-3 space-y-2">{rows.map(r=><div key={String(r.id)} className="border-l-4 border-indigo-500 pl-3 text-sm"><b>{String(r.libelle??r.poste)}</b><span className="ml-2 text-slate-500">{String(r.date_debut)} - {String(r.date_fin??'En cours')}</span></div>)}</div>}
    </section>
  </main>;
}
