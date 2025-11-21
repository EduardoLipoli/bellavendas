import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

// 1. Estilos de painel lateral (copiados do ProductFormModal)
const customStyles = {
    content: {
        top: '0', right: '0', bottom: '0', left: 'auto',
        width: '500px',
        padding: '0',
        overflow: 'hidden',
        border: 'none',
        borderRadius: '0',
        boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
        transform: 'none',
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

// 4. Adicionada a prop 'isSubmitting' para consistência
const FornecedorFormModal = ({ isOpen, onRequestClose, onSave, fornecedor, isSubmitting }) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        categoria: '',
        status: 'Ativo'
    });

    useEffect(() => {
        if (isOpen) {
            if (fornecedor) {
                setFormData(fornecedor);
            } else {
                setFormData({
                    nome: '',
                    email: '',
                    telefone: '',
                    categoria: '',
                    status: 'Ativo'
                });
            }
        }
    }, [fornecedor, isOpen]);

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
            closeTimeoutMS={300} // Animação de fechamento suave
        >
            {/* 2. Estrutura de layout de painel lateral */}
            <div className="flex flex-col h-full">
                {/* Cabeçalho fixo */}
                <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">{fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                        <button onClick={onRequestClose} className="text-white hover:text-rose-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Área de conteúdo com scroll */}
                <div className="p-6 bg-white overflow-y-auto flex-grow">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Nome do Fornecedor</label>
                            <input name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Telefone</label>
                                <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Categoria de Fornecimento</label>
                            <input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Roupas, Eletrônicos" className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>

                        {/* 3. Rodapé fixo com botões de ação */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 mt-6">
                            <button type="button" onClick={onRequestClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium" disabled={isSubmitting}>
                                Cancelar
                            </button>
                            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-medium hover:opacity-90 w-36" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : (fornecedor ? 'Salvar' : 'Adicionar')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default FornecedorFormModal;