import React, { useEffect, useState } from 'react';
import { Property } from '../../types';

const DashboardPanel = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperties, setSelectedProperties] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://kuckuc.rs/api/properties', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch properties');
            const data = await response.json();
            setProperties(data);
        } catch (err) {
            setError('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const togglePropertySelection = (id: number) => {
        const newSelected = new Set(selectedProperties);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProperties(newSelected);
    };

    const exportSelected = async () => {
        if (selectedProperties.size === 0) {
            setError('Please select properties to export');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://kuckuc.rs/api/properties/export`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    property_ids: Array.from(selectedProperties)
                })
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'properties_export.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Export failed');
        }
    };

    const togglePropertyStatus = async (id: number, isActive: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://kuckuc.rs/api/properties/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: isActive }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            fetchProperties();
        } catch (err) {
            setError('Failed to update property status');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Property Dashboard</h1>
                <div className="space-x-4">
                    <button
                        onClick={() => window.location.href = '/property/new'}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Add New Property
                    </button>
                    <button
                        onClick={exportSelected}
                        disabled={selectedProperties.size === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        Export Selected ({selectedProperties.size})
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Select
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {properties.map((property) => (
                                <tr key={property.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedProperties.has(property.id!)}
                                            onChange={() => togglePropertySelection(property.id!)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {property.agent_code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {property.property_type} ({property.deal_type})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {property.details[0]?.city}, {property.details[0]?.district}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        €{property.details[0]?.price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${property.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {property.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => {
                                                if (property.id !== undefined) {
                                                    togglePropertyStatus(property.id, !property.is_active);
                                                }
                                            }}
                                            className={`px-3 py-1 rounded ${property.is_active
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                }`}
                                        >
                                            {property.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        {property.id !== undefined && (
                                            <button
                                                onClick={() => window.location.href = `/property/edit/${property.id}`}
                                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DashboardPanel;