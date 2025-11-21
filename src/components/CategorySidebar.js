// src/components/CategorySidebar.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTshirt, faShoePrints, faGem, faSprayCan } from '@fortawesome/free-solid-svg-icons'; // Ícones de exemplo

const categories = [
    { name: 'Roupas', icon: faTshirt },
    { name: 'Calçados', icon: faShoePrints },
    { name: 'Acessórios', icon: faGem },
    { name: 'Beleza', icon: faSprayCan },
];

const CategorySidebar = ({ selectedCategory, onSelectCategory }) => {
    return (
        <div className="bg-surface p-2 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">Categorias</h3>
            <ul className="space-y-2">
                {categories.map((category) => (
                    <li key={category.name}>
                        <button
                            onClick={() => onSelectCategory(category.name)}
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${
                                selectedCategory === category.name
                                ? 'bg-accent text-white font-semibold'
                                : 'text-text-secondary hover:bg-zinc-700 hover:text-text-primary'
                            }`}
                        >
                            <FontAwesomeIcon icon={category.icon} className="mr-3 w-5" />
                            {category.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategorySidebar;