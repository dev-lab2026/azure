import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { UserRole } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onImported?: () => void;
};

export const ExcelIntelligentImportModal: React.FC<Props> = ({ isOpen, onClose, role, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<any>(null);

  const total = useMemo(() => preview?.data?.totals
    ? Object.values(preview.data.totals).reduce((a:any,b:any)=>a+Number(b||0),0)
    : 0, [preview]);

  if (!isOpen) return null;

  const reset = () => { setFile(null); setPreview(null); setDone(null); setError(''); };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(''); setPreview(null); setDone(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch('/api/import-excel/preview', { method:'POST', body:fd, credentials:'include' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analyse impossible.');
      setPreview(d);
    } catch(e:any) { setError(e?.message || 'Analyse impossible.'); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    if (!preview?.data?.results) return;
    setLoading(true); setError('');
    try {
      const groups:any = {};
      for (const type of ['projects','tasks','milestones']) {
        groups[type] = preview.data.results[type]?.items || [];
      }
      const r = await fetch('/api/import-excel/confirm', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({groups})
      });
      const d = await r.json();
      if (!r.ok) throw new Error([d.error, ...(d.errors || [])].filter(Boolean).join('\n'));
      setDone(d.data);
      onImported?.();
    } catch(e:any) { setError(e?.message || 'Import impossible.'); }
    finally { setLoading(false); }
  };

  const result = preview?.data?.results || {};
  const sheets = preview?.data?.sheets || [];

  return <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
      <header className="p-6 border-b flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600"/> Import intelligent des données métier</h2>
          <p className="text-sm text-slate-500 mt-1">Excel/CSV → compréhension des feuilles → adaptation au modèle Clarity → validation → PostgreSQL.</p>
        </div>
        <button onClick={()=>{reset();onClose();}}><X/></button>
      </header>

      <main className="p-6 overflow-y-auto space-y-5">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900">
          <b>Le moteur reconnaît automatiquement :</b> projets, tâches et jalons, même si les colonnes sont en français ou en anglais.
          Il rattache les tâches/jalons à un projet par <b>Project ID</b> ou <b>Project Code</b>.
        </div>

        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
          <FileSpreadsheet className="mx-auto w-10 h-10 text-emerald-600"/>
          <p className="font-bold mt-3">Déposer votre fichier Excel</p>
          <p className="text-xs text-slate-500 mt-1">XLSX, XLS ou CSV · jusqu'à 10 Mo</p>
          <input className="mt-4" type="file" accept=".xlsx,.xls,.csv" onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);setDone(null);setError('')}} />
          {file && <p className="text-xs font-semibold text-slate-700 mt-3">📎 {file.name}</p>}
        </div>

        {sheets.length > 0 && <div className="grid md:grid-cols-3 gap-3">
          {sheets.map((s:any)=><div key={s.sheet} className="rounded-2xl border p-4">
            <div className="font-bold">{s.sheet}</div>
            <div className="text-xs text-slate-500 mt-1">{s.rows?.length || 0} ligne(s) · type détecté : <b>{s.type}</b></div>
            <div className="text-xs text-indigo-600 mt-2">Confiance : {Math.round((s.confidence||0)*100)}%</div>
          </div>)}
        </div>}

        {preview && <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            {[
              ['Projets', result.projects?.validCount || 0],
              ['Tâches', result.tasks?.validCount || 0],
              ['Jalons', result.milestones?.validCount || 0],
              ['Total', total]
            ].map(([label,value])=><div key={String(label)} className="rounded-2xl bg-slate-50 border p-4"><div className="text-xs uppercase text-slate-500">{label}</div><div className="text-2xl font-black">{value}</div></div>)}
          </div>

          {['projects','tasks','milestones'].map(type => result[type] && <section key={type} className="border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 font-bold">{type === 'projects' ? 'Projets détectés' : type === 'tasks' ? 'Tâches détectées' : 'Jalons détectés'} — {result[type].validCount} valide(s)</div>
            <div className="max-h-48 overflow-auto divide-y">
              {result[type].items?.slice(0,50).map((x:any,i:number)=><div key={i} className="px-4 py-2 text-sm flex justify-between gap-4">
                <span className="font-medium">{x.title || x.name}</span>
                <span className="text-xs text-slate-500">{x.projectCode || x.code || x.projectId || ''}</span>
              </div>)}
            </div>
          </section>)}

          {Object.values(result).some((x:any)=>x?.errors?.length) && <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <AlertTriangle className="inline w-4 h-4 mr-1"/> Certaines lignes nécessitent une correction avant import.
            <div className="mt-2 max-h-32 overflow-auto text-xs">{Object.values(result).flatMap((x:any)=>x?.errors||[]).slice(0,30).map((e:any,i:number)=><div key={i}>• {e}</div>)}</div>
          </div>}
        </div>}

        {done && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-900">
          <CheckCircle2 className="inline w-5 h-5 mr-2"/> Import terminé : <b>{done.projects || 0} projet(s), {done.tasks || 0} tâche(s), {done.milestones || 0} jalon(s)</b>.
        </div>}

        {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 whitespace-pre-wrap"><AlertTriangle className="inline w-4 h-4 mr-1"/>{error}</div>}
      </main>

      <footer className="p-4 border-t bg-slate-50 flex justify-end gap-2">
        <button onClick={()=>{reset();onClose();}} className="px-4 py-2 rounded-xl border bg-white">Fermer</button>
        <button onClick={analyze} disabled={!file||loading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50">
          {loading ? <Loader2 className="inline w-4 h-4 animate-spin mr-2"/> : <Upload className="inline w-4 h-4 mr-2"/>}Analyser le fichier
        </button>
        <button onClick={apply} disabled={!preview||loading||total===0} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50">
          <CheckCircle2 className="inline w-4 h-4 mr-1"/> Alimenter la base
        </button>
      </footer>
    </div>
  </div>;
};
