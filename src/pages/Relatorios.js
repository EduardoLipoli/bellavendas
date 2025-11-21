import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCsv,
  faDownload,
  faCalendarAlt,
  faBoxOpen,
  faShoppingCart,
  faUsers,
  faFileInvoiceDollar,
  faSpinner,
  faChartLine,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

// Importando os serviços de busca de dados
import {
  getVendas,
  getProdutos,
  getContas,
  getClientes,
} from "../services/firestoreService";

const Relatorios = () => {
  const [loading, setLoading] = useState({
    vendas: false,
    produtos: false,
    financeiro: false,
    clientes: false,
  });

  // Estados para filtros de data
  const [filtroVendas, setFiltroVendas] = useState({ inicio: "", fim: "" });
  const [filtroContas, setFiltroContas] = useState({ inicio: "", fim: "" });

  // --- FUNÇÃO GENÉRICA PARA BAIXAR CSV ---
  const downloadCSV = (data, headers, fileName) => {
    const csvContent = [
      headers.join(";"), // Cabeçalho
      ...data.map((row) => row.join(";")), // Linhas
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${fileName}_${new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 1. RELATÓRIO DE VENDAS ---
  const gerarRelatorioVendas = async () => {
    setLoading((prev) => ({ ...prev, vendas: true }));
    try {
      const todasVendas = await getVendas();

      // Filtrar por data se houver seleção
      const vendasFiltradas = todasVendas.filter((venda) => {
        if (!venda.data?.seconds) return false;
        const dataVenda = new Date(venda.data.seconds * 1000);
        const inicio = filtroVendas.inicio
          ? new Date(filtroVendas.inicio)
          : null;
        const fim = filtroVendas.fim
          ? new Date(`${filtroVendas.fim}T23:59:59`)
          : null;

        if (inicio && dataVenda < inicio) return false;
        if (fim && dataVenda > fim) return false;
        return true;
      });

      if (vendasFiltradas.length === 0) {
        toast.error("Nenhuma venda encontrada no período.");
        setLoading((prev) => ({ ...prev, vendas: false }));
        return;
      }

      const headers = [
        "ID",
        "Data",
        "Cliente",
        "Status",
        "Forma Pagamento",
        "Total (R$)",
      ];
      const rows = vendasFiltradas.map((v) => [
        v.id,
        new Date(v.data.seconds * 1000).toLocaleDateString("pt-BR"),
        `"${v.cliente?.nome || "Consumidor"}"`,
        v.statusPagamento,
        v.formaPagamento,
        parseFloat(v.total || 0)
          .toFixed(2)
          .replace(".", ","),
      ]);

      downloadCSV(rows, headers, "Relatorio_Vendas");
      toast.success("Relatório de Vendas gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading((prev) => ({ ...prev, vendas: false }));
    }
  };

  // --- 2. RELATÓRIO DE ESTOQUE (PRODUTOS) ---
  const gerarRelatorioProdutos = async () => {
    setLoading((prev) => ({ ...prev, produtos: true }));
    try {
      const produtos = await getProdutos();

      const headers = [
        "Produto",
        "Categoria",
        "Fornecedor",
        "Custo",
        "Preço Venda",
        "Estoque Atual",
        "Status",
      ];
      const rows = produtos.map((p) => [
        `"${p.nome}"`,
        p.categoria,
        `"${p.fornecedorNome || ""}"`,
        parseFloat(p.custo || 0)
          .toFixed(2)
          .replace(".", ","),
        parseFloat(p.preco || 0)
          .toFixed(2)
          .replace(".", ","),
        p.estoque,
        p.status,
      ]);

      downloadCSV(rows, headers, "Relatorio_Estoque");
      toast.success("Relatório de Estoque gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading((prev) => ({ ...prev, produtos: false }));
    }
  };

  // --- 3. RELATÓRIO FINANCEIRO (CONTAS A PAGAR) ---
  const gerarRelatorioContas = async () => {
    setLoading((prev) => ({ ...prev, financeiro: true }));
    try {
      const contas = await getContas();

      // Filtrar por data de vencimento
      const contasFiltradas = contas.filter((conta) => {
        let dataVenc = null;
        if (conta.dataVencimento?.seconds) {
          dataVenc = new Date(conta.dataVencimento.seconds * 1000);
        } else {
          dataVenc = new Date(conta.dataVencimento);
        }

        const inicio = filtroContas.inicio
          ? new Date(filtroContas.inicio)
          : null;
        const fim = filtroContas.fim
          ? new Date(`${filtroContas.fim}T23:59:59`)
          : null;

        if (inicio && dataVenc < inicio) return false;
        if (fim && dataVenc > fim) return false;
        return true;
      });

      const headers = [
        "Descrição",
        "Fornecedor",
        "Vencimento",
        "Valor",
        "Status",
        "Categoria",
      ];
      const rows = contasFiltradas.map((c) => {
        const dataVenc = c.dataVencimento?.seconds
          ? new Date(c.dataVencimento.seconds * 1000).toLocaleDateString(
              "pt-BR"
            )
          : new Date(c.dataVencimento).toLocaleDateString("pt-BR");

        return [
          `"${c.descricao}"`,
          `"${c.fornecedorNome || ""}"`,
          dataVenc,
          parseFloat(c.valor || 0)
            .toFixed(2)
            .replace(".", ","),
          c.status,
          c.categoria,
        ];
      });

      downloadCSV(rows, headers, "Relatorio_Contas_Pagar");
      toast.success("Relatório Financeiro gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading((prev) => ({ ...prev, financeiro: false }));
    }
  };

  // --- 4. RELATÓRIO DE CLIENTES ---
  const gerarRelatorioClientes = async () => {
    setLoading((prev) => ({ ...prev, clientes: true }));
    try {
      // Passamos um objeto vazio para pegar todos, ignorando paginação padrão
      const result = await getClientes({ perPage: 10000 });
      const clientes = result.data || [];

      const headers = ["Nome", "Email", "CPF/CNPJ", "Telefone", "Status"];
      const rows = clientes.map((c) => [
        `"${c.nome}"`,
        c.email,
        c.cpf,
        c.telefone || "",
        c.status,
      ]);

      downloadCSV(rows, headers, "Relatorio_Clientes_Completo");
      toast.success("Lista de Clientes gerada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading((prev) => ({ ...prev, clientes: false }));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div>
            {/* CORRIGIDO AQUI: Apenas um h2 */}
            <h2 className="text-2xl font-bold">Central de Relatórios</h2>
            <p className="text-gray-600 mt-1">
              Exporte dados detalhados para análise e controle do seu negócio
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <FontAwesomeIcon
                  icon={faShoppingCart}
                  className="text-blue-600 text-sm"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendas</p>
                <p className="font-semibold text-gray-800">Período</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <FontAwesomeIcon
                  icon={faBoxOpen}
                  className="text-green-600 text-sm"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estoque</p>
                <p className="font-semibold text-gray-800">Completo</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <FontAwesomeIcon
                  icon={faFileInvoiceDollar}
                  className="text-red-600 text-sm"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Financeiro</p>
                <p className="font-semibold text-gray-800">Contas a pagar</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="text-purple-600 text-sm"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clientes</p>
                <p className="font-semibold text-gray-800">Base completa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Vendas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <FontAwesomeIcon
                    icon={faShoppingCart}
                    className="text-blue-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Relatório de Vendas
                  </h3>
                  <p className="text-sm text-gray-500">
                    Histórico completo de vendas
                  </p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                CSV
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-3 block">
                  Filtrar por período
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      value={filtroVendas.inicio}
                      onChange={(e) =>
                        setFiltroVendas({
                          ...filtroVendas,
                          inicio: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      value={filtroVendas.fim}
                      onChange={(e) =>
                        setFiltroVendas({
                          ...filtroVendas,
                          fim: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={gerarRelatorioVendas}
                disabled={loading.vendas}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-xs"
              >
                {loading.vendas ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faDownload} className="text-lg" />
                )}
                {loading.vendas ? "Gerando relatório..." : "Exportar Relatório"}
              </button>
            </div>
          </div>
        </div>

        {/* Card de Produtos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-xl">
                  <FontAwesomeIcon
                    icon={faBoxOpen}
                    className="text-green-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Inventário de Estoque
                  </h3>
                  <p className="text-sm text-gray-500">
                    Produtos, custos e quantidades
                  </p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                CSV
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Relatório completo com todos os produtos cadastrados,
                  incluindo custos, preços de venda, quantidade em estoque e
                  status de cada item.
                </p>
              </div>

              <button
                onClick={gerarRelatorioProdutos}
                disabled={loading.produtos}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-xs"
              >
                {loading.produtos ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faFileCsv} className="text-lg" />
                )}
                {loading.produtos
                  ? "Gerando inventário..."
                  : "Exportar Inventário"}
              </button>
            </div>
          </div>
        </div>

        {/* Card Financeiro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl">
                  <FontAwesomeIcon
                    icon={faFileInvoiceDollar}
                    className="text-red-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Contas a Pagar
                  </h3>
                  <p className="text-sm text-gray-500">
                    Despesas e vencimentos
                  </p>
                </div>
              </div>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                CSV
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-3 block">
                  Filtrar por vencimento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      value={filtroContas.inicio}
                      onChange={(e) =>
                        setFiltroContas({
                          ...filtroContas,
                          inicio: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      value={filtroContas.fim}
                      onChange={(e) =>
                        setFiltroContas({
                          ...filtroContas,
                          fim: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={gerarRelatorioContas}
                disabled={loading.financeiro}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-xs"
              >
                {loading.financeiro ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faDownload} className="text-lg" />
                )}
                {loading.financeiro
                  ? "Gerando relatório..."
                  : "Exportar Financeiro"}
              </button>
            </div>
          </div>
        </div>

        {/* Card de Clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-xl">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-purple-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Base de Clientes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dados completos de contato
                  </p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                CSV
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Exporte a lista completa de clientes com informações de
                  contato, documentos e status para campanhas de marketing ou
                  backup de dados.
                </p>
              </div>

              <button
                onClick={gerarRelatorioClientes}
                disabled={loading.clientes}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-xs"
              >
                {loading.clientes ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faDatabase} className="text-lg" />
                )}
                {loading.clientes
                  ? "Gerando base..."
                  : "Exportar Base de Clientes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Todos os relatórios são gerados em formato CSV compatível com Excel,
          Google Sheets e outros aplicativos de planilha
        </p>
      </div>
    </div>
  );
};

export default Relatorios;
