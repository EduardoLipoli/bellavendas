# 🛍️ BellaVendas - Sistema de Gestão Comercial

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![Versão](https://img.shields.io/badge/Versão-1.0.0-blue)
![Licença](https://img.shields.io/badge/Licença-MIT-green)

> **BellaVendas** é uma solução completa e moderna para gestão de micro e pequenas empresas. Desenvolvido para simplificar o controle de estoque, vendas, financeiro e relacionamento com clientes em uma interface intuitiva e responsiva.

---

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Dashboard+BellaVendas" alt="Dashboard BellaVendas" width="800"/>
</div>

---

## ✨ Funcionalidades Principais

### 📊 Dashboard Inteligente
* **KPIs em Tempo Real:** Acompanhamento de Vendas Hoje, Clientes Ativos, Total do Mês e Alertas de Estoque.
* **Gráficos e Resumos:** Visualização rápida de produtos mais vendidos e desempenho financeiro.
* **Ticket Médio:** Análise de ticket médio diário e mensal.

### 📦 Gestão de Produtos e Estoque
* **Cadastro Completo:** Upload de imagens (integração Cloudinary), categorização e fornecedores.
* **Precificação Inteligente:** Cálculo automático de margem de lucro (%) com indicadores visuais de saúde financeira.
* **Controle de Estoque:** Alertas visuais para estoque baixo e status (Ativo, Esgotado, Inativo).

### 💰 Vendas e PDV
* **Registro Ágil:** Fluxo de venda simplificado com seleção de clientes e produtos.
* **Status Financeiro:** Controle de pagamentos (Pendente, Pago, Atrasado, Cancelado).
* **Histórico:** Listagem completa com filtros avançados por data, status e forma de pagamento.

### 💸 Financeiro (Contas a Pagar)
* **Controle de Despesas:** Gestão de contas operacionais, fornecedores e custos fixos.
* **Status de Pagamento:** Marcação de contas pagas e visualização de atrasos.
* **Filtros:** Organização por centro de custo, categoria e periodicidade.

### 👥 CRM (Clientes e Fornecedores)
* **Gestão de Entidades:** CRUD completo de Clientes e Fornecedores.
* **Histórico:** Visualização rápida de compras por cliente.

### 📈 Relatórios e Exportação
* **Formatos Compatíveis:** Exportação de dados em **CSV** (Excel/Sheets).
* **Tipos de Relatório:** Vendas, Inventário de Estoque, Financeiro e Base de Clientes.

### ⚙️ Configurações e Segurança
* **Autenticação:** Login seguro via Firebase Auth.
* **Personalização:** Modos de tema (Dark Mode), dados da empresa e gestão de usuários.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando as melhores práticas de desenvolvimento web moderno:

| Categoria | Tecnologias |
| :--- | :--- |
| **Frontend** | React.js, React Router DOM |
| **Estilização** | Tailwind CSS, FontAwesome |
| **Backend / BaaS** | Firebase (Firestore, Auth, Functions) |
| **Uploads** | Cloudinary (Imagens de produtos) |
| **Data/Hora** | date-fns, React Datepicker |
| **UI/UX** | Framer Motion (Animações), React Hot Toast (Notificações) |