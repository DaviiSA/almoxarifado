import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Boxes } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StampBadge } from '@/components/StampBadge';
import { Button, Input } from '@/components/Form';
import { formatNumber, downloadCSV } from '@/lib/format';
import type { EstoqueMaterial } from '@/types';

export function Inventory() {
  const [items, setItems] = useState<EstoqueMaterial[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<EstoqueMaterial[]>('/inventory')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.descricao.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Saldo atual"
        title="Estoque"
        description="Saldo calculado automaticamente a partir do histórico de entradas e saídas."
        action={
          <Button variant="ghost" onClick={() => downloadCSV('estoque.csv', filtered as unknown as Record<string, string | number>[])}>
            <Download size={15} /> Exportar CSV
          </Button>
        }
      />

      <div className="card-surface p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input placeholder="Buscar material ou categoria…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {error && <div className="card-surface p-4 mb-4 text-sm text-rust-500">{error}</div>}

      <div className="card-surface overflow-hidden">
        {filtered.length === 0 && items !== null ? (
          <EmptyState icon={Boxes} title="Nenhum material encontrado" description="Ajuste a busca ou cadastre materiais na aba Materiais." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-right">Particular</th>
                  <th className="px-4 py-3 font-semibold text-right">Energisa</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Mínimo</th>
                  <th className="px-4 py-3 font-semibold text-right">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.materialId} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 font-medium text-ink">{m.descricao}</td>
                    <td className="px-4 py-3 text-ink-soft">{m.categoria}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(m.particular)}</td>
                    <td className="px-4 py-3 text-right code-tag">{formatNumber(m.energisa)}</td>
                    <td className="px-4 py-3 text-right code-tag font-semibold">
                      {formatNumber(m.total)} {m.unidade}
                    </td>
                    <td className="px-4 py-3 text-right code-tag text-ink-soft">{formatNumber(m.estoqueMinimo)}</td>
                    <td className="px-4 py-3 text-right">
                      {m.abaixoDoMinimo ? <StampBadge tone="rust">Baixo</StampBadge> : <StampBadge tone="moss">OK</StampBadge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
