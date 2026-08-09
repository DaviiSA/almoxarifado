import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Users as UsersIcon, CheckCircle2, AlertTriangle, RefreshCw, Sheet } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Button } from '@/components/Form';
import { StampBadge } from '@/components/StampBadge';
import { useToast } from '@/lib/toast-context';
import type { Usuario, SetupStatus } from '@/types';

const emptyForm = { nome: '', email: '', senha: '', perfil: 'EQUIPE', equipeVinculada: '' };

export function UsersPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Usuario[] | null>(null);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Usuario[]>('/users').then(setItems).catch(() => notify('Não foi possível carregar os usuários.', 'error'));
  }
  function checkStatus() {
    setChecking(true);
    api.get<SetupStatus>('/setup').then(setStatus).catch(() => setStatus(null)).finally(() => setChecking(false));
  }
  useEffect(() => {
    load();
    checkStatus();
  }, []);

  async function provisionSheets() {
    setProvisioning(true);
    try {
      const r = await api.post<SetupStatus & { criadas: string[] }>('/setup');
      setStatus(r);
      notify(r.criadas.length ? `Abas criadas: ${r.criadas.join(', ')}` : 'Planilha já estava configurada.');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao configurar a planilha.', 'error');
    } finally {
      setProvisioning(false);
    }
  }

  async function toggleAtivo(u: Usuario) {
    try {
      await api.put(`/users/${u.id}`, { ativo: !u.ativo });
      notify(u.ativo ? 'Usuário desativado.' : 'Usuário reativado.');
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao atualizar usuário.', 'error');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      notify('Usuário cadastrado. Compartilhe o e-mail e a senha com a pessoa.');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao cadastrar usuário.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Acesso"
        title="Usuários"
        description="Pessoas com acesso ao sistema e status da conexão com a planilha do Google."
        action={
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Novo usuário
          </Button>
        }
      />

      <div className="card-surface p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-display text-xl font-semibold text-ink flex items-center gap-2">
            <Sheet size={18} className="text-amber-600" /> Configuração da planilha
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={checkStatus} disabled={checking}>
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> Verificar
            </Button>
            {status && status.abasFaltando.length > 0 && (
              <Button variant="secondary" onClick={provisionSheets} disabled={provisioning}>
                {provisioning ? 'Configurando…' : 'Criar abas faltantes'}
              </Button>
            )}
          </div>
        </div>
        {status ? (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-3">
              {status.configurado ? (
                <StampBadge tone="moss"><CheckCircle2 size={13} /> Planilha configurada</StampBadge>
              ) : (
                <StampBadge tone="rust"><AlertTriangle size={13} /> Faltam abas</StampBadge>
              )}
            </div>
            <p className="text-xs text-ink-soft">
              Abas encontradas: <span className="code-tag">{status.abasExistentes.join(', ') || '—'}</span>
            </p>
            {status.abasFaltando.length > 0 && (
              <p className="text-xs text-rust-500 mt-1">
                Abas faltando: <span className="code-tag">{status.abasFaltando.join(', ')}</span> — clique em "Criar abas
                faltantes" para gerar automaticamente com os cabeçalhos corretos.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-soft mt-2">
            Não foi possível verificar a planilha. Confirme se <span className="code-tag">GOOGLE_SHEET_ID</span>,{' '}
            <span className="code-tag">GOOGLE_SERVICE_ACCOUNT_EMAIL</span> e{' '}
            <span className="code-tag">GOOGLE_PRIVATE_KEY</span> estão configurados e se a planilha foi compartilhada
            com o e-mail da service account.
          </p>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Perfil</th>
                <th className="px-4 py-3 font-semibold">Equipe</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items?.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium text-ink">{u.nome}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-4 py-3">
                    <StampBadge tone={u.perfil === 'ADMIN' ? 'amber' : 'steel'}>{u.perfil}</StampBadge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{u.equipeVinculada || '—'}</td>
                  <td className="px-4 py-3">
                    <StampBadge tone={u.ativo ? 'moss' : 'rust'}>{u.ativo ? 'Ativo' : 'Inativo'}</StampBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => toggleAtivo(u)} className="!py-1 !px-2.5 text-xs">
                      {u.ativo ? 'Desativar' : 'Reativar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items?.length === 0 && (
          <div className="p-6 text-center text-sm text-ink-soft flex flex-col items-center gap-2">
            <UsersIcon size={22} />
            Nenhum usuário cadastrado na planilha ainda. Você está usando a conta administradora de emergência.
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo usuário">
        <form onSubmit={handleSubmit}>
          <Field label="Nome" required>
            <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <Field label="E-mail" required>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Senha provisória" required>
            <Input type="text" required minLength={6} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Perfil" required>
              <Select required value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
                <option value="EQUIPE">Equipe</option>
                <option value="ADMIN">Administrador</option>
              </Select>
            </Field>
            <Field label="Equipe vinculada">
              <Input value={form.equipeVinculada} onChange={(e) => setForm({ ...form, equipeVinculada: e.target.value })} placeholder="Equipe Alpha…" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="secondary" disabled={saving}>{saving ? 'Salvando…' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
