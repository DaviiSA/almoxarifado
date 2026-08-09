import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, ArrowDownToLine, Download } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Field, Input, TextArea, Select, Button } from '@/components/Form';
import { StampBadge, statusTone } from '@/components/StampBadge';
import { useToast } from '@/lib/toast-context';
import { formatDate, formatNumber, todayISO, downloadCSV } from '@/lib/format';
import type { Entrada, Material, Obra } from '@/types';

const emptyForm = {
  data: todayISO(), tipoEstoque: 'Particular', obraId: '', materialId: '', quantidade: '',
  fornecedor: '', notaFiscal: '', observacoes: '',
};

export function Entries() {
  const { notify } = useToast();
  const [items, setItems] = useState<Entrada[] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [works, setWorks] = useState<Obra[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Entrada[]>('/entries').then(setItems).catch(() => notify('Não foi possível carregar as entradas.', 'error'));
  }
  useEffect(() => {
    load();
    api.get<Material[]>('/materials').then(setMaterials).catch(() => {});
    api.get<Obra[]>('/works').then(setWorks).catch(() => {});
  }, []);

  const materialMap = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const workMap = useMemo(() => new Map(works.map((w) => [w.id, w.nome])), [works]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/entries', { ...form, quantidade: Number(form.quantidade) });
      notify('Entrada registrada.');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao registrar entrada.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (!items) return;
    downloadCSV(
      'entradas.csv',
      items.map((e) => ({
        data: formatDate(e.data),
        tipo: e.tipoEstoque,
        material: materialMap.get(e.materialId)?.descricao ?? e.materialId,
        quantidade: e.quantidade,
        fornecedor: e.fornecedor,
        notaFiscal: e.notaFiscal,
        recebidoPor: e.recebidoPor,
      })),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Movimentação"
        title="Entradas"
        description="Recebimento de materiais no almoxarifado, com nota fiscal e fornecedor."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={exportCSV}><Download size={15} /> CSV</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> Nova entrada</Button>
          </div>
        }
      />

      <div className="card-surface overflow-hidden">
        {items?.length === 0 ? (
          <EmptyState icon={ArrowDownToLine} title="Nenhuma entrada registrada" description="Registre o recebimento de materiais para começar o histórico." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold text-right">Qtd.</th>
                  <th className="px-4 py-3 font-semibold">Fornecedor</th>
                  <th className="px-4 py-3 font-semibold">NF</th>
                  <th className="px-4 py-3 font-semibold">Recebido por</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(e.data)}</td>
                    <td className="px-4 py-3"><StampBadge tone={statusTone(e.tipoEstoque)}>{e.tipoEstoque}</StampBadge></td>
                    <td className="px-4 py-3 font-medium text-ink">{materialMap.get(e.materialId)?.descricao ?? e.materialId}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(e.quantidade)}</td>
                    <td className="px-4 py-3 text-ink-soft">{e.fornecedor}</td>
                    <td className="px-4 py-3 code-tag text-ink-soft">{e.notaFiscal || '—'}</td>
                    <td className="px-4 py-3 text-ink-soft">{e.recebidoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar entrada">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" required>
              <Input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Field>
            <Field label="Tipo de estoque" required>
              <Select required value={form.tipoEstoque} onChange={(e) => setForm({ ...form, tipoEstoque: e.target.value })}>
                <option value="Particular">Particular</option>
                <option value="Energisa">Energisa</option>
              </Select>
            </Field>
          </div>
          <Field label="Material" required>
            <Select required value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
              <option value="">Selecione…</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.descricao} ({m.unidade})</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade" required>
              <Input type="number" min={0} step="any" required value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
            </Field>
            <Field label="Obra vinculada">
              <Select value={form.obraId} onChange={(e) => setForm({ ...form, obraId: e.target.value })}>
                <option value="">Nenhuma</option>
                {works.map((w) => <option key={w.id} value={w.id}>{w.nome}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fornecedor" required>
              <Input required value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </Field>
            <Field label="Nota fiscal">
              <Input value={form.notaFiscal} onChange={(e) => setForm({ ...form, notaFiscal: e.target.value })} />
            </Field>
          </div>
          <Field label="Observações">
            <TextArea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="secondary" disabled={saving}>{saving ? 'Salvando…' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
