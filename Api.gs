/**
 * Api.gs — cada função aqui é chamada diretamente do navegador via
 * google.script.run.nomeDaFuncao(...). O primeiro argumento é sempre o
 * token de sessão (exceto no login).
 */

// ── Autenticação ───────────────────────────────────────────────────────
function apiLogin(email, password) {
  email = String(email || '').trim().toLowerCase();
  const props = PropertiesService.getScriptProperties();
  const bootstrapEmail = (props.getProperty('ADMIN_EMAIL') || '').toLowerCase();
  const bootstrapPassword = props.getProperty('ADMIN_PASSWORD');

  if (bootstrapEmail && email === bootstrapEmail && password === bootstrapPassword) {
    const user = { id: 'admin-bootstrap', nome: 'Administrador', email, perfil: 'ADMIN', equipeVinculada: '' };
    return { token: createSession_(user), user };
  }

  const rows = readRows_('Usuarios');
  for (const r of rows) {
    if (String(r[2]).toLowerCase() === email) {
      const mapped = mapUsuario_(r);
      if (!mapped.ativo) break;
      if (verifyPassword_(password, r[3])) {
        const user = { id: mapped.id, nome: mapped.nome, email, perfil: mapped.perfil, equipeVinculada: mapped.equipeVinculada };
        return { token: createSession_(user), user };
      }
      break;
    }
  }
  throw new Error('Credenciais inválidas.');
}

function apiLogout(token) {
  if (token) CacheService.getScriptCache().remove(`session_${token}`);
  return { ok: true };
}

function apiMe(token) {
  const user = getSessionUser_(token);
  if (!user) throw new Error('Não autenticado.');
  return { user };
}

// ── Configuração da planilha ──────────────────────────────────────────
function apiGetSetupStatus(token) {
  requireAdmin_(token);
  const { existentes, faltando } = getSheetStatus_();
  return { configurado: faltando.length === 0, abasExistentes: existentes, abasFaltando: faltando };
}

function apiProvisionSheets(token) {
  requireAdmin_(token);
  const criadas = provisionSheets_();
  const { existentes, faltando } = getSheetStatus_();
  return { criadas, configurado: faltando.length === 0, abasExistentes: existentes, abasFaltando: faltando };
}

// ── Materiais ──────────────────────────────────────────────────────────
function apiGetMaterials(token) {
  requireAuth_(token);
  return readRows_('Materiais').map(mapMaterial_);
}

function apiCreateMaterial(token, data) {
  requireAdmin_(token);
  if (!data.descricao || !data.unidade || !data.categoria) throw new Error('Preencha descrição, unidade e categoria.');
  const id = `MAT-${Date.now()}`;
  appendRow_('Materiais', [id, data.descricao, data.unidade, data.categoria, Number(data.estoqueMinimo) || 0, data.observacoes || '']);
  return { message: 'Material cadastrado com sucesso.', id };
}

function apiUpdateMaterial(token, id, data) {
  requireAdmin_(token);
  const ok = updateRowById_('Materiais', id, [id, data.descricao, data.unidade, data.categoria, Number(data.estoqueMinimo) || 0, data.observacoes || '']);
  if (!ok) throw new Error('Material não encontrado.');
  return { message: 'Material atualizado com sucesso.' };
}

// ── Obras ──────────────────────────────────────────────────────────────
function apiGetWorks(token) {
  requireAuth_(token);
  return readRows_('Obras').map(mapObra_);
}

function apiCreateWork(token, data) {
  requireAdmin_(token);
  if (!data.nome || !data.contratante || !data.dataInicio || !data.tipo) throw new Error('Preencha nome, contratante, data de início e tipo.');
  const id = `OBR-${Date.now()}`;
  appendRow_('Obras', [id, data.nome, data.contratante, data.dataInicio, data.status || 'Em andamento', data.tipo, data.observacoes || '']);
  return { message: 'Obra cadastrada com sucesso.', id };
}

function apiUpdateWork(token, id, data) {
  requireAdmin_(token);
  const ok = updateRowById_('Obras', id, [id, data.nome, data.contratante, data.dataInicio, data.status, data.tipo, data.observacoes || '']);
  if (!ok) throw new Error('Obra não encontrada.');
  return { message: 'Obra atualizada com sucesso.' };
}

// ── Entradas (somente admin registra) ────────────────────────────────
function apiGetEntries(token) {
  requireAuth_(token);
  return readRows_('Entradas').map(mapEntrada_).sort((a, b) => (a.data < b.data ? 1 : -1));
}

function apiCreateEntry(token, data) {
  const user = requireAdmin_(token);
  if (!data.data || !data.tipoEstoque || !data.materialId || !data.quantidade || !data.fornecedor) {
    throw new Error('Preencha data, tipo de estoque, material, quantidade e fornecedor.');
  }
  const id = `ENT-${Date.now()}`;
  appendRow_('Entradas', [id, data.data, data.tipoEstoque, data.obraId || '', data.materialId, Number(data.quantidade), data.fornecedor, data.notaFiscal || '', user.nome, data.observacoes || '']);
  return { message: 'Entrada registrada com sucesso.', id };
}

// ── Saídas (admin e equipe) ────────────────────────────────────────────
function apiGetOutputs(token) {
  requireAuth_(token);
  return readRows_('Saidas').map(mapSaida_).sort((a, b) => (a.data < b.data ? 1 : -1));
}

function apiCreateOutput(token, data) {
  const user = requireAuth_(token);
  if (!data.data || !data.tipoEstoque || !data.obraId || !data.materialId || !data.quantidade || !data.equipeResponsavel) {
    throw new Error('Preencha data, tipo de estoque, obra, material, quantidade e equipe responsável.');
  }
  const id = `SAI-${Date.now()}`;
  appendRow_('Saidas', [id, data.data, data.tipoEstoque, data.obraId, data.materialId, Number(data.quantidade), data.origemComplemento || '', data.equipeResponsavel, user.nome, data.observacoes || '']);
  return { message: 'Saída registrada com sucesso.', id };
}

// ── Aplicações em campo ─────────────────────────────────────────────────
function apiGetFieldApplications(token) {
  requireAuth_(token);
  return readRows_('Aplicacoes').map(mapAplicacao_).sort((a, b) => (a.data < b.data ? 1 : -1));
}

function apiCreateFieldApplication(token, data) {
  const user = requireAuth_(token);
  if (!data.data || !data.obraId || !data.materialId || data.quantidadeAplicada === undefined || !data.equipe || !data.localizacao) {
    throw new Error('Preencha todos os campos obrigatórios da aplicação em campo.');
  }
  const id = `APP-${Date.now()}`;
  appendRow_('Aplicacoes', [id, data.data, data.obraId, data.materialId, Number(data.quantidadeAplicada), Number(data.quantidadeSobra) || 0, data.equipe, data.localizacao, user.nome, data.observacoes || '']);
  return { message: 'Aplicação em campo registrada com sucesso.', id };
}

// ── Estoque calculado e estatísticas ────────────────────────────────────
function apiGetInventory(token) {
  requireAuth_(token);
  return computeInventory_().estoque.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));
}

function apiGetStats(token) {
  requireAuth_(token);
  return computeStats_();
}

// ── Usuários (admin) ─────────────────────────────────────────────────────
function apiGetUsers(token) {
  requireAdmin_(token);
  return readRows_('Usuarios').map(mapUsuario_);
}

function apiCreateUser(token, data) {
  requireAdmin_(token);
  if (!data.nome || !data.email || !data.senha || !data.perfil) throw new Error('Preencha nome, e-mail, senha e perfil.');
  if (String(data.senha).length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
  const email = String(data.email).toLowerCase();
  const existentes = readRows_('Usuarios').map(mapUsuario_);
  if (existentes.some((u) => u.email.toLowerCase() === email)) throw new Error('Já existe um usuário com este e-mail.');
  const id = `USR-${Date.now()}`;
  appendRow_('Usuarios', [id, data.nome, email, makePasswordHash_(data.senha), data.perfil, data.equipeVinculada || '', 'true']);
  return { message: 'Usuário cadastrado com sucesso.', id };
}

function apiToggleUser(token, id, ativo) {
  requireAdmin_(token);
  const rows = readRows_('Usuarios');
  const row = rows.find((r) => String(r[0]) === String(id));
  if (!row) throw new Error('Usuário não encontrado.');
  updateRowById_('Usuarios', id, [row[0], row[1], row[2], row[3], row[4], row[5], String(ativo)]);
  return { message: 'Usuário atualizado com sucesso.' };
}
