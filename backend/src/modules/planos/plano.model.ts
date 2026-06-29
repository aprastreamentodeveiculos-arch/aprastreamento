import { Schema, model, Document } from 'mongoose';

export interface IFaixaPreco {
  de: number;      // Quantidade mínima de veículos
  ate?: number;    // Quantidade máxima (opcional para a última faixa)
  valor: number;   // Valor unitário do veículo nessa faixa
}

export interface IPlano extends Document {
  nome: string;
  tipoCobranca: 'POR_VEICULO' | 'FIXO_GLOBAL' | 'ESCALONADO_FROTA';
  periodicidade: 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  valorBase: number; // Usado se tipo for POR_VEICULO ou FIXO_GLOBAL
  faixasPreco: IFaixaPreco[]; // Usado se tipo for ESCALONADO_FROTA
  fidelidadeMeses: number; // 0 se não houver fidelidade
  descontoFidelidadePct: number; // Desconto em % se fidelizado
  descricao?: string;
  ativo: boolean;
}

const FaixaPrecoSchema = new Schema<IFaixaPreco>({
  de: { type: Number, required: true, min: 1 },
  ate: { type: Number },
  valor: { type: Number, required: true, min: 0 }
}, { _id: false });

const PlanoSchema = new Schema<IPlano>({
  nome: { type: String, required: true, unique: true, trim: true },
  tipoCobranca: { type: String, required: true, enum: ['POR_VEICULO', 'FIXO_GLOBAL', 'ESCALONADO_FROTA'] },
  periodicidade: { type: String, required: true, enum: ['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'], default: 'MENSAL' },
  valorBase: { type: Number, default: 0, min: 0 },
  faixasPreco: { type: [FaixaPrecoSchema], default: [] },
  fidelidadeMeses: { type: Number, default: 0, min: 0 },
  descontoFidelidadePct: { type: Number, default: 0, min: 0, max: 100 },
  descricao: { type: String, trim: true },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

export const Plano = model<IPlano>('Plano', PlanoSchema);
