import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StatCard from '../components/StatCard';
import { 
    getVendas, 
    updateStatusPagamentoVenda, 
    deleteVenda, 
    reauthenticate, 
    exportVendasToCSV,
} from '../services/firestoreService'; 
import DataTable from '../components/DataTable';
import ModalVenda from '../components/ModalVenda';
import ModalDetalhesVenda from '../components/ModalDetalhesVenda';
import ModalComprovante from '../components/ModalComprovante';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faSearch, 
    faTrash, 
    faEdit, 
    faCheckCircle, 
    faClock, 
    faExclamationTriangle, 
    faEye, 
    faFilter,
    faSyncAlt,
    faChevronDown,
    faChevronUp,
    faDollarSign, 
    faBan
} from '@fortawesome/free-solid-svg-icons';
import ConfirmSaleDeleteModal from '../components/ConfirmSaleDeleteModal';
import ModalCancelarVenda from '../components/ModalCancelarVenda'; 
import { cancelVenda } from '../services/firestoreService'; 

const PaginaVendas = () => {
    // --- ESTADOS ---
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [vendaAtual, setVendaAtual] = useState(null);
    const [selectedVendas, setSelectedVendas] = useState([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [isComprovanteModalOpen, setIsComprovanteModalOpen] = useState(false);
    
    // Estados de filtro
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('todos');
    const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
    
    // Estados de cancelamento
    const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);
    const [vendaParaCancelar, setVendaParaCancelar] = useState(null);
    const [isCanceling, setIsCanceling] = useState(false);

    // --- FUNÇÕES DE DADOS E EVENTOS ---
    const carregarVendas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVendas();
            setVendas(data);
            
            const vendasAtrasadas = data.filter(venda => 
                venda.statusPagamento === 'Pendente' && 
                venda.dataVencimento && 
                new Date(venda.dataVencimento.seconds * 1000) < new Date()
            );
            
            if (vendasAtrasadas.length > 0) {
                toast.error(`Você tem ${vendasAtrasadas.length} venda(s) atrasada(s)!`, {
                    duration: 6000,
                    icon: '⚠️'
                });
            }
        } catch (e) {
            toast.error("Erro ao carregar vendas.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarVendas();
    }, [carregarVendas]);

    const handleOpenCreateModal = useCallback(() => {
        setVendaAtual(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenEditModal = useCallback((venda) => {
        setVendaAtual(venda);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setVendaAtual(null);
    }, []);

    const handleCloseDetalhesModal = () => {
        setIsDetalhesModalOpen(false);
        setVendaSelecionada(null);
    };
    
    const handleOpenComprovanteModal = useCallback((venda) => {
        setVendaSelecionada(venda);
        setIsComprovanteModalOpen(true);
    }, []);

    const handleCloseComprovanteModal = () => {
        setIsComprovanteModalOpen(false);
        setVendaSelecionada(null);
    };

    const handleUpdateSucesso = () => {
        handleCloseDetalhesModal();
        carregarVendas();
    };

    const handleSelectVenda = (id) => {
        setSelectedVendas(prev => prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]);
    };

    const handleSelectAllVendas = () => {
        if (selectedVendas.length === paginatedVendas.length) {
            setSelectedVendas([]);
        } else {
            setSelectedVendas(paginatedVendas.map(v => v.id));
        }
    };

    const handleOpenConfirmModal = useCallback((venda) => {
        setItemToDelete(venda);
        setIsConfirmModalOpen(true);
    }, []);

    const handleBulkDelete = () => {
        setItemToDelete(selectedVendas);
        setIsConfirmModalOpen(true);
    };

    const handleOpenCancelarModal = (venda) => {
        setVendaParaCancelar(venda);
        setIsCancelarModalOpen(true);
    };

    const handleCloseCancelarModal = () => {
        setVendaParaCancelar(null);
        setIsCancelarModalOpen(false);
    };

    const handleConfirmarCancelamento = async ({ motivo, devolverAoEstoque, password }) => {
        if (!vendaParaCancelar) return;

        if (!password) {
            toast.error("A senha é obrigatória para cancelar.");
            return;
        }

        setIsCanceling(true);
        try {
            const isPasswordCorrect = await reauthenticate(password);
            if (!isPasswordCorrect) {
                toast.error("Senha incorreta!");
                setIsCanceling(false);
                return; 
            }

            await cancelVenda(vendaParaCancelar.id, motivo, devolverAoEstoque);
            
            toast.success("Venda cancelada com sucesso!");
            handleCloseCancelarModal();
            carregarVendas(); 
        } catch (error) {
            toast.error(error.message || "Falha ao cancelar a venda.");
        } finally {
            setIsCanceling(false);
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedVendas.length === 0) return;
        
        try {
            toast.loading('Atualizando status...');
            await Promise.all(selectedVendas.map(id => 
                updateStatusPagamentoVenda(id, 'Pago')
            ));
            
            setVendas(prevVendas => 
                prevVendas.map(v => selectedVendas.includes(v.id) ? { ...v, statusPagamento: 'Pago' } : v)
            );
            
            setSelectedVendas([]);
            toast.dismiss();
            toast.success(`${selectedVendas.length} venda(s) marcada(s) como pagas!`);
        } catch (error) {
            toast.dismiss();
            toast.error("Erro ao atualizar status.");
            console.error(error);
        }
    };

    const handleConfirmDelete = async ({ password, reason }) => {
        if (!password) {
            toast.error("Por favor, digite sua senha para confirmar.");
            return;
        }
        
        const isBulk = Array.isArray(itemToDelete);
        const item = isBulk ? null : itemToDelete;

        if (isBulk && itemToDelete.length === 0) return;

        setIsDeleting(true);
        try {
            const isPasswordCorrect = await reauthenticate(password);
            if (!isPasswordCorrect) {
                toast.error("Senha incorreta!");
                setIsDeleting(false);
                return;
            }

            if (isBulk) {
                toast.loading('Excluindo vendas em massa...');
                await Promise.all(itemToDelete.map(id => deleteVenda(id)));
                toast.dismiss();
                toast.success(`${itemToDelete.length} venda(s) excluída(s)!`);
            } else {
                await deleteVenda(item.id);
                toast.success("Venda excluída com sucesso!");
            }
            
            setSelectedVendas([]);
            carregarVendas();

        } catch (error) {
            toast.error("Ocorreu um erro inesperado ao excluir.");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSort = (key) => {
        let dir = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            dir = 'desc';
        }
        setSortConfig({ key, direction: dir });
        setCurrentPage(1);
    };
    
    const handleUpdateStatus = useCallback(async (vendaId, statusAtual, novoStatus) => {
        try {
            await updateStatusPagamentoVenda(vendaId, novoStatus);
            
            setVendas(vendasAtuais => 
            vendasAtuais.map(v => v.id === vendaId ? { ...v, statusPagamento: novoStatus } : v)
            );
            
            toast.success(`Status alterado para ${novoStatus}`);
        } catch (error) {
            toast.error("Erro ao atualizar o status.");
        }
    }, []);

    // Função simplificada sem log de auditoria
    const handleVendaFinalizada = async (vendaSalva) => {
        setVendaAtual(null);
        carregarVendas();
    };

    // --- LÓGICA DE MEMOIZAÇÃO E FORMATAÇÃO ---
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const formatarData = (timestamp) => { 
        if (!timestamp?.seconds) return 'N/A'; 
        return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const resumoFinanceiro = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return vendas.reduce((acc, venda) => {
            if (venda.statusPagamento === 'Cancelado') {
                 acc.totalVendas += venda.total;
            } else {
                acc.totalVendas += venda.total;
            }

            if (venda.statusPagamento === 'Pago') {
                acc.totalPago += venda.total;
            } 
            else if (venda.statusPagamento === 'Pendente') {
                let dataVenc = null;

                if (venda.dataVencimento) {
                  if (typeof venda.dataVencimento.toDate === 'function') {
                    dataVenc = venda.dataVencimento.toDate();
                  }
                  else if (venda.dataVencimento.seconds) {
                    dataVenc = new Date(venda.dataVencimento.seconds * 1000);
                  }
                  else {
                    dataVenc = new Date(venda.dataVencimento);
                  }
                }

                if (dataVenc && !isNaN(dataVenc) && dataVenc < hoje) {
                    acc.totalAtrasado += venda.total;
                } else {
                    acc.totalPendente += venda.total;
                }
            } 
            else if (venda.statusPagamento === 'Cancelado') {
                acc.totalCancelado += venda.total;
            }
            
            return acc;
        }, {
            totalVendas: 0,
            totalPago: 0,
            totalPendente: 0,
            totalAtrasado: 0,
            totalCancelado: 0
        });
    }, [vendas]);

    const filteredAndSortedVendas = useMemo(() => {
        let vendasFiltradas = [...vendas].filter(venda => {
            const matchSearch = 
                (venda.cliente?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                venda.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchDataInicio = !filtroDataInicio || 
                (venda.data?.seconds && new Date(venda.data.seconds * 1000) >= new Date(filtroDataInicio));
                
            const matchDataFim = !filtroDataFim || 
                (venda.data?.seconds && new Date(venda.data.seconds * 1000) <= new Date(`${filtroDataFim}T23:59:59`));
                
            const matchStatus = filtroStatus === 'todos' || venda.statusPagamento === filtroStatus;
            const matchFormaPagamento = filtroFormaPagamento === 'todos' || venda.formaPagamento === filtroFormaPagamento;
            
            return matchSearch && matchDataInicio && matchDataFim && matchStatus && matchFormaPagamento;
        });

        if (sortConfig.key) {
            vendasFiltradas.sort((a, b) => {
                let aValue, bValue;
                
                if (sortConfig.key === 'cliente.nome') {
                    aValue = a.cliente?.nome || '';
                    bValue = b.cliente?.nome || '';
                } else if (sortConfig.key === 'data') {
                    aValue = a.data?.seconds || 0;
                    bValue = b.data?.seconds || 0;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return vendasFiltradas;
    }, [vendas, searchTerm, sortConfig, filtroDataInicio, filtroDataFim, filtroStatus, filtroFormaPagamento]);

    const paginatedVendas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedVendas.slice(start, start + itemsPerPage);
    }, [filteredAndSortedVendas, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedVendas.length / itemsPerPage);

    // --- DEFINIÇÃO DAS COLUNAS ---
    const columns = useMemo(() => [
        { 
            key: 'cliente.nome', 
            header: 'Cliente', 
            sortable: true, 
            renderCell: (item) => (
                <div>
                    <div className="font-medium text-gray-900">{item.cliente?.nome || 'Cliente não informado'}</div>
                    <div className="text-sm text-gray-500">ID: #{item.id.substring(0, 8)}</div>
                </div>
            )
        },
        { 
            key: 'data', 
            header: 'Data', 
            sortable: true, 
            renderCell: (item) => formatarData(item.data) 
        },
        { 
            key: 'formaPagamento', 
            header: 'Pagamento', 
            sortable: true, 
            renderCell: (item) => (
                <div>
                    <div className="text-sm font-medium">{item.formaPagamento}</div>
                    {item.dataVencimento && (
                        <div className="text-xs text-gray-500">
                            Venc: {formatarData(item.dataVencimento)}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'statusPagamento',
            header: 'Status',
            sortable: true,
            renderCell: (item) => {
                const isCancelado = item.statusPagamento === 'Cancelado';
                const isPago = item.statusPagamento === 'Pago';
                const isAtrasado = !isPago && !isCancelado && 
                                item.dataVencimento && 
                                new Date(item.dataVencimento.seconds * 1000) < new Date();

                const statusInfo = 
                    isCancelado ? { text: 'Cancelado', icon: faBan, color: 'gray' } :
                    isPago ? { text: 'Pago', icon: faCheckCircle, color: 'green' } :
                    isAtrasado ? { text: 'Atrasado', icon: faExclamationTriangle, color: 'red' } :
                    { text: 'Pendente', icon: faClock, color: 'yellow' };

                return (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={isCancelado}
                            onClick={() => {
                                if (isCancelado) return; 
                                const novoStatus = isPago ? 'Pendente' : 'Pago';
                                handleUpdateStatus(item.id, item.statusPagamento, novoStatus);
                            }}
                            className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800
                                        ${isCancelado ? 'cursor-not-allowed' : `hover:bg-${statusInfo.color}-200`}`}
                        >
                            <FontAwesomeIcon icon={statusInfo.icon} className="mr-1.5" />
                            {statusInfo.text}
                        </button>
                        
                        {isAtrasado && (
                            <span className="animate-pulse bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                Urgente!
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'total',
            header: 'Total',
            sortable: true,
            renderCell: (item) => <span className="font-bold text-gray-800">{formatCurrency(item.total)}</span>
        },
        {
            key: 'actions', 
            header: 'Ações',
            renderCell: (item) => (
                <div className="flex items-center gap-4 text-gray-500 text-lg">
                    <button onClick={() => handleOpenComprovanteModal(item)} className="hover:text-primary" title="Visualizar Compra">
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                    
                    {/* Botão Histórico REMOVIDO DAQUI */}

                    {item.statusPagamento !== 'Cancelado' && (
                        <>
                            <button onClick={() => handleOpenEditModal(item)} className="hover:text-blue-600" title="Editar Venda">
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button onClick={() => handleOpenCancelarModal(item)} className="hover:text-orange-600" title="Cancelar Venda">
                                <FontAwesomeIcon icon={faBan} />
                            </button>
                        </>
                    )}

                    {item.statusPagamento === 'Cancelado' && (
                        <button onClick={() => handleOpenConfirmModal(item)} className="hover:text-red-600" title="Excluir Venda Permanentemente">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    )}
                </div>
            )
        }
    ], [handleUpdateStatus, handleOpenEditModal, handleOpenConfirmModal, handleOpenComprovanteModal]);

    const EmptyState = () => (
        <div className="text-center py-12">
            <h3 className="text-xl font-medium">Nenhuma venda encontrada</h3>
            <p className="text-gray-500 mt-2">Clique em "Nova Venda" para começar.</p>
        </div>
    );
    
    // --- RENDERIZAÇÃO ---
    return (
        <div>
            <LoadingSpinner loading={loading || isDeleting} />
            <div>
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Vendas</h1>
                            <p className="text-gray-500 mt-1">Gerencie e registre todas as vendas realizadas</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedVendas.length > 0 && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleBulkMarkAsPaid} 
                                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} /> 
                                        Marcar como Pagas ({selectedVendas.length})
                                    </button>
                                    <button 
                                        onClick={handleBulkDelete} 
                                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                        Excluir ({selectedVendas.length})
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleOpenCreateModal} 
                                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-primary-dark flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Nova Venda
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <StatCard 
                            title="Total Vendas"
                            value={formatCurrency(resumoFinanceiro.totalVendas)}
                            icon={faDollarSign}
                            color="blue"
                        />
                        <StatCard 
                            title="Total Pago"
                            value={formatCurrency(resumoFinanceiro.totalPago)}
                            icon={faCheckCircle}
                            color="green"
                        />
                        <StatCard 
                            title="Total Pendente"
                            value={formatCurrency(resumoFinanceiro.totalPendente)}
                            icon={faClock}
                            color="yellow"
                        />
                        <StatCard 
                            title="Total Atrasado"
                            value={formatCurrency(resumoFinanceiro.totalAtrasado)}
                            icon={faExclamationTriangle}
                            color="red"
                        />
                        <StatCard 
                            title="Total Cancelado"
                            value={formatCurrency(resumoFinanceiro.totalCancelado)}
                            icon={faBan}
                            color="gray"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="relative w-full md:w-auto">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente, ID ou produto..."
                                    className="border rounded-lg p-2 pl-9 w-full md:w-64 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-shadow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${showFiltrosAvancados ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    <FontAwesomeIcon icon={faFilter} />
                                    Filtros
                                    <FontAwesomeIcon icon={showFiltrosAvancados ? faChevronUp : faChevronDown} />
                                </button>
                                
                                <button 
                                    onClick={carregarVendas}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                    title="Recarregar dados"
                                >
                                    <FontAwesomeIcon icon={faSyncAlt} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Filtros Avançados */}
                        {showFiltrosAvancados && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                    <input
                                        type="date"
                                        value={filtroDataInicio}
                                        onChange={(e) => setFiltroDataInicio(e.target.value)}
                                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                                    <input
                                        type="date"
                                        value={filtroDataFim}
                                        onChange={(e) => setFiltroDataFim(e.target.value)}
                                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={filtroStatus}
                                        onChange={(e) => setFiltroStatus(e.target.value)}
                                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-shadow"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="Pago">Pago</option>
                                        <option value="Pendente">Pendente</option>
                                        <option value="Atrasado">Atrasado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma Pagamento</label>
                                    <select
                                        value={filtroFormaPagamento}
                                        onChange={(e) => setFiltroFormaPagamento(e.target.value)}
                                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-shadow"
                                    >
                                        <option value="todos">Todas</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão">Cartão</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Boleto">Boleto</option>
                                        <option value="Transferência">Transferência</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        <DataTable
                            showSelection={true}
                            data={paginatedVendas}
                            columns={columns}
                            isLoading={loading}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            selectedItems={selectedVendas}
                            onSelectItem={handleSelectVenda}
                            onSelectAll={handleSelectAllVendas}
                            emptyStateComponent={<EmptyState />}
                        />

                        {!loading && filteredAndSortedVendas.length > itemsPerPage && (
                            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                   <span>Itens por pág:</span>
                                   <select 
                                     value={itemsPerPage}
                                     onChange={(e) => { 
                                         setItemsPerPage(Number(e.target.value)); 
                                         setCurrentPage(1); 
                                     }}
                                     className="border-gray-300 rounded-lg text-sm focus:ring-blue-500"
                                   >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                   </select>
                                </div>
                               
                                <div className="text-sm text-gray-500">
                                    Página {currentPage} de {totalPages} | 
                                    Total: {filteredAndSortedVendas.length} vendas
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                        disabled={currentPage === 1} 
                                        className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                        disabled={currentPage === totalPages} 
                                        className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <ModalVenda 
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onVendaFinalizada={handleVendaFinalizada}
                        vendaParaEditar={vendaAtual}
                    />
                    
                    <ConfirmSaleDeleteModal
                        isOpen={isConfirmModalOpen}
                        onRequestClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={handleConfirmDelete}
                        isSubmitting={isDeleting}
                        venda={itemToDelete}
                    />
                    
                    <ModalDetalhesVenda
                        isOpen={isDetalhesModalOpen}
                        onClose={handleCloseDetalhesModal}
                        venda={vendaSelecionada}
                        onUpdate={handleUpdateSucesso}
                    />
                    
                    <ModalComprovante
                        isOpen={isComprovanteModalOpen}
                        onClose={handleCloseComprovanteModal}
                        venda={vendaSelecionada}
                    />
                    
                    <ModalCancelarVenda
                        isOpen={isCancelarModalOpen}
                        onClose={handleCloseCancelarModal}
                        onConfirm={handleConfirmarCancelamento}
                        isSubmitting={isCanceling}
                        venda={vendaParaCancelar}
                    />
                </div>
            </div>
        </div>
    );
};

export default PaginaVendas;