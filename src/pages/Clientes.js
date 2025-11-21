import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getClientes,
  getClientesCount,
  updateCliente,
  deleteCliente,
  addCliente,
} from "../services/firestoreService";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { reauthenticate } from "../services/authService";
import ClienteFormModal from "../components/ClienteFormModal";
import ClienteViewModal from "../components/ClienteViewModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DataTable from "../components/DataTable"; // <-- VERIFIQUE SE O CAMINHO ESTÁ CORRETO
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faEdit,
  faEye,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

// Função para pegar as iniciais do nome para o avatar
export const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.slice(0, 2).toUpperCase();
};

const avatarColors = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-danger",
  "bg-warning",
];
const PER_PAGE = 5;

const Clientes = () => {
  // === ESTADOS ===
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clienteAtual, setClienteAtual] = useState(null);

  // DataTable (Seleção e Ordenação)
  const [sortConfig, setSortConfig] = useState({
    key: "nome",
    direction: "asc",
  });
  const [selectedClients, setSelectedClients] = useState([]);

  // Filtro e Paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [pageLastVisible, setPageLastVisible] = useState({});

  const fetchClientesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedClients([]); // Limpa a seleção ao buscar novos dados
    try {
      const options = {
        statusFilter,
        searchTerm,
        page: currentPage,
        perPage: PER_PAGE,
        lastVisible: currentPage > 1 ? pageLastVisible[currentPage - 1] : null,
      };
      const result = await getClientes(options);
      const count = await getClientesCount({ statusFilter, searchTerm });
      setClientes(result.data);
      setTotalClientes(count);
      if (result.lastVisible) {
        setPageLastVisible((prev) => ({
          ...prev,
          [currentPage]: result.lastVisible,
        }));
      }
    } catch (err) {
      setError("Falha ao carregar clientes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  // useEffect principal que reage a mudanças
  useEffect(() => {
    fetchClientesData();
  }, [fetchClientesData]);

  // Handlers para abrir modais
  const handleOpenFormModal = (cliente = null) => {
    setClienteAtual(cliente);
    setFormModalOpen(true);
  };
  const handleOpenViewModal = (cliente) => {
    setClienteAtual(cliente);
    setViewModalOpen(true);
  };
  const handleOpenDeleteModal = (cliente) => {
    setClienteAtual(cliente);
    setDeleteModalOpen(true);
  };

  // Handlers para fechar modais
  const handleCloseModals = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setDeleteModalOpen(false);
    setClienteAtual(null);
  };

  // Handlers para DataTable
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSelectClient = (id) => {
    setSelectedClients((prev) =>
      prev.includes(id)
        ? prev.filter((clientId) => clientId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    // Seleciona todos os clientes *atualmente visíveis*
    if (selectedClients.length === clientes.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clientes.map((c) => c.id));
    }
  };

  // Função para exclusão em massa (exemplo)
  const handleBulkDelete = () => {
    // Define clienteAtual como null para sinalizar ao modal que é uma exclusão em massa
    setClienteAtual(null);
    setDeleteModalOpen(true);
  };

  const sortedClientes = useMemo(() => {
    let items = [...clientes];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [clientes, sortConfig]);

  const handleSave = async (data) => {
    // 1. Validação de Nome (deve ter nome e sobrenome)
    if (!data.nome || data.nome.trim().indexOf(" ") === -1) {
      toast.error("Por favor, insira o nome completo.");
      return;
    }
    // 2. Validação de Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Por favor, insira um email válido.");
      return;
    }
    // 3. Validação de CPF (remove a máscara para contar os dígitos)
    const cpfDigits = data.cpf.replace(/\D/g, ""); // \D remove tudo que não for dígito
    if (cpfDigits.length !== 11) {
      toast.error("O CPF deve ter 11 dígitos.");
      return;
    }

    // Se todas as validações passarem, continua para salvar
    setIsSubmitting(true);
    try {
      if (clienteAtual) {
        await updateCliente(clienteAtual.id, data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await addCliente(data);
        toast.success("Cliente adicionado com sucesso!");
      }
      handleCloseModals();
      fetchClientesData();
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar o cliente.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (password) => {
    if (!password) {
      toast.error("A senha é obrigatória.");
      return;
    }

    setIsSubmitting(true); // Ativa o loading
    try {
      // 1. Autentica UMA VEZ
      const success = await reauthenticate(password);

      if (success) {
        // Cenário A: Exclusão Única (clicou na lixeira da linha)
        if (clienteAtual) {
          await deleteCliente(clienteAtual.id);
          toast.success("Cliente excluído com sucesso!");
        }
        // Cenário B: Exclusão em Massa (clicou no botão Excluir Selecionados)
        else if (selectedClients.length > 0) {
          // Executa todas as exclusões simultaneamente
          const deletePromises = selectedClients.map((id) => deleteCliente(id));
          await Promise.all(deletePromises);

          toast.success(
            `${selectedClients.length} clientes excluídos com sucesso!`
          );
          setSelectedClients([]); // Limpa a seleção
        }

        // Fecha modal e atualiza dados
        handleCloseModals();

        // Volta para página 1 se necessário ou recarrega
        setCurrentPage(1);
        setPageLastVisible({}); // Reseta paginação do Firestore
        fetchClientesData();
      } else {
        toast.error("Senha incorreta. A exclusão foi cancelada.");
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao excluir.");
      console.error("Erro na exclusão: ", err);
    } finally {
      setIsSubmitting(false); // Desativa o loading
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setPageLastVisible({});
  };

  // === CONFIGURAÇÃO PARA O DATATABLE ===
  const columns = [
    {
      key: "nome",
      header: "Nome",
      sortable: true,
      skeletonWidth: "w-48",
      renderCell: (item, index) => (
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 h-10 w-10 ${
              avatarColors[index % avatarColors.length]
            } rounded-full flex items-center justify-center text-white font-bold mr-3`}
          >
            {getInitials(item.nome)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.nome}</div>
            <div className="text-sm text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    { key: "cpf", header: "CPF/CNPJ", sortable: true, skeletonWidth: "w-32" },
    {
      key: "dataNascimento",
      header: "Nascimento",
      sortable: false,
      skeletonWidth: "w-24",
      renderCell: (item) =>
        item.dataNascimento
          ? item.dataNascimento.toDate().toLocaleDateString("pt-BR")
          : "N/A",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      skeletonWidth: "w-24",
      renderCell: (item) => (
        <span
          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === "Ativo"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      sortable: false,
      skeletonWidth: "w-28",
      renderCell: (item) => (
        <div className="flex gap-3 text-lg">
          <button
            onClick={() => handleOpenFormModal(item)}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title="Editar"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => handleOpenViewModal(item)}
            className="text-gray-500 hover:text-teal-600 transition-colors"
            title="Visualizar"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          <button
            onClick={() => handleOpenDeleteModal(item)}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Excluir"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ),
    },
  ];

  const EmptyState = () => (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-700">
        Nenhum cliente encontrado
      </h3>
      <p className="text-sm text-gray-500">
        Ajuste os filtros ou adicione um novo cliente para começar.
      </p>
    </div>
  );

  const totalPages = Math.ceil(totalClientes / PER_PAGE);

  return (
    <div>
      <LoadingSpinner loading={loading || isSubmitting} />

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-gray-500">Gerencie seu cadastro de clientes</p>
        </div>
        <div className="flex gap-2">
          {selectedClients.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faTrash} /> Excluir (
              {selectedClients.length})
            </button>
          )}
          <button
            onClick={() => handleOpenFormModal()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* CARD BRANCO PRINCIPAL COM A TABELA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-light">
        {/* BARRA DE BUSCA E FILTROS */}
        <div className="flex justify-between items-center mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchClientesData();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome..."
              className="border rounded-lg p-2 w-64"
            />
            <button
              type="submit"
              className="bg-secondary text-white px-4 rounded-lg hover:bg-opacity-90"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>
          <div className="flex items-center">
            <span className="mr-4 text-sm text-gray-600">
              Filtrar por Status:
            </span>
            <div className="flex border rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setPageLastVisible({});
                  setStatusFilter("");
                }}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  !statusFilter ? "bg-secondary text-white" : "hover:bg-light"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setPageLastVisible({});
                  setStatusFilter("Ativo");
                }}
                className={`px-3 py-2 text-sm border-l ${
                  statusFilter === "Ativo"
                    ? "bg-secondary text-white"
                    : "hover:bg-light"
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setPageLastVisible({});
                  setStatusFilter("Inativo");
                }}
                className={`px-3 py-2 text-sm rounded-r-lg border-l ${
                  statusFilter === "Inativo"
                    ? "bg-secondary text-white"
                    : "hover:bg-light"
                }`}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* AQUI ESTÁ A MUDANÇA PRINCIPAL: USANDO O COMPONENTE DATATABLE */}
        <DataTable
          data={sortedClientes}
          columns={columns} // 'columns' é a constante que você define fora do return
          isLoading={loading}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedItems={selectedClients}
          onSelectItem={handleSelectClient}
          onSelectAll={handleSelectAll}
          emptyStateComponent={<EmptyState />} // 'EmptyState' é o componente que você define fora do return
          rowKey="id"
        />

        {/* RODAPÉ COM PAGINAÇÃO */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {clientes.length} de {totalClientes} clientes
          </div>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-light disabled:opacity-50"
              >
                Anterior
              </button>
              {[...Array(totalPages).keys()].map((num) => (
                <button
                  key={num + 1}
                  onClick={() => setCurrentPage(num + 1)}
                  className={`px-3 py-1 border rounded-lg ${
                    currentPage === num + 1
                      ? "bg-secondary text-white"
                      : "hover:bg-light"
                  }`}
                >
                  {num + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-light disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAIS */}
      <ClienteFormModal
        isOpen={formModalOpen}
        onRequestClose={handleCloseModals}
        onSave={handleSave}
        cliente={clienteAtual}
        isSubmitting={isSubmitting}
      />
      <ClienteViewModal
        isOpen={viewModalOpen}
        onRequestClose={handleCloseModals}
        cliente={clienteAtual}
      />
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onRequestClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Clientes;
