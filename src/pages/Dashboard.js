// Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faUsers,
  faExclamationTriangle,
  faChartLine,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";

// Importe suas funções do serviço
import {
  getDashboardStats,
  getRecentSales,
  getRecentProducts,
  getTopSellingProducts,
  getTopCustomers,
  getTopSuppliers,
  getTopCategories,
} from "../services/firestoreService";

// --- HELPERS ---

const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "?";
  const names = name.trim().split(" ");
  if (names.length === 0) return "?";
  const initials = names.map((n) => n[0]).join("");
  return initials.substring(0, 2).toUpperCase();
};

const Avatar = ({ src, name, size = "w-10 h-10" }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(!src); // Reseta o erro se a URL mudar
  }, [src]);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-blue-200 text-blue-800 font-bold ${size}`}
        title={name}
      >
        <span>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover ${size}`}
      onError={() => setError(true)}
    />
  );
};

const ProductImage = ({ src, name }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (error || !src) {
    return (
      <div className="bg-gray-100 w-16 h-16 rounded-xl flex items-center justify-center border border-gray-200">
        <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400 text-2xl" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

// --- SUB-COMPONENTES ---

const SummaryCard = ({ title, value, icon, color, loading }) => (
  <div
    className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
      loading ? "animate-pulse" : ""
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div
        className="p-3 rounded-full text-white flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color }}
      >
        <FontAwesomeIcon icon={icon} className="text-xl" />
      </div>
    </div>
  </div>
);

const RecentSalesTable = ({ sales, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Vendas Recentes</h3>
      <Link
        to="/vendas"
        className="text-sm text-blue-500 cursor-pointer hover:underline focus:outline-none"
      >
        Ver todas
      </Link>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading
            ? Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={`skeleton-sale-${i}`}>
                    <td colSpan="4" className="px-4 py-4">
                      <div className="animate-pulse flex items-center space-x-4">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
            : sales.map((sale, index) => (
                <tr
                  key={sale.id || `sale-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        src={sale.cliente?.imageUrl}
                        name={sale.cliente?.nome || "Cliente"}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.cliente?.nome || "Desconhecido"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.cliente?.email || "Email não inf."}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {(sale.total ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {sale.data?.seconds
                      ? new Date(sale.data.seconds * 1000).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${
                    sale.status === "Pago"
                      ? "bg-green-100 text-green-800"
                      : sale.status === "Pendente"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                    >
                      {sale.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RecentProducts = ({ products, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Produtos Recentes</h3>
      <Link
        to="/produtos"
        className="text-sm text-blue-500 cursor-pointer hover:underline focus:outline-none"
      >
        Ver todos
      </Link>
    </div>
    <div className="space-y-4">
      {loading
        ? Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={`skeleton-prod-${i}`}
                className="flex items-center animate-pulse"
              >
                <div className="bg-gray-200 rounded-xl w-16 h-16" />
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
        : products.map((product, index) => (
            <div
              key={product.id || `prod-${index}`}
              className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ProductImage src={product.imageUrl} name={product.nome} />
              <div className="ml-4 flex-1">
                <h4 className="font-medium text-gray-900">
                  {product.nome || "Produto sem nome"}
                </h4>
                <p className="text-sm text-gray-500">
                  {product.categoria || "Geral"} • R${" "}
                  {(product.preco ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="ml-auto flex items-center">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    (product.estoque ?? 0) < 5
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  Estoque: {product.estoque ?? 0}
                </span>
              </div>
            </div>
          ))}
    </div>
  </div>
);

const TopSellingProducts = ({ products, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Produtos Mais Vendidos
    </h3>
    <div className="space-y-4">
      {loading
        ? Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={`topselling-skeleton-${i}`}
                className="flex items-center animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="ml-4 flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))
        : products.map((product, index) => (
            <div
              key={product.id || `top-prod-${index}`}
              className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-800 font-medium flex-shrink-0">
                {index + 1}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="font-medium text-gray-900">{product.nome}</h4>
                <p className="text-sm text-gray-500">{product.categoria}</p>
              </div>
              <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {product.quantidade ?? 0} vendas
              </span>
            </div>
          ))}
    </div>
  </div>
);

const AverageTicket = ({ daily, monthly, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Médio</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
        <p className="text-sm text-blue-700 font-medium">Diário</p>
        <div className="mt-2">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <h4 className="text-2xl font-bold text-gray-800">
              R$ {(daily ?? 0).toFixed(2)}
            </h4>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
        <p className="text-sm text-purple-700 font-medium">Mensal</p>
        <div className="mt-2">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <h4 className="text-2xl font-bold text-gray-800">
              R$ {(monthly ?? 0).toFixed(2)}
            </h4>
          )}
        </div>
      </div>
    </div>
  </div>
);

const FinancialSummary = ({
  totalVendas = 0,
  totalCustos = 0,
  totalDespesas = 0,
  loading,
}) => {
  const vendas = Number(totalVendas);
  const custos = Number(totalCustos);
  const despesas = Number(totalDespesas);

  const lucroBruto = vendas - custos;
  const lucroLiquido = lucroBruto - despesas;

  const margemBruta = vendas > 0 ? (lucroBruto / vendas) * 100 : 0;
  const margemLiquida = vendas > 0 ? (lucroLiquido / vendas) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Resumo Financeiro do Mês
      </h3>
      <div className="space-y-3">
        {/* Total Vendido */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Total Vendido
          </span>
          {loading ? (
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <span className="text-lg font-bold text-gray-800">
              R$ {vendas.toFixed(2)}
            </span>
          )}
        </div>

        {/* Lucro Bruto */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Lucro Bruto</span>
          {loading ? (
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <span className="text-lg font-bold text-green-600">
              R$ {lucroBruto.toFixed(2)} ({margemBruta.toFixed(1)}%)
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          Vendas - Custo dos Produtos
        </p>

        {/* Lucro Líquido */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">
            Lucro Líquido
          </span>
          {loading ? (
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <span
              className={`text-lg font-bold ${
                lucroLiquido >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              R$ {lucroLiquido.toFixed(2)} ({margemLiquida.toFixed(1)}%)
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 -mt-2">Lucro Bruto - Despesas</p>
      </div>
    </div>
  );
};

const TopCategories = ({ categories, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Categorias Mais Vendidas
    </h3>
    <div className="space-y-3">
      {loading
        ? Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={`cat-skeleton-${i}`} className="animate-pulse">
                <div className="flex justify-between mb-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"></div>
              </div>
            ))
        : categories.map((category, index) => (
            <div key={category.id || `cat-${index}`} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {category.nome}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {category.percentual}%
                </span>
              </div>
              {/* Adicionado overflow-hidden para cortar a barra se passar do limite */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full"
                  // Math.min garante que o CSS nunca receba mais de 100% na largura
                  style={{ width: `${Math.min(category.percentual, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
    </div>
  </div>
);

const TopCustomers = ({ customers, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Clientes que Mais Compraram
      </h3>
      <Link
        to="/clientes"
        className="text-sm text-blue-500 cursor-pointer hover:underline focus:outline-none"
      >
        Ver todos
      </Link>
    </div>
    <div className="space-y-4">
      {loading
        ? Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={`cust-skeleton-${i}`}
                className="flex items-center animate-pulse"
              >
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
        : customers.map((customer, index) => (
            <div
              key={customer.id || `cust-${index}`}
              className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Avatar src={customer.imageUrl} name={customer.nome} />
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">
                  {customer.nome || "Cliente"}
                </h4>
                <p className="text-sm text-gray-500">
                  {customer.totalCompras ?? 0} compras
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-sm font-medium text-gray-900">
                  R$ {(customer.valorTotal ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
    </div>
  </div>
);

const TopSuppliers = ({ suppliers, loading }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Fornecedores Mais Utilizados
    </h3>
    <div className="space-y-4">
      {loading ? (
        Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={`sup-skeleton-${i}`}
              className="flex items-center animate-pulse"
            >
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-4 flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          ))
      ) : suppliers.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Nenhum dado de fornecedor disponível no momento.
        </p>
      ) : (
        suppliers.map((supplier, index) => (
          <div
            key={supplier.id || `sup-${index}`}
            className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Avatar name={supplier.nome} />
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">{supplier.nome}</h4>
              <p className="text-sm text-gray-500">
                {supplier.produtosFornecidos} produtos
              </p>
            </div>
            <div className="ml-auto flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {supplier.pedidos} pedidos
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL DO DASHBOARD ---

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVendasHoje: 0,
    totalClientesAtivos: 0,
    totalEstoqueBaixo: 0,
    totalVendasMes: 0,
    totalGastosMes: 0,
    totalCustoProdutosVendidosMes: 0,
    vendasHojeCount: 0,
  });

  const [recentSales, setRecentSales] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Busque os dados principais
        const [
          statsData,
          salesData,
          recentProductsData,
          topSellingData,
          topCustomersData,
          topCategoriesData,
        ] = await Promise.all([
          getDashboardStats(),
          getRecentSales(),
          getRecentProducts(),
          getTopSellingProducts(),
          getTopCustomers(),
          getTopCategories(),
        ]);

        setStats((prev) => ({ ...prev, ...statsData }));
        setRecentSales(salesData || []);
        setRecentProducts(recentProductsData || []);
        setTopSellingProducts(topSellingData || []);
        setTopCustomers(topCustomersData || []);
        setTopCategories(topCategoriesData || []);

        // 2. Busca isolada de fornecedores (Try/Catch separado para não quebrar o resto)
        try {
          // Descomente quando o backend estiver pronto:
          // const suppliersData = await getTopSuppliers();
          // setTopSuppliers(suppliersData || []);
          setTopSuppliers([]); // Mantém vazio por enquanto
        } catch (supplierError) {
          console.warn("Erro ao buscar fornecedores:", supplierError);
          setTopSuppliers([]);
        }
      } catch (error) {
        console.error("Erro crítico ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Cálculos de Ticket Médio com proteção contra divisão por zero
  const dailyAverageTicket =
    (stats.vendasHojeCount ?? 0) > 0
      ? (stats.totalVendasHoje ?? 0) / stats.vendasHojeCount
      : 0;

  const monthlyAverageTicket =
    (stats.totalVendasMes ?? 0) > 0
      ? stats.totalVendasMes / 30 // Média simples de 30 dias
      : 0;

  return (
    <div>
      {/* Spinner global é opcional já que temos skeletons */}
      <LoadingSpinner loading={loading} />

      <div className=" min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500">Resumo completo do sistema</p>
        </div>

        {/* Grid de cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <SummaryCard
            title="Vendas Hoje"
            value={`R$ ${(stats.totalVendasHoje ?? 0).toFixed(2)}`}
            icon={faShoppingCart}
            color="#f8b7d5"
            loading={loading}
          />
          <SummaryCard
            title="Clientes Ativos"
            value={stats.totalClientesAtivos ?? 0}
            icon={faUsers}
            color="#d0bdf4"
            loading={loading}
          />
          <SummaryCard
            title="Estoque Baixo"
            value={stats.totalEstoqueBaixo ?? 0}
            icon={faExclamationTriangle}
            color="#ffaaa5"
            loading={loading}
          />
          <SummaryCard
            title="Total do Mês"
            value={`R$ ${(stats.totalVendasMes ?? 0).toFixed(2)}`}
            icon={faChartLine}
            color="#a0d2eb"
            loading={loading}
          />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Coluna 1 (Esquerda/Larga) */}
          <div className="lg:col-span-2 space-y-6">
            <RecentSalesTable sales={recentSales} loading={loading} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FinancialSummary
                totalVendas={stats.totalVendasMes}
                totalCustos={stats.totalCustoProdutosVendidosMes}
                totalDespesas={stats.totalGastosMes}
                loading={loading}
              />
              <AverageTicket
                daily={dailyAverageTicket}
                monthly={monthlyAverageTicket}
                loading={loading}
              />
            </div>

            <TopSellingProducts
              products={topSellingProducts}
              loading={loading}
            />
          </div>

          {/* Coluna 2 (Direita/Estreita) */}
          <div className="space-y-6">
            <RecentProducts products={recentProducts} loading={loading} />
            <TopCategories categories={topCategories} loading={loading} />
            <TopCustomers customers={topCustomers} loading={loading} />
            <TopSuppliers suppliers={topSuppliers} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
