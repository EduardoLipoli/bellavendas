import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { IMaskInput } from 'react-imask';

// Estilos para o Modal - AGORA LATERAL DIREITA
const customStyles = {
  content: {
    top: '0',
    right: '0',
    bottom: '0',
    left: 'auto', // Isso é crucial para alinhar à direita
    width: '500px',
    padding: '0',
    overflow: 'hidden',
    border: 'none',
    borderRadius: '0',
    boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
    transform: 'none', // Removemos qualquer transformação anterior
    margin: '0',
    maxHeight: '100vh',
    transition: 'transform 0.3s ease-out',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
  }
};
Modal.setAppElement('#root');

const ClienteFormModal = ({ isOpen, onRequestClose, onSave, cliente, isSubmitting }) => {
    const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cpf: '', dataNascimento: '', status: 'Ativo' });

    useEffect(() => {
        if (cliente) {
            let formattedDate = '';
            if (cliente.dataNascimento && typeof cliente.dataNascimento.toDate === 'function') {
                const date = cliente.dataNascimento.toDate();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
            setFormData({
                nome: cliente.nome || '',
                email: cliente.email || '',
                telefone: cliente.telefone || '',
                cpf: cliente.cpf || '',
                dataNascimento: formattedDate,
                status: cliente.status || 'Ativo',
            });
        } else {
            setFormData({ nome: '', email: '', telefone: '', cpf: '', dataNascimento: '', status: 'Ativo' });
        }
    }, [cliente, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            style={customStyles}
            closeTimeoutMS={300}
        >
            <div className="flex flex-col h-full">
                {/* Cabeçalho fixo */}
                <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">{cliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                        <button 
                            onClick={onRequestClose} 
                            className="text-white hover:text-rose-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Área de conteúdo com scroll */}
                <div className="p-6 bg-white overflow-y-auto flex-grow">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Nome Completo</label>
                            <input 
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
                                required
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                            <input 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
                                placeholder='email@email.com'
                                type="email"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Telefone</label>
                                <IMaskInput
                                    mask="(00) 00000-0000"
                                    value={formData.telefone}
                                    name="telefone"
                                    type="tel"
                                    placeholder='(00) 99999-9999'
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
                                    onAccept={(value) => handleChange({ target: { name: 'telefone', value } })}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">CPF</label>
                                <IMaskInput
                                    mask="000.000.000-00"
                                    value={formData.cpf}
                                    name="cpf"
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
                                    onAccept={(value) => handleChange({ target: { name: 'cpf', value } })}
                                />
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Data de Nascimento</label>
                            <input 
                                name="dataNascimento" 
                                value={formData.dataNascimento} 
                                onChange={handleChange} 
                                type="date" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm" 
                            />
                        </div>
                        
                        <div className="mb-8">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange} 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white shadow-sm"
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>

                        {/* Rodapé fixo */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={onRequestClose} 
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition duration-300 shadow-sm"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-medium hover:opacity-90 transition duration-300 w-36 shadow-md"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Salvando...
                                    </span>
                                ) : cliente ? 'Salvar' : 'Adicionar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default ClienteFormModal;