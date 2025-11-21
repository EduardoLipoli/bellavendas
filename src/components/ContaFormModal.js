import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';

const customStyles = {
  content: {
    top: '0', right: '0', bottom: '0', left: 'auto',
    width: '500px', padding: '0', overflow: 'hidden',
    border: 'none', borderRadius: '0', boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
  }
};

Modal.setAppElement('#root');

// Estado inicial definido para reutilização e clareza.
const initialState = {
  descricao: '',
  valor: '',
  dataVencimento: '',
  fornecedorId: '',
  status: 'Pendente',
  categoria: '',
  centroCusto: '',
  periodicidade: 'Única',
  observacoes: '',
  recorrente: false,
  parcelas: 1
};

const ContaFormModal = ({ 
  isOpen, 
  onRequestClose, 
  onSave, 
  conta, 
  isSubmitting, 
  fornecedores,
  categorias,
  centrosCusto,
  periodicidades
}) => {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      if (conta) { // Modo de EDIÇÃO
        const dataFormatada = conta.dataVencimento?.seconds 
          ? new Date(conta.dataVencimento.seconds * 1000).toISOString().split('T')[0] 
          : conta.dataVencimento || '';
        
        // **LÓGICA CORRIGIDA E ROBUSTA**
        // Garante que cada campo tenha um valor padrão para evitar `undefined`.
        setFormData({
          descricao: conta.descricao || '',
          valor: conta.valor || '',
          dataVencimento: dataFormatada,
          fornecedorId: conta.fornecedorId || '',
          status: conta.status || 'Pendente',
          categoria: conta.categoria || '',
          centroCusto: conta.centroCusto || '',
          periodicidade: conta.periodicidade || 'Única',
          observacoes: conta.observacoes || '',
          recorrente: conta.periodicidade && conta.periodicidade !== 'Única',
          parcelas: conta.parcelas || 1
        });
        
      } else { // Modo de CRIAÇÃO
        // Reseta para o estado inicial, que já é seguro.
        setFormData(initialState);
      }
    }
  }, [conta, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.recorrente && formData.periodicidade === 'Única') {
      toast.error('Selecione uma periodicidade para contas recorrentes');
      return;
    }
    
    if (formData.recorrente && formData.parcelas < 2) {
      toast.error('Contas recorrentes devem ter pelo menos 2 parcelas');
      return;
    }
    
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      closeTimeoutMS={300}
    >
      <div className="flex flex-col h-full">
        <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {conta ? 'Editar Conta' : 'Nova Conta a Pagar'}
            </h2>
            <button 
              type="button" 
              onClick={onRequestClose} 
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="p-6 bg-white overflow-y-auto flex-grow space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Descrição *
              </label>
              <input 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                placeholder="Descrição da conta" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Fornecedor *
              </label>
              <select 
                name="fornecedorId" 
                value={formData.fornecedorId} 
                onChange={handleChange} 
                className="w-full p-2 border border-gray-300 rounded-lg bg-white" 
                required
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Categoria
                </label>
                <select 
                  name="categoria" 
                  value={formData.categoria} 
                  onChange={handleChange} 
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Centro de Custo
                </label>
                <select 
                  name="centroCusto" 
                  value={formData.centroCusto} 
                  onChange={handleChange} 
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Selecione um centro de custo</option>
                  {centrosCusto.map(cc => (
                    <option key={cc} value={cc}>{cc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Valor (R$) *
                </label>
                <input 
                  name="valor" 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={formData.valor} 
                  onChange={handleChange} 
                  placeholder="0,00" 
                  className="w-full p-2 border border-gray-300 rounded-lg" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Data de Vencimento *
                </label>
                <input 
                  name="dataVencimento" 
                  type="date" 
                  value={formData.dataVencimento} 
                  onChange={handleChange} 
                  className="w-full p-2 border border-gray-300 rounded-lg" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Status
                </label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Paga">Paga</option>
                </select>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center mb-4">
                <input 
                  id="recorrente"
                  name="recorrente" 
                  type="checkbox" 
                  checked={formData.recorrente} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="recorrente" className="ml-2 text-sm font-medium text-gray-700">
                  Conta Recorrente/parcelada
                </label>
              </div>
              
              {formData.recorrente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Periodicidade *
                    </label>
                    <select 
                      name="periodicidade" 
                      value={formData.periodicidade} 
                      onChange={handleChange} 
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      required
                    >
                      {periodicidades.map(periodo => (
                        <option key={periodo} value={periodo}>{periodo}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Número de Parcelas *
                    </label>
                    <input 
                      name="parcelas" 
                      type="number" 
                      min="2" 
                      max="360"
                      value={formData.parcelas} 
                      onChange={handleChange} 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      required={formData.recorrente}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Observações
              </label>
              <textarea 
                name="observacoes" 
                value={formData.observacoes} 
                onChange={handleChange} 
                placeholder="Detalhes adicionais sobre esta conta" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                rows="3"
              />
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200 mt-auto">
            <div className="flex justify-end gap-4">
              <button 
                type="button" 
                onClick={onRequestClose} 
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium" 
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-medium hover:opacity-90 transition duration-300 w-36 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (conta ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ContaFormModal;