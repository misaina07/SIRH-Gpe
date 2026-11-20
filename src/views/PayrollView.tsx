import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../services/api';
import { PayrollEmployee,PayrollLine,PayrollResult} from '../types/paie';

export function PayrollView({ role }: { role:string }) {
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [employees,setEmployees]=useState<PayrollEmployee[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [result,setResult]=useState<PayrollResult|null>(null);
  const [error,setError]=useState('');
  const [periodId,setPeriodId]=useState<number|null>(null);
  const canManage=role==='RH';

  const refresh=useCallback(async()=> {
    // Charge les données de collecte et retrouve la période du mois affiché.
    if(!canManage)return;
    const [year,monthNumber]=month.split('-').map(Number);
    const from=`${year}-${String(monthNumber).padStart(2,'0')}-01`;
    const last=new Date(year,monthNumber,0);
    const to=`${year}-${String(monthNumber).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`;
    try {
      setError('');
      const data=await apiGet<{employees:PayrollEmployee[]}>(`/payroll/collection?from=${from}&to=${to}`);
      setEmployees(data.employees);
      const periods=await apiGet<Array<{id:number;annee:number;mois:number;verrouillee:boolean}>>('/payroll/periods');
      setPeriodId(periods.find(p=>p.annee===year&&p.mois===monthNumber)?.id??null);
    } catch(e) { setError(e instanceof Error?e.message:'Erreur de chargement'); }
  },[month,canManage]);

  useEffect(()=>{void refresh();},[refresh]);

  const calculate=async(employee:PayrollEmployee)=>{
    // Transforme les données collectées en PayrollInput puis demande
    // au backend d'appliquer les règles de calcul de paie.
    setSelected(employee.id);
    setError('');
    try {
      const manualVariables=employee.manual_variables.map(v=>({
        rubriqueCode:v.rubrique_code,
        label:v.libelle,
        type:v.type,
        quantity:v.quantite,
        amount:v.montant,
        week:v.semaine
      }));
      const result=await apiPost<PayrollResult>('/payroll/calculate',{
        employeeId:employee.id,
        matricule:employee.matricule,
        firstName:employee.first_name,
        lastName:employee.last_name,
        monthlyBaseSalary:employee.monthly_gross_salary,
        fixedBonus:employee.fixed_bonus,
        variableBonus:employee.variable_bonus,
        workRegime:employee.work_regime,
        grade:null,
        contractStartDate:null,
        contractEndDate:null,
        effectiveWorkedMinutes:employee.effective_worked_minutes,
        overtime25Minutes:employee.overtime_25_minutes,
        overtime50Minutes:employee.overtime_50_minutes,
        nightMinutes:employee.night_minutes,
        sundayMinutes:employee.sunday_worked_minutes,
        holidayMinutes:employee.holiday_worked_minutes,
        absenceDays:employee.absence_days,
        leaveWithoutPayDays:employee.leave_without_pay_days,
        dependentCount:0,
        manualVariables
      });
      setResult(result);
    } catch(e) { setError(e instanceof Error?e.message:'Calcul impossible'); }
  };

  const openPeriod=async()=>{
    // Crée ou ouvre la période mensuelle avant toute saisie de paie.
    const [year,monthNumber]=month.split('-').map(Number);
    try{
      const period=await apiPost<{id:number}>('/payroll/periods',{year,month:monthNumber});
      setPeriodId(period.id);
      setError('Période de paie ouverte.');
    }catch(e){setError(e instanceof Error?e.message:'Ouverture impossible');}
  };

  const exportPdf=()=>{
    if(result==null){setError('Calculez d’abord un bulletin avant l’export PDF.');return;}
    const lines=result.lines.map(line=>`
      <tr><td>${line.label}</td><td>${line.quantity?.toLocaleString('fr-FR')??'-'}</td><td>${line.rate?.toLocaleString('fr-FR')??'-'}</td><td>${line.amount?.toLocaleString('fr-FR')??'0'} Ar</td></tr>
    `).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Fiche de paie ${result.matricule}</title>
      <style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#172033;font-size:12px}h1{font-size:20px;margin:0 0 4px}.muted{color:#64748b}.header{display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}.card{border:1px solid #cbd5e1;padding:10px;border-radius:6px}.right{text-align:right}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e2e8f0;padding:7px;text-align:left}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.total{font-size:16px;font-weight:bold;border-top:2px solid #1e293b}</style></head>
      <body><div class="header"><div><h1>Fiche de paie</h1><div class="muted">Période : ${month}</div></div><div class="right"><b>SIRH Entreprise</b><br><span class="muted">Bulletin individuel</span></div></div>
      <div class="grid"><div class="card"><b>Salarié</b><br>${result.firstName} ${result.lastName}<br><span class="muted">${result.matricule}</span></div><div class="card"><b>Paie</b><br>Brut : ${result.grossSalary?.toLocaleString('fr-FR')} Ar<br>Net : ${result.netSalary?.toLocaleString('fr-FR')} Ar</div></div>
      <table><thead><tr><th>Désignation</th><th>Quantité</th><th>Taux</th><th>Montant</th></tr></thead><tbody>${lines}</tbody></table>
      <p class="total right">Salaire net à payer : ${result.netSalary?.toLocaleString('fr-FR')} Ar</p>
      <p class="muted">CNaPS employé : ${result.cnapsEmployee?.toLocaleString('fr-FR')} Ar — OSTIE employé : ${result.ostieEmployee?.toLocaleString('fr-FR')} Ar — IRSA : ${result.irsa?.toLocaleString('fr-FR')} Ar</p>
      </body></html>`;
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob);
    const popup=window.open(url,'_blank','width=900,height=700');
    if(popup){popup.addEventListener('load',()=>{popup.focus();popup.print();});setTimeout(()=>URL.revokeObjectURL(url),60000);}
  };

  const lockPeriod=async()=>{
    // Verrouille définitivement les valeurs de la période sélectionnée.
    let targetPeriodId=periodId;
    if(targetPeriodId==null){
      const [year,monthNumber]=month.split('-').map(Number);
      try{
        const period=await apiPost<{id:number}>('/payroll/periods',{year,month:monthNumber});
        targetPeriodId=period.id;
        setPeriodId(period.id);
      }catch(e){setError(e instanceof Error?e.message:'Ouverture impossible');return;}
    }
    try{
      await apiPatch(`/payroll/periods/${targetPeriodId}/lock`,{});
      setError('Période verrouillée.');
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:'Verrouillage impossible');}
  };

  const saveBulletin=async()=>{
    // Persiste le résultat calculé pour rendre le bulletin consultable
    // après rechargement de la page ou redémarrage du serveur.
    if(result==null){setError('Calculez un bulletin avant de sauvegarder.');return;}
    let targetPeriodId=periodId;
    if(targetPeriodId==null){
      const [year,monthNumber]=month.split('-').map(Number);
      try{
        const period=await apiPost<{id:number}>('/payroll/periods',{year,month:monthNumber});
        targetPeriodId=period.id;
        setPeriodId(period.id);
      }catch(e){setError(e instanceof Error?e.message:'Ouverture impossible');return;}
    }
    try{
      await apiPost(`/payroll/periods/${targetPeriodId}/bulletins`,result);
      setError('Bulletin enregistré.');
    }catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible');}
  };

  if(!canManage)return <div className="p-8"><p className="rounded-lg border border-amber-300 bg-amber-50 p-4">Accès réservé aux RH.</p></div>;

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
    <header>
      <p className="text-sm text-slate-500">Bloc 8</p>
      <h1 className="text-2xl font-bold text-slate-900">Paie</h1>
    </header>
    {error&&<div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    <section className="rounded-xl border bg-white p-5">
      <label className="text-sm font-medium">Période
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="ml-3 rounded-lg border px-3 py-2"/>
      </label>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>void openPeriod()} className="rounded-lg border px-3 py-2 text-sm">Ouvrir</button>
        <button onClick={()=>void lockPeriod()} className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-800">Verrouiller</button>
      </div>
    </section>
    <section className="grid gap-4 md:grid-cols-[1fr_22rem]">
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3">Salarié</th><th className="p-3">Salaire</th><th className="p-3">HS 25/50</th><th></th></tr></thead>
          <tbody>{employees.map(e=><tr key={e.id} className={selected===e.id?'bg-indigo-50':''}>
            <td className="p-3"><b>{e.first_name} {e.last_name}</b><div className="text-xs text-slate-500">{e.matricule}</div></td>
            <td className="p-3">{e.monthly_gross_salary?.toLocaleString()} Ar</td>
            <td className="p-3">{Math.round(e.overtime_25_minutes/60)} h / {Math.round(e.overtime_50_minutes/60)} h</td>
            <td className="p-3"><button onClick={()=>void calculate(e)} className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white">Calculer</button></td>
          </tr>)}</tbody>
        </table>
        {employees.length===0&&<p className="p-6 text-center text-slate-500">Aucun salarié actif pour cette période.</p>}
      </div>
      {result&&<aside className="h-fit rounded-xl border bg-white p-5">
        <h2 className="font-semibold">{result.matricule}</h2>
        {result.warnings.map(w=><p key={w} className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">{w}</p>)}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Brut</dt><dd>{result.grossSalary?.toLocaleString()} Ar</dd></div>
          <div className="flex justify-between"><dt>IRSA</dt><dd>{result.irsa?.toLocaleString()} Ar</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Net</dt><dd>{result.netSalary?.toLocaleString()} Ar</dd></div>
        </dl>
        <h3 className="mt-5 text-sm font-semibold">Lignes du bulletin</h3>
        <div className="mt-2 max-h-80 space-y-1 overflow-auto">{result.lines.map((line,i)=><div key={`${line.code}-${i}`} className="flex justify-between border-b py-2 text-xs"><span>{line.label}</span><b>{line.amount?.toLocaleString()} Ar</b></div>)}</div>
        <button onClick={()=>void saveBulletin()} className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Enregistrer le bulletin</button>
        <button onClick={exportPdf} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">Exporter la fiche PDF</button>
      </aside>}
    </section>
  </main>;
}
