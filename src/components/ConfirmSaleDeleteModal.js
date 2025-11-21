import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '90%', // Usa porcentagem para ser responsivo
        maxWidth: '500px', // Define uma largura máxima
        padding: '0', // Removemos o padding daqui para controlar via Tailwind
        borderRadius: '12px', // Bordas mais arredondadas
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: 'none'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)', // Efeito de desfoque no fundo
        zIndex: 1000,
    }
};
Modal.setAppElement('#root');

const ConfirmSaleDeleteModal = ({ isOpen, onRequestClose, onConfirm, isSubmitting, venda }) => {
  const [password, setPassword] = useState('');
  // REMOVIDO: const [returnToStock, setReturnToStock] = useState(true);
  const [reason, setReason] = useState(''); // Mantido para o log

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Apenas a senha e o motivo são necessários agora
    onConfirm({ password, reason });
  };

    if (!isOpen) return null;

return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
        {/* Botão para Fechar o Modal */}
        <button 
            onClick={onRequestClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            title="Fechar"
        >
            <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl mr-3" />
            <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
        </div>
        
        {/* Mensagem de Confirmação */}
        <p className="text-gray-600 mb-6 leading-relaxed">
            A venda <strong>#{venda?.id?.substring(0, 8)}</strong> já foi cancelada. Esta ação irá <strong>excluí-la permanentemente</strong> do sistema e não poderá ser desfeita.
        </p>

        {/* Formulário */}
        <div className="space-y-4">
            <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Exclusão (Opcional)
                </label>
                <input 
                    type="text" 
                    id="reason"
                    value={reason} 
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ex: Limpeza de registros antigos"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Sua Senha para Confirmar
                </label>
                <input 
                    type="password"
                    id="password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-400"
                />
            </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
            <button 
                onClick={onRequestClose} 
                className="py-2 px-5 border rounded-lg hover:bg-gray-100 transition-colors"
            >
                Voltar
            </button>
            <button 
                onClick={handleConfirm} 
                disabled={isSubmitting || !password}
                className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Excluindo...' : 'Excluir Permanentemente'}
            </button>
        </div>
      </div>
    </Modal>
);
};

export default ConfirmSaleDeleteModal;