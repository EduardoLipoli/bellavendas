import React from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faPen, faBoxOpen, faTag, faBarcode, 
  faIndustry, faRuler, faShieldAlt, faDollarSign, 
  faChartLine, faInfoCircle, faCreditCard
} from '@fortawesome/free-solid-svg-icons';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxWidth: '95%',
    padding: '0',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 1000,
  }
};

Modal.setAppElement('#root');

const ModalDetalhesProduto = ({ isOpen, onClose, produto, onEdit }) => {
  if (!produto) return null;

  // --- LÓGICA DE CÁLCULO ATUALIZADA ---
  const preco = parseFloat(produto.preco) || 0;
  const custo = parseFloat(produto.custo) || 0;
  const gastos = parseFloat(produto.gastosAdicionais) || 0;
  const taxaMaquininha = parseFloat(produto.taxaMaquininha) || 0; // Pegando a taxa salva

  // 1. Custo Total
  const custoTotal = custo + gastos;

  // 2. Quanto a maquininha vai "morder" do preço
  const valorDescontoMaquininha = preco * (taxaMaquininha / 100);

  // 3. Lucro Real (Preço - Taxa Maquininha - Custo Total)
  const lucroReal = preco - valorDescontoMaquininha - custoTotal;

  // 4. Markup Real (Baseado no lucro líquido)
  const markup = custoTotal > 0 ? (lucroReal / custoTotal) * 100 : 0;

  // Formatação de moeda
  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Detalhes do Produto"
    >
      {/* Cabeçalho */}
      <div className="relative p-6 border-b flex items-start gap-4 bg-gray-50">
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden border">
           {produto.imageUrl ? (
             <img src={produto.imageUrl} alt={produto.nome} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
               150 x 150
             </div>
           )}
        </div>
        
        <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 leading-tight">{produto.nome}</h2>
            <p className="text-gray-500">{produto.descricao || 'Sem descrição'}</p>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Grid de Informações Básicas */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faTag} className="text-gray-400 w-4"/> Código Interno (SKU)
                </span>
                <span className="font-semibold text-gray-700">{produto.codigo || '-'}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBarcode} className="text-gray-400 w-4"/> Código de Barras
                </span>
                <span className="font-semibold text-gray-700">{produto.codigoDeBarras || 'Não informado'}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faIndustry} className="text-gray-400 w-4"/> Fornecedor
                </span>
                <span className="font-semibold text-gray-700">{produto.fornecedorNome || '-'}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400 w-4"/> Categoria
                </span>
                <span className="font-semibold text-gray-700">{produto.categoria || '-'}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faRuler} className="text-gray-400 w-4"/> Unidade de Medida
                </span>
                <span className="font-semibold text-gray-700">{produto.unidadeMedida || 'un'}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-gray-400 w-4"/> Status
                </span>
                <span className={`font-semibold ${produto.status === 'ativo' ? 'text-green-600' : 'text-red-600'} capitalize`}>
                    {produto.status}
                </span>
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Seção Financeira Ajustada */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            {/* Custo */}
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide">
                    <FontAwesomeIcon icon={faDollarSign} className="text-gray-400 w-4"/> Custo Total (Compra + Gastos)
                </span>
                <span className="font-bold text-lg text-gray-700">
                    {formatMoney(custoTotal)}
                </span>
            </div>

            {/* Preço de Venda */}
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide">
                    <FontAwesomeIcon icon={faDollarSign} className="text-green-500 w-4"/> Preço de Venda
                </span>
                <span className="font-bold text-lg text-green-600">
                    {formatMoney(preco)}
                </span>
            </div>
            
            {/* NOVO: Taxa da Maquininha (Informativo) */}
            {taxaMaquininha > 0 && (
                <div className="col-span-2 bg-orange-50 p-2 rounded border border-orange-100 flex justify-between items-center text-sm">
                    <span className="text-orange-700 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCreditCard} /> 
                        Taxa Maquininha ({taxaMaquininha}%)
                    </span>
                    <span className="font-semibold text-orange-800">
                        - {formatMoney(valorDescontoMaquininha)}
                    </span>
                </div>
            )}

            {/* Lucro Real */}
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide">
                    <FontAwesomeIcon icon={faDollarSign} className="text-gray-400 w-4"/> Lucro Líquido Real
                </span>
                <span className={`font-bold text-lg ${lucroReal > 0 ? 'text-gray-800' : 'text-red-500'}`}>
                    {formatMoney(lucroReal)}
                </span>
            </div>

            {/* Markup */}
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide">
                    <FontAwesomeIcon icon={faChartLine} className="text-gray-400 w-4"/> Margem Real
                </span>
                <span className="font-bold text-lg text-gray-700">
                    {markup.toFixed(1)}%
                </span>
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Rodapé Estoque */}
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 text-xs flex items-center gap-2">
                    <FontAwesomeIcon icon={faBoxOpen} /> Estoque Atual
                </span>
                <span className="font-medium">{produto.estoque} Unidades</span>
            </div>
            <div className="flex flex-col">
                <span className="text-gray-500 mb-1 text-xs flex items-center gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} /> Estoque Mínimo
                </span>
                <span className="font-medium">{produto.estoqueMinimo} Unidades</span>
            </div>
        </div>

      </div>

      {/* Botões de Ação */}
      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
        <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
        >
            Fechar
        </button>
        <button 
            onClick={() => onEdit(produto)}
            className="px-4 py-2 bg-pink-300 text-white rounded-lg hover:bg-pink-400 font-medium transition-colors flex items-center gap-2"
        >
            <FontAwesomeIcon icon={faPen} /> Editar Produto
        </button>
      </div>
    </Modal>
  );
};

export default ModalDetalhesProduto;