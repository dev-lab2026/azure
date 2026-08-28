import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, Clock3, Gauge,
  Layers3, Target, TrendingUp, Users, WalletCards
} from 'lucide-react';
import {
  BarChart, Bar, CartesianGrid, Cell, LineChart, Line, PieChart, Pie,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Project } from '../types';
import { calculateProjectMetrics, formatCurrency } from '../utils/pmCalculations';

interface PMStudioAnalyticsProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

const statusLabel: Record<string,string> = {
  IN_PROGRESS: 'En cours',
  PLANNING: 'Planification',
  COMPLETED: 'Terminé',
  ON_HOLD: 'En pause',
  AT_RISK: 'À risque',
  CANCELLED: 'Annulé',
};

export const PMStudioAnalytics: React.FC<PMStudioAnalyticsProps> = ({ projects, onSelectProject }) => {
  const [range, setRange] = useState<'ALL'|'ACTIVE'|'RISK'>('ALL');

  const analytics = useMemo(() => {
    const filtered = projects.filter(p => range === 'ALL'
      ? true
      : range === 'ACTIVE'
        ? p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
        : p.status === 'AT_RISK'
    );
    const metrics = filtered.map(project => ({ project, metrics: calculateProjectMetrics(project) }));
    const totalTasks = metrics.reduce((n,x)=>n+x.metrics.totalTasks,0);
    const completedTasks = metrics.reduce((n,x)=>n+x.metrics.completedTasks,0);
    const overdue = metrics.reduce((n,x)=>n+x.metrics.overdueTasks,0);
    const blocked = metrics.reduce((n,x)=>n+x.metrics.blockedTasks,0);
    const risks = metrics.reduce((n,x)=>n+x.metrics.totalRisksCount,0);
    const criticalRisks = metrics.reduce((n,x)=>n+x.metrics.criticalRisksCount,0);
    const budget = metrics.reduce((n,x)=>n+x.metrics.BAC,0);
    const ev = metrics.reduce((n,x)=>n+x.metrics.EV,0);
    const ac = metrics.reduce((n,x)=>n+x.metrics.AC,0);
    const avgProgress = metrics.length ? metrics.reduce((n,x)=>n+x.metrics.progressPercent,0)/metrics.length : 0;
    const avgHealth = metrics.length ? metrics.reduce((n,x)=>n+x.metrics.healthScore,0)/metrics.length : 0;
    return {
      filtered, metrics, totalTasks, completedTasks, overdue, blocked, risks, criticalRisks,
      budget, ev, ac, avgProgress, avgHealth,
      completionRate: totalTasks ? completedTasks/totalTasks*100 : 0,
    };
  }, [projects, range]);

  const statusData = useMemo(() => {
    const counts = new Map<string,number>();
    analytics.filtered.forEach(p => counts.set(p.status,(counts.get(p.status)||0)+1));
    return Array.from(counts.entries()).map(([name,value])=>({name:statusLabel[name]||name,value}));
  }, [analytics.filtered]);

  const projectData = analytics.metrics
    .slice()
    .sort((a,b)=>b.metrics.progressPercent-a.metrics.progressPercent)
    .slice(0,8)
    .map(({project,metrics})=>({
      id: project.id, name: project.code || project.name.slice(0,14),
      progress: Math.round(metrics.progressPercent), health: Math.round(metrics.healthScore),
      tasks: metrics.totalTasks, risks: metrics.criticalRisksCount
    }));

  const kpis = [
    { label:'Projets suivis', value: analytics.filtered.length, icon: Layers3, note:'périmètre courant' },
    { label:'Avancement moyen', value:`${Math.round(analytics.avgProgress)}%`, icon: TrendingUp, note:'progression portefeuille' },
    { label:'Tâches terminées', value:`${analytics.completedTasks}/${analytics.totalTasks}`, icon: CheckCircle2, note:`${Math.round(analytics.completionRate)}% réalisées` },
    { label:'Risques critiques', value:analytics.criticalRisks, icon: AlertTriangle, note:`${analytics.risks} risques au total` },
    { label:'Santé moyenne', value:Math.round(analytics.avgHealth), icon:Gauge, note:'score / 100' },
    { label:'Budget BAC', value:formatCurrency(analytics.budget), icon:WalletCards, note:'budget agrégé' },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-20 bottom-0 w-56 h-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              <BarChart3 className="w-4 h-4" /> PM Studio Analytics
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Pilotage opérationnel en un coup d’œil</h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Une vue native de Clarity alimentée par les projets, tâches, risques, jalons et indicateurs EVM de PostgreSQL.
            </p>
          </div>
          <div className="flex gap-2">
            {([['ALL','Tout'],['ACTIVE','Actifs'],['RISK','À risque']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setRange(id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${range===id?'bg-white text-slate-900 border-white':'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(kpi=>{
          const Icon=kpi.icon;
          return <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
              <Icon className="w-4 h-4 text-indigo-500"/>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 truncate">{kpi.value}</div>
            <div className="mt-1 text-[11px] text-slate-400">{kpi.note}</div>
          </div>;
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-bold text-slate-900">Performance des projets</h2><p className="text-xs text-slate-500">Avancement et santé</p></div>
            <Activity className="w-5 h-5 text-indigo-500"/>
          </div>
          <div className="h-72">
            {projectData.length ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{top:8,right:10,left:-15,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                <Tooltip formatter={(v:any)=>[`${v}%`,'Score']}/>
                <Bar dataKey="progress" name="Avancement" radius={[6,6,0,0]} />
                <Bar dataKey="health" name="Santé" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer> : <EmptyState/>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Répartition des statuts</h2>
          <p className="text-xs text-slate-500">Périmètre sélectionné</p>
          <div className="h-72">
            {statusData.length ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {statusData.map((_,i)=><Cell key={i}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer> : <EmptyState/>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-indigo-500"/><div><h2 className="font-bold">Top projets</h2><p className="text-xs text-slate-500">Cliquez pour ouvrir le projet</p></div></div>
          <div className="space-y-2">
            {analytics.metrics.slice().sort((a,b)=>b.metrics.healthScore-a.metrics.healthScore).slice(0,6).map(({project,metrics})=>(
              <button key={project.id} onClick={()=>onSelectProject(project.id)} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold text-sm truncate">{project.code} · {project.name}</span><span className="text-xs font-bold">{Math.round(metrics.progressPercent)}%</span></div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{width:`${Math.min(100,Math.max(0,metrics.progressPercent))}%`}}/></div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500"><span>Santé {Math.round(metrics.healthScore)}/100</span><span>{metrics.totalTasks} tâches · {metrics.criticalRisksCount} risques critiques</span></div>
              </button>
            ))}
            {!analytics.metrics.length && <EmptyState/>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Clock3 className="w-5 h-5 text-indigo-500"/><div><h2 className="font-bold">Alertes de pilotage</h2><p className="text-xs text-slate-500">Points à traiter en priorité</p></div></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <AlertCard icon={AlertTriangle} label="Risques critiques" value={analytics.criticalRisks} tone="rose"/>
            <AlertCard icon={Clock3} label="Tâches en retard" value={analytics.overdue} tone="amber"/>
            <AlertCard icon={Activity} label="Tâches bloquées" value={analytics.blocked} tone="violet"/>
            <AlertCard icon={Users} label="Membres mobilisés" value={analytics.filtered.reduce((n,p)=>n+p.members.length,0)} tone="blue"/>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-700">Valeur acquise / coût réel</span><span className="font-bold">{formatCurrency(analytics.ev)} / {formatCurrency(analytics.ac)}</span></div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-indigo-500" style={{width:`${analytics.budget ? Math.min(100, analytics.ev/analytics.budget*100) : 0}%`}}/></div>
          </div>
        </div>
      </div>
    </section>
  );
};

const EmptyState=()=> <div className="h-full flex items-center justify-center text-sm text-slate-400">Aucune donnée disponible.</div>;
const AlertCard=({icon:Icon,label,value,tone}:{icon:any,label:string,value:number,tone:string})=>{
  const toneClass:Record<string,string>={rose:'bg-rose-50 border-rose-100 text-rose-600',amber:'bg-amber-50 border-amber-100 text-amber-600',violet:'bg-violet-50 border-violet-100 text-violet-600',blue:'bg-blue-50 border-blue-100 text-blue-600'};
  return <div className={`rounded-xl border p-4 ${toneClass[tone]||toneClass.blue}`}>
    <Icon className="w-4 h-4" />
    <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    <div className="text-xs text-slate-500">{label}</div>
  </div>;
};
