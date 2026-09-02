import test from 'node:test';
import assert from 'node:assert/strict';
import { readDemo, saveDemo, deleteDemo, demoPage, demoStats, validateInput, STORAGE_KEY, initialInput } from '../lib/issues.ts';
const memory = () => { const data = new Map(); return { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>data.set(k,v) }; };
test('CRUD persists and increments version; stale updates do not overwrite', () => {
  const store = memory(); const created = saveDemo(store, {...initialInput,title:'Nueva incidencia'});
  const updated = saveDemo(store, {...created,status:'RESOLVED'}, created.id);
  assert.equal(updated.version,1);
  assert.throws(()=>saveDemo(store,{...created,title:'Edición obsoleta'},created.id),/cambió/);
  assert.equal(readDemo(store).find(x=>x.id===created.id).status,'RESOLVED');
  assert.throws(()=>deleteDemo(store,created.id,0),/cambió/);
  deleteDemo(store,created.id,1);
  assert.equal(readDemo(store).some(x=>x.id===created.id),false);
});
test('invalid input does not alter saved data', () => {
  const store=memory();readDemo(store);const before=store.getItem(STORAGE_KEY);
  for(const patch of [{title:'  '},{title:'ab'},{title:'x'.repeat(121)},{status:'UNKNOWN'},{priority:'toString'},{description:'x'.repeat(4001)}]) {
    assert.throws(()=>saveDemo(store,{...initialInput,title:'Valid title',...patch}));
  }
  assert.equal(store.getItem(STORAGE_KEY),before);
});
test('search combines status and priority and paginates', () => {
  const rows=readDemo(memory());
  const page=demoPage(rows,{q:'CONTRASEÑA',status:'OPEN',priority:'CRITICAL',page:0,size:2});
  assert.equal(page.totalElements,1);assert.equal(page.content[0].id,1);
  const paged=demoPage(rows,{q:'',status:'',priority:'',page:1,size:2});
  assert.equal(paged.totalPages,3);assert.equal(paged.content.length,2);
  assert.deepEqual(demoStats(rows),{total:6,open:3,inProgress:2,resolved:1});
});
test('empty data remains empty on reload', () => {
  const store=memory();store.setItem(STORAGE_KEY,'[]');assert.deepEqual(readDemo(store),[]);
});
test('corrupt storage is preserved rather than silently replaced', () => {
  const store=memory();store.setItem(STORAGE_KEY,'broken');assert.throws(()=>readDemo(store),/leer/);assert.equal(store.getItem(STORAGE_KEY),'broken');
});
test('validation trims fields and rejects invalid versions', () => {
  assert.equal(validateInput({...initialInput,title:'  Login error  '}).title,'Login error');
  assert.throws(()=>validateInput({...initialInput,title:'Valid title',version:-1}));
});
