// src/components/ModalCancelarVenda.js

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from './LoadingSpinner';

const ModalCancelarVenda = ({ isOpen, onClose, onConfirm, isSubmitting, venda }) => {
  const [motivo, setMotivo] = useState('');
  const [devolverAoEstoque, setDevolverAoEstoque] = useState(true);
  // 1. Adicionar estado para a senha
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (!motivo.trim()) {
      alert("Por favor, informe o motivo do cancelamento.");
      return;
    }
    if (!password) {
        alert("Por favor, informe sua senha para confirmar.");
        return;
    }
    // 3. Passar a senha junto com os outros dados
    onConfirm({ motivo, devolverAoEstoque, password });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center">
        <LoadingSpinner loading={isSubmitting} />
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold">Cancelar Venda</h2>
            </div>
            
<p className="text-gray-600 mb-4">
                Você está prestes a cancelar a venda <strong>#{venda?.id.substring(0, 8)}</strong>. Esta ação não pode ser desfeita.
            </p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo do Cancelamento (obrigatório)
                    </label>
                    <textarea
                        id="motivo"
                        rows="3"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-300"
                        placeholder="Ex: Cliente desistiu da compra..."
                    />
                </div>

                {/* 2. Adicionar o campo de senha no formulário */}
                <div>
                    <label htmlFor="password-cancel" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha para Confirmar
                    </label>
                    <input
                        type="password"
                        id="password-cancel"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-300"
                        placeholder="Digite sua senha"
                    />
                </div>
            </div>

            <div className="flex items-center my-6">
                <input
                    type="checkbox"
                    id="devolverEstoque"
                    checked={devolverAoEstoque}
                    onChange={(e) => setDevolverAoEstoque(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="devolverEstoque" className="ml-2 block text-sm text-gray-900">
                    Devolver itens ao estoque?
                </label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={onClose} className="py-2 px-4 border rounded-lg hover:bg-gray-100">
                    Voltar
                </button>
                <button 
                    onClick={handleConfirmClick} 
                    // O botão agora também verifica se a senha foi preenchida
                    disabled={isSubmitting || !motivo.trim() || !password}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300"
                >
                    {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ModalCancelarVenda;