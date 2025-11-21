import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const customStyles = {
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '400px', padding: '2rem', borderRadius: '8px' },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const ConfirmDeleteModal = ({ isOpen, onRequestClose, onConfirm, isSubmitting }) => { // Recebe a prop
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        onConfirm(password);
        setPassword('');
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <div className="text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger text-4xl mb-4" />
                <h2 className="text-xl font-bold text-text">Confirmar Exclusão</h2>
                <p className="text-gray-600 my-3">Esta ação é irreversível. Para confirmar, por favor, digite sua senha.</p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full border p-2 rounded"
                />
            </div>
            <div className="flex justify-center gap-4 mt-6">
                <button type="button" onClick={onRequestClose} className="px-6 py-2 bg-gray-300 rounded-lg" disabled={isSubmitting}>Cancelar</button>
                {/* Botão atualizado */}
                <button onClick={handleConfirm} className="px-6 py-2 bg-danger text-white rounded-lg w-48" disabled={isSubmitting}>
                    {isSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDeleteModal;