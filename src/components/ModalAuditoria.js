import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faUser, faCalendarAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const ModalAuditoria = ({ isOpen, onClose, logs, venda }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} className="text-purple-600" />
            Histórico de Alterações - Venda #{venda?.id.substring(0, 8)}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-grow">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faInfoCircle} size="2x" className="mb-3" />
              <p>Nenhum registro de alteração encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="border-l-4 border-purple-500 pl-4 py-3 bg-gray-50 rounded-r-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-gray-500" />
                        <span className="font-medium">{log.userName}</span>
                      </div>
                      <p className="text-gray-700 mt-1">{log.action}</p>
                      {log.details && (
                        <p className="text-sm text-gray-600 mt-1 bg-gray-100 p-2 rounded">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {log.timestamp.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAuditoria;