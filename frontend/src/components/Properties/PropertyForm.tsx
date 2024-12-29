// frontend/src/components/Properties/PropertyForm.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property, PropertyType, DealType, PropertyStatus } from '../../types';

const PropertyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [property, setProperty] = useState<Partial<Property>>({
        property_type: 'apartment' as PropertyType,
        deal_type: 'sale' as DealType,
        status: 'ready' as PropertyStatus,
        is_active: true,
        details: [
            { language: 'sr', city: '', district: '', price: 0, living_area: 0, rooms: 0 },
            { language: 'en', city: '', district: '', price: 0, living_area: 0, rooms: 0 },
            { language: 'ru', city: '', district: '', price: 0, living_area: 0, rooms: 0 },
        ]
    });
    const handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProperty(prev => ({
            ...prev,
            property_type: e.target.value as PropertyType
        }));
    };
    const handleDealTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProperty(prev => ({
            ...prev,
            deal_type: e.target.value as DealType
        }));
    };


    useEffect(() => {
        if (isEditing) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/properties/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch property');
            const data = await response.json();
            setProperty(data);
        } catch (err) {
            setError('Failed to load property');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                isEditing ? `http://localhost:8080/api/properties/${id}` : 'http://localhost:8080/api/properties',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(property),
                }
            );

            if (!response.ok) throw new Error('Failed to save property');
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to save property');
        } finally {
            setLoading(false);
        }
    };

    const updateDetails = (language: string, field: string, value: any) => {
        setProperty(prev => ({
            ...prev,
            details: prev.details?.map(detail =>
                detail.language === language ? { ...detail, [field]: value } : detail
            )
        }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">
                    {isEditing ? 'Edit Property' : 'Add New Property'}
                </h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property Type</label>
                            <select
                                value={property.property_type}
                                onChange={handlePropertyTypeChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="office">Office</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deal Type</label>
                            <select
                                value={property.deal_type}
                                onChange={handleDealTypeChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="sale">Sale</option>
                                <option value="rent">Rent</option>
                            </select>
                        </div>
                    </div>

                    {/* Multi-language details */}
                    <div className="space-y-6">
                        {['sr', 'en', 'ru'].map(lang => (
                            <div key={lang} className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {lang === 'sr' ? 'Serbian' : lang === 'en' ? 'English' : 'Russian'} Details
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            value={property.details?.find(d => d.language === lang)?.city || ''}
                                            onChange={e => updateDetails(lang, 'city', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">District</label>
                                        <input
                                            type="text"
                                            value={property.details?.find(d => d.language === lang)?.district || ''}
                                            onChange={e => updateDetails(lang, 'district', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price</label>
                                        <input
                                            type="number"
                                            value={property.details?.find(d => d.language === lang)?.price || 0}
                                            onChange={e => updateDetails(lang, 'price', Number(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Living Area (m²)</label>
                                        <input
                                            type="number"
                                            value={property.details?.find(d => d.language === lang)?.living_area || 0}
                                            onChange={e => updateDetails(lang, 'living_area', Number(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Rooms</label>
                                        <input
                                            type="number"
                                            value={property.details?.find(d => d.language === lang)?.rooms || 0}
                                            onChange={e => updateDetails(lang, 'rooms', Number(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? 'Saving...' : 'Save Property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PropertyForm;