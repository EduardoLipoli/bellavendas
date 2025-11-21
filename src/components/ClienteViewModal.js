import React from 'react';
import Modal from 'react-modal';
import { getInitials } from '../pages/Clientes'; // Vamos exportar a função de iniciais
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBirthdayCake, faIdCard, faPhone, faEnvelope, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

// Estilos
const customStyles = {
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '400px', padding: '2rem', borderRadius: '8px' },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const ClienteViewModal = ({ isOpen, onRequestClose, cliente }) => {
    if (!cliente) return null;

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {getInitials(cliente.nome)}
                </div>
                <h2 className="text-2xl font-bold text-text">{cliente.nome}</h2>
                <div className={`status-badge mt-2 ${cliente.status === 'Ativo' ? 'bg-success/80 text-green-900' : 'bg-warning/80 text-orange-900'}`}>
                    <FontAwesomeIcon icon={cliente.status === 'Ativo' ? faCheckCircle : faTimesCircle} className="mr-1" />
                    {cliente.status}
                </div>
            </div>
            <div className="mt-6 border-t pt-4">
                <p className="flex items-center text-text my-2"><FontAwesomeIcon icon={faEnvelope} className="mr-3 text-gray-400 w-5" /> {cliente.email}</p>
                <p className="flex items-center text-text my-2"><FontAwesomeIcon icon={faPhone} className="mr-3 text-gray-400 w-5" /> {cliente.telefone || 'Não informado'}</p>
                <p className="flex items-center text-text my-2"><FontAwesomeIcon icon={faIdCard} className="mr-3 text-gray-400 w-5" /> {cliente.cpf || 'Não informado'}</p>
                <p className="flex items-center text-text my-2"><FontAwesomeIcon icon={faBirthdayCake} className="mr-3 text-gray-400 w-5" /> {cliente.dataNascimento ? cliente.dataNascimento.toDate().toLocaleDateString('pt-BR') : 'Não informado'}</p>
            </div>
            <div className="flex justify-end mt-6">
                 <button type="button" onClick={onRequestClose} className="px-6 py-2 bg-gray-300 rounded-lg">Fechar</button>
            </div>
        </Modal>
    );
};

export default ClienteViewModal;