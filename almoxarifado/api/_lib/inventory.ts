import { readSheet } from './sheets';
import type { Entrada, Saida, Material, EstoqueMaterial } from '../../src/types';

/**
 * Calcula o estoque atual de cada material a partir do histórico de Entradas e Saídas.
 * Não existe uma aba "Estoque" redundante — o saldo é sempre derivado dos lançamentos,
 * o que evita a planilha ficar dessincronizada.
 *
 * Regra de negócio:
 *  - Entrada "Particular" soma ao saldo Particular; Entrada "Energisa" soma ao saldo Energisa.
 *  - Saída "Particular" subtrai do saldo Particular; Saída "Energisa" subtrai do saldo Energisa.
 *  - Saída "Misto" (obra Energisa complementada com material Particular) subtrai do saldo
 *    Particular, pois foi o estoque físico de onde o material realmente saiu.
 */
export async function computeInventory(): Promise<{
  estoque: EstoqueMaterial[];
  entradas: Entrada[];
  saidas: Saida[];
  materiais: Material[];
}> {
  const [materiais, entradas, saidas] = await Promise.all([
    readSheet<Material>('Materiais', (r) => ({
      id: r[0],
      descricao: r[1],
      unidade: r[2],
      categoria: r[3],
      estoqueMinimo: Number(r[4] || 0),
      observacoes: r[5] || undefined,
    })),
    readSheet<Entrada>('Entradas', (r) => ({
      id: r[0],
      data: r[1],
      tipoEstoque: (r[2] as Entrada['tipoEstoque']) || 'Particular',
      obraId: r[3] || undefined,
      materialId: r[4],
      quantidade: Number(r[5] || 0),
      fornecedor: r[6],
      notaFiscal: r[7],
      recebidoPor: r[8],
      observacoes: r[9] || undefined,
    })),
    readSheet<Saida>('Saidas', (r) => ({
      id: r[0],
      data: r[1],
      tipoEstoque: (r[2] as Saida['tipoEstoque']) || 'Particular',
      obraId: r[3],
      materialId: r[4],
      quantidade: Number(r[5] || 0),
      origemComplemento: r[6] || undefined,
      equipeResponsavel: r[7],
      retiradoPor: r[8],
      observacoes: r[9] || undefined,
    })),
  ]);

  const saldoParticular = new Map<string, number>();
  const saldoEnergisa = new Map<string, number>();
  const add = (map: Map<string, number>, id: string, qty: number) => map.set(id, (map.get(id) ?? 0) + qty);

  for (const e of entradas) {
    if (e.tipoEstoque === 'Energisa') add(saldoEnergisa, e.materialId, e.quantidade);
    else add(saldoParticular, e.materialId, e.quantidade);
  }
  for (const s of saidas) {
    if (s.tipoEstoque === 'Energisa') add(saldoEnergisa, s.materialId, -s.quantidade);
    else add(saldoParticular, s.materialId, -s.quantidade); // 'Particular' e 'Misto' saem do Particular
  }

  const estoque: EstoqueMaterial[] = materiais.map((m) => {
    const particular = saldoParticular.get(m.id) ?? 0;
    const energisa = saldoEnergisa.get(m.id) ?? 0;
    const total = particular + energisa;
    return {
      materialId: m.id,
      descricao: m.descricao,
      unidade: m.unidade,
      categoria: m.categoria,
      estoqueMinimo: m.estoqueMinimo,
      particular,
      energisa,
      total,
      abaixoDoMinimo: total < m.estoqueMinimo,
    };
  });

  return { estoque, entradas, saidas, materiais };
}
