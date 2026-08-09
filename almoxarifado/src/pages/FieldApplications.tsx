import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, MapPin, Download } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Field, Input, TextArea, Select, Button } from '@/components/Form';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { formatDate, formatNumber, todayISO, downloadCSV } from '@/lib/format';
import type { AplicacaoCampo, Material, Obra } from '@/types';

const emptyForm = {
  data: todayISO(), obraId: '', materialId: '', quantidadeAplicada: '', quantidadeSobra: '0',
  equipe: '', localizacao: '', observacoes: '',
};

export function FieldApplications() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<AplicacaoCampo[] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [works, setWorks] = useState<Obra[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, equipe: user?.equipeVinculada ?? '' });
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<AplicacaoCampo[]>('/field-applications').then(setItems).catch(() => notify('Não foi possível carregar as aplicações.', 'error'));
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
      await api.post('/field-applications', {
        ...form,
        quantidadeAplicada: Number(form.quantidadeAplicada),
        quantidadeSobra: Number(form.quantidadeSobra) || 0,
      });
      notify('Aplicação em campo registrada.');
      setModalOpen(false);
      setForm({ ...emptyForm, equipe: user?.equipeVinculada ?? '' });
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao registrar aplicação.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (!items) return;
    downloadCSV(
      'aplicacoes-campo.csv',
      items.map((a) => ({
        data: formatDate(a.data),
        obra: workMap.get(a.obraId) ?? a.obraId,
        material: materialMap.get(a.materialId)?.descricao ?? a.materialId,
        aplicado: a.quantidadeAplicada,
        sobra: a.quantidadeSobra,
        equipe: a.equipe,
        local: a.localizacao,
      })),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Campo"
        title="Aplicações em campo"
        description="Registro do que foi efetivamente aplicado em cada obra, com sobra e localização."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={exportCSV}><Download size={15} /> CSV</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> Nova aplicação</Button>
          </div>
        }
      />

      <div className="card-surface overflow-hidden">
        {items?.length === 0 ? (
          <EmptyState icon={MapPin} title="Nenhuma aplicação registrada" description="Registre o que foi aplicado em campo pela equipe." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold text-right">Aplicado</th>
                  <th className="px-4 py-3 font-semibold text-right">Sobra</th>
                  <th className="px-4 py-3 font-semibold">Equipe</th>
                  <th className="px-4 py-3 font-semibold">Local</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(a.data)}</td>
                    <td className="px-4 py-3 text-ink-soft">{workMap.get(a.obraId) ?? a.obraId}</td>
                    <td className="px-4 py-3 font-medium text-ink">{materialMap.get(a.materialId)?.descricao ?? a.materialId}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(a.quantidadeAplicada)}</td>
                    <td className="px-4 py-3 text-right code-tag text-ink-soft">{formatNumber(a.quantidadeSobra)}</td>
                    <td className="px-4 py-3 text-ink-soft">{a.equipe}</td>
                    <td className="px-4 py-3 text-ink-soft">{a.localizacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar aplicação em campo">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" required>
              <Input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Field>
            <Field label="Equipe" required>
              <Input required value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} />
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
            <Field label="Quantidade aplicada" required>
              <Input type="number" min={0} step="any" required value={form.quantidadeAplicada} onChange={(e) => setForm({ ...form, quantidadeAplicada: e.target.value })} />
            </Field>
            <Field label="Sobra">
              <Input type="number" min={0} step="any" value={form.quantidadeSobra} onChange={(e) => setForm({ ...form, quantidadeSobra: e.target.value })} />
            </Field>
          </div>
          <Field label="Localização" required>
            <Input required value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} placeholder="Endereço, poste, ponto de referência…" />
          </Field>
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
