import React from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faBoxOpen, faTag, faBuilding, faBarcode, faKey, 
    faRulerCombined, faDollarSign, faShieldAlt, faInfoCircle, faPercentage, faLink 
} from '@fortawesome/free-solid-svg-icons';

const customStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: '600px', padding: '0',
        borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
    }
};

const DetailItem = ({ icon, label, value, colorClass = "text-gray-800" }) => (
    <div className="flex items-start py-3">
        <FontAwesomeIcon icon={icon} className="text-gray-400 mt-1 mr-4 w-5 text-center" />
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`font-semibold text-md ${colorClass}`}>{value || 'Não informado'}</p>
        </div>
    </div>
);

const ModalDetalhesProduto = ({ isOpen, onClose, produto, onEdit }) => {
    if (!produto) return null;

    const custoTotal = (produto.custo || 0) + (produto.gastosAdicionais || 0);
    const lucroBruto = (produto.preco || 0) - custoTotal;
    const markup = produto.custo > 0 ? (lucroBruto / produto.custo) * 100 : 0;

    const statusInfo = {
        ativo: { text: 'Ativo', color: 'text-green-600' },
        inativo: { text: 'Inativo', color: 'text-yellow-600' },
        esgotado: { text: 'Esgotado', color: 'text-red-600' },
    }[produto.status] || { text: 'Desconhecido', color: 'text-gray-600' };

    return (
        <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
            <div className="flex flex-col">
                {/* Cabeçalho com Imagem e Título */}
                <div className="flex items-center p-6 bg-gray-50 border-b">
                    <img 
                        src={produto.imageUrl || 'https://placehold.co/150x150'} 
                        alt={produto.nome} 
                        className="w-20 h-20 object-cover rounded-lg mr-4 border"
                    />
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-gray-800">{produto.nome}</h2>
                        <p className="text-gray-500">{produto.categoria}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>
                
                {/* Corpo com Detalhes */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                    {produto.descricao && (
                        <div className="mb-6">
                             <h4 className="font-bold text-gray-600 mb-2">Descrição</h4>
                             <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{produto.descricao}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <DetailItem icon={faKey} label="Código Interno (SKU)" value={produto.codigo} />
                        <DetailItem icon={faBarcode} label="Código de Barras" value={produto.codigoDeBarras} />
                        <DetailItem icon={faBuilding} label="Fornecedor" value={produto.fornecedorNome} />
                        <DetailItem icon={faTag} label="Categoria" value={produto.categoria} />
                        <DetailItem icon={faRulerCombined} label="Unidade de Medida" value={produto.unidadeMedida} />
                        <DetailItem icon={faShieldAlt} label="Status" value={statusInfo.text} colorClass={statusInfo.color} />
                        
                        {/* Valores */}
                        <div className="md:col-span-2 my-2 border-t"></div>
                        <DetailItem icon={faDollarSign} label="Custo Total (Compra + Gastos)" value={custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        <DetailItem icon={faDollarSign} label="Preço de Venda" value={(produto.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="text-green-600" />
                        <DetailItem icon={faDollarSign} label="Lucro Bruto" value={lucroBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        <DetailItem icon={faPercentage} label="Markup" value={`${markup.toFixed(1)}%`} />

                        {/* Estoque */}
                        <div className="md:col-span-2 my-2 border-t"></div>
                        <DetailItem icon={faBoxOpen} label="Estoque Atual" value={`${produto.estoque} Unidades`} />
                        <DetailItem icon={faInfoCircle} label="Estoque Mínimo" value={`${produto.estoqueMinimo} Unidades`} />

                        {produto.url && (
                          <>
                            <div className="md:col-span-2 my-2 border-t"></div>
                            <div className="md:col-span-2 flex items-start py-3">
                                <FontAwesomeIcon icon={faLink} className="text-gray-400 mt-1 mr-4 w-5 text-center" />
                                <div>
                                    <p className="text-sm text-gray-500">URL do Produto</p>
                                    <a 
                                        href={produto.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="font-semibold text-md text-blue-600 hover:underline break-all"
                                    >
                                        {produto.url}
                                    </a>
                                </div>
                            </div>
                          </>
                        )}
                    </div>
                </div>

                {/* Rodapé com Botões */}
                <div className="flex justify-end gap-4 p-4 bg-gray-50 border-t">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Fechar</button>
                    <button onClick={() => onEdit(produto)} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Editar Produto</button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalDetalhesProduto;