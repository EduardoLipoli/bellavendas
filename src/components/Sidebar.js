import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/authService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faTachometerAlt,
  faUsers,
  faBoxOpen,
  faShoppingCart,
  faReceipt,
  faChartBar,
  faCog,
  faTruck,
  faSignOutAlt,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

// --- COMPONENTE AUXILIAR PARA OS ITENS DO MENU ---
// Adicionamos a lógica de Tooltip aqui para manter o código principal limpo
const NavItem = ({ to, icon, label, collapsed }) => {
  const activeStyle = {
    backgroundColor: "rgba(248, 183, 213, 0.2)",
    color: "#d53f8c",
    borderRight: collapsed ? "4px solid #d53f8c" : "none", // Borda na direita quando recolhido
    borderLeft: collapsed ? "none" : "4px solid #d53f8c", // Borda na esquerda quando expandido
  };

  return (
    <NavLink
      to={to}
      style={({ isActive }) => (isActive ? activeStyle : undefined)}
      className="group relative flex items-center px-4 py-3 my-1 text-gray-700 rounded-lg font-medium hover:bg-pink-50 transition-all"
    >
      <FontAwesomeIcon
        icon={icon}
        className={`text-lg transition-all ${collapsed ? "mx-auto" : "mr-4"}`}
      />
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip que aparece apenas quando a sidebar está recolhida */}
      {collapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {label}
        </div>
      )}
    </NavLink>
  );
};

// --- COMPONENTE PRINCIPAL DA SIDEBAR ---
const Sidebar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Fecha o menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Array de itens para facilitar a renderização
  const navItems = [
    { to: "/", icon: faTachometerAlt, label: "Dashboard" },
    { to: "/clientes", icon: faUsers, label: "Clientes" },
    { to: "/produtos", icon: faBoxOpen, label: "Produtos" },
    { to: "/vendas", icon: faShoppingCart, label: "Vendas" },
    { to: "/fornecedores", icon: faTruck, label: "Fornecedores" },
    { to: "/contas-a-pagar", icon: faReceipt, label: "Contas a Pagar" },
    { to: "/relatorios", icon: faChartBar, label: "Relatórios" },
    { to: "/configuracoes", icon: faCog, label: "Configurações" },
  ];

  return (
    <div
      className={`bg-white h-screen sticky top-0 shadow-xl flex flex-col justify-between transition-all duration-300 z-[99999] ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Seção Superior: Logo e Navegação */}
      <div>
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center ${
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          <FontAwesomeIcon
            icon={faStore}
            className={`text-secondary text-2xl transition-all duration-300 ${
              !collapsed ? "mr-3" : ""
            }`}
          />
          {!collapsed && (
            <h1 className="text-xl font-bold text-secondary truncate">
              BellaVendas
            </h1>
          )}
        </div>

        {/* Itens do Menu */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      {/* Seção Inferior: Usuário e Botão de Recolher */}
      <div className="p-2 border-t border-gray-200">
        <div ref={userMenuRef} className="relative">
          {/* Menu Dropdown de Logout */}
          {isUserMenuOpen && !collapsed && (
            <div className="absolute bottom-full mb-2 w-full left-0 bg-white rounded-xl shadow-lg border border-gray-100 p-1 animate-fade-in">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          )}

          {/* Botão do Perfil do Usuário */}
          <button
            onClick={() => !collapsed && setIsUserMenuOpen((prev) => !prev)}
            className={`w-full flex items-center p-2 rounded-lg transition-colors ${
              !collapsed ? "hover:bg-gray-100" : "cursor-default"
            }`}
          >
            <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : "?"}
            </div>
            {!collapsed && (
              <div className="ml-3 text-left flex-1 truncate">
                <p className="font-semibold text-sm truncate">
                  {currentUser?.displayName || currentUser?.email}
                </p>
                <p className="text-xs text-gray-500">Usuário</p>
              </div>
            )}
            {!collapsed && (
              <FontAwesomeIcon
                icon={faChevronUp}
                className={`ml-2 text-xs transition-transform duration-300 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
        </div>

        {/* Botão para Recolher/Expandir a Sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 mt-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-secondary transition-colors"
        >
          <FontAwesomeIcon
            icon={collapsed ? faChevronRight : faChevronLeft}
            className="text-sm"
          />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
