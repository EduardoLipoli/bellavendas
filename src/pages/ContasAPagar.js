import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getContas, addConta, updateConta, updateContaStatus, deleteConta, getFornecedores } from '../services/firestoreService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faTrash, faCheck, faSearch, faEdit, faFileExport, faSyncAlt, 
  faFileInvoiceDollar, faExclamationTriangle, faPiggyBank,
  faFilter, faChevronUp, faChevronDown, faCheckCircle, faCalendarAlt, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import ContaFormModal from '../components/ContaFormModal';
import SimpleConfirmModal from '../components/SimpleConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard'; // <-- Importado o componente correto

// Imports para o Calendário
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css'; 
import '../styles/datepicker-custom.css';

// Registra o idioma português para o calendário
registerLocale('pt-BR', ptBR);


// Constantes
const CATEGORIAS = [ 'Operacional', 'RH', 'Impostos', 'Investimentos', 'Marketing', 'Infraestrutura', 'Outros' ];
const CENTROS_CUSTO = [ 'Vendas', 'TI', 'Produção', 'Administrativo', 'Marketing', 'Diretoria', 'Outros' ];
const PERIODICIDADES = [ 'Única', 'Mensal', 'Trimestral', 'Semestral', 'Anual' ];

const ContasAPagar = () => {
  const [contas, setContas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contaAtual, setContaAtual] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dataVencimento', direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState({ status: 'all', categoria: 'all', periodicidade: 'all', centroCusto: 'all', valorMin: '', valorMax: '' });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);

  const fetchContasEFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const [contasData, fornecedoresData] = await Promise.all([getContas(), getFornecedores()]);
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const contasAtualizadas = contasData.map(conta => {
        if (conta.status === 'Pendente' && conta.dataVencimento) {
          const dataVencimento = conta.dataVencimento.seconds 
            ? new Date(conta.dataVencimento.seconds * 1000) 
            : new Date(conta.dataVencimento);
            
          if (dataVencimento < hoje) {
            return { ...conta, status: 'Atrasada' };
          }
        }
        return conta;
      });
      
      setContas(contasAtualizadas);
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Falha ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContasEFornecedores();
  }, [fetchContasEFornecedores]);
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const filteredAndSortedContas = useMemo(() => {
    let result = contas.filter(conta => {
      if (!conta.dataVencimento) return false;
      const dataVencimento = conta.dataVencimento.seconds 
        ? new Date(conta.dataVencimento.seconds * 1000) 
        : new Date(conta.dataVencimento);
        
      return dataVencimento.getFullYear() === currentMonth.getFullYear() &&
             dataVencimento.getMonth() === currentMonth.getMonth();
    });
    
    if (filters.status !== 'all') {
      result = result.filter(conta => conta.status === filters.status);
    }
    if (filters.categoria !== 'all') {
      result = result.filter(conta => conta.categoria === filters.categoria);
    }
    if (filters.periodicidade !== 'all') {
      result = result.filter(conta => conta.periodicidade === filters.periodicidade);
    }
    if (filters.centroCusto !== 'all') {
      result = result.filter(conta => conta.centroCusto === filters.centroCusto);
    }
    if (filters.valorMin) {
      result = result.filter(conta => parseFloat(conta.valor) >= parseFloat(filters.valorMin));
    }
    if (filters.valorMax) {
      result = result.filter(conta => parseFloat(conta.valor) <= parseFloat(filters.valorMax));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(conta => 
        conta.descricao.toLowerCase().includes(term) ||
        (conta.fornecedorNome && conta.fornecedorNome.toLowerCase().includes(term)) ||
        (conta.observacoes && conta.observacoes.toLowerCase().includes(term)) ||
        (conta.categoria && conta.categoria.toLowerCase().includes(term))
      );
    }
    
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'dataVencimento' || sortConfig.key === 'dataPagamento') {
          const dateA = a[sortConfig.key]?.seconds ? new Date(a[sortConfig.key].seconds * 1000) : new Date(a[sortConfig.key] || 0);
          const dateB = b[sortConfig.key]?.seconds ? new Date(b[sortConfig.key].seconds * 1000) : new Date(b[sortConfig.key] || 0);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'valor') {
          return sortConfig.direction === 'asc' ? parseFloat(a.valor) - parseFloat(b.valor) : parseFloat(b.valor) - parseFloat(a.valor);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [contas, filters, searchTerm, sortConfig, currentMonth]);

  const metrics = useMemo(() => {
    const contasDoMes = filteredAndSortedContas;

    const contasPendentes = contasDoMes.filter(c => c.status === 'Pendente' || c.status === 'Atrasada');
    const contasAtrasadas = contasDoMes.filter(c => c.status === 'Atrasada');
    const contasPagas = contasDoMes.filter(c => c.status === 'Paga');
    
    const totalPendente = contasPendentes.reduce((sum, conta) => sum + parseFloat(conta.valor || 0), 0);
    const totalAtrasado = contasAtrasadas.reduce((sum, conta) => sum + parseFloat(conta.valor || 0), 0);
    const totalPagoMesAtual = contasPagas.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

    const mesAnterior = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const totalPagoMesAnterior = contas
      .filter(c => {
        if (c.status !== 'Paga' || !c.dataPagamento) return false;
        const dataPagamento = c.dataPagamento.seconds ? new Date(c.dataPagamento.seconds * 1000) : new Date(c.dataPagamento);
        return dataPagamento.getFullYear() === mesAnterior.getFullYear() && dataPagamento.getMonth() === mesAnterior.getMonth();
      })
      .reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
    
    const economiaMensal = totalPagoMesAnterior - totalPagoMesAtual;
        
    return {
      totalPendente,
      totalAtrasado,
      totalPago: totalPagoMesAtual,
      economiaMensal,
    };
  }, [filteredAndSortedContas, contas, currentMonth]);
  
  const totalItems = filteredAndSortedContas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedContas.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenModal = (conta = null) => {
    setContaAtual(conta);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setContaAtual(null);
  };

  const handleSaveConta = async (formData) => {
    setIsSubmitting(true);
    try {
      const fornecedorNome = fornecedores.find(f => f.id === formData.fornecedorId)?.nome || '';
      const contaData = { ...formData, valor: parseFloat(formData.valor), fornecedorNome };
      delete contaData.recorrente;

      if (formData.recorrente && formData.parcelas > 1) {
        await handleSaveRecorrente(contaData);
      } else {
        if (contaAtual) {
          await updateConta(contaAtual.id, contaData);
          toast.success("Conta atualizada com sucesso!");
        } else {
          await addConta(contaData);
          toast.success("Conta adicionada com sucesso!");
        }
      }
      
      fetchContasEFornecedores();
      handleCloseModal();
    } catch (error) {
      const action = contaAtual ? 'atualizar' : 'adicionar';
      toast.error(`Erro ao ${action} a conta: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveRecorrente = async (contaPrincipal) => {
    const parcelas = [];
    const dataBase = new Date(contaPrincipal.dataVencimento.replace(/-/g, '/'));
    
    for (let i = 0; i < contaPrincipal.parcelas; i++) {
      const dataVencimento = new Date(dataBase);
      dataVencimento.setMonth(dataBase.getMonth() + i);
      
      parcelas.push({
        ...contaPrincipal,
        descricao: `${contaPrincipal.descricao} (${i + 1}/${contaPrincipal.parcelas})`,
        dataVencimento: dataVencimento.toISOString().split('T')[0], 
        parcelaAtual: i + 1,
        totalParcelas: contaPrincipal.parcelas,
        status: 'Pendente'
      });
    }
    
    const promises = parcelas.map(parcela => addConta(parcela));
    await Promise.all(promises);
    toast.success(`${parcelas.length} parcelas criadas com sucesso!`);
  };

  const handleToggleStatus = async (id) => {
    const conta = contas.find(c => c.id === id);
    if (!conta) return;

    let novoStatus;
    let dataPagamento = null;
    
    if (conta.status === 'Pendente' || conta.status === 'Atrasada') {
      novoStatus = 'Paga';
      dataPagamento = new Date().toISOString();
    } else {
      novoStatus = 'Pendente';
    }

    try {
      await updateContaStatus(id, novoStatus, dataPagamento);
      toast.success(`Conta "${conta.descricao}" atualizada para ${novoStatus}!`);
      fetchContasEFornecedores();
    } catch {
      toast.error("Erro ao atualizar o status da conta.");
    }
  };
  
  const handleBulkMarkAsPaid = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const dataPagamento = new Date().toISOString();
      await Promise.all(selectedItems.map(id => updateContaStatus(id, 'Paga', dataPagamento)));
      toast.success(`${selectedItems.length} conta(s) marcada(s) como paga(s)!`);
      fetchContasEFornecedores();
      setSelectedItems([]);
    } catch (error) {
      toast.error("Erro ao atualizar o status das contas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirmModal = (item) => { 
    setItemToDelete(item); 
    setIsConfirmModalOpen(true); 
  };
  
  const handleBulkDelete = () => { 
    if (selectedItems.length > 0) { 
      setItemToDelete(null); 
      setIsConfirmModalOpen(true); 
    } 
  };
  
  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      if (itemToDelete) {
        await deleteConta(itemToDelete.id);
        toast.success("Conta excluída com sucesso!");
      } else if (selectedItems.length > 0) {
        await Promise.all(selectedItems.map(id => deleteConta(id)));
        toast.success(`${selectedItems.length} conta(s) excluída(s) com sucesso!`);
        setSelectedItems([]);
      }
      fetchContasEFornecedores();
    } catch (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paga': return 'bg-green-100 text-green-800';
      case 'Atrasada': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const columns = [
    { key: 'descricao', header: 'Descrição', sortable: true },
    { key: 'fornecedorNome', header: 'Fornecedor', sortable: true },
    { key: 'categoria', header: 'Categoria', sortable: true },
    { 
      key: 'valor', header: 'Valor', sortable: true, 
      renderCell: (item) => (
        <div className={item.status === 'Atrasada' ? 'text-red-600 font-bold' : ''}>
          R$ {parseFloat(item.valor || 0).toFixed(2)}
        </div>
      ) 
    },
    { 
      key: 'dataVencimento', header: 'Vencimento', sortable: true, 
      renderCell: (item) => {
        const date = item.dataVencimento.seconds ? new Date(item.dataVencimento.seconds * 1000) : new Date(item.dataVencimento);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const atrasada = item.status === 'Atrasada';
        return (
          <div className={atrasada ? 'text-red-600 font-bold' : ''}>
            {date.toLocaleDateString('pt-BR')}
            {atrasada && ` (${Math.floor((hoje - date) / (1000 * 60 * 60 * 24))} dias)`}
          </div>
        );
      } 
    },
    { 
      key: 'status', header: 'Status', sortable: true, 
      renderCell: (item) => {
        const badgeClasses = `px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`;
        const hoverClasses = item.status !== 'Paga' ? 'hover:bg-green-200 hover:text-green-900' : 'hover:bg-yellow-200 hover:text-yellow-900';
        return (
          <button onClick={() => handleToggleStatus(item.id)} className={`${badgeClasses} ${hoverClasses} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`} title={`Clique para marcar como ${item.status === 'Paga' ? 'Pendente' : 'Paga'}`}>
            {item.status}
          </button>
        );
      }
    },
    { 
      key: 'actions', header: 'Ações',
      renderCell: (item) => (
        <div className="flex gap-4 text-lg">
          <button onClick={() => handleOpenModal(item)} className="text-gray-500 hover:text-[#9c7dcb] transition-colors" title="Editar Conta"><FontAwesomeIcon icon={faEdit} /></button>
          <button onClick={() => handleOpenConfirmModal(item)} className="text-gray-500 hover:text-red-600 transition-colors" title="Excluir"><FontAwesomeIcon icon={faTrash} /></button>
        </div>
      )
    }
  ];

  const CustomMonthInput = React.forwardRef(({ value, onClick }, ref) => (
    <button
        className="flex items-center gap-3 text-xl font-bold text-gray-700 text-center mx-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={onClick}
        ref={ref}
    >
        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#9c7dcb]" />
        {value}
    </button>
  ));

  return (
    <div>
      <LoadingSpinner loading={loading || isSubmitting} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Contas a Pagar</h2>
          <p className="text-gray-600 mt-1">Gestão financeira completa para sua empresa.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {selectedItems.length > 0 && (
            <>
              <button onClick={handleBulkMarkAsPaid} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><FontAwesomeIcon icon={faCheck} /> Pagar ({selectedItems.length})</button>
              <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"><FontAwesomeIcon icon={faTrash} /> Excluir ({selectedItems.length})</button>
            </>
          )}
          <button onClick={() => handleOpenModal()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-primary-dark flex items-center gap-2"><FontAwesomeIcon icon={faPlus} /> Nova Conta</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={faFileInvoiceDollar} title="Total Pendente" value={`R$ ${metrics.totalPendente.toFixed(2)}`} color="primary" />
        <StatCard icon={faExclamationTriangle} title="Total Atrasado" value={`R$ ${metrics.totalAtrasado.toFixed(2)}`} color="red" />
        <StatCard icon={faCheckCircle} title="Total Pago no Mês" value={`R$ ${metrics.totalPago.toFixed(2)}`} color="green" />
        <StatCard icon={faPiggyBank} title="Balanço Mensal" value={`R$ ${metrics.economiaMensal.toFixed(2)}`} color={metrics.economiaMensal >= 0 ? "green" : "red"} />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        
        <div className="flex justify-center items-center mb-4">
            <button onClick={handlePreviousMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-[#9c7dcb]" title="Mês anterior"><FontAwesomeIcon icon={faChevronLeft} size="lg" /></button>
            <DatePicker
                selected={currentMonth}
                onChange={(date) => setCurrentMonth(date)}
                dateFormat="MMMM 'de' yyyy"
                showMonthYearPicker
                locale="pt-BR"
                popperClassName="custom-datepicker-popper"
                customInput={<CustomMonthInput />}
            />
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-[#9c7dcb]" title="Próximo mês"><FontAwesomeIcon icon={faChevronRight} size="lg" /></button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-t pt-4">
            <div className="relative w-full md:w-auto">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por descrição, fornecedor..."
                    className="border rounded-lg p-2 pl-9 w-full md:w-64 focus:ring-2 focus:ring-[#9c7dcb] focus:border-[#9c7dcb] outline-none transition-shadow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${showFiltrosAvancados ? 'bg-[#9c7dcb] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    <FontAwesomeIcon icon={faFilter} />
                    Filtros
                    <FontAwesomeIcon icon={showFiltrosAvancados ? faChevronUp : faChevronDown} />
                </button>
                
                <button 
                    onClick={fetchContasEFornecedores}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    title="Recarregar dados"
                >
                    <FontAwesomeIcon icon={faSyncAlt} />
                </button>
            </div>
        </div>

        {showFiltrosAvancados && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={filters.status}
                        onChange={e => setFilters({...filters, status: e.target.value})}
                        className="border rounded-lg p-2 w-full bg-white focus:ring-2 focus:ring-[#9c7dcb] focus:border-[#9c7dcb] outline-none transition-shadow"
                    >
                        <option value="all">Todos</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Paga">Paga</option>
                        <option value="Atrasada">Atrasada</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                        value={filters.categoria}
                        onChange={e => setFilters({...filters, categoria: e.target.value})}
                        className="border rounded-lg p-2 w-full bg-white focus:ring-2 focus:ring-[#9c7dcb] focus:border-[#9c7dcb] outline-none transition-shadow"
                    >
                        <option value="all">Todas</option>
                        {CATEGORIAS.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
                    <select
                        value={filters.periodicidade}
                        onChange={e => setFilters({...filters, periodicidade: e.target.value})}
                        className="border rounded-lg p-2 w-full bg-white focus:ring-2 focus:ring-[#9c7dcb] focus:border-[#9c7dcb] outline-none transition-shadow"
                    >
                        <option value="all">Todas</option>
                        {PERIODICIDADES.map(p => (<option key={p} value={p}>{p}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
                    <select
                        value={filters.centroCusto}
                        onChange={e => setFilters({...filters, centroCusto: e.target.value})}
                        className="border rounded-lg p-2 w-full bg-white focus:ring-2 focus:ring-[#9c7dcb] focus:border-[#9c7dcb] outline-none transition-shadow"
                    >
                        <option value="all">Todos</option>
                        {CENTROS_CUSTO.map(cc => (<option key={cc} value={cc}>{cc}</option>))}
                    </select>
                </div>
            </div>
        )}

        <DataTable
          data={currentItems}
          columns={columns}
          isLoading={loading}
          sortConfig={sortConfig}
          onSort={(key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
          selectedItems={selectedItems}
          onSelectItem={(id) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedItems(prev => prev.length === currentItems.length ? [] : currentItems.map(c => c.id))}
          emptyStateComponent={
            <div className="text-center py-12">
              <h3 className="font-bold text-lg">Nenhuma conta encontrada para o período selecionado.</h3>
              <p className="text-gray-500 mt-1">{searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '') ? 'Ajuste seus filtros ou limpe a busca' : 'Tente selecionar outro mês ou adicionar uma nova conta.'}</p>
            </div>
          }
        />
        
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} de {totalItems} registros</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="mr-2 text-sm">Itens por página:</span>
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded p-1 text-sm">
                  {[5, 10, 25, 50].map(size => (<option key={size} value={size}>{size}</option>))}
                </select>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-[#9c7dcb] text-white' : ''}`}>{i + 1}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ContaFormModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        onSave={handleSaveConta}
        conta={contaAtual}
        isSubmitting={isSubmitting}
        fornecedores={fornecedores}
        categorias={CATEGORIAS}
        centrosCusto={CENTROS_CUSTO}
        periodicidades={PERIODICIDADES}
      />

      <SimpleConfirmModal
        isOpen={isConfirmModalOpen}
        onRequestClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isSubmitting={isSubmitting}
        title="Confirmar Exclusão"
        message={itemToDelete ? `Tem certeza que deseja excluir a conta "${itemToDelete.descricao}"?` : `Tem certeza que deseja excluir ${selectedItems.length} conta(s) selecionada(s)?`}
      />
    </div>
  );
};

export default ContasAPagar;