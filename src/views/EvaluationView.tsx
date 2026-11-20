import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export function EvaluationView() {
  const [rows,setRows]=useState<Array<Record<string,unknown>>>([]);
  const [matricule,setMatricule]=useState('EMP-2026-0001');
  const [period,setPeriod]=useState('2026');
  const [score,setScore]=useState('3');
  const [error,setError]=useState('');

  const refresh=async()=>{try{setRows(await apiGet<Array<Record<string,unknown>>>('/evaluations'));}catch(e){setError(e instanceof Error?e.message:'Chargement impossible');}};
  useEffect(()=>{void refresh();},[]);
  const submit=async()=>{try{await apiPost('/evaluations',{matricule:matricule.trim(),period,score:Number(score),comment:'Evaluation saisie depuis le portail'});await refresh();}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible');}};

  return <main className="mx-auto w-full max-w-7xl p-6 md:p-8">
    <p className="text-sm text-slate-500">Bloc 9</p><h1 className="text-2xl font-bold">Evaluation, competences & formation</h1>
    {error&&<p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="mt-6 rounded-xl border bg-white p-5">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded border px-3 py-2" value={matricule} onChange={e=>setMatricule(e.target.value)} placeholder="Matricule employe"/>
        <input className="rounded border px-3 py-2" value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Periode"/>
        <input className="rounded border px-3 py-2" type="number" min="0" max="5" value={score} onChange={e=>setScore(e.target.value)} placeholder="Score"/>
        <button onClick={()=>void submit()} className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Creer une evaluation</button>
      </div>
    </section>
    <section className="mt-4 overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Employe</th><th className="p-3">Matricule</th><th className="p-3">Periode</th><th className="p-3">Score</th><th className="p-3">Statut</th></tr></thead>
      <tbody>{rows.map(r=><tr key={String(r.id)} className="border-t"><td className="p-3">{String(r.employee_name??r.employee_id)}</td><td className="p-3">{String(r.matricule??'-')}</td><td className="p-3">{String(r.periode)}</td><td className="p-3">{String(r.score)}</td><td className="p-3">{String(r.statut)}</td></tr>)}</tbody></table>
      {rows.length===0&&<p className="p-6 text-center text-slate-500">Aucune evaluation.</p>}
    </section>
  </main>;
}
