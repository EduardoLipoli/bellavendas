import React, { useState, useEffect } from 'react';
import { getFornecedores, addFornecedor, updateFornecedor, deleteFornecedor } from '../services/firestoreService';
import FornecedorCard from '../components/FornecedorCard';
import FornecedorFormModal from '../components/FornecedorFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faSync } from '@fortawesome/free-solid-svg-icons';

const Fornecedores = () => {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fornecedorAtual, setFornecedorAtual] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchFornecedores = async () => {
        setLoading(true);
        const data = await getFornecedores();
        setFornecedores(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchFornecedores();
    }, []);

    const handleOpenModal = (fornecedor = null) => {
        setFornecedorAtual(fornecedor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFornecedorAtual(null);
    };

    const handleSave = async (data) => {
        if (fornecedorAtual) {
            await updateFornecedor(fornecedorAtual.id, data);
        } else {
            await addFornecedor(data);
        }
        fetchFornecedores();
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            await deleteFornecedor(id);
            fetchFornecedores();
        }
    };

    const filteredFornecedores = fornecedores.filter(fornecedor => 
        fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fornecedor.categoria && fornecedor.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div>
        <LoadingSpinner loading={loading} />
        <div>
            {/* Header modernizado */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Fornecedores</h1>
                <p className="text-gray-600 mt-1">Gerencie seus fornecedores e parceiros comerciais</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Barra de pesquisa moderna */}
                <div className="relative w-full md:w-64">
                <input
                    type="text"
                    placeholder="Buscar fornecedor..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-3 text-gray-400"
                />
                </div>
                
                {/* Botão moderno com efeito */}
                <button 
                onClick={() => handleOpenModal()} 
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Novo Fornecedor
                </button>
            </div>
            </div>

            {/* Status Bar modernizada */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-500 text-sm">Total</span>
                <span className="text-2xl font-bold text-gray-800">{fornecedores.length}</span>
            </div>
            <div className="flex flex-col p-4 bg-green-50 rounded-lg">
                <span className="text-gray-500 text-sm">Ativos</span>
                <span className="text-2xl font-bold text-green-600">{fornecedores.filter(f => f.status === 'Ativo').length}</span>
            </div>
            <div className="flex flex-col p-4 bg-yellow-50 rounded-lg md:col-span-1">
                <span className="text-gray-500 text-sm">Inativos</span>
                <span className="text-2xl font-bold text-yellow-600">{fornecedores.filter(f => f.status === 'Inativo').length}</span>
            </div>
            </div>

            {/* Lista de fornecedores */}
            {!loading && (
            <>
                {filteredFornecedores.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                    {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                    {searchTerm 
                        ? "Tente ajustar sua busca ou cadastre um novo fornecedor" 
                        : "Comece cadastrando seu primeiro fornecedor"}
                    </p>
                    <button 
                    onClick={() => handleOpenModal()} 
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg transition-all duration-300 shadow hover:shadow-md"
                    >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Adicionar Fornecedor
                    </button>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFornecedores.map(fornecedor => (
                    <FornecedorCard
                        key={fornecedor.id}
                        fornecedor={fornecedor}
                        onEdit={() => handleOpenModal(fornecedor)}
                        onDelete={() => handleDelete(fornecedor.id)}
                    />
                    ))}
                </div>
                )}
            </>
            )}
        </div>

        {/* Modal */}
        <FornecedorFormModal
            isOpen={isModalOpen}
            onRequestClose={handleCloseModal}
            onSave={handleSave}
            fornecedor={fornecedorAtual}
        />
    </div>
  );
};

export default Fornecedores;