import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getProdutos, addProduto, updateProduto, deleteProduto, 
  getCategorias, getFornecedores 
} from '../services/firestoreService';
import ProductFormModal from '../components/ProductFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faSearch, faEdit, faTrash, faSort, faSortUp, faSortDown, 
  faFilter, faTimes, faEye, faFileExport, faChartLine, faInfoCircle,
  faBoxes, faPercentage, faMoneyBillWave, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleConfirmModal from '../components/SimpleConfirmModal';
import ModalDetalhesProduto from '../components/ModalDetalhesProduto';
import { Link } from 'react-router-dom';

const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Para o formulário de edição/criação
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false); // Para o novo modal de detalhes
    const [produtoSelecionado, setProdutoSelecionado] = useState(null); // Um estado unificado para o produto
    const [minStock, setMinStock] = useState('');
    const [maxStock, setMaxStock] = useState('');
    const [filtrarApenasBaixoEstoque, setFiltrarApenasBaixoEstoque] = useState(false);


    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const [produtosData, categoriasData, fornecedoresData] = await Promise.all([
                getProdutos(),
                getCategorias(),
                getFornecedores()
            ]);

            setCategorias(categoriasData);
            setFornecedores(fornecedoresData);

            const filteredData = produtosData.filter(p => {
                const categoryMatch = selectedCategory ? p.categoria === selectedCategory : true;
                const statusMatch = selectedStatus ? p.status === selectedStatus : true;
                
                const searchMatch = searchTerm ? 
                    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.fornecedorNome && p.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
                    : true;
                
                const minStockMatch = minStock ? p.estoque >= parseInt(minStock) : true;
                const maxStockMatch = maxStock ? p.estoque <= parseInt(maxStock) : true;

                const baixoEstoqueMatch = filtrarApenasBaixoEstoque 
                    ? (p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo) 
                    : true;

                // Combina todos os filtros
                return categoryMatch && statusMatch && searchMatch && minStockMatch && maxStockMatch && baixoEstoqueMatch;
            });

            setProdutos(filteredData);
        } catch (error) {
            toast.error("Erro ao buscar dados.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, selectedStatus, minStock, maxStock, filtrarApenasBaixoEstoque]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig, selectedCategory, selectedStatus, minStock, maxStock]);
    
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProdutos = useMemo(() => {
        if (!sortConfig.key) return produtos;

        return [...produtos].sort((a, b) => {
            let valA, valB;

            if (sortConfig.key === 'margem') {
                valA = (a.custo > 0) ? ((a.preco - a.custo) / a.custo) : -Infinity;
                valB = (b.custo > 0) ? ((b.preco - b.custo) / b.custo) : -Infinity;
            } else if (sortConfig.key === 'status') {
                const statusOrder = { 'ativo': 1, 'esgotado': 2, 'inativo': 3 };
                valA = statusOrder[a.status] || 4;
                valB = statusOrder[b.status] || 4;
            } else {
                valA = a[sortConfig.key] || '';
                valB = b[sortConfig.key] || '';
            }
            
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [produtos, sortConfig]);

    const paginatedProdutos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedProdutos.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedProdutos, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedProdutos.length / itemsPerPage);

    // Calcular métricas para os cards de resumo
    const metrics = useMemo(() => {
        const totalProdutos = produtos.length;
        const produtosAtivos = produtos.filter(p => p.status === 'ativo').length;
        const produtosComBaixoEstoque = produtos.filter(p => 
            p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo
        ).length;
        
        const custoTotal = produtos.reduce((sum, p) => sum + (p.custo * p.estoque), 0);
        const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.estoque), 0);
        
        return {
            totalProdutos,
            produtosAtivos,
            produtosComBaixoEstoque,
            custoTotal,
            valorTotalEstoque
        };
    }, [produtos]);

    const handleSelectProduct = (id) => { 
        setSelectedProducts(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        ); 
    };
    
    const handleSelectAll = () => { 
        if (selectedProducts.length === paginatedProdutos.length) { 
            setSelectedProducts([]); 
        } else { 
            setSelectedProducts(paginatedProdutos.map(p => p.id)); 
        } 
    };
    
    const handleBulkDelete = () => { 
        if (selectedProducts.length > 0) { 
            setProductToDelete(null); 
            setIsConfirmModalOpen(true); 
        } 
    };
    
    const handleOpenImageModal = (imageUrl) => { 
        setSelectedImage(imageUrl); 
        setIsImageModalOpen(true); 
    };
    
    const handleCloseImageModal = () => { 
        setIsImageModalOpen(false); 
        setSelectedImage(''); 
    };
    
    const handleOpenConfirmModal = (produto) => { 
        setProductToDelete(produto); 
        setIsConfirmModalOpen(true); 
    };

        // Handlers para o modal de EDIÇÃO/CRIAÇÃO
    const handleOpenEditModal = (produto = null) => {
        setProdutoSelecionado(produto);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setProdutoSelecionado(null);
    };

    // Handlers para o modal de DETALHES
    const handleOpenDetalhesModal = (produto) => {
        setProdutoSelecionado(produto);
        setIsDetalhesModalOpen(true);
    };
    const handleCloseDetalhesModal = () => {
        setIsDetalhesModalOpen(false);
    };
    
    // Handler para o botão "Editar" de DENTRO do modal de detalhes
    const handleEditFromDetails = (produto) => {
        handleCloseDetalhesModal(); // Fecha o modal de detalhes
        setTimeout(() => handleOpenEditModal(produto), 100); // Abre o modal de edição
    };

    const handleConfirmDelete = async () => {
        setIsSubmitting(true);
        try {
            if (productToDelete) {
                await deleteProduto(productToDelete.id);
                toast.success("Produto excluído!");
            } else if (selectedProducts.length > 0) {
                await Promise.all(selectedProducts.map(id => deleteProduto(id)));
                toast.success(`${selectedProducts.length} produto(s) excluído(s)!`);
                setSelectedProducts([]);
            }
            if (paginatedProdutos.length === selectedProducts.length && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            fetchPageData();
        } catch (error) {
            toast.error("Erro ao excluir.");
        } finally {
            setIsSubmitting(false);
            setIsConfirmModalOpen(false);
            setProductToDelete(null);
        }
    };
    
    const handleSaveProduto = async (produtoData, imageFile) => {
            setIsSubmitting(true);
            try {
                let finalProductData = { ...produtoData };
                if (imageFile) {
                    const cloudName = 'dbnq2djs2';
                    const uploadPreset = 'bellavendas-app';
                    const formData = new FormData();
                    formData.append('file', imageFile);
                    formData.append('upload_preset', uploadPreset);
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
                    if (!response.ok) throw new Error('Falha no upload da imagem.');
                    const data = await response.json();
                    finalProductData.imageUrl = data.secure_url;
                }
                
                // --- CORRIGIDO: Usa 'produtoSelecionado' em vez de 'produtoAtual' ---
                if (produtoSelecionado) {
                    await updateProduto(produtoSelecionado.id, finalProductData);
                    toast.success("Produto atualizado!");
                } else {
                    await addProduto(finalProductData);
                    toast.success("Produto adicionado!");
                }
                
                fetchPageData();
                handleCloseEditModal();
            } catch (error) {
                toast.error(`Erro ao salvar: ${error.message}`);
            } finally {
                setIsSubmitting(false);
            }
        };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'ativo': return 'bg-green-100 text-green-800';
            case 'inativo': return 'bg-red-100 text-red-800';
            case 'esgotado': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedStatus('');
        setMinStock('');
        setMaxStock('');
        setFiltrarApenasBaixoEstoque(false); // <-- ADICIONE ESTA LINHA
    };

    return (
        <div>
            <LoadingSpinner loading={loading || isSubmitting} />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Produtos</h2>
                    <p className="text-gray-500 mt-1">Gerencie seu catálogo e analise sua lucratividade</p>
                </div>
                <div className="flex gap-2">
                    {selectedProducts.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <FontAwesomeIcon icon={faTrash} /> Excluir ({selectedProducts.length})
                        </button>
                    )}
                    <button onClick={() => handleOpenEditModal()} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center">
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border flex items-center">
                    <div className="mr-4 bg-blue-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faBoxes} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Produtos</p>
                        <p className="text-xl font-bold">{metrics.totalProdutos}</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border flex items-center">
                    <div className="mr-4 bg-green-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Produtos Ativos</p>
                        <p className="text-xl font-bold">{metrics.produtosAtivos}</p>
                    </div>
                </div>
                
                <button 
                    // --- LÓGICA ATUALIZADA AQUI ---
                    // Agora, ao clicar, ele inverte o valor do estado.
                    // Se estiver 'true', vira 'false'. Se estiver 'false', vira 'true'.
                    onClick={() => setFiltrarApenasBaixoEstoque(prevState => !prevState)}
                    className={`bg-white p-4 rounded-lg shadow border flex items-center w-full text-left transition-all duration-200
                        ${filtrarApenasBaixoEstoque ? 'ring-2 ring-yellow-500 border-yellow-400' : 'hover:border-gray-300'}`}
                >
                    <div className="mr-4 bg-yellow-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faBoxOpen} className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Baixo Estoque</p>
                        <p className="text-xl font-bold text-yellow-700">{metrics.produtosComBaixoEstoque}</p>
                    </div>
                </button>
                
                <div className="bg-white p-4 rounded-lg shadow border flex items-center">
                    <div className="mr-4 bg-purple-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Custo Total Estoque</p>
                        {/* --- LINHA ATUALIZADA --- */}
                        <p className="text-xl font-bold">{
                            metrics.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        }</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border flex items-center">
                    <div className="mr-4 bg-indigo-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faPercentage} className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Valor Total Estoque</p>
                        {/* --- LINHA ATUALIZADA --- */}
                        <p className="text-xl font-bold">{
                            metrics.valorTotalEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        }</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por produto, fornecedor ou código..." 
                            className="border rounded-lg p-2 pl-9 w-64" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)} 
                                className="border rounded-lg p-2 pl-9 pr-8 appearance-none"
                            >
                                <option value="">Todas Categorias</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="relative">
                            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)} 
                                className="border rounded-lg p-2 pl-9 pr-8 appearance-none"
                            >
                                <option value="">Todos Status</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                                <option value="esgotado">Esgotado</option>
                            </select>
                        </div>
                        
                        <div className="flex gap-1">
                            <input 
                                type="number" 
                                placeholder="Min estoque" 
                                className="border rounded-lg p-2 w-24" 
                                value={minStock} 
                                onChange={(e) => setMinStock(e.target.value)} 
                                min="0"
                            />
                            <span className="self-center text-gray-400">-</span>
                            <input 
                                type="number" 
                                placeholder="Max estoque" 
                                className="border rounded-lg p-2 w-24" 
                                value={maxStock} 
                                onChange={(e) => setMaxStock(e.target.value)} 
                                min="0"
                            />
                        </div>
                        
                        {(selectedCategory || selectedStatus || minStock || maxStock || searchTerm) && (
                            <button 
                                onClick={resetFilters}
                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <FontAwesomeIcon icon={faTimes} /> Limpar filtros
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 w-4">
                                    <input 
                                        type="checkbox" 
                                        className="rounded" 
                                        checked={paginatedProdutos.length > 0 && selectedProducts.length === paginatedProdutos.length} 
                                        onChange={handleSelectAll} 
                                    />
                                </th>
                                {['nome', 'fornecedorNome', 'categoria', 'custo', 'preco', 'margem', 'estoque', 'status'].map((key) => (
                                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort(key)}>
                                        <div className="flex items-center gap-2 capitalize">
                                            {
                                                {
                                                    'fornecedorNome': 'Fornecedor', 
                                                    'preco': 'Preço Venda', 
                                                    'margem': 'Margem %',
                                                    'categoria': 'Categoria',
                                                    'estoque': 'Estoque',
                                                    'status': 'Status'
                                                }[key] || key
                                            }
                                            {sortConfig.key === key ? (sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />) : <FontAwesomeIcon icon={faSort} className="opacity-40" />}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {loading ? (
                                    [...Array(itemsPerPage)].map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="animate-pulse">
                                            <td className="p-4"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="flex items-center"><div className="h-10 w-10 bg-gray-200 rounded-md"></div><div className="ml-4 flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="flex gap-4"><div className="h-6 w-6 bg-gray-200 rounded"></div><div className="h-6 w-6 bg-gray-200 rounded"></div><div className="h-6 w-6 bg-gray-200 rounded"></div></div></td>
                                        </tr>
                                    ))
                                ) : paginatedProdutos.length > 0 ? (
                                    paginatedProdutos.map((produto) => (
                                        <motion.tr 
                                            key={produto.id} 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            exit={{ opacity: 0 }} 
                                            className={`transition-colors ${selectedProducts.includes(produto.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded" 
                                                    checked={selectedProducts.includes(produto.id)} 
                                                    onChange={() => handleSelectProduct(produto.id)} 
                                                />
                                            </td>
                                            <td 
                                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                                onClick={() => handleOpenDetalhesModal(produto)}

                                            >
                                                <div className="flex items-center">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenImageModal(produto.imageUrl); }}>
                                                        <img 
                                                            src={produto.imageUrl || 'https://placehold.co/150x150'} 
                                                            alt={produto.nome} 
                                                            className="w-10 h-10 object-cover rounded-md flex-shrink-0" 
                                                            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x150' }} 
                                                        />
                                                    </button>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900 hover:text-primary-dark">{produto.nome}</div>
                                                        <div className="text-xs text-gray-500">{produto.codigo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <Link to="/fornecedores" className="hover:text-primary hover:underline transition-colors">
                                                    {produto.fornecedorNome || 'N/A'}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to="/configuracoes" className="hover:opacity-80 transition-opacity">
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {produto.categoria || 'N/A'}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {produto.custo ? `R$ ${parseFloat(produto.custo).toFixed(2)}` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                                {produto.preco ? `R$ ${parseFloat(produto.preco).toFixed(2)}` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                                {(() => {
                                                    const preco = parseFloat(produto.preco || 0);
                                                    const custo = parseFloat(produto.custo || 0);
                                                    if (custo > 0) {
                                                        const markup = (((preco - custo) / custo) * 100);
                                                        const corMarkup = markup >= 50 ? 'text-green-600' : markup >= 25 ? 'text-orange-500' : 'text-red-600';
                                                        return (
                                                            <div className="tooltip" data-tip={`Lucro: R$ ${(preco - custo).toFixed(2)}`}>
                                                                <span className={corMarkup}>{markup.toFixed(1)}%</span>
                                                            </div>
                                                        );
                                                    }
                                                    return <span className="text-gray-500">N/A</span>;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${produto.estoque >= 15 ? 'bg-green-100 text-green-800' : produto.estoque >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {produto.estoque} Unid.
                                                    {produto.estoqueMinimo > 0 && produto.estoque <= produto.estoqueMinimo && (
                                                        <FontAwesomeIcon icon={faInfoCircle} className="ml-1 text-red-500" title="Estoque abaixo do mínimo" />
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(produto.status)}`}>
                                                    {produto.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg">
                                                <button 
                                                    onClick={() => handleOpenDetalhesModal(produto)}
                                                    className="text-gray-500 hover:text-primary transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenEditModal(produto)} 
                                                    className="ml-4 text-gray-500 hover:text-blue-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenConfirmModal(produto)} 
                                                    className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="10" className="text-center py-12"><h3 className="text-xl font-medium">Nenhum produto encontrado</h3><p className="text-gray-500 mt-2">Ajuste sua busca ou clique em "Novo Produto" para começar.</p></td></tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {!loading && sortedProdutos.length > itemsPerPage && (
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <span>Itens por pág:</span>
                           <select 
                                value={itemsPerPage} 
                                onChange={(e) => { 
                                    setItemsPerPage(Number(e.target.value)); 
                                    setCurrentPage(1); 
                                }} 
                                className="border-gray-300 rounded-lg text-sm"
                            >
                               <option value={5}>5</option>
                               <option value={10}>10</option>
                               <option value={20}>20</option>
                               <option value={50}>50</option>
                           </select>
                        </div>
                        <div className="text-sm text-gray-500">Página {currentPage} de {totalPages}</div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                disabled={currentPage === 1} 
                                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                disabled={currentPage === totalPages} 
                                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 1. Modal de Detalhes (Componente externo) */}
            <ModalDetalhesProduto 
                isOpen={isDetalhesModalOpen}
                onClose={handleCloseDetalhesModal}
                produto={produtoSelecionado}
                onEdit={handleEditFromDetails}
            />
            
            {/* 2. Modal de Edição/Criação */}
            <ProductFormModal 
                isOpen={isEditModalOpen}
                onRequestClose={handleCloseEditModal}
                onSave={handleSaveProduto}
                produto={produtoSelecionado}
                isSubmitting={isSubmitting}
                categorias={categorias}
                fornecedores={fornecedores} 
            />
            
            <SimpleConfirmModal 
                isOpen={isConfirmModalOpen} 
                onRequestClose={() => setIsConfirmModalOpen(false)} 
                onConfirm={handleConfirmDelete} 
                isSubmitting={isSubmitting} 
                title="Confirmar Exclusão" 
                message={ productToDelete ? `Excluir "${productToDelete?.nome}"?` : `Excluir ${selectedProducts.length} produto(s)?`} 
            />
            
            <AnimatePresence>
                {isImageModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" 
                        onClick={handleCloseImageModal}
                    >
                        <motion.div 
                            initial={{ scale: 0.7 }} 
                            animate={{ scale: 1 }} 
                            exit={{ scale: 0.7 }} 
                            className="relative" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={selectedImage} 
                                alt="Visualização ampliada" 
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" 
                            />
                            <button 
                                onClick={handleCloseImageModal} 
                                className="absolute -top-4 -right-4 bg-white rounded-full h-10 w-10 flex items-center justify-center text-black text-2xl" 
                                aria-label="Fechar"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Produtos;