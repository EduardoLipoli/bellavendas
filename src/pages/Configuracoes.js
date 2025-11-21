import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toast from 'react-hot-toast';

// Componentes de UI e Serviços
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleConfirmModal from '../components/SimpleConfirmModal';
import { 
    getCategorias, 
    addCategoria, 
    updateCategoria, 
    deleteCategoria,
    saveSettings, // <--- NOVA FUNÇÃO
    getSettings   // <--- NOVA FUNÇÃO
} from '../services/firestoreService';

// Ícones
import { 
  faPlus, faEdit, faTrash, faSpinner, faUser, 
  faBuilding, faBox, faTags, faCog, faSave, 
  faTimes, faLock, faBell, faChartBar, 
  faShieldAlt, faInfoCircle, faEnvelope, 
  faToggleOn, faToggleOff 
} from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTES AUXILIARES ---

const TabButton = ({ name, icon, label, activeTab, setActiveTab }) => (
    <button
      className={`flex items-center gap-2 py-3 px-4 rounded-t-lg transition-all duration-300 whitespace-nowrap ${
        activeTab === name 
          ? 'bg-white text-primary border-b-2 border-primary font-medium' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(name)}
    >
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </button>
);

const SectionCard = ({ title, icon, children, className = "" }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4 border-b pb-2">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl" />
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
);

const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
        <span className="text-gray-700 font-medium">{label}</span>
        <button 
            onClick={() => onChange(!checked)}
            className={`text-2xl transition-colors duration-300 focus:outline-none ${checked ? 'text-green-500' : 'text-gray-300'}`}
        >
            <FontAwesomeIcon icon={checked ? faToggleOn : faToggleOff} />
        </button>
    </div>
);

const FormInput = ({ label, type = "text", value, onChange, placeholder, name, className = "" }) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input 
            type={type} 
            name={name}
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder} 
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
        />
    </div>
);

const FormSelect = ({ label, value, onChange, options, name }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select 
            name={name}
            value={value} 
            onChange={onChange} 
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

const Configuracoes = () => {
  // Estados de UI
  const [activeTab, setActiveTab] = useState('categorias');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DAS ABAS ---

  // 1. Categorias (Separado pois é uma coleção própria)
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtual, setCategoriaAtual] = useState(null);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);

  // 2. Usuários (Salvo no documento de config global para simplicidade)
  const [usuarios, setUsuarios] = useState([
    { id: 1, nome: 'Admin Principal', email: 'admin@bellavendas.com', funcao: 'Administrador' }
  ]);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', funcao: 'Vendedor' });

  // 3. Empresa
  const [empresa, setEmpresa] = useState({ 
      nome: '', cnpj: '', endereco: '', cidade: '', estado: '', telefone: '', email: '', cep: ''
  });

  // 4. Estoque
  const [estoque, setEstoque] = useState({ 
      unidadeMedidaPadrao: 'un', 
      alertaEstoqueMinimo: 10, 
      controlarValidade: true, 
      metodoCusto: 'Medio',
      permitirEstoqueNegativo: false
  });

  // 5. Configurações Gerais
  const [geral, setGeral] = useState({
      moeda: 'BRL',
      fusoHorario: 'America/Sao_Paulo',
      notificacoesEmail: true,
      notificacoesSistema: true,
      temaEscuro: false,
      backupAutomatico: 'semanal'
  });

  // 6. Segurança
  const [seguranca, setSeguranca] = useState({ 
      autenticacaoDoisFatores: false, 
      exigirSenhaForte: true, 
      tempoSessao: 60, 
      historicoLogin: true
  });

  // --- CARREGAMENTO DE DADOS ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Busca Categorias (Coleção separada)
      const categoriasData = await getCategorias();
      setCategorias(categoriasData);
      
      // 2. Busca Configurações Globais (Documento único)
      const settings = await getSettings();
      
      if(settings) {
          // Se existirem dados salvos, atualiza os estados
          if (settings.empresa) setEmpresa(prev => ({...prev, ...settings.empresa}));
          if (settings.estoque) setEstoque(prev => ({...prev, ...settings.estoque}));
          if (settings.geral) setGeral(prev => ({...prev, ...settings.geral}));
          if (settings.seguranca) setSeguranca(prev => ({...prev, ...settings.seguranca}));
          if (settings.usuarios && Array.isArray(settings.usuarios)) setUsuarios(settings.usuarios);
      }

    } catch (error) {
      toast.error("Erro ao carregar configurações.");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS GERAIS ---
  
  const handleChange = (setter) => (e) => {
      const { name, value, type, checked } = e.target;
      setter(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
  };

  // Salva TUDO no Firestore
  const handleSaveAllChanges = async () => {
    setIsSubmitting(true);
    try {
        const configData = {
            empresa,
            estoque,
            geral,
            seguranca,
            usuarios // Salvando usuários aqui também
        };
        
        await saveSettings(configData);

        toast.success("Configurações salvas com sucesso!");
    } catch (error) {
        console.error(error);
        toast.error("Erro ao salvar configurações.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- HANDLERS CATEGORIA (Mantidos independentes pois usam coleção própria) ---
  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    if (!nomeCategoria.trim()) return toast.error("Nome obrigatório.");
    setIsSubmitting(true);
    try {
      if (categoriaAtual) {
        await updateCategoria(categoriaAtual.id, { nome: nomeCategoria });
        toast.success("Categoria atualizada!");
      } else {
        await addCategoria({ nome: nomeCategoria });
        toast.success("Categoria criada!");
      }
      setCategoriaAtual(null);
      setNomeCategoria('');
      // Recarrega apenas categorias
      const novasCategorias = await getCategorias();
      setCategorias(novasCategorias);
    } catch (error) {
      toast.error("Erro ao salvar categoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCategoria = async () => {
    if (!categoriaToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteCategoria(categoriaToDelete.id);
      toast.success("Categoria excluída!");
      const novasCategorias = await getCategorias();
      setCategorias(novasCategorias);
    } catch (error) {
      toast.error("Erro ao excluir.");
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setCategoriaToDelete(null);
    }
  };

  // --- HANDLER USUÁRIO ---
  const handleAddUsuario = (e) => {
      e.preventDefault();
      if(!novoUsuario.nome || !novoUsuario.email) return toast.error("Preencha nome e email");
      
      const novoUser = { ...novoUsuario, id: Date.now() };
      setUsuarios(prev => [...prev, novoUser]);
      setNovoUsuario({ nome: '', email: '', funcao: 'Vendedor' });
      
      // Opcional: Se quiser salvar imediatamente ao adicionar usuário, descomente:
      // saveSettings({ usuarios: [...usuarios, novoUser] });
      toast.success("Usuário adicionado à lista (Clique em Salvar Tudo para confirmar)");
  };

  const handleRemoveUsuario = (id) => {
      setUsuarios(prev => prev.filter(u => u.id !== id));
      toast.success("Usuário removido (Clique em Salvar Tudo para confirmar)");
  };

  // --- RENDERIZAÇÃO ---
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSpinner loading={loading} />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
            <p className="text-gray-600 mt-1">Gerencie as preferências do seu sistema BellaVendas</p>
          </div>
          <div>
            <button 
                onClick={handleSaveAllChanges} 
                disabled={isSubmitting} 
                className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2 disabled:opacity-50 shadow-md transition-all hover:shadow-lg"
            >
              {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Tudo'}</span>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-50 rounded-t-xl overflow-x-auto mb-[-1px] scrollbar-thin">
          <div className="flex border-b border-gray-200 min-w-max">
            <TabButton name="categorias" icon={faTags} label="Categorias" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="usuarios" icon={faUser} label="Usuários & Acesso" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="empresa" icon={faBuilding} label="Dados da Empresa" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="estoque" icon={faBox} label="Estoque" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="geral" icon={faCog} label="Geral" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="seguranca" icon={faShieldAlt} label="Segurança" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
        
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
          
          {/* --- ABA CATEGORIAS --- */}
          {activeTab === 'categorias' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="lg:col-span-1">
                <SectionCard title={categoriaAtual ? 'Editar Categoria' : 'Nova Categoria'} icon={faTags}>
                  <form onSubmit={handleSubmitCategoria}>
                    <FormInput 
                        label="Nome da Categoria" 
                        value={nomeCategoria} 
                        onChange={(e) => setNomeCategoria(e.target.value)} 
                        placeholder="Ex: Roupas, Acessórios..." 
                    />
                    <div className="flex gap-2 mt-4">
                      <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={categoriaAtual ? faSave : faPlus} />}
                        <span>{categoriaAtual ? 'Salvar' : 'Adicionar'}</span>
                      </button>
                      {categoriaAtual && (
                        <button type="button" onClick={() => { setCategoriaAtual(null); setNomeCategoria(''); }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                    </div>
                  </form>
                </SectionCard>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    Categorias ajudam a organizar seus produtos e filtram relatórios de vendas.
                </div>
              </div>
              <div className="lg:col-span-2">
                <SectionCard title={`Categorias (${categorias.length})`} icon={faTags}>
                   {categorias.length === 0 ? (
                       <p className="text-gray-500 text-center py-8">Nenhuma categoria encontrada.</p>
                   ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {categorias.map(cat => (
                            <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{cat.nome}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => { setCategoriaAtual(cat); setNomeCategoria(cat.nome); }} className="text-blue-600 hover:text-blue-800 mr-4" title="Editar"><FontAwesomeIcon icon={faEdit} /></button>
                                <button onClick={() => { setCategoriaToDelete(cat); setIsConfirmModalOpen(true); }} className="text-red-500 hover:text-red-700" title="Excluir"><FontAwesomeIcon icon={faTrash} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                   )}
                </SectionCard>
              </div>
            </div>
          )}

          {/* --- ABA USUÁRIOS --- */}
          {activeTab === 'usuarios' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                <div className="lg:col-span-1">
                    <SectionCard title="Cadastrar Usuário" icon={faUser}>
                        <form onSubmit={handleAddUsuario}>
                            <FormInput label="Nome Completo" name="nome" value={novoUsuario.nome} onChange={handleChange(setNovoUsuario)} placeholder="Nome do funcionário" />
                            <FormInput label="Email de Acesso" name="email" type="email" value={novoUsuario.email} onChange={handleChange(setNovoUsuario)} placeholder="email@exemplo.com" />
                            <FormSelect 
                                label="Função" 
                                name="funcao"
                                value={novoUsuario.funcao} 
                                onChange={handleChange(setNovoUsuario)}
                                options={[
                                    { value: 'Administrador', label: 'Administrador (Acesso Total)' },
                                    { value: 'Gerente', label: 'Gerente (Edita Produtos/Vendas)' },
                                    { value: 'Vendedor', label: 'Vendedor (Apenas Vendas)' }
                                ]}
                            />
                            <button type="submit" className="w-full mt-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2 transition-colors">
                                <FontAwesomeIcon icon={faEnvelope} /> Adicionar
                            </button>
                        </form>
                    </SectionCard>
                </div>
                <div className="lg:col-span-2">
                    <SectionCard title="Usuários do Sistema" icon={faUser}>
                        <div className="overflow-hidden rounded-lg border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usuário</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Função</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {usuarios.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.funcao === 'Administrador' ? 'bg-purple-100 text-purple-800' : 
                                                    user.funcao === 'Gerente' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {user.funcao}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleRemoveUsuario(user.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>
            </div>
          )}

          {/* --- ABA EMPRESA --- */}
          {activeTab === 'empresa' && (
             <div className="animate-fade-in">
                 <SectionCard title="Dados Organizacionais" icon={faBuilding}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormInput label="Nome da Empresa / Fantasia" name="nome" value={empresa.nome} onChange={handleChange(setEmpresa)} />
                         <FormInput label="CNPJ / CPF" name="cnpj" value={empresa.cnpj} onChange={handleChange(setEmpresa)} placeholder="00.000.000/0000-00" />
                         <FormInput label="Email de Contato" name="email" value={empresa.email} onChange={handleChange(setEmpresa)} />
                         <FormInput label="Telefone / WhatsApp" name="telefone" value={empresa.telefone} onChange={handleChange(setEmpresa)} />
                     </div>
                     <div className="mt-4">
                         <FormInput label="Endereço Completo" name="endereco" value={empresa.endereco} onChange={handleChange(setEmpresa)} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                         <FormInput label="Cidade" name="cidade" value={empresa.cidade} onChange={handleChange(setEmpresa)} />
                         <FormInput label="Estado" name="estado" value={empresa.estado} onChange={handleChange(setEmpresa)} />
                         <FormInput label="CEP" name="cep" value={empresa.cep} onChange={handleChange(setEmpresa)} placeholder="00000-000" />
                     </div>
                 </SectionCard>
             </div>
          )}

          {/* --- ABA ESTOQUE --- */}
          {activeTab === 'estoque' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                  <SectionCard title="Controle de Produtos" icon={faBox}>
                      <FormSelect 
                          label="Método de Custo" 
                          name="metodoCusto"
                          value={estoque.metodoCusto} 
                          onChange={handleChange(setEstoque)}
                          options={[
                              { value: 'Medio', label: 'Custo Médio' },
                              { value: 'Ultimo', label: 'Último Preço de Compra' },
                              { value: 'Manual', label: 'Definido Manualmente' }
                          ]}
                      />
                      <FormSelect 
                          label="Unidade de Medida Padrão" 
                          name="unidadeMedidaPadrao"
                          value={estoque.unidadeMedidaPadrao} 
                          onChange={handleChange(setEstoque)}
                          options={[
                              { value: 'un', label: 'Unidade (un)' },
                              { value: 'kg', label: 'Quilograma (kg)' },
                              { value: 'cx', label: 'Caixa (cx)' },
                              { value: 'l', label: 'Litro (l)' }
                          ]}
                      />
                      <FormInput 
                        label="Alertar Estoque Baixo (Quantidade)" 
                        type="number" 
                        name="alertaEstoqueMinimo"
                        value={estoque.alertaEstoqueMinimo} 
                        onChange={handleChange(setEstoque)} 
                       />
                  </SectionCard>

                  <SectionCard title="Regras de Movimentação" icon={faChartBar}>
                      <ToggleSwitch 
                        label="Controlar Data de Validade" 
                        checked={estoque.controlarValidade} 
                        onChange={(val) => setEstoque(prev => ({...prev, controlarValidade: val}))} 
                      />
                      <p className="text-xs text-gray-500 mb-4 pl-1">Exige data de vencimento ao dar entrada em produtos perecíveis.</p>

                      <ToggleSwitch 
                        label="Permitir Estoque Negativo" 
                        checked={estoque.permitirEstoqueNegativo} 
                        onChange={(val) => setEstoque(prev => ({...prev, permitirEstoqueNegativo: val}))} 
                      />
                      <p className="text-xs text-gray-500 mb-4 pl-1">Permite vender produtos mesmo sem saldo no sistema.</p>
                  </SectionCard>
              </div>
          )}

          {/* --- ABA GERAL --- */}
          {activeTab === 'geral' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                 <SectionCard title="Personalização" icon={faCog}>
                     <FormSelect 
                        label="Moeda Padrão" 
                        name="moeda"
                        value={geral.moeda} 
                        onChange={handleChange(setGeral)}
                        options={[{ value: 'BRL', label: 'Real Brasileiro (R$)' }, { value: 'USD', label: 'Dólar Americano ($)' }]}
                     />
                     <FormSelect 
                        label="Fuso Horário" 
                        name="fusoHorario"
                        value={geral.fusoHorario} 
                        onChange={handleChange(setGeral)}
                        options={[{ value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' }, { value: 'America/Manaus', label: 'Manaus (GMT-4)' }]}
                     />
                     <ToggleSwitch 
                        label="Modo Escuro (Dark Mode)" 
                        checked={geral.temaEscuro} 
                        onChange={(val) => setGeral(prev => ({...prev, temaEscuro: val}))} 
                     />
                 </SectionCard>

                 <SectionCard title="Sistema & Notificações" icon={faBell}>
                     <ToggleSwitch 
                        label="Notificações por Email" 
                        checked={geral.notificacoesEmail} 
                        onChange={(val) => setGeral(prev => ({...prev, notificacoesEmail: val}))} 
                     />
                     <div className="h-px bg-gray-100 my-2"></div>
                     <ToggleSwitch 
                        label="Notificações no Sistema" 
                        checked={geral.notificacoesSistema} 
                        onChange={(val) => setGeral(prev => ({...prev, notificacoesSistema: val}))} 
                     />
                     <div className="h-px bg-gray-100 my-2"></div>
                     <FormSelect 
                        label="Backup Automático" 
                        name="backupAutomatico"
                        value={geral.backupAutomatico} 
                        onChange={handleChange(setGeral)}
                        options={[
                            { value: 'diario', label: 'Diariamente' },
                            { value: 'semanal', label: 'Semanalmente' },
                            { value: 'mensal', label: 'Mensalmente' },
                            { value: 'off', label: 'Desativado' }
                        ]}
                     />
                 </SectionCard>
             </div>
          )}

          {/* --- ABA SEGURANÇA --- */}
          {activeTab === 'seguranca' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                  <SectionCard title="Políticas de Acesso" icon={faShieldAlt}>
                      <FormInput 
                        label="Tempo limite de sessão (minutos)" 
                        type="number" 
                        name="tempoSessao"
                        value={seguranca.tempoSessao} 
                        onChange={handleChange(setSeguranca)} 
                      />
                      <div className="mt-4">
                        <ToggleSwitch 
                            label="Exigir Senha Forte" 
                            checked={seguranca.exigirSenhaForte} 
                            onChange={(val) => setSeguranca(prev => ({...prev, exigirSenhaForte: val}))} 
                        />
                        <p className="text-xs text-gray-500 pl-1">Mínimo 8 caracteres, letras e números.</p>
                      </div>
                  </SectionCard>

                  <SectionCard title="Autenticação Avançada" icon={faLock}>
                      <ToggleSwitch 
                          label="Autenticação de Dois Fatores (2FA)" 
                          checked={seguranca.autenticacaoDoisFatores} 
                          onChange={(val) => setSeguranca(prev => ({...prev, autenticacaoDoisFatores: val}))} 
                      />
                      <p className="text-sm text-gray-600 mt-2 mb-4">
                          Adiciona uma camada extra de segurança exigindo um código enviado por email ao fazer login.
                      </p>
                      
                      <ToggleSwitch 
                          label="Registrar Histórico de Login" 
                          checked={seguranca.historicoLogin} 
                          onChange={(val) => setSeguranca(prev => ({...prev, historicoLogin: val}))} 
                      />
                  </SectionCard>
              </div>
          )}

        </div>
      </div>

      {/* Modal de Confirmação para Categorias */}
      <SimpleConfirmModal
        isOpen={isConfirmModalOpen}
        onRequestClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDeleteCategoria}
        isSubmitting={isSubmitting}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a categoria "${categoriaToDelete?.nome}"?`}
      />
    </>
  );
};

export default Configuracoes;