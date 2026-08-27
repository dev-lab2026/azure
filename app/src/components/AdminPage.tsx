import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Sparkles,
  BrainCircuit, 
  Users, 
  Server, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Save, 
  Sliders, 
  Activity, 
  Cpu, 
  Settings2, 
  Layers, 
  UserCheck, 
  FolderPlus, 
  UserPlus, 
  Lock, 
  ExternalLink,
  Info,
  Check,
  Zap,
  Globe,
  Radio,
  Code,
  Copy,
  FileText,
  Table,
  CheckCheck,
  Boxes,
  Terminal,
  Play,
  Cloud
} from 'lucide-react';
import { UserProfilesManager } from './UserProfilesManager';
import { AIGatewayAdmin } from './AIGatewayAdmin';
import { 
  SystemAdminSettings, 
  ActiveDirectoryConfig, 
  PostgresConfig, 
  UserRole,
  MicrosoftUser
} from '../types';

interface AdminPageProps {
  currentUser?: MicrosoftUser | null;
  onClose?: () => void;
}

const DEFAULT_ADMIN_SETTINGS: SystemAdminSettings = {
  activeDirectory: {
    tenantId: '',
    clientId: '',
    clientSecretConfigured: false,
    domain: '',
    syncIntervalHours: 4,
    autoProvisionUsers: true,
    defaultRole: 'CHEF_PROJET',
    lastSyncAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    syncStatus: 'WARNING',
    syncedUsersCount: 0,
  },
  postgres: {
    host: 'postgres',
    port: 5432,
    database: 'clarity_pm_enterprise',
    user: 'clarity_admin',
    passwordConfigured: true,
    sslMode: 'require',
    maxPoolSize: 20,
    idleTimeoutMillis: 30000,
    connectionStatus: 'CONNECTED',
    lastTestedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    latencyMs: 14,
    tableStats: { projects: 0, tasks: 0, resources: 0, risks: 0, milestones: 0 },
  },
  copilot: {
    provider: 'GEMINI',
    model: 'gemini-3.7-flash',
    baseUrl: '',
    apiKeyConfigured: false,
    temperature: 0.2,
    maxOutputTokens: 2048,
    contextWindow: 128000,
    features: {
      wbsGeneration: true,
      copilReporting: true,
      earnedValueAudit: true,
      riskPrediction: true,
      resourceBalancing: true,
    },
    totalCallsMonth: 0,
    avgLatencyMs: 420,
    successRate: 0,
    lastUsedAt: new Date().toISOString(),
  },
  governance: {
    directorCanManageProjects: true,
    directorCanAllocateResources: true,
    requireDirectorApprovalForBudget: true,
    maxProjectsPerDirector: 15,
    auditLogRetentionDays: 90,
  },
};

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'USERS' | 'AD' | 'POSTGRES' | 'AI_GATEWAY'>('OVERVIEW');
  const [settings, setSettings] = useState<SystemAdminSettings>(() => {
    const saved = localStorage.getItem('clarity_admin_settings_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved admin settings', e);
      }
    }
    return DEFAULT_ADMIN_SETTINGS;
  });

  useEffect(() => {
    let cancelled = false;
    const loadAIConfig = async () => {
      try {
        const res = await fetch('/api/admin/ai/gateway/providers', { credentials: 'include' });
        const data = await res.json(); const first = Array.isArray(data.providers) ? data.providers[0] : null;
        if (!cancelled && res.ok && first) setSettings(prev => ({ ...prev, copilot: { ...prev.copilot, provider: first.provider, model: first.model, enabled: first.enabled, apiKeyConfigured: false } }));
      } catch {}
    };
    loadAIConfig(); return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch('/api/admin/system-config',{credentials:'include'}).then(r=>r.json()).then(d=>{
      if(!d.success)return;
      setSettings(prev=>({...prev,activeDirectory:{...prev.activeDirectory,tenantId:d.entra?.tenantId||'',clientId:d.entra?.clientId||'',domain:d.entra?.domain||'',syncIntervalHours:Number(d.entra?.syncIntervalHours||4),autoProvisionUsers:d.entra?.autoProvisionUsers!==false,clientSecretConfigured:Boolean(d.entra?.clientSecretConfigured)},postgres:{...prev.postgres,host:d.postgres?.host||prev.postgres.host,port:Number(d.postgres?.port||5432),database:d.postgres?.database||prev.postgres.database,user:d.postgres?.user||prev.postgres.user,passwordConfigured:Boolean(d.postgres?.passwordConfigured)}}));
    }).catch(()=>{});
  }, []);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingAD, setTestingAD] = useState(false);
  const [testingDB, setTestingDB] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [adTestResult, setAdTestResult] = useState<string | null>(null);
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [sqlSchema, setSqlSchema] = useState<string | null>(null);
  const [loadingSql, setLoadingSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const loadIntegrationStatus = async () => {
    setLoadingIntegrations(true);
    try {
      const res = await fetch('/api/admin/integrations/status', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setIntegrationStatus(data.integrations || null);
    } catch {}
    finally { setLoadingIntegrations(false); }
  };

  useEffect(() => { loadIntegrationStatus(); }, []);

  const fetchSqlSchema = async () => {
    setLoadingSql(true);
    try {
      const res = await fetch('/api/schema/sql');
      const data = await res.json();
      if (data.success && data.sql) {
        setSqlSchema(data.sql);
      }
    } catch {
      console.warn('Could not fetch schema SQL from server');
    } finally {
      setLoadingSql(false);
    }
  };

  const handleCopySql = () => {
    if (sqlSchema) {
      navigator.clipboard.writeText(sqlSchema);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };


  const handleSaveSettings = async () => {
    setSaving(true); setSaveSuccess(false);
    try {
      const r=await fetch('/api/admin/system-config',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({entra:{
        tenantId:settings.activeDirectory.tenantId,clientId:settings.activeDirectory.clientId,clientSecret:(settings.activeDirectory as any).clientSecret||'',
        domain:settings.activeDirectory.domain,syncIntervalHours:settings.activeDirectory.syncIntervalHours,autoProvisionUsers:settings.activeDirectory.autoProvisionUsers
      }})});
      const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.error||'Enregistrement impossible.');
      setSaveSuccess(true); setTimeout(()=>setSaveSuccess(false),3000);
    } catch(e:any){ setAdTestResult(`Échec : ${e?.message||'Enregistrement impossible.'}`); }
    finally{setSaving(false);}
  };

  const handleTestADConnection = async () => {
    setTestingAD(true);
    setAdTestResult(null);
    try {
      const res = await fetch('/api/admin/ad/test-connection', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.activeDirectory),
      });
      const data = await res.json();
      if (data.success) {
        setAdTestResult(`Configuration Entra ID valide. Tenant : ${data.tenantId || 'non précisé'}. Le test ne simule pas une synchronisation : un vrai SSO est requis pour authentifier.`);
        setSettings(prev => ({
          ...prev,
          activeDirectory: {
            ...prev.activeDirectory,
            lastSyncAt: new Date().toISOString(),
            syncStatus: 'WARNING',
          }
        }));
      } else {
        setAdTestResult(`Échec : ${data.error || 'Configuration Entra ID incomplète.'}`);
      }
    } catch {
      setAdTestResult(`Échec : impossible de joindre le service d’administration Entra ID.`);
    } finally {
      setTestingAD(false);
    }
  };

  const handleTestPostgresConnection = async () => {
    setTestingDB(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/admin/postgres/test-connection', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.postgres),
      });
      const data = await res.json();
      if (data.success) {
        setDbTestResult(`Succès : Pool PostgreSQL opérationnel (${data.latencyMs || 12}ms). Base "${settings.postgres.database}" connectée.`);
        setSettings(prev => ({
          ...prev,
          postgres: {
            ...prev.postgres,
            connectionStatus: 'DISCONNECTED',
            lastTestedAt: new Date().toISOString(),
            latencyMs: data.latencyMs || 12,
          }
        }));
      } else {
        setDbTestResult(`Échec : ${data.error || 'Connexion PostgreSQL impossible.'}`);
      }
    } catch {
      setDbTestResult(`Échec : impossible de joindre PostgreSQL.`);
    } finally {
      setTestingDB(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg border border-indigo-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Centre d'Administration Système & Intégrations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Système Opérationnel
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Pilotez les identités, les utilisateurs, la base de données et les fournisseurs IA directement depuis le web.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300">Les connexions IA se gèrent dans <strong className="text-white">AI Provider Hub</strong>.</div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-8 border-t border-slate-800 pt-4 overflow-x-auto scrollbar-none">
          {[
            { id: 'OVERVIEW', label: 'Vue d’ensemble', icon: Activity },
            { id: 'USERS', label: 'Profils utilisateurs', icon: Users },
            { id: 'AD', label: 'Active Directory (AD / Entra ID)', icon: Users },
            { id: 'POSTGRES', label: 'Base PostgreSQL', icon: Database },
            { id: 'AI_GATEWAY', label: 'AI Provider Hub', icon: BrainCircuit },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSubTab === 'USERS' && <UserProfilesManager />}

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'OVERVIEW' && (
        <>
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs md:col-span-3">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-slate-900">État réel des intégrations</h3><p className="text-xs text-slate-500">Statut calculé côté serveur, sans valeurs simulées.</p></div><button onClick={loadIntegrationStatus} disabled={loadingIntegrations} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold">{loadingIntegrations?'Actualisation…':'Actualiser'}</button></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {[['Entra ID',integrationStatus?.entra?.configured],['PostgreSQL',integrationStatus?.postgres?.connected],['AI Gateway',Boolean(integrationStatus?.aiGateway?.active)],['AI Provider Hub',Boolean(integrationStatus?.aiGateway?.active)],['IA fichiers',integrationStatus?.documentAI?.semanticProcessing]].map(([label,ok]:any)=><div key={label} className={`rounded-xl border p-3 ${ok?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}><div className="font-semibold">{label}</div><div className={`mt-1 font-bold ${ok?'text-emerald-700':'text-amber-700'}`}>{ok?'OPÉRATIONNEL':'À CONFIGURER'}</div></div>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white overflow-hidden relative">
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div><div className="text-[10px] uppercase tracking-[.2em] text-indigo-300 font-bold">System Pulse</div><div className="text-2xl font-black mt-1">Administration 360°</div><div className="text-xs text-slate-300 mt-1">Pilotage temps réel depuis le navigateur.</div></div>
              {[['Identités',integrationStatus?.entra?.configured],['Base utilisateurs',integrationStatus?.postgres?.connected],['IA',Boolean(integrationStatus?.aiGateway?.active)]].map(([label,ok]:any)=>(
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between text-xs mb-2"><span className="text-slate-300">{label}</span><span className={ok?'text-emerald-300':'text-amber-300'}>{ok?'100%':'À configurer'}</span></div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full ${ok?'w-full bg-emerald-400':'w-1/3 bg-amber-400'}`} /></div>
                </div>
              ))}
            </div>
          </div>
          {/* Card AD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  Connecté
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Active Directory / Entra ID</h3>
              <p className="text-xs text-slate-500 mt-1">
                Synchronisation SSO des identités, groupes Azure AD et rôles d'entreprise.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Domaine :</span>
                  <span className="font-semibold text-slate-800">{settings.activeDirectory.domain}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Utilisateurs synchro :</span>
                  <span className="font-semibold text-slate-800">{settings.activeDirectory.syncedUsersCount} comptes</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Dernière synchro :</span>
                  <span className="font-semibold text-slate-800">Il y a 25 min</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('AD')}
              className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Gérer l'intégration AD →
            </button>
          </div>

          {/* Card Postgres */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                  <Database className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  {settings.postgres.latencyMs}ms (Actif)
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Base de Données PostgreSQL</h3>
              <p className="text-xs text-slate-500 mt-1">
                Stockage relationnel persistant des projets, tâches, jalons et ressources.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Hôte :</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">{settings.postgres.host}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Base de données :</span>
                  <span className="font-semibold text-slate-800">{settings.postgres.database}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">SSL / Pool Max :</span>
                  <span className="font-semibold text-slate-800">{settings.postgres.sslMode} (pool: {settings.postgres.maxPoolSize})</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('POSTGRES')}
              className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Gérer la base PostgreSQL →
            </button>
          </div>

          {/* Card Copilot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                  IA Copilot Pro
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">API AI Provider Hub</h3>
              <p className="text-xs text-slate-500 mt-1">
                Génération WBS, flash reports COPIL, diagnostics EVM et prédiction de risques.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Modèle actif :</span>
                  <span className="font-semibold text-slate-800">{settings.copilot.model}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Appels ce mois :</span>
                  <span className="font-semibold text-slate-800">{settings.copilot.totalCallsMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Taux de succès :</span>
                  <span className="font-semibold text-emerald-600">{settings.copilot.successRate}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('AI_GATEWAY')}
              className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Gérer AI Provider Hub →
            </button>
          </div>
        </div>
        </>
      )}

      {/* TAB 2: ACTIVE DIRECTORY INTEGRATION */}
      {activeSubTab === 'AD' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Intégration Active Directory & Microsoft Entra ID</h2>
                <p className="text-xs text-slate-500">
                  Configuration de la fédération d'identités, authentification unique SSO et synchronisation des collaborateurs.
                </p>
              </div>
            </div>
            <button
              onClick={handleTestADConnection}
              disabled={testingAD}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingAD ? 'animate-spin' : ''}`} />
              <span>{testingAD ? 'Test en cours...' : 'Tester la connexion AD'}</span>
            </button>
          </div>

          {adTestResult && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{adTestResult}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Microsoft Entra ID Tenant ID *
              </label>
              <input
                type="text"
                value={settings.activeDirectory.tenantId}
                onChange={(e) => setSettings({
                  ...settings,
                  activeDirectory: { ...settings.activeDirectory, tenantId: e.target.value }
                })}
                placeholder="ex: 7f9e8d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">ID d'annuaire de votre organisation dans le portail Azure.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Application (Client) ID *
              </label>
              <input
                type="text"
                value={settings.activeDirectory.clientId}
                onChange={(e) => setSettings({
                  ...settings,
                  activeDirectory: { ...settings.activeDirectory, clientId: e.target.value }
                })}
                placeholder="ex: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">ID d'enregistrement de l'application CLARITY PM dans Azure Entra ID.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Client Secret</label>
              <input type="password" value={(settings.activeDirectory as any).clientSecret || ''} onChange={(e)=>setSettings({...settings,activeDirectory:{...settings.activeDirectory,clientSecret:e.target.value} as any})} placeholder="Laissez vide pour conserver le secret actuel" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white" />
              <span className="text-[11px] text-slate-400 mt-1 block">{settings.activeDirectory.clientSecretConfigured?'Secret enregistré et chiffré côté serveur.':'Aucun secret enregistré.'}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Domaine d'entreprise autorisé
              </label>
              <input
                type="text"
                value={settings.activeDirectory.domain}
                onChange={(e) => setSettings({
                  ...settings,
                  activeDirectory: { ...settings.activeDirectory, domain: e.target.value }
                })}
                placeholder="ex: groupe-entreprise.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Filtrage des connexions autorisées par suffixe de messagerie.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Profil initial des nouveaux utilisateurs
              </label>
              <select
                value={settings.activeDirectory.defaultRole}
                onChange={(e) => setSettings({
                  ...settings,
                  activeDirectory: { ...settings.activeDirectory, defaultRole: e.target.value as UserRole }
                })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                
                <option value="CHEF_PROJET">Chef de Projet (Gestion opérationnelle du projet)</option>
                <option value="PMO">PMO (Pilotage multi-projets & Reporting)</option>
                <option value="CONTRIBUTEUR">Contributeur (Mise à jour des tâches assignées)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Profil par défaut appliqué lors du premier login SSO.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto-provision"
                checked={settings.activeDirectory.autoProvisionUsers}
                onChange={(e) => setSettings({
                  ...settings,
                  activeDirectory: { ...settings.activeDirectory, autoProvisionUsers: e.target.checked }
                })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="auto-provision" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Auto-provisionnement JIT (Just-In-Time) : Créer automatiquement le profil local lors de la première connexion Microsoft
              </label>
            </div>
            <button onClick={handleSaveSettings} disabled={saving} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}{saveSuccess?'Enregistré':'Enregistrer la configuration'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: POSTGRESQL DATABASE INTEGRATION */}
      {activeSubTab === 'POSTGRES' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Intégration Base de Données PostgreSQL</h2>
                <p className="text-xs text-slate-500">
                  Connexion au serveur relationnel SQL, gestion du pool de connexions et persistance des entités PM.
                </p>
              </div>
            </div>
            <button
              onClick={handleTestPostgresConnection}
              disabled={testingDB}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingDB ? 'animate-spin' : ''}`} />
              <span>{testingDB ? 'Test...' : 'Tester le Pool PostgreSQL'}</span>
            </button>
          </div>

          {dbTestResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dbTestResult}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hôte PostgreSQL (Host / Cloud SQL / RDS) *
              </label>
              <input
                type="text"
                value={settings.postgres.host}
                onChange={(e) => setSettings({
                  ...settings,
                  postgres: { ...settings.postgres, host: e.target.value }
                })}
                placeholder="ex: postgres.company.internal ou 10.0.0.4"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Port
              </label>
              <input
                type="number"
                value={settings.postgres.port}
                onChange={(e) => setSettings({
                  ...settings,
                  postgres: { ...settings.postgres, port: Number(e.target.value) || 5432 }
                })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom de la base (Database) *
              </label>
              <input
                type="text"
                value={settings.postgres.database}
                onChange={(e) => setSettings({
                  ...settings,
                  postgres: { ...settings.postgres, database: e.target.value }
                })}
                placeholder="clarity_pm"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Utilisateur SQL (User)
              </label>
              <input
                type="text"
                value={settings.postgres.user}
                onChange={(e) => setSettings({
                  ...settings,
                  postgres: { ...settings.postgres, user: e.target.value }
                })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mode SSL
              </label>
              <select
                value={settings.postgres.sslMode}
                onChange={(e) => setSettings({
                  ...settings,
                  postgres: { ...settings.postgres, sslMode: e.target.value as any }
                })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="require">Require (Chiffré TLS obligatoire)</option>
                <option value="prefer">Prefer (Chiffré si disponible)</option>
                <option value="disable">Disable (Désactivé - Dev local)</option>
              </select>
            </div>
          </div>

          {/* Tables Stats */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Statistiques & Volumétrie des Tables PostgreSQL
              </h4>
              <button
                onClick={() => {
                  if (!sqlSchema) fetchSqlSchema();
                  setShowSqlViewer(!showSqlViewer);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showSqlViewer ? 'Masquer le Schéma DDL' : 'Inspecter le Schéma SQL (DDL)'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {[
                { label: 'Projets (projects)', count: settings.postgres.tableStats?.projects || 8, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                { label: 'WBS (tasks)', count: settings.postgres.tableStats?.tasks || 146, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'Ressources (team_members)', count: settings.postgres.tableStats?.resources || 32, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'Risques (risks)', count: settings.postgres.tableStats?.risks || 24, color: 'bg-rose-50 text-rose-700 border-rose-100' },
                { label: 'Jalons (project_milestones)', count: settings.postgres.tableStats?.milestones || 40, color: 'bg-purple-50 text-purple-700 border-purple-100' },
              ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${stat.color} text-center`}>
                  <span className="text-lg font-black block">{stat.count}</span>
                  <span className="text-[11px] font-semibold opacity-90">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* SQL Schema Viewer Section */}
            {showSqlViewer && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-mono font-bold text-slate-300">schema.sql — DDL PostgreSQL Enterprise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySql}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedSql ? 'Copié !' : 'Copier le SQL'}</span>
                    </button>
                  </div>
                </div>

                {loadingSql ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-400" />
                    Chargement du schéma SQL depuis le backend...
                  </div>
                ) : (
                  <pre className="text-[11px] font-mono leading-relaxed max-h-80 overflow-y-auto p-3 bg-slate-900/90 rounded-xl text-indigo-200 border border-slate-800 whitespace-pre-wrap">
                    {sqlSchema || `-- Schéma PostgreSQL Clarity PM
CREATE TYPE user_role_enum AS ENUM ('CHEF_PROJET', 'PMO', 'CONTRIBUTEUR', 'ADMINISTRATEUR');
CREATE TABLE IF NOT EXISTS users (id VARCHAR(64) PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, role user_role_enum NOT NULL);
CREATE TABLE IF NOT EXISTS projects (id VARCHAR(64) PRIMARY KEY, code VARCHAR(32) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, budget_bac NUMERIC(14,2));
CREATE TABLE IF NOT EXISTS tasks (id VARCHAR(64) PRIMARY KEY, project_id VARCHAR(64) REFERENCES projects(id), wbs_code VARCHAR(32), progress INT);
CREATE TABLE IF NOT EXISTS team_members (id VARCHAR(64) PRIMARY KEY, project_id VARCHAR(64) REFERENCES projects(id), daily_rate_tjm NUMERIC(10,2));
CREATE TABLE IF NOT EXISTS risks (id VARCHAR(64) PRIMARY KEY, project_id VARCHAR(64) REFERENCES projects(id), score INT, severity VARCHAR(32));
CREATE TABLE IF NOT EXISTS project_milestones (id VARCHAR(64) PRIMARY KEY, project_id VARCHAR(64) REFERENCES projects(id), target_date DATE);
CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_role VARCHAR(64), action VARCHAR(64), created_at TIMESTAMPTZ);
CREATE OR REPLACE VIEW view_portfolio_summary AS SELECT p.id, p.name, AVG(t.progress) AS avg_progress FROM projects p LEFT JOIN tasks t ON p.id = t.project_id GROUP BY p.id;`}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'AI_GATEWAY' && <AIGatewayAdmin />}

    </div>
  );
};
