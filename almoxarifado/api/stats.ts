import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, handleApiError } from './_lib/auth';
import { computeInventory } from './_lib/inventory';
import { readSheet } from './_lib/sheets';
import type { Obra, AplicacaoCampo, DashboardStats, AtividadeRecente } from '../src/types';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const [{ estoque, entradas, saidas, materiais }, obras, aplicacoes] = await Promise.all([
      computeInventory(),
      readSheet<Obra>('Obras', (r) => ({
        id: r[0], nome: r[1], contratante: r[2], dataInicio: r[3],
        status: (r[4] as Obra['status']) || 'Em andamento', tipo: r[5], observacoes: r[6] || undefined,
      })),
      readSheet<AplicacaoCampo>('Aplicacoes', (r) => ({
        id: r[0], data: r[1], obraId: r[2], materialId: r[3],
        quantidadeAplicada: Number(r[4] || 0), quantidadeSobra: Number(r[5] || 0),
        equipe: r[6], localizacao: r[7], responsavel: r[8], observacoes: r[9] || undefined,
      })),
    ]);

    const particularTotal = estoque.reduce((acc, m) => acc + m.particular, 0);
    const energisaTotal = estoque.reduce((acc, m) => acc + m.energisa, 0);
    const obrasAndamento = obras.filter((o) => o.status === 'Em andamento').length;
    const materiaisAbaixoMinimo = estoque.filter((m) => m.abaixoDoMinimo);

    // Movimentação dos últimos 6 meses
    const now = new Date();
    const buckets: { key: string; mes: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, mes: MESES[d.getMonth()], entradas: 0, saidas: 0 });
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    for (const e of entradas) {
      const d = new Date(e.data);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = bucketMap.get(key);
      if (b) b.entradas += e.quantidade;
    }
    for (const s of saidas) {
      const d = new Date(s.data);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = bucketMap.get(key);
      if (b) b.saidas += s.quantidade;
    }

    // Estoque por categoria
    const catMap = new Map<string, number>();
    for (const m of estoque) catMap.set(m.categoria || 'Outros', (catMap.get(m.categoria || 'Outros') ?? 0) + m.total);
    const estoquePorCategoria = Array.from(catMap.entries()).map(([categoria, quantidade]) => ({ categoria, quantidade }));

    // Atividade recente (últimos lançamentos combinados)
    const materialNome = new Map(materiais.map((m) => [m.id, m.descricao]));
    const atividade: AtividadeRecente[] = [
      ...entradas.map((e) => ({
        tipo: 'entrada' as const,
        data: e.data,
        descricaoMaterial: materialNome.get(e.materialId) ?? e.materialId,
        quantidade: e.quantidade,
        responsavel: e.recebidoPor,
        detalhe: `Entrada (${e.tipoEstoque}) — ${e.fornecedor}`,
      })),
      ...saidas.map((s) => ({
        tipo: 'saida' as const,
        data: s.data,
        descricaoMaterial: materialNome.get(s.materialId) ?? s.materialId,
        quantidade: s.quantidade,
        responsavel: s.retiradoPor,
        detalhe: `Saída (${s.tipoEstoque}) — equipe ${s.equipeResponsavel}`,
      })),
      ...aplicacoes.map((a) => ({
        tipo: 'aplicacao' as const,
        data: a.data,
        descricaoMaterial: materialNome.get(a.materialId) ?? a.materialId,
        quantidade: a.quantidadeAplicada,
        responsavel: a.responsavel,
        detalhe: `Aplicação em campo — ${a.localizacao}`,
      })),
    ]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .slice(0, 10);

    const stats: DashboardStats = {
      particularTotal,
      energisaTotal,
      obrasAndamento,
      alertasEstoque: materiaisAbaixoMinimo.length,
      materiaisAbaixoMinimo,
      movimentacaoMensal: buckets.map(({ mes, entradas, saidas }) => ({ mes, entradas, saidas })),
      estoquePorCategoria,
      atividadeRecente: atividade,
    };

    res.json(stats);
  } catch (error) {
    handleApiError(res, error);
  }
}
