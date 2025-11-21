import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

// Define o mapeamento de status para cores
const statusStyles = {
    'Disponível': 'bg-success text-white',
    'Estoque baixo': 'bg-warning text-white',
    'Fora de estoque': 'bg-danger text-white'
};

const ProductCard = ({ produto, onEdit, onDelete }) => {
    // Determina o status com base no estoque
    let status = 'Disponível';
    if (produto.estoque === 0) {
        status = 'Fora de estoque';
    } else if (produto.estoque < 5) {
        status = 'Estoque baixo';
    }

    const statusClassName = statusStyles[status] || 'bg-gray-400 text-white';
    
    return (
        <div className="product-card bg-white rounded-lg p-4 shadow-sm border border-light flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg">{produto.nome}</h4>
                    <span className={`status-badge ${statusClassName}`}>{status}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">Código: {produto.codigo}</p>
                <p className="font-bold text-xl text-secondary mt-1">R$ {parseFloat(produto.preco).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mt-4 border-t pt-3">
                <p className="text-sm">Estoque: <span className="font-medium">{produto.estoque}</span></p>
                <div className="flex space-x-3">
                    <button onClick={onEdit} className="text-secondary hover:text-secondary-dark text-lg">
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button onClick={onDelete} className="text-danger hover:text-danger-dark text-lg">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;