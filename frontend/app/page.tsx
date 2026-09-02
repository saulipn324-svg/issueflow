'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, Circle, CircleDot, LayoutList, Plus, RotateCcw, Search, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { api, statuses, priorities, initialInput, readDemo, demoPage, demoStats, saveDemo, deleteDemo, seedIssues, STORAGE_KEY, validateInput, type Issue, type IssueInput, type IssuePage, type Stats, type Status, type Priority } from '@/lib/issues';

const blankPage: IssuePage = { content: [], page: 0, size: 8, totalElements: 0, totalPages: 0 };
const blankStats: Stats = { total: 0, open: 0, inProgress: 0, resolved: 0 };
const message = (e: unknown) => e instanceof Error ? e.message : 'No se pudo completar la operación.';
const date = (value: string) => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value));

export default function Home() {
  const [mode, setMode] = useState<'demo' | 'api' | null>(null);
  const [query, setQuery] = useState(''); const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState(''); const [priority, setPriority] = useState(''); const [page, setPage] = useState(0);
  const [result, setResult] = useState<IssuePage>(blankPage); const [stats, setStats] = useState<Stats>(blankStats);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Issue | null>(null); const [editing, setEditing] = useState<Issue | null>(null);
  const [form, setForm] = useState<IssueInput>(initialInput); const [formOpen, setFormOpen] = useState(false); const [formError, setFormError] = useState(''); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'reset' | null>(null);
  const refresh = () => setRevision(n => n + 1);

  useEffect(() => { if (mode) return; setLoading(true); const abort = new AbortController(); fetch('/api/config', {signal: abort.signal}).then(r => { if (!r.ok) throw new Error('No se pudo cargar la configuración.'); return r.json() as Promise<{mode: string}>; }).then(data => { if (data.mode !== 'api' && data.mode !== 'demo') throw new Error('Configuración no válida.'); setMode(data.mode); }).catch(e => { if (!abort.signal.aborted) {setError(message(e)); setLoading(false);} }); return () => abort.abort(); }, [revision, mode]);
  useEffect(() => { const timer = setTimeout(() => { setDebounced(query); setPage(0); }, 250); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    if (!mode) return;
    const abort = new AbortController(); setLoading(true); setError('');
    const filters = { q: debounced, status, priority, page, size: 8 };
    const load = async () => {
      if (mode === 'demo') { const rows = readDemo(localStorage); return [demoPage(rows, filters), demoStats(rows)] as const; }
      const params = new URLSearchParams({q: debounced, page: String(page), size: '8'});
      if (status) params.set('status', status); if (priority) params.set('priority', priority);
      return Promise.all([api<IssuePage>(`/issues?${params}`, {signal:abort.signal}), api<Stats>('/stats', {signal:abort.signal})]);
    };
    load().then(([list, totals]) => { if (abort.signal.aborted) return; if (list.totalPages > 0 && page >= list.totalPages) {setPage(list.totalPages - 1); return;} setResult(list); setStats(totals); }).catch(e => { if (!abort.signal.aborted) setError(message(e)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [mode, debounced, status, priority, page, revision]);
  useEffect(() => { const change = (event: StorageEvent) => { if (event.key === STORAGE_KEY) refresh(); }; window.addEventListener('storage', change); return () => window.removeEventListener('storage', change); }, []);

  const openNew = useCallback((title = '') => {setEditing(null); setForm({...initialInput, title}); setFormError(''); setFormOpen(true);}, []);
  const readyRef = useRef(false); readyRef.current = !!mode && !busy;
  useEffect(() => {
    type ToolContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (value: unknown) => unknown }, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & {modelContext?: ToolContext}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: 'start_issue_creation', title: 'Preparar una incidencia', description: 'Abre el formulario para crear una incidencia. No guarda datos; el usuario debe completar y confirmar el formulario.', inputSchema: {type:'object', properties:{title:{type:'string',maxLength:120}}, additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute(value: unknown) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Se espera un objeto.');
      const input = value as Record<string, unknown>;
      if (Object.keys(input).some(k => k !== 'title') || (input.title !== undefined && (typeof input.title !== 'string' || input.title.length > 120))) throw new Error('El título debe ser texto de hasta 120 caracteres.');
      if (!readyRef.current) throw new Error('La aplicación aún no está disponible.');
      flushSync(() => openNew((input.title as string | undefined) || ''));
      return { stage:'form_open', saved:false };
    }};
    try { Promise.resolve(context.registerTool(tool, {signal:lifecycle.signal})).catch(() => {}); } catch { /* Optional browser capability. */ }
    return () => lifecycle.abort();
  }, [openNew]);

  function edit(issue: Issue) {setSelected(null);setEditing(issue);setForm({...issue});setFormError('');setFormOpen(true);}
  async function save(event: React.FormEvent) {
    event.preventDefault(); setFormError(''); setBusy(true);
    try {
      const input = validateInput(form);
      if (mode === 'demo') saveDemo(localStorage, input, editing?.id);
      else if (mode === 'api') await api<Issue>(editing ? `/issues/${editing.id}` : '/issues', {method:editing ? 'PUT':'POST', body:JSON.stringify(input)});
      else throw new Error('La aplicación aún no está disponible.');
      setFormOpen(false); setNotice(editing ? 'Incidencia actualizada.' : 'Incidencia creada.'); refresh();
    } catch (e) {setFormError(message(e));} finally {setBusy(false);}
  }
  async function confirmAction() {
    setBusy(true); setFormError('');
    try {
      if (confirm === 'reset') {localStorage.setItem(STORAGE_KEY, JSON.stringify(seedIssues()));setPage(0);setQuery('');setStatus('');setPriority('');setNotice('Datos de ejemplo restaurados.');}
      else if (confirm === 'delete' && selected) {
        if (mode === 'demo') deleteDemo(localStorage, selected.id, selected.version);
        else await api<void>(`/issues/${selected.id}?version=${selected.version}`, {method:'DELETE'});
        setSelected(null);setNotice('Incidencia eliminada.');
      }
      setConfirm(null);refresh();
    } catch(e) {setFormError(message(e));} finally {setBusy(false);}
  }
  const update = (key: keyof IssueInput, value: string) => setForm(v => ({...v,[key]:value}));
  const metrics = [{label:'Total de incidencias',value:stats.total,Icon:LayoutList},{label:'Abiertas',value:stats.open,Icon:Circle},{label:'En progreso',value:stats.inProgress,Icon:CircleDot},{label:'Resueltas',value:stats.resolved,Icon:CheckCircle2}];
  return <div className="shell">
    <aside className="sidebar"><a className="brand" href="/">◈ issueflow<span>WORKSPACE</span></a><div className="nav-active"><LayoutList size={17}/> Incidencias</div><p className="side-caption">UN PASO A LA VEZ</p><p className="side-info">De un problema pendiente a una solución documentada.</p><div className="side-foot">Un proyecto de<br/><strong>Saul Ramos Sanchez</strong><br/><a href="/guia.html" target="_blank" rel="noopener noreferrer">Guía del proyecto ↗</a></div></aside>
    <main className="workspace"><header className="topbar"><span>Mi espacio / <strong>Incidencias</strong></span><span className="mode-label">{mode === 'api' ? 'CONECTADO A SPRING BOOT' : mode === 'demo' ? 'DEMO LOCAL' : 'CONECTANDO…'}</span></header>
      <section className="content"><div className="heading"><div><p className="eyebrow">MENOS RUIDO. MÁS SOLUCIONES.</p><h1>Todo bajo control.</h1><p className="muted">Organiza, prioriza y da seguimiento a cada incidencia.</p></div><Button className="h-10 px-5" disabled={!mode || busy} onClick={() => openNew()}><Plus size={17}/> Nueva incidencia</Button></div>
        <div className="stats">{metrics.map(({label,value,Icon})=><article className="stat" key={label}><span>{label}<Icon size={16}/></span><strong>{loading && !result.content.length ? '—' : value}</strong></article>)}</div>
        {notice && <div className="notice" role="status">{notice}<Button aria-label="Cerrar mensaje" variant="ghost" size="icon-xs" className="float-right" onClick={() => setNotice('')}><X/></Button></div>}
        {error && <div className="notice error" role="alert">{error} <Button variant="link" onClick={refresh}>Reintentar</Button></div>}
        <section className="panel" aria-busy={loading}><div className="panel-head"><h2>Registro de incidencias</h2><span>{result.totalElements} resultados</span></div>
          <div className="toolbar"><div className="searchbox"><Search size={16}/><label className="sr-only" htmlFor="search">Buscar por título, descripción o responsable</label><Input id="search" className="h-9" placeholder="Buscar una incidencia…" value={query} maxLength={120} onChange={e=>setQuery(e.target.value)}/></div><label className="sr-only" htmlFor="filter-status">Filtrar por estado</label><select id="filter-status" className="select-control" value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}><option value="">Todos los estados</option>{Object.entries(statuses).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><label className="sr-only" htmlFor="filter-priority">Filtrar por prioridad</label><select id="filter-priority" className="select-control" value={priority} onChange={e=>{setPriority(e.target.value);setPage(0);}}><option value="">Todas las prioridades</option>{Object.entries(priorities).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><Button variant="outline" size="icon-lg" aria-label="Actualizar incidencias" disabled={loading} onClick={refresh}><RotateCcw size={16}/></Button></div>
          {loading ? <div className="empty" role="status">Cargando incidencias…</div> : error ? <div className="empty">No se pudo cargar el registro. Tus datos no se han modificado.</div> : result.content.length === 0 ? <div className="empty"><Activity size={28} className="mx-auto mb-3"/><strong>{stats.total ? 'No hay coincidencias.' : 'Tu registro está listo para empezar.'}</strong><p>{stats.total ? 'Prueba con otros filtros o términos de búsqueda.' : 'Crea tu primera incidencia para organizar el trabajo.'}</p><Button variant="outline" onClick={()=>{if(stats.total){setQuery('');setStatus('');setPriority('');setPage(0);}else openNew();}}>{stats.total ? 'Limpiar filtros' : 'Crear incidencia'}</Button></div> : <div className="table-wrap"><table><thead><tr><th scope="col">INCIDENCIA</th><th scope="col">ESTADO</th><th scope="col">PRIORIDAD</th><th scope="col">RESPONSABLE</th><th scope="col">ACTUALIZADA</th></tr></thead><tbody>{result.content.map(issue=><tr key={issue.id}><td><span className="issue-code">INC-{String(issue.id).padStart(3,'0')}</span><button className="issue-title" onClick={()=>{setSelected(issue);setFormError('');}}>{issue.title}</button></td><td><span className={`badge ${issue.status}`}>{statuses[issue.status]}</span></td><td><span className={`badge ${issue.priority}`}>{priorities[issue.priority]}</span></td><td><span className="assignee"><span className="avatar" aria-hidden="true">{issue.assignee ? issue.assignee.split(' ').slice(0,2).map(x=>x[0]).join('') : '—'}</span>{issue.assignee || 'Sin asignar'}</span></td><td className="date">{date(issue.updatedAt)}</td></tr>)}</tbody></table></div>}
          <div className="pagination"><span>Ordenadas por última actualización</span><div><Button size="icon-sm" variant="outline" aria-label="Página anterior" disabled={page===0 || loading} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={14}/></Button><span>{result.totalPages ? page+1 : 0} / {result.totalPages}</span><Button size="icon-sm" variant="outline" aria-label="Página siguiente" disabled={page+1>=result.totalPages || loading} onClick={()=>setPage(p=>p+1)}><ArrowRight size={14}/></Button></div></div>
        </section><div className="demo-note">{mode === 'demo' ? <>Datos ficticios. Tus cambios se guardan solo en este navegador, sin conexión al backend Java. <Button variant="link" className="h-auto p-0 text-xs" onClick={()=>{setFormError('');setConfirm('reset');}}>Restaurar ejemplos</Button>.</> : 'Las incidencias se guardan en la base de datos del backend Spring Boot.'} <a className="doc-link" href="/guia.html" target="_blank" rel="noopener noreferrer">Ver documentación ↗</a></div>
      </section>
    </main>
    <Dialog open={formOpen} onOpenChange={open=>{if(!busy)setFormOpen(open);}}><DialogContent className="sm:max-w-xl modal-body" showCloseButton={false}><DialogTitle>{editing ? 'Editar incidencia' : 'Nueva incidencia'}</DialogTitle><DialogDescription>{editing ? `INC-${String(editing.id).padStart(3,'0')} · Actualiza los detalles y el seguimiento.` : 'Describe el problema y define su prioridad.'}</DialogDescription><form onSubmit={save}><div className="form-grid"><div className="field full"><label htmlFor="title">Título *</label><Input id="title" autoFocus required minLength={3} maxLength={120} value={form.title} onChange={e=>update('title',e.target.value)} disabled={busy} placeholder="¿Qué necesita atención?"/></div><div className="field full"><label htmlFor="description">Descripción</label><Textarea id="description" rows={4} maxLength={4000} value={form.description} onChange={e=>update('description',e.target.value)} disabled={busy} placeholder="Contexto, pasos para reproducir y resultado esperado…"/><span className="field-hint">Hasta 4000 caracteres.</span></div><div className="field"><label htmlFor="status">Estado *</label><select id="status" className="select-control" value={form.status} onChange={e=>update('status',e.target.value as Status)} disabled={busy}>{Object.entries(statuses).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div className="field"><label htmlFor="priority">Prioridad *</label><select id="priority" className="select-control" value={form.priority} onChange={e=>update('priority',e.target.value as Priority)} disabled={busy}>{Object.entries(priorities).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div className="field full"><label htmlFor="assignee">Responsable</label><Input id="assignee" maxLength={80} value={form.assignee} onChange={e=>update('assignee',e.target.value)} disabled={busy} placeholder="Nombre, opcional"/></div></div>{formError && <p className="error-text" role="alert">{formError}</p>}<div className="actions"><Button type="button" variant="outline" disabled={busy} onClick={()=>setFormOpen(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear incidencia'}</Button></div></form></DialogContent></Dialog>
    <Dialog open={!!selected && !confirm} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="sm:max-w-xl modal-body" showCloseButton={false}><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>INC-{String(selected?.id || 0).padStart(3,'0')}</DialogDescription>{selected && <><div className="details"><span className={`badge ${selected.status}`}>{statuses[selected.status]}</span><span className={`badge ${selected.priority}`}>{priorities[selected.priority]}</span></div><p className="view-description">{selected.description || 'Sin descripción.'}</p><p className="detail-meta">Responsable: {selected.assignee || 'Sin asignar'}<br/>Creada: {date(selected.createdAt)} · Actualizada: {date(selected.updatedAt)} (UTC)</p><div className="actions"><Button variant="destructive" className="danger-zone" onClick={()=>{setFormError('');setConfirm('delete');}}><Trash2/> Eliminar</Button><Button variant="outline" onClick={()=>setSelected(null)}>Cerrar</Button><Button onClick={()=>edit(selected)}><Pencil/> Editar</Button></div></>}</DialogContent></Dialog>
    <Dialog open={!!confirm} onOpenChange={open=>{if(!open && !busy)setConfirm(null);}}><DialogContent showCloseButton={false}><DialogTitle>{confirm==='reset' ? '¿Restaurar los ejemplos?' : '¿Eliminar esta incidencia?'}</DialogTitle><DialogDescription>{confirm==='reset' ? 'Se reemplazarán los datos de esta demo en tu navegador por los ejemplos iniciales.' : `Se eliminará «${selected?.title}». Esta acción no se puede deshacer.`}</DialogDescription>{formError && <p className="error-text" role="alert">{formError}</p>}<div className="actions"><Button variant="outline" disabled={busy} onClick={()=>setConfirm(null)}>Cancelar</Button><Button variant="destructive" disabled={busy} onClick={confirmAction}>{busy?'Procesando…':confirm==='reset'?'Restaurar':'Eliminar'}</Button></div></DialogContent></Dialog>
  </div>;
}


