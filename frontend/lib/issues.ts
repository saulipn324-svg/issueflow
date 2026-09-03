export const statuses = { OPEN: 'Abierta', IN_PROGRESS: 'En progreso', RESOLVED: 'Resuelta' } as const;
export const priorities = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' } as const;
export type Status = keyof typeof statuses;
export type Priority = keyof typeof priorities;
export type IssueInput = { title: string; description: string; status: Status; priority: Priority; assignee: string; version?: number };
export type Issue = IssueInput & { id: number; version: number; createdAt: string; updatedAt: string };
export type Filters = { q: string; status: string; priority: string; page: number; size: number };
export type IssuePage = { content: Issue[]; page: number; size: number; totalElements: number; totalPages: number };
export type Stats = { total: number; open: number; inProgress: number; resolved: number };
export const STORAGE_KEY = 'issueflow-demo-v1';
export const initialInput: IssueInput = { title: '', description: '', status: 'OPEN', priority: 'MEDIUM', assignee: '' };

export function validateInput(value: unknown): IssueInput {
  if (!value || typeof value !== 'object') throw new Error('Los datos de la incidencia no son válidos.');
  const v = value as Record<string, unknown>;
  if (typeof v.title !== 'string' || v.title.trim().length < 3 || v.title.trim().length > 120) throw new Error('El título debe tener entre 3 y 120 caracteres.');
  if (typeof v.description !== 'string' || v.description.trim().length > 4000) throw new Error('La descripción admite hasta 4000 caracteres.');
  if (typeof v.assignee !== 'string' || v.assignee.trim().length > 80) throw new Error('El responsable admite hasta 80 caracteres.');
  if (!Object.hasOwn(statuses, String(v.status)) || !Object.hasOwn(priorities, String(v.priority))) throw new Error('Selecciona un estado y una prioridad válidos.');
  if (v.version !== undefined && (!Number.isInteger(v.version) || Number(v.version) < 0)) throw new Error('La versión no es válida.');
  return { title: v.title.trim(), description: v.description.trim(), status: v.status as Status, priority: v.priority as Priority, assignee: v.assignee.trim(), ...(v.version === undefined ? {} : { version: Number(v.version) }) };
}

export function seedIssues(): Issue[] {
  const rows: [string, Status, Priority, string, string][] = [
    ['Error al restablecer la contraseña', 'OPEN', 'CRITICAL', 'Ana López', 'El enlace de recuperación devuelve un error al confirmar la nueva contraseña. Revisar el flujo y la expiración del token.'],
    ['El reporte mensual no se descarga', 'IN_PROGRESS', 'HIGH', 'Saul Ramos', 'Al solicitar el reporte mensual la descarga no se inicia. Reproducir el caso y revisar los logs del servicio.'],
    ['Mejorar el contraste de los formularios', 'OPEN', 'MEDIUM', '', 'Revisar etiquetas y mensajes de ayuda para facilitar la lectura.'],
    ['Corregir el formato de fecha en el historial', 'RESOLVED', 'LOW', 'Diego Ruiz', 'Se unificó el formato de fecha en la lista y en el detalle.'],
    ['Validar campos obligatorios del registro', 'IN_PROGRESS', 'HIGH', 'Ana López', 'Mostrar mensajes claros cuando falten campos requeridos y validar también en la API.'],
    ['Ajustar la navegación en pantallas pequeñas', 'OPEN', 'MEDIUM', 'Saul Ramos', 'Evitar el desbordamiento horizontal del menú en dispositivos móviles.']
  ];
  return rows.map(([title, status, priority, assignee, description], i) => ({ id: i + 1, version: 0, title, status, priority, assignee, description, createdAt: new Date(Date.UTC(2026, 7, 25 + i, 12)).toISOString(), updatedAt: new Date(Date.UTC(2026, 7, 25 + i, 12)).toISOString() }));
}
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export function readDemo(store: Store): Issue[] {
  const raw = store.getItem(STORAGE_KEY);
  if (raw === null) { const rows = seedIssues(); store.setItem(STORAGE_KEY, JSON.stringify(rows)); return rows; }
  try {
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error();
    const ids = new Set<number>();
    for (const row of rows) {
      validateInput(row);
      if (!Number.isInteger(row.id) || row.id <= 0 || ids.has(row.id) || !Number.isInteger(row.version) || row.version < 0 || !Number.isFinite(Date.parse(row.createdAt)) || !Number.isFinite(Date.parse(row.updatedAt))) throw new Error();
      ids.add(row.id);
    }
    return rows;
  } catch { throw new Error('No se pudieron leer los datos de la demo. Puedes restaurar los ejemplos para empezar de nuevo.'); }
}
export function demoStats(rows: Issue[]): Stats {
  return { total: rows.length, open: rows.filter(x => x.status === 'OPEN').length, inProgress: rows.filter(x => x.status === 'IN_PROGRESS').length, resolved: rows.filter(x => x.status === 'RESOLVED').length };
}
export function demoPage(rows: Issue[], f: Filters): IssuePage {
  const q = f.q.trim().toLocaleLowerCase();
  const filtered = rows.filter(x => (!f.status || x.status === f.status) && (!f.priority || x.priority === f.priority) && (!q || `${x.title} ${x.description} ${x.assignee}`.toLocaleLowerCase().includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
  return { content: filtered.slice(f.page * f.size, (f.page + 1) * f.size), page: f.page, size: f.size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / f.size) };
}
export function saveDemo(store: Store, value: unknown, id?: number): Issue {
  const input = validateInput(value); const rows = readDemo(store); const now = new Date().toISOString();
  let saved: Issue;
  if (id !== undefined) {
    const index = rows.findIndex(x => x.id === id);
    if (index < 0) throw new Error('La incidencia ya no existe. Actualiza la lista.');
    if (input.version !== rows[index].version) throw new Error('La incidencia cambió. Actualiza la lista antes de volver a intentarlo.');
    saved = { ...rows[index], ...input, version: rows[index].version + 1, updatedAt: now }; rows[index] = saved;
  } else {
    saved = { ...input, id: Math.max(0, ...rows.map(x => x.id)) + 1, version: 0, createdAt: now, updatedAt: now }; rows.push(saved);
  }
  store.setItem(STORAGE_KEY, JSON.stringify(rows)); return saved;
}
export function deleteDemo(store: Store, id: number, version: number): void {
  const rows = readDemo(store); const row = rows.find(x => x.id === id);
  if (!row) throw new Error('La incidencia ya no existe.');
  if (row.version !== version) throw new Error('La incidencia cambió. Actualiza la lista antes de eliminarla.');
  store.setItem(STORAGE_KEY, JSON.stringify(rows.filter(x => x.id !== id)));
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers); if (!headers.has('Content-Type')) headers.set('Content-Type','application/json');
  if (options.method && !['GET','HEAD'].includes(options.method)) {
    const csrfResponse = await fetch('/api/backend/auth/csrf', {cache:'no-store'});
    if (!csrfResponse.ok) throw new Error('No se pudo preparar la sesión.');
    const csrf = await csrfResponse.json() as {headerName:string;token:string}; headers.set(csrf.headerName, csrf.token);
  }
  const response = await fetch(`/api/backend${path}`, { ...options, headers, cache:'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {detail?: string};
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('session-expired'));
    throw new Error(body.detail || 'No se pudo completar la operación. Inténtalo de nuevo.');
  }
  return response.status === 204 ? undefined as T : response.json();
}


