import { useEffect, useState } from 'react';
import { Boxes, Zap, HardHat, TriangleAlert, ArrowDownToLine, ArrowUpFromLine, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StampBadge } from '@/components/StampBadge';
import { formatNumber, timeAgo } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import type { DashboardStats } from '@/types';

const ACTIVITY_ICON = { entrada: ArrowDownToLine, saida: ArrowUpFromLine, aplicacao: MapPin };
const ACTIVITY_LABEL = { entrada: 'Entrada', saida: 'Saída', aplicacao: 'Aplicação' };
const ACTIVITY_TONE: Record<string, string> = {
  entrada: 'text-moss-500 bg-moss-50',
  saida: 'text-rust-500 bg-rust-50',
  aplicacao: 'text-steel-600 bg-steel-50',
};

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardStats>('/stats')
      .then(setStats)
      .catch((e) => setError(e.message || 'Não foi possível carregar os dados.'));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Painel"
        title={`Olá, ${user?.nome?.split(' ')[0] ?? ''}`}
        description="Visão geral do estoque, obras em andamento e movimentações recentes."
      />

      {error && (
        <div className="card-surface p-4 mb-6 text-sm text-rust-500 border-rust-500/30">
          {error} — confira se a planilha do Google já foi configurada (veja a página Usuários → Configuração).
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Estoque Particular" value={formatNumber(stats?.particularTotal ?? 0)} icon={Boxes} tone="amber" />
        <StatCard label="Estoque Energisa" value={formatNumber(stats?.energisaTotal ?? 0)} icon={Zap} tone="steel" />
        <StatCard label="Obras em andamento" value={formatNumber(stats?.obrasAndamento ?? 0)} icon={HardHat} tone="moss" />
        <StatCard
          label="Alertas de estoque"
          value={formatNumber(stats?.alertasEstoque ?? 0)}
          icon={TriangleAlert}
          tone="rust"
          hint={stats?.alertasEstoque ? 'materiais abaixo do mínimo' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card-surface p-5 xl:col-span-2">
          <h3 className="font-display text-xl font-semibold text-ink mb-4">Movimentação · últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.movimentacaoMensal ?? []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-line)', fontSize: 13 }}
                cursor={{ fill: 'var(--color-paper)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" name="Entradas" fill="var(--color-moss-500)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="var(--color-rust-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-5">
          <h3 className="font-display text-xl font-semibold text-ink mb-4">Estoque por categoria</h3>
          {stats?.estoquePorCategoria.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.estoquePorCategoria} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  width={90}
                  tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-line)', fontSize: 13 }} />
                <Bar dataKey="quantidade" fill="var(--color-amber-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Boxes} title="Sem materiais ainda" description="Cadastre materiais para ver a distribuição por categoria." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <h3 className="font-display text-xl font-semibold text-ink mb-4">Abaixo do estoque mínimo</h3>
          {stats?.materiaisAbaixoMinimo.length ? (
            <ul className="divide-y divide-line">
              {stats.materiaisAbaixoMinimo.map((m) => (
                <li key={m.materialId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{m.descricao}</p>
                    <p className="code-tag text-ink-soft">{m.categoria}</p>
                  </div>
                  <StampBadge tone="rust">
                    {formatNumber(m.total)} / {formatNumber(m.estoqueMinimo)} {m.unidade}
                  </StampBadge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={TriangleAlert} title="Tudo em ordem" description="Nenhum material está abaixo do estoque mínimo no momento." />
          )}
        </div>

        <div className="card-surface p-5">
          <h3 className="font-display text-xl font-semibold text-ink mb-4">Atividade recente</h3>
          {stats?.atividadeRecente.length ? (
            <ul className="divide-y divide-line">
              {stats.atividadeRecente.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.tipo];
                return (
                  <li key={i} className="py-2.5 flex items-start gap-3">
                    <div className={`shrink-0 rounded-md p-1.5 ${ACTIVITY_TONE[a.tipo]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{ACTIVITY_LABEL[a.tipo]}</span> · {a.descricaoMaterial} ·{' '}
                        <span className="font-medium">{formatNumber(a.quantidade)}</span>
                      </p>
                      <p className="text-xs text-ink-soft truncate">
                        {a.detalhe} · {a.responsavel} · {timeAgo(a.data)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={ArrowDownToLine} title="Sem movimentações" description="As entradas, saídas e aplicações aparecerão aqui." />
          )}
        </div>
      </div>
    </div>
  );
}
