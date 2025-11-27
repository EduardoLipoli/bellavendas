import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faReceipt, faUser, faCalendarAlt, 
    faBoxOpen, faTag, faGift, faCreditCard, 
    faPercentage, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';

const ModalComprovante = ({ isOpen, onClose, venda }) => {
    if (!isOpen || !venda) return null;

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    
    const formatarData = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleString('pt-BR');
    };

    // LÓGICA: Se existir array de pagamentos, usa ele. Se não, cria um falso baseado no resumo antigo.
    const pagamentosReais = (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0)
        ? venda.pagamentos
        : [{ 
            metodo: venda.formaPagamento || 'Pagamento', 
            valor: venda.total,
            parcelas: venda.parcelas || 1,
            isResumo: true 
          }];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Cabeçalho */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                <FontAwesomeIcon icon={faReceipt} className="text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Comprovante</h2>
                                <p className="text-purple-100 text-xs flex items-center gap-1 mt-1 opacity-80">
                                    <FontAwesomeIcon icon={faTag} className="text-[10px]" />
                                    #{venda.id ? venda.id.substring(0, 8).toUpperCase() : 'NOVO'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-all">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
                
                {/* Corpo Rolável */}
                <div className="p-6 overflow-y-auto custom-scrollbar text-gray-800">
                    
                    {/* Cliente e Data */}
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-50 p-2.5 rounded-full text-purple-600">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Cliente</p>
                                <p className="font-bold text-gray-800">{venda.cliente?.nome || 'Consumidor Final'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide flex items-center justify-end gap-1">
                                <FontAwesomeIcon icon={faCalendarAlt} /> Data
                            </p>
                            <p className="font-medium text-gray-700 text-sm">{formatarData(venda.data)}</p>
                        </div>
                    </div>

                    {/* Lista de Itens */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faBoxOpen} className="text-purple-500"/>
                            Resumo do Pedido
                        </h3>
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="divide-y divide-gray-50 bg-gray-50/30">
                                {venda.itens?.map((item, index) => {
                                    // Verifica se é brinde (Preço 0 ou flag isBrinde)
                                    const isFree = item.precoUnitario === 0 || item.isBrinde === true;

                                    return (
                                        <div key={index} className={`flex items-center p-3 hover:bg-white transition-colors ${isFree ? 'bg-purple-50/50' : ''}`}>
                                            <div className="relative flex-shrink-0 mr-3">
                                                {item.imageUrl ? (
                                                     <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                                        <FontAwesomeIcon icon={faBoxOpen} />
                                                    </div>
                                                )}
                                                <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                                    {item.quantidade}
                                                </span>
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-sm text-gray-800 truncate">{item.nome}</p>
                                                {isFree ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded mt-0.5">
                                                        <FontAwesomeIcon icon={faGift} /> MIMO / BRINDE
                                                    </span>
                                                ) : (
                                                    <p className="text-xs text-gray-500">{formatCurrency(item.precoUnitario)} un.</p>
                                                )}
                                            </div>

                                            <div className="text-right pl-2">
                                                {isFree ? (
                                                    <span className="text-purple-600 font-bold text-sm">GRÁTIS</span>
                                                ) : (
                                                    <span className="font-bold text-gray-800 text-sm">{formatCurrency(item.quantidade * item.precoUnitario)}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="space-y-2 mb-6 border-t border-gray-100 pt-4">
                        {venda.custoBrindes > 0 && (
                            <div className="flex justify-between text-xs text-purple-400 mb-2 italic">
                                <span>Mimos incluídos (valor cortesia)</span>
                                <span>{formatCurrency(venda.custoBrindes)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(venda.subtotal || venda.total)}</span>
                        </div>

                        {(venda.descontoValor > 0 || venda.descontoPercentual > 0) && (
                            <div className="flex justify-between text-sm text-red-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faPercentage} className="text-xs"/> Desconto
                                    {venda.descontoPercentual > 0 && <span className="text-xs bg-red-50 px-1 rounded">({venda.descontoPercentual}%)</span>}
                                </span>
                                <span>- {formatCurrency(venda.descontoValor)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200 mt-2">
                            <span className="font-bold text-gray-700">TOTAL PAGO</span>
                            <span className="font-bold text-xl text-green-700">{formatCurrency(venda.total)}</span>
                        </div>
                    </div>

                    {/* Detalhamento do Pagamento */}
                    <div className="mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCreditCard} />
                            Formas de Pagamento
                        </h3>
                        <div className="space-y-2">
                            {pagamentosReais.map((pag, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-3 rounded-lg border border-gray-100 bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="text-blue-500 w-5 flex justify-center">
                                            {pag.metodo === 'Pix' ? '💠' : <FontAwesomeIcon icon={pag.metodo.includes('Dinheiro') ? faMoneyBillWave : faCreditCard} />}
                                        </div>
                                        <p className="font-semibold text-gray-700">
                                            {pag.metodo} {pag.parcelas > 1 ? `(${pag.parcelas}x)` : ''}
                                        </p>
                                    </div>
                                    <span className="font-bold text-gray-800">{formatCurrency(pag.valor)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Rodapé */}
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100 text-xs text-gray-400 flex-shrink-0">
                    <p>Obrigado pela preferência!</p>
                </div>
            </div>
        </div>
    );
};

export default ModalComprovante;