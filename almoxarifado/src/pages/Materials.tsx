import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Search, Pencil, Package } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Field, Input, TextArea, Button } from '@/components/Form';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { formatNumber } from '@/lib/format';
import type { Material } from '@/types';

const emptyForm = { descricao: '', unidade: '', categoria: '', estoqueMinimo: '0', observacoes: '' };

export function Materials() {
  const { user } = useAuth();
  const { notify } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [items, setItems] = useState<Material[] | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Material[]>('/materials').then(setItems).catch(() => notify('Não foi possível carregar os materiais.', 'error'));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((m) => m.descricao.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q)) : items;
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(m: Material) {
    setEditing(m);
    setForm({
      descricao: m.descricao,
      unidade: m.unidade,
      categoria: m.categoria,
      estoqueMinimo: String(m.estoqueMinimo),
      observacoes: m.observacoes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/materials/${editing.id}`, { ...form, estoqueMinimo: Number(form.estoqueMinimo) });
        notify('Material atualizado.');
      } else {
        await api.post('/materials', { ...form, estoqueMinimo: Number(form.estoqueMinimo) });
        notify('Material cadastrado.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao salvar material.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Materiais"
        description="Itens controlados pelo almoxarifado, com unidade de medida e estoque mínimo."
        action={
          isAdmin && (
            <Button variant="secondary" onClick={openNew}>
              <Plus size={16} /> Novo material
            </Button>
          )
        }
      />

      <div className="card-surface p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input placeholder="Buscar por descrição ou categoria…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {filtered.length === 0 && items !== null ? (
          <EmptyState icon={Package} title="Nenhum material cadastrado" description="Cadastre o primeiro material para começar a controlar o estoque." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Unidade</th>
                  <th className="px-4 py-3 font-semibold text-right">Estoque mín.</th>
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 code-tag text-ink-soft">{m.id}</td>
                    <td className="px-4 py-3 font-medium text-ink">{m.descricao}</td>
                    <td className="px-4 py-3 text-ink-soft">{m.categoria}</td>
                    <td className="px-4 py-3 text-ink-soft">{m.unidade}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(m.estoqueMinimo)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(m)} className="text-ink-soft hover:text-amber-600 p-1">
                          <Pencil size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar material' : 'Novo material'}>
        <form onSubmit={handleSubmit}>
          <Field label="Descrição" required>
            <Input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Cabo de alumínio 4mm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidade" required>
              <Input required value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="UN, M, KG…" />
            </Field>
            <Field label="Categoria" required>
              <Input required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Elétrico, Ferragem…" />
            </Field>
          </div>
          <Field label="Estoque mínimo" required>
            <Input type="number" min={0} required value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })} />
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
