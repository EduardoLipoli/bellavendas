import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Importe o 'toast' e 'ToastBar' para customizar a notificação
import { Toaster, toast, ToastBar } from 'react-hot-toast';

import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Vendas from './pages/Vendas';
import Fornecedores from './pages/Fornecedores';
import ContasAPagar from './pages/ContasAPagar';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <AuthProvider>
      <Toaster
        // 1. Posição alterada para a parte de baixo
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            fontSize: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
            style: {
              background: '#F0FFF4',
              border: '1px solid #a8e6cf',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
            style: {
              background: '#FFF5F5',
              border: '1px solid #ffaaa5',
            },
          },
        }}
      >
        {/* 2. Adiciona o botão de fechar (X) em cada notificação */}
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '0 0 0 10px',
                      lineHeight: '1'
                    }}
                    onClick={() => toast.dismiss(t.id)}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      
      <Router>
        <Routes>
          {/* Rota pública de Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Protegidas que usam o Layout Principal */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            {/* Páginas que aparecerão dentro do MainLayout */}
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="contas-a-pagar" element={<ContasAPagar />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;