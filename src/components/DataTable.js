import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

const DataTable = ({
    data,
    columns,
    isLoading,
    rowKey = 'id', // 'id' como padrão
    sortConfig,
    onSort,
    selectedItems,
    onSelectItem,
    onSelectAll,
    emptyStateComponent
}) => {
    
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="p-4"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
            {columns.map((col, index) => (
                <td key={index} className="px-6 py-4">
                    <div className={`h-4 bg-gray-200 rounded ${col.skeletonWidth || 'w-24'}`}></div>
                </td>
            ))}
        </tr>
    );

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-100/70">
                    <tr>
                        <th className="p-4 w-4">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={data.length > 0 && selectedItems.length === data.length}
                                onChange={onSelectAll}
                            />
                        </th>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => col.sortable && onSort(col.key)}
                            >
                                <div className="flex items-center gap-2 capitalize">
                                    {col.header}
                                    {col.sortable && (
                                        sortConfig.key === col.key ? (
                                            sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />
                                        ) : <FontAwesomeIcon icon={faSort} className="opacity-40" />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    <AnimatePresence>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : data.length > 0 ? (
                            data.map((item, index) => (
                                <motion.tr
                                    key={item[rowKey]}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`transition-colors ${selectedItems.includes(item[rowKey]) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedItems.includes(item[rowKey])}
                                            onChange={() => onSelectItem(item[rowKey])}
                                        />
                                    </td>
                                    {columns.map((col) => (
                                    <td key={`${item[rowKey]}-${col.key}`} className="px-6 py-4 whitespace-nowrap">
                                        {/* AJUSTE AQUI: passe 'item' e 'index' */}
                                        {col.renderCell ? col.renderCell(item, index) : item[col.key]}
                                    </td>
                                    ))}
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1}>
                                    {emptyStateComponent}
                                </td>
                            </tr>
                        )}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;