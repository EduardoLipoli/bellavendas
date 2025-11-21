import React from 'react';
import { PuffLoader } from 'react-spinners';

// Você pode escolher outros loaders no site da biblioteca, mas o PuffLoader é elegante.
const LoadingSpinner = ({ loading }) => {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
            <PuffLoader color="#d0bdf4" size={80} /> {/* Usando a cor 'secondary' */}
        </div>
    );
};

export default LoadingSpinner;