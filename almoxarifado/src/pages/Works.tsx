import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Search, Pencil, HardHat } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Field, Input, TextArea, Select, Button } from '@/components/Form';
import { StampBadge, statusTone } from '@/components/StampBadge';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { formatDate, todayISO } from '@/lib/format';
import type { Obra } from '@/types';

const emptyForm = { nome: '', contratante: '', dataInicio: todayISO(), status: 'Em andamento', tipo: '', observacoes: '' };

export function Works() {
  const { user } = useAuth();
  const { notify } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [items, setItems] = useState<Obra[] | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Obra[]>('/works').then(setItems).catch(() => notify('Não foi possível carregar as obras.', 'error'));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((o) => o.nome.toLowerCase().includes(q) || o.contratante.toLowerCase().includes(q)) : items;
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(o: Obra) {
    setEditing(o);
    setForm({ nome: o.nome, contratante: o.contratante, dataInicio: o.dataInicio, status: o.status, tipo: o.tipo, observacoes: o.observacoes ?? '' });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/works/${editing.id}`, form);
        notify('Obra atualizada.');
      } else {
        await api.post('/works', form);
        notify('Obra cadastrada.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao salvar obra.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Contratos"
        title="Obras"
        description="Obras atendidas pelo almoxarifado, particulares ou da Energisa."
        action={
          isAdmin && (
            <Button variant="secondary" onClick={openNew}>
              <Plus size={16} /> Nova obra
            </Button>
          )
        }
      />

      <div className="card-surface p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input placeholder="Buscar por nome ou contratante…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((o) => (
          <div key={o.id} className="card-surface p-4 animate-enter">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-ink truncate">{o.nome}</p>
                <p className="text-xs text-ink-soft">{o.contratante}</p>
              </div>
              {isAdmin && (
                <button onClick={() => openEdit(o)} className="text-ink-soft hover:text-amber-600 p-1 shrink-0">
                  <Pencil size={15} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <StampBadge tone={statusTone(o.status)}>{o.status}</StampBadge>
              <span className="code-tag text-ink-soft">{o.tipo}</span>
            </div>
            <p className="text-xs text-ink-soft mt-2">Início: {formatDate(o.dataInicio)}</p>
            {o.observacoes && <p className="text-sm text-ink-soft mt-2 border-t border-line pt-2">{o.observacoes}</p>}
          </div>
        ))}
      </div>

      {filtered.length === 0 && items !== null && (
        <EmptyState icon={HardHat} title="Nenhuma obra cadastrada" description="Cadastre a primeira obra para vincular entradas, saídas e aplicações." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar obra' : 'Nova obra'}>
        <form onSubmit={handleSubmit}>
          <Field label="Nome da obra" required>
            <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <Field label="Contratante" required>
            <Input required value={form.contratante} onChange={(e) => setForm({ ...form, contratante: e.target.value })} placeholder="Particular, Energisa…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de início" required>
              <Input type="date" required value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            </Field>
            <Field label="Status" required>
              <Select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluída">Concluída</option>
              </Select>
            </Field>
          </div>
          <Field label="Tipo" required>
            <Input required value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Rede subterrânea, poda, manutenção…" />
          </Field>
          <Field label="Observações">
            <TextArea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="secondary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
