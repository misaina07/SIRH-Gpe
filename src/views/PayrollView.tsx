import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
import { PayrollEmployee,PayrollLine,PayrollResult} from '../types/paie';

export function PayrollView({ role }: { role:string }) {
  const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [employees,setEmployees]=useState<PayrollEmployee[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [result,setResult]=useState<PayrollResult|null>(null);
  const [error,setError]=useState('');
  const canManage=role==='RH';

  const refresh=useCallback(async()=> {
    if(!canManage)return;
    const [year,monthNumber]=month.split('-').map(Number);
    const from=`${year}-${String(monthNumber).padStart(2,'0')}-01`;
    const last=new Date(year,monthNumber,0);
    const to=`${year}-${String(monthNumber).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`;
    try {
      setError('');
      const data=await apiGet<{employees:PayrollEmployee[]}>(`/payroll/collection?from=${from}&to=${to}`);
      setEmployees(data.employees);
    } catch(e) { setError(e instanceof Error?e.message:'Erreur de chargement'); }
  },[month,canManage]);

  useEffect(()=>{void refresh();},[refresh]);

  const calculate=async(employee:PayrollEmployee)=>{
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
      </aside>}
    </section>
  </main>;
}
