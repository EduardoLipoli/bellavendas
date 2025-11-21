import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPhoneAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const FornecedorCard = ({ fornecedor, onEdit, onDelete }) => {
    const statusClass = fornecedor.status === 'Ativo' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800';

    return (
        <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 transition-transform duration-300 hover:shadow-md hover:-translate-y-1">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{fornecedor.nome}</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{fornecedor.categoria || 'Sem categoria'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                        {fornecedor.status}
                    </span>
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-600 pt-4 mt-4">
                    <p className="text-sm mb-2 flex items-center">
                        <FontAwesomeIcon icon={faPhoneAlt} className="mr-2 text-gray-400 w-4" /> 
                        {fornecedor.telefone}
                    </p>
                    <p className="text-sm flex items-center truncate">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400 w-4" /> 
                        {fornecedor.email}
                    </p>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <div className="flex space-x-3">
                    <button 
                        onClick={onEdit} 
                        className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors"
                    >
                        <FontAwesomeIcon icon={faEdit} className="text-sm" />
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                    >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FornecedorCard;