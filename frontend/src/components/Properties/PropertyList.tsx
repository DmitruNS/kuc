// frontend/src/components/Properties/PropertyList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import PropertyFilters from './PropertyFilters';
import { useTranslation } from '../../localization/translations';

const PropertyList = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [language, setLanguage] = useState('ru');
    const t = useTranslation(language);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        property_type: '',
        deal_type: '',
        city: '',
        price_min: '',
        price_max: '',
        rooms_min: '',
        rooms_max: '',
        area_min: '',
        area_max: '',
    });

    useEffect(() => {
        fetchProperties();
    }, [language, filters]);

    const fetchProperties = async () => {
        try {
            // Создаем URL с параметрами фильтрации
            const params = new URLSearchParams({
                language,
                ...(filters.property_type && { property_type: filters.property_type }),
                ...(filters.deal_type && { deal_type: filters.deal_type }),
                ...(filters.city && { city: filters.city }),
                ...(filters.price_min && { price_min: filters.price_min }),
                ...(filters.price_max && { price_max: filters.price_max }),
                ...(filters.rooms_min && { rooms_min: filters.rooms_min }),
                ...(filters.rooms_max && { rooms_max: filters.rooms_max }),
                ...(filters.area_min && { area_min: filters.area_min }),
                ...(filters.area_max && { area_max: filters.area_max }),
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/properties?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch properties');
            }
            const data = await response.json();
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setError('Failed to load properties');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDashboardClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('properties')}</h1>
                <div className="flex gap-4 items-center">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-4 py-2 border rounded"
                    >
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                        <option value="sr">Serbian</option>
                    </select>
                    <button
                        onClick={handleDashboardClick}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t('dashboard')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        {t('logout')}
                    </button>
                </div>
            </div>
            <PropertyFilters filters={filters} onChange={setFilters} />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                    <div key={property.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        {/* Добавляем контейнер для изображения */}
                        <div className="w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                            {property.documents && property.documents.length > 0 ? (
                                <img
                                    src={`http://localhost:8080/uploads/${property.documents[0].file_path}`}
                                    alt={property.details[0]?.city || 'Property'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <span className="text-gray-400">No image</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-start mb-4">

                            <div>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mr-2 ${property.deal_type === 'sale'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                    }`}>
                                    {t(property.deal_type)}
                                </span>
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    {t(property.property_type)}
                                </span>
                            </div>
                        </div>

                        <div className="text-xl font-semibold mb-2">
                            {property.details[0]?.city}, {property.details[0]?.district}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>{t('livingArea')}:</span>
                                <span className="font-medium">{property.details[0]?.living_area}m²</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>{t('rooms')}:</span>
                                <span className="font-medium">{property.details[0]?.rooms}</span>
                            </div>
                            {property.details[0]?.floor_number !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span>Floor:</span>
                                    <span className="font-medium">{property.details[0]?.floor_number} of {property.details[0]?.total_floors}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="text-2xl font-bold text-indigo-600">
                                {property.deal_type === 'sale' ? '€' : '€/month'}
                                {property.details[0]?.price.toLocaleString()}
                            </div>
                        </div>

                        {property.documents && property.documents.length > 0 && (
                            <div className="mt-4 flex gap-2">
                                {property.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="text-sm text-gray-500"
                                    >
                                        <span className="material-icons text-gray-400">
                                            {doc.file_type === 'image' ? 'photo' : 'description'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {properties.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                    No properties found matching your criteria
                </div>
            )}
        </div>
    );
};

export default PropertyList;