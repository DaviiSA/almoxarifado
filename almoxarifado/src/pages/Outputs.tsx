import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, ArrowUpFromLine, Download } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Field, Input, TextArea, Select, Button } from '@/components/Form';
import { StampBadge, statusTone } from '@/components/StampBadge';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { formatDate, formatNumber, todayISO, downloadCSV } from '@/lib/format';
import type { Saida, Material, Obra } from '@/types';

const emptyForm = {
  data: todayISO(), tipoEstoque: 'Particular', obraId: '', materialId: '', quantidade: '',
  origemComplemento: '', equipeResponsavel: '', observacoes: '',
};

export function Outputs() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<Saida[] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [works, setWorks] = useState<Obra[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, equipeResponsavel: user?.equipeVinculada ?? '' });
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Saida[]>('/outputs').then(setItems).catch(() => notify('Não foi possível carregar as saídas.', 'error'));
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
      await api.post('/outputs', { ...form, quantidade: Number(form.quantidade) });
      notify('Saída registrada.');
      setModalOpen(false);
      setForm({ ...emptyForm, equipeResponsavel: user?.equipeVinculada ?? '' });
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao registrar saída.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (!items) return;
    downloadCSV(
      'saidas.csv',
      items.map((s) => ({
        data: formatDate(s.data),
        tipo: s.tipoEstoque,
        obra: workMap.get(s.obraId) ?? s.obraId,
        material: materialMap.get(s.materialId)?.descricao ?? s.materialId,
        quantidade: s.quantidade,
        equipe: s.equipeResponsavel,
        retiradoPor: s.retiradoPor,
      })),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Movimentação"
        title="Saídas"
        description="Retirada de materiais do almoxarifado para uso em obras."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={exportCSV}><Download size={15} /> CSV</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> Nova saída</Button>
          </div>
        }
      />

      <div className="card-surface overflow-hidden">
        {items?.length === 0 ? (
          <EmptyState icon={ArrowUpFromLine} title="Nenhuma saída registrada" description="Registre a retirada de materiais para uma obra." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold text-right">Qtd.</th>
                  <th className="px-4 py-3 font-semibold">Equipe</th>
                  <th className="px-4 py-3 font-semibold">Retirado por</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(s.data)}</td>
                    <td className="px-4 py-3"><StampBadge tone={statusTone(s.tipoEstoque)}>{s.tipoEstoque}</StampBadge></td>
                    <td className="px-4 py-3 text-ink-soft">{workMap.get(s.obraId) ?? s.obraId}</td>
                    <td className="px-4 py-3 font-medium text-ink">{materialMap.get(s.materialId)?.descricao ?? s.materialId}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(s.quantidade)}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.equipeResponsavel}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.retiradoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar saída">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" required>
              <Input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Field>
            <Field label="Tipo de estoque" required>
              <Select required value={form.tipoEstoque} onChange={(e) => setForm({ ...form, tipoEstoque: e.target.value })}>
                <option value="Particular">Particular</option>
                <option value="Energisa">Energisa</option>
                <option value="Misto">Misto (complemento com Particular)</option>
              </Select>
            </Field>
          </div>
          <Field label="Obra" required>
            <Select required value={form.obraId} onChange={(e) => setForm({ ...form, obraId: e.target.value })}>
              <option value="">Selecione…</option>
              {works.map((w) => <option key={w.id} value={w.id}>{w.nome}</option>)}
            </Select>
          </Field>
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
            <Field label="Equipe responsável" required>
              <Input required value={form.equipeResponsavel} onChange={(e) => setForm({ ...form, equipeResponsavel: e.target.value })} />
            </Field>
          </div>
          {form.tipoEstoque === 'Misto' && (
            <Field label="Origem do complemento">
              <Input value={form.origemComplemento} onChange={(e) => setForm({ ...form, origemComplemento: e.target.value })} placeholder="Ex.: faltou 20un no estoque Energisa" />
            </Field>
          )}
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
