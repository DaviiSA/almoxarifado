/**
 * Reports.gs — estoque e estatísticas, sempre calculados a partir do histórico
 * de Entradas e Saídas (nunca de uma aba de saldo mantida manualmente).
 */

function mapMaterial_(r) {
  return { id: r[0], descricao: r[1], unidade: r[2], categoria: r[3], estoqueMinimo: Number(r[4] || 0), observacoes: r[5] || '' };
}
function mapObra_(r) {
  return { id: r[0], nome: r[1], contratante: r[2], dataInicio: toDateStr_(r[3]), status: r[4] || 'Em andamento', tipo: r[5], observacoes: r[6] || '' };
}
function mapEntrada_(r) {
  return { id: r[0], data: toDateStr_(r[1]), tipoEstoque: r[2] || 'Particular', obraId: r[3] || '', materialId: r[4], quantidade: Number(r[5] || 0), fornecedor: r[6], notaFiscal: r[7] || '', recebidoPor: r[8], observacoes: r[9] || '' };
}
function mapSaida_(r) {
  return { id: r[0], data: toDateStr_(r[1]), tipoEstoque: r[2] || 'Particular', obraId: r[3], materialId: r[4], quantidade: Number(r[5] || 0), origemComplemento: r[6] || '', equipeResponsavel: r[7], retiradoPor: r[8], observacoes: r[9] || '' };
}
function mapAplicacao_(r) {
  return { id: r[0], data: toDateStr_(r[1]), obraId: r[2], materialId: r[3], quantidadeAplicada: Number(r[4] || 0), quantidadeSobra: Number(r[5] || 0), equipe: r[6], localizacao: r[7], responsavel: r[8], observacoes: r[9] || '' };
}
function mapUsuario_(r) {
  const ativoRaw = r[6];
  const ativo = !(ativoRaw === false || String(ativoRaw) === 'false' || String(ativoRaw) === '0');
  return { id: r[0], nome: r[1], email: r[2], perfil: r[4] || 'EQUIPE', equipeVinculada: r[5] || '', ativo };
}

/**
 * Regra de negócio do saldo:
 *  - Entrada "Particular" soma ao saldo Particular; Entrada "Energisa" soma ao saldo Energisa.
 *  - Saída "Particular" subtrai do saldo Particular; Saída "Energisa" subtrai do saldo Energisa.
 *  - Saída "Misto" (obra Energisa complementada com material Particular) subtrai do Particular,
 *    pois foi de lá que o material fisicamente saiu.
 */
function computeInventory_() {
  const materiais = readRows_('Materiais').map(mapMaterial_);
  const entradas = readRows_('Entradas').map(mapEntrada_);
  const saidas = readRows_('Saidas').map(mapSaida_);

  const saldoParticular = new Map();
  const saldoEnergisa = new Map();
  const add = (map, id, qty) => map.set(id, (map.get(id) || 0) + qty);

  entradas.forEach((e) => add(e.tipoEstoque === 'Energisa' ? saldoEnergisa : saldoParticular, e.materialId, e.quantidade));
  saidas.forEach((s) => add(s.tipoEstoque === 'Energisa' ? saldoEnergisa : saldoParticular, s.materialId, -s.quantidade));

  const estoque = materiais.map((m) => {
    const particular = saldoParticular.get(m.id) || 0;
    const energisa = saldoEnergisa.get(m.id) || 0;
    const total = particular + energisa;
    return {
      materialId: m.id, descricao: m.descricao, unidade: m.unidade, categoria: m.categoria,
      estoqueMinimo: m.estoqueMinimo, particular, energisa, total, abaixoDoMinimo: total < m.estoqueMinimo,
    };
  });

  return { estoque, entradas, saidas, materiais };
}

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function computeStats_() {
  const { estoque, entradas, saidas, materiais } = computeInventory_();
  const obras = readRows_('Obras').map(mapObra_);
  const aplicacoes = readRows_('Aplicacoes').map(mapAplicacao_);

  const particularTotal = estoque.reduce((acc, m) => acc + m.particular, 0);
  const energisaTotal = estoque.reduce((acc, m) => acc + m.energisa, 0);
  const obrasAndamento = obras.filter((o) => o.status === 'Em andamento').length;
  const materiaisAbaixoMinimo = estoque.filter((m) => m.abaixoDoMinimo);

  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, mes: MESES_PT[d.getMonth()], entradas: 0, saidas: 0 });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  entradas.forEach((e) => {
    const d = new Date(`${e.data}T00:00:00`);
    const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.entradas += e.quantidade;
  });
  saidas.forEach((s) => {
    const d = new Date(`${s.data}T00:00:00`);
    const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.saidas += s.quantidade;
  });

  const catMap = new Map();
  estoque.forEach((m) => catMap.set(m.categoria || 'Outros', (catMap.get(m.categoria || 'Outros') || 0) + m.total));
  const estoquePorCategoria = Array.from(catMap.entries()).map(([categoria, quantidade]) => ({ categoria, quantidade }));

  const nomeMaterial = new Map(materiais.map((m) => [m.id, m.descricao]));
  const atividade = [
    ...entradas.map((e) => ({ tipo: 'entrada', data: e.data, descricaoMaterial: nomeMaterial.get(e.materialId) || e.materialId, quantidade: e.quantidade, responsavel: e.recebidoPor, detalhe: `Entrada (${e.tipoEstoque}) — ${e.fornecedor}` })),
    ...saidas.map((s) => ({ tipo: 'saida', data: s.data, descricaoMaterial: nomeMaterial.get(s.materialId) || s.materialId, quantidade: s.quantidade, responsavel: s.retiradoPor, detalhe: `Saída (${s.tipoEstoque}) — equipe ${s.equipeResponsavel}` })),
    ...aplicacoes.map((a) => ({ tipo: 'aplicacao', data: a.data, descricaoMaterial: nomeMaterial.get(a.materialId) || a.materialId, quantidade: a.quantidadeAplicada, responsavel: a.responsavel, detalhe: `Aplicação em campo — ${a.localizacao}` })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 10);

  return {
    particularTotal, energisaTotal, obrasAndamento, alertasEstoque: materiaisAbaixoMinimo.length,
    materiaisAbaixoMinimo,
    movimentacaoMensal: buckets.map(({ mes, entradas, saidas }) => ({ mes, entradas, saidas })),
    estoquePorCategoria,
    atividadeRecente: atividade,
  };
}
