// Arquivo: components/ModalComprovante.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faReceipt, faUser, faCalendarAlt, faBoxOpen, faTag } from '@fortawesome/free-solid-svg-icons';

const ModalComprovante = ({ isOpen, onClose, venda }) => {
    if (!isOpen || !venda) return null;

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const formatarData = (timestamp) => {
        if (!timestamp?.seconds) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleString('pt-BR');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
                {/* Cabeçalho com gradiente */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-5 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-xl">
                                <FontAwesomeIcon icon={faReceipt} className="text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Comprovante de Compra</h2>
                                <p className="text-purple-100 text-sm flex items-center gap-1 mt-1">
                                    <FontAwesomeIcon icon={faTag} className="text-xs" />
                                    #{venda.id.substring(0, 8)}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
                
                {/* Corpo do comprovante */}
                <div className="p-6 text-gray-800">
                    {/* Informações do cliente */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <FontAwesomeIcon icon={faUser} size="lg" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="font-bold text-lg text-gray-800">{venda.cliente?.nome}</p>
                        </div>
                    </div>

                    {/* Grid de informações */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data da Venda
                            </p>
                            <p className="font-semibold text-gray-800">{formatarData(venda.data)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Forma de Pagamento</p>
                            <p className="font-semibold text-gray-800">{venda.formaPagamento || 'Não informado'}</p>
                        </div>
                    </div>

                    {/* Lista de itens */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3">
                            <h2 className="text-xl font-bold gap-2 flex items-center text-gray-700">

                                <FontAwesomeIcon icon={faBoxOpen} />
                                Itens Comprados
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                            {venda.itens?.map((item, index) => (
                                <div key={item.produtoId || item.id || item.nome || index} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                                    <div className="relative">
                                        <img 
                                            src={item.imageUrl || 'https://placehold.co/150'} 
                                            alt={item.nome}
                                            className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-sm"
                                        />
                                        <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {item.quantidade}
                                        </span>
                                    </div>
                                    <div className="ml-4 flex-grow">
                                        <p className="font-semibold text-gray-800">{item.nome}</p>
                                        <p className="text-sm text-gray-500">{formatCurrency(item.precoUnitario)}/un</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">{formatCurrency(item.quantidade * item.precoUnitario)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-50 rounded-xl border border-purple-100">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">VALOR TOTAL</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-purple-700">{formatCurrency(venda.total)}</p>
                        </div>
                    </div>

                    {/* Rodapé */}
                    <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                        <p>Obrigado pela sua compra!</p>
                        <p className="mt-1">Em caso de dúvidas, entre em contato com nosso suporte.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalComprovante;