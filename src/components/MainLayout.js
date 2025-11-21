import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 p-8">
                {/* O Outlet renderiza a página da rota atual */}
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;