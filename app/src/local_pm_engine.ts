import { Project, Task, Milestone } from './types';

const isoToday = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function overdueTasks(project: Project, today = isoToday()) {
  return (project.tasks || []).filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate < today)
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate));
}
function dueSoonTasks(project: Project, days = 7, today = isoToday()) {
  return (project.tasks || []).filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate >= today && daysBetween(t.dueDate, today) <= days)
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate));
}
function riskScore(project: Project) {
  const overdue = overdueTasks(project).length;
  const blocked = (project.tasks || []).filter(t => t.status === 'BLOCKED').length;
  const lateMilestones = (project.milestones || []).filter(m => !m.completed && m.targetDate < isoToday()).length;
  const progress = project.tasks.length ? project.tasks.reduce((s,t)=>s+Number(t.completionPercent||0),0)/project.tasks.length : 0;
  return Math.min(100, overdue * 8 + blocked * 10 + lateMilestones * 15 + Math.max(0, 50 - progress) * 0.5);
}

export function localPmAnswer(project: Project, message: string) {
  const q = norm(message || '');
  const today = isoToday();
  const tasks = project.tasks || [];
  const milestones = project.milestones || [];
  const risks = project.risks || [];
  const overdue = overdueTasks(project, today);
  const soon = dueSoonTasks(project, 7, today);
  const avgProgress = tasks.length ? Math.round(tasks.reduce((s,t)=>s+Number(t.completionPercent||0),0)/tasks.length) : 0;
  const score = Math.round(riskScore(project));

  let reply = '';
  const elements: Record<string, any[]> = { tasks: [], milestones: [], risks: [], dates: [], budgets: [], decisions: [], corrections: [], missing: [] };
  const findings: any[] = [];
  const recommendations: any[] = [];

  if (/retard|en retard|late|overdue/.test(q)) {
    reply = overdue.length
      ? `J’ai détecté ${overdue.length} tâche(s) en retard dans « ${project.name} ».`
      : `Aucune tâche en retard n’est détectée dans « ${project.name} ».`;
    elements.tasks = overdue.slice(0, 50).map(t => ({ title: t.title, status: t.status, dueDate: t.dueDate, delayDays: daysBetween(today, t.dueDate) * -1 }));
  } else if (/echeance|échéance|cette semaine|semaine|a venir|à venir|prochaine/.test(q)) {
    reply = soon.length ? `${soon.length} tâche(s) arrivent à échéance dans les 7 prochains jours.` : `Aucune tâche n’arrive à échéance dans les 7 prochains jours.`;
    elements.tasks = soon.slice(0, 50).map(t => ({ title: t.title, dueDate: t.dueDate, progress: t.completionPercent, status: t.status }));
  } else if (/jalon|milestone/.test(q)) {
    const late = milestones.filter(m => !m.completed && m.targetDate < today);
    reply = `Le projet contient ${milestones.length} jalon(s), dont ${late.length} en retard.`;
    elements.milestones = milestones.slice(0, 50).map(m => ({ title: m.title, targetDate: m.targetDate, completed: m.completed }));
  } else if (/risque|risk|critic/.test(q)) {
    reply = `Le score de risque calculé localement est de ${score}/100. ${risks.length} risque(s) sont enregistrés.`;
    elements.risks = risks.slice(0, 50).map(r => ({ title: r.title, category: r.category, probability: r.probability, impact: r.impact, score: Number(r.probability||0)*Number(r.impact||0), status: r.status }));
    if (score >= 60) recommendations.push('Prioriser les tâches en retard/bloquées et revoir les jalons menacés.');
  } else if (/avancement|progress|progression|pourcentage|etat du projet|état du projet/.test(q)) {
    reply = `L’avancement moyen des ${tasks.length} tâche(s) de « ${project.name} » est estimé à ${avgProgress}%.`;
    findings.push({ title: 'Avancement', description: `${avgProgress}% calculé à partir des pourcentages des tâches.` });
  } else if (/budget|cout|coût|finance|bac/.test(q)) {
    const estimated = tasks.reduce((s,t)=>s+Number(t.costEstimated||0),0);
    const actual = tasks.reduce((s,t)=>s+Number(t.costActual||0),0);
    reply = `Budget projet (BAC) : ${Number(project.totalBudget||0).toLocaleString('fr-FR')} ${project.currency || 'EUR'}. Coûts tâches : ${estimated.toLocaleString('fr-FR')} estimé(s), ${actual.toLocaleString('fr-FR')} réel(s).`;
    elements.budgets = [{ title: 'Budget', bac: project.totalBudget, estimated, actual, currency: project.currency || 'EUR' }];
  } else if (/combien|nombre|tache|tâche|task|projet/.test(q)) {
    reply = `« ${project.name} » contient ${tasks.length} tâche(s), ${milestones.length} jalon(s) et ${risks.length} risque(s). Avancement moyen : ${avgProgress}%.`;
    elements.tasks = tasks.slice(0, 20).map(t => ({ title: t.title, status: t.status, progress: t.completionPercent, dueDate: t.dueDate }));
  } else {
    reply = `Je peux analyser localement le projet « ${project.name} » : retards, échéances, jalons, risques, avancement et budget. Essayez par exemple « Quels projets/tâches sont en retard ? » ou « Quels jalons sont menacés ? »`;
  }

  if (overdue.length) findings.push({ title: 'Tâches en retard', description: `${overdue.length} tâche(s) dépassent leur échéance.` });
  const lateMilestones = milestones.filter(m => !m.completed && m.targetDate < today);
  if (lateMilestones.length) findings.push({ title: 'Jalons en retard', description: `${lateMilestones.length} jalon(s) dépassent leur date cible.` });
  if (overdue.length || lateMilestones.length) recommendations.push('Vérifier les dépendances et réaffecter les tâches critiques avant le prochain comité projet.');

  return {
    provider: 'Clarity Local PM Engine', model: 'rules + PostgreSQL',
    reply,
    analysis: { summary: reply, findings, contradictions: [], recommendations, elements },
    actions: []
  };
}
