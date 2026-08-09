export type Role = 'ADMIN' | 'EQUIPE';
export type TipoEstoque = 'Particular' | 'Energisa';
export type TipoSaida = 'Particular' | 'Energisa' | 'Misto';
export type StatusObra = 'Em andamento' | 'Concluída';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  perfil: Role;
  equipeVinculada?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Role;
  equipeVinculada?: string;
  ativo: boolean;
}

export interface Material {
  id: string;
  descricao: string;
  unidade: string;
  categoria: string;
  estoqueMinimo: number;
  observacoes?: string;
}

export interface Obra {
  id: string;
  nome: string;
  contratante: string;
  dataInicio: string;
  status: StatusObra;
  tipo: string;
  observacoes?: string;
}

export interface Entrada {
  id: string;
  data: string;
  tipoEstoque: TipoEstoque;
  obraId?: string;
  materialId: string;
  quantidade: number;
  fornecedor: string;
  notaFiscal: string;
  recebidoPor: string;
  observacoes?: string;
}

export interface Saida {
  id: string;
  data: string;
  tipoEstoque: TipoSaida;
  obraId: string;
  materialId: string;
  quantidade: number;
  origemComplemento?: string;
  equipeResponsavel: string;
  retiradoPor: string;
  observacoes?: string;
}

export interface AplicacaoCampo {
  id: string;
  data: string;
  obraId: string;
  materialId: string;
  quantidadeAplicada: number;
  quantidadeSobra: number;
  equipe: string;
  localizacao: string;
  responsavel: string;
  observacoes?: string;
}

export interface EstoqueMaterial {
  materialId: string;
  descricao: string;
  unidade: string;
  categoria: string;
  estoqueMinimo: number;
  particular: number;
  energisa: number;
  total: number;
  abaixoDoMinimo: boolean;
}

export interface DashboardStats {
  particularTotal: number;
  energisaTotal: number;
  obrasAndamento: number;
  alertasEstoque: number;
  materiaisAbaixoMinimo: EstoqueMaterial[];
  movimentacaoMensal: { mes: string; entradas: number; saidas: number }[];
  estoquePorCategoria: { categoria: string; quantidade: number }[];
  atividadeRecente: AtividadeRecente[];
}

export interface AtividadeRecente {
  tipo: 'entrada' | 'saida' | 'aplicacao';
  data: string;
  descricaoMaterial: string;
  quantidade: number;
  responsavel: string;
  detalhe: string;
}

export interface SetupStatus {
  configurado: boolean;
  abasExistentes: string[];
  abasFaltando: string[];
}
