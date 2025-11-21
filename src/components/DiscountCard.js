// src/components/DiscountCard.js

import React from 'react';

const DiscountCard = ({ title, description, discount, color }) => {
    return (
        <div className="bg-surface p-6 rounded-xl border border-border flex justify-between items-start h-full">
            <div className="flex flex-col h-full">
                <div>
                    <h4 className="font-bold text-text-primary">{title}</h4>
                    <p className="text-sm text-text-secondary mt-1">{description}</p>
                </div>
                <p className={`mt-4 text-3xl font-bold`} style={{ color }}>{discount}</p>
            </div>
            <button className="text-sm text-accent font-semibold hover:text-accent-hover">
                Editar
            </button>
        </div>
    );
};

export default DiscountCard;