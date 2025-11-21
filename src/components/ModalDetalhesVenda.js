import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCheck, 
  faClock, 
  faCheckCircle,
  faCalendarAlt,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { updateParcelaStatus } from '../services/firestoreService';
import toast from 'react-hot-toast';

const ModalDetalhesVenda = ({ isOpen, onClose, venda, onUpdate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !venda) return null;

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(value);
    };
    
    const formatarData = (data, options = {}) => {
        if (!data) return 'N/A';
        const dateObj = data.seconds ? new Date(data.seconds * 1000) : data;
        return dateObj.toLocaleDateString('pt-BR', options);
    };

    const handleToggleStatusParcela = async (numeroParcela, statusAtual) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
        
        try {
            await updateParcelaStatus(venda.id, numeroParcela, novoStatus);
            toast.success(`Parcela ${numeroParcela} marcada como ${novoStatus}!`);
            onUpdate();
        } catch (error) {
            toast.error("Erro ao atualizar status da parcela.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calcula totais
    const totalVenda = venda.parcelasDetalhes?.reduce((sum, p) => sum + p.valor, 0) || 0;
    const totalPago = venda.parcelasDetalhes?.reduce((sum, p) => 
        p.status === 'Pago' ? sum + p.valor : sum, 0) || 0;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 bg-purple-400 text-white">
                    <div>
                        <h2 className="text-xl font-bold">Detalhes da Venda</h2>
                        <p className="text-purple-100 text-sm flex items-center mt-1">
                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                            {venda.cliente?.nome || 'Cliente não informado'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Fechar modal"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                {/* Resumo Financeiro */}
                <div className="grid grid-cols-2 gap-4 p-5 border-b">
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Total da Venda</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(totalVenda)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Total Pago</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(totalPago)}</p>
                    </div>
                </div>
                
                {/* Lista de Parcelas */}
                <div className="max-h-[60vh] overflow-y-auto p-5">
                    <div className="space-y-4">
                        {venda.parcelasDetalhes?.map(p => (
                            <div 
                                key={p.numeroParcela} 
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                    p.status === 'Pago' 
                                        ? 'border-green-200 bg-green-50' 
                                        : 'border-amber-200 bg-amber-50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-baseline">
                                            <span className="font-bold text-gray-900">Parcela {p.numeroParcela}</span>
                                            <span className="ml-2 font-medium text-gray-600">{formatCurrency(p.valor)}</span>
                                        </div>
                                        
                                        <div className="flex items-center text-sm text-gray-500 mt-2">
                                            <FontAwesomeIcon 
                                                icon={faCalendarAlt} 
                                                className="mr-2 text-purple-400" 
                                            />
                                            <span>Vencimento: {formatarData(p.dataVencimento, { 
                                                day: '2-digit', 
                                                month: 'long', 
                                                year: 'numeric' 
                                            })}</span>
                                        </div>
                                        
                                        {p.status === 'Pago' && p.dataPagamento && (
                                            <div className="flex items-center text-sm mt-2">
                                                <FontAwesomeIcon 
                                                    icon={faCheckCircle} 
                                                    className="mr-2 text-green-500" 
                                                />
                                                <span className="text-green-700">
                                                    Pago em: {formatarData(p.dataPagamento)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => handleToggleStatusParcela(p.numeroParcela, p.status)}
                                        disabled={isSubmitting}
                                        className={`min-w-[100px] px-4 py-2 text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-all ${
                                            p.status === 'Pago'
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-amber-500 text-white hover:bg-amber-600'
                                        } ${
                                            isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <svg 
                                                className="animate-spin h-4 w-4 text-current" 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                fill="none" 
                                                viewBox="0 0 24 24"
                                            >
                                                <circle 
                                                    className="opacity-25" 
                                                    cx="12" 
                                                    cy="12" 
                                                    r="10" 
                                                    stroke="currentColor" 
                                                    strokeWidth="4"
                                                ></circle>
                                                <path 
                                                    className="opacity-75" 
                                                    fill="currentColor" 
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        ) : (
                                            <FontAwesomeIcon 
                                                icon={p.status === 'Pago' ? faCheck : faClock} 
                                            />
                                        )}
                                        {p.status}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-500">
                    {venda.parcelasDetalhes?.length} parcelas no total
                </div>
            </div>
        </div>
    );
};

export default ModalDetalhesVenda;