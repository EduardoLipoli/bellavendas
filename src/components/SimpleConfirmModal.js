import React from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'; // Ícone mais genérico

// Estilos do modal (idênticos ao seu outro modal para consistência)
const customStyles = {
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '400px', padding: '2rem', borderRadius: '8px' },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1001 } // zIndex maior se necessário
};
Modal.setAppElement('#root');

const SimpleConfirmModal = ({ isOpen, onRequestClose, onConfirm, isSubmitting, title, message }) => {
    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <div className="text-center">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-accent text-4xl mb-4" />
                <h2 className="text-xl font-bold text-text-primary">{title || 'Confirmar Ação'}</h2>
                <p className="text-gray-600 my-4">
                    {message || 'Você tem certeza que deseja prosseguir?'}
                </p>
            </div>
            <div className="flex justify-center gap-4 mt-6">
                <button 
                    type="button" 
                    onClick={onRequestClose} 
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors" 
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm} 
                    className="px-6 py-2 bg-danger text-white font-semibold rounded-lg w-32 hover:bg-red-700 transition-colors" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Aguarde...' : 'Excluir'}
                </button>
            </div>
        </Modal>
    );
};

export default SimpleConfirmModal;