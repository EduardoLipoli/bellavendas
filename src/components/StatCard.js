import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatCard = ({ 
  icon, 
  title, 
  value, 
  color, 
  onClick, 
  isActive = false // Novo prop para controlar o estado ativo do filtro
}) => {
  // Mapeia as cores para as classes do Tailwind CSS
  const theme = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  }[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  // Define as classes base para o card
  let baseClasses = "bg-white p-4 rounded-lg shadow border flex items-center transition-all duration-200 w-full text-left";

  // Adiciona estilos de hover para cards que não são botões
  if (!onClick) {
    baseClasses += " hover:shadow-md";
  } else {
    // Adiciona estilos de filtro ativo/inativo para botões
    baseClasses += ` ${isActive ? 'ring-2 ring-offset-1' : 'hover:border-gray-300'}`;
    
    // Define a cor do anel com base na cor do tema
    if (isActive) {
        if(color === 'yellow') baseClasses += ' ring-yellow-500 border-yellow-400';
        if(color === 'red') baseClasses += ' ring-red-500 border-red-400';
    }
  }

  const content = (
    <>
      <div className={`mr-4 p-3 rounded-full ${theme.bg}`}>
        <FontAwesomeIcon icon={icon} className={`${theme.text} text-xl`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-xl font-bold ${color === 'yellow' ? 'text-yellow-700' : ''}`}>{value}</p>
      </div>
    </>
  );

  // Renderiza como <button> se onClick for fornecido, senão como <div>
  return onClick ? (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  ) : (
    <div className={baseClasses}>
      {content}
    </div>
  );
};

export default StatCard;