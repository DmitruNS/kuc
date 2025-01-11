// frontend/src/components/Properties/PropertyForm.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../localization/translations';
import FileUpload from '../Files/FileUpload';
import { getApiUrl } from '../../config/api';
import {
    Property,
    PropertyType,
    DealType,
    PropertyStatus,
    ContractStatus,
    PropertyOwner
} from '../../types';
const formatDateForAPI = (date: string): string => {
    // Преобразуем YYYY-MM-DD в YYYY-MM-DDTHH:mm:ssZ
    return `${date}T00:00:00Z`;
};
const PropertyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tempId, setTempId] = useState<number | null>(null);
    const isEditing = Boolean(id);
    const [activeLanguage, setActiveLanguage] = useState('sr');
    const t = useTranslation(activeLanguage);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [property, setProperty] = useState<Partial<Property>>({
        property_type: 'apartment' as PropertyType,
        deal_type: 'sale' as DealType,
        status: 'ready' as PropertyStatus,
        is_active: true,
        details: [
            {
                language: 'sr',
                city: '', district: '', address: '', heating_type: '',
                plot_facilities: null,     // Изменено
                equipment: null,           // Изменено
                road_access: '', description: '',
                floor_number: 0, total_floors: 0, living_area: 0,
                rooms: 0, bedrooms: 0, bathrooms: 0, plot_size: 0, price: 0,
                registered: false, water_supply: false, sewage: false
            },
            {
                language: 'en',
                city: '', district: '', address: '', heating_type: '',
                plot_facilities: null,     // Изменено
                equipment: null,           // Изменено
                road_access: '', description: '',
                floor_number: 0, total_floors: 0, living_area: 0,
                rooms: 0, bedrooms: 0, bathrooms: 0, plot_size: 0, price: 0,
                registered: false, water_supply: false, sewage: false
            },
            {
                language: 'ru',
                city: '', district: '', address: '', heating_type: '',
                plot_facilities: null,     // Изменено
                equipment: null,           // Изменено
                road_access: '', description: '',
                floor_number: 0, total_floors: 0, living_area: 0,
                rooms: 0, bedrooms: 0, bathrooms: 0, plot_size: 0, price: 0,
                registered: false, water_supply: false, sewage: false
            }
        ],
        owner: {
            properties_count: 1,
            contract_status: 'active' as ContractStatus,
            contract_number: '',
            contract_end_date: formatDateForAPI(new Date().toISOString().split('T')[0]),
        }
    });

    // Обработчики изменения полей
    const updateDetails = (language: string, field: string, value: any) => {
        setProperty(prev => ({
            ...prev,
            details: prev.details?.map(detail =>
                detail.language === language
                    ? { ...detail, [field]: value }
                    : detail
            )
        }));
    };

    const updateCommonFields = (field: string, value: any) => {
        setProperty(prev => ({
            ...prev,
            details: prev.details?.map(detail => ({
                ...detail,
                [field]: value
            }))
        }));
    };


    useEffect(() => {
        const currentPropertyId = isEditing && id ? parseInt(id, 10) : tempId;
        console.log('Property ID status:', {
            isEditing,
            id,
            tempId,
            currentPropertyId,
            propertyObject: property
        });
    }, [isEditing, id, tempId, property]);
    {
        error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
            </div>
        )
    }

    const fetchProperty = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl(`/api/properties/${id}`), {
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
    useEffect(() => {
        if (isEditing && id) {
            fetchProperty();
        }
    }, [isEditing, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                getApiUrl(isEditing ? `/api/properties/${id}` : '/api/properties'),
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(property),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save property');
            }

            const savedProperty = await response.json();
            if (!isEditing) {
                setTempId(savedProperty.id);
                setProperty(savedProperty);
            }

            // Показываем сообщение об успехе
            // и возможность загрузить файлы

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save property');
        } finally {
            setLoading(false);
        }
    };


    // Исправим типизацию updateOwner
    const updateOwner = (field: keyof PropertyOwner, value: any) => {
        const processedValue = field === 'contract_end_date' ? formatDateForAPI(value) : value;
        setProperty(prev => ({
            ...prev,
            owner: {
                ...prev.owner,
                properties_count: prev.owner?.properties_count || 1,
                contract_status: prev.owner?.contract_status || 'active',
                contract_number: prev.owner?.contract_number || '',
                contract_end_date: prev.owner?.contract_end_date || '',
                [field]: processedValue
            }
        }));
    };
    // JSX для формы
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">
                        {isEditing ? t('editProperty') : t('addProperty')}
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveLanguage('sr')}
                            className={`px-4 py-2 rounded ${activeLanguage === 'sr' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                }`}
                        >
                            Serbian
                        </button>
                        <button
                            onClick={() => setActiveLanguage('en')}
                            className={`px-4 py-2 rounded ${activeLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setActiveLanguage('ru')}
                            className={`px-4 py-2 rounded ${activeLanguage === 'ru' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                }`}
                        >
                            Russian
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('basicInfo')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('propertyType')}
                                </label>
                                <select
                                    value={property.property_type}
                                    onChange={e => setProperty(prev => ({
                                        ...prev,
                                        property_type: e.target.value as PropertyType
                                    }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                >
                                    <option value="house">{t('house')}</option>
                                    <option value="apartment">{t('apartment')}</option>
                                    <option value="office">{t('office')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('dealType')}
                                </label>
                                <select
                                    value={property.deal_type}
                                    onChange={e => setProperty(prev => ({
                                        ...prev,
                                        deal_type: e.target.value as DealType
                                    }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                >
                                    <option value="sale">{t('sale')}</option>
                                    <option value="rent">{t('rent')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Языкозависимые поля */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Localized Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    value={property.details?.find(d => d.language === activeLanguage)?.city || ''}
                                    onChange={e => updateDetails(activeLanguage, 'city', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">District</label>
                                <input
                                    type="text"
                                    value={property.details?.find(d => d.language === activeLanguage)?.district || ''}
                                    onChange={e => updateDetails(activeLanguage, 'district', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    value={property.details?.find(d => d.language === activeLanguage)?.address || ''}
                                    onChange={e => updateDetails(activeLanguage, 'address', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Heating Type</label>
                                <input
                                    type="text"
                                    value={property.details?.find(d => d.language === activeLanguage)?.heating_type || ''}
                                    onChange={e => updateDetails(activeLanguage, 'heating_type', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Общие числовые параметры */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Property Parameters</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Floor Number</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].floor_number || 0}
                                    onChange={e => updateCommonFields('floor_number', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Floors</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].total_floors || 0}
                                    onChange={e => updateCommonFields('total_floors', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Living Area (m²)</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].living_area || 0}
                                    onChange={e => updateCommonFields('living_area', parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Rooms</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].rooms || 0}
                                    onChange={e => updateCommonFields('rooms', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].bedrooms || 0}
                                    onChange={e => updateCommonFields('bedrooms', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].bathrooms || 0}
                                    onChange={e => updateCommonFields('bathrooms', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            {property.property_type === 'house' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Plot Size (m²)</label>
                                    <input
                                        type="number"
                                        value={property.details?.[0].plot_size || 0}
                                        onChange={e => updateCommonFields('plot_size', parseFloat(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input
                                    type="number"
                                    value={property.details?.[0].price || 0}
                                    onChange={e => updateCommonFields('price', parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Булевы параметры */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Additional Features</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={property.details?.[0].registered || false}
                                    onChange={e => updateCommonFields('registered', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Registered
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={property.details?.[0].water_supply || false}
                                    onChange={e => updateCommonFields('water_supply', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Water Supply
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={property.details?.[0].sewage || false}
                                    onChange={e => updateCommonFields('sewage', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Sewage
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Информация о собственнике */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Properties Count</label>
                                <input
                                    type="number"
                                    value={property.owner?.properties_count || 1}
                                    onChange={e => updateOwner('properties_count', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contract Status</label>
                                <select
                                    value={property.owner?.contract_status || 'active'}
                                    onChange={e => updateOwner('contract_status', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contract Number</label>
                                <input
                                    type="text"
                                    value={property.owner?.contract_number || ''}
                                    onChange={e => updateOwner('contract_number', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contract End Date</label>
                                <input
                                    type="date"
                                    value={property.owner?.contract_end_date?.split('T')[0] || ''}
                                    onChange={e => updateOwner('contract_end_date', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                                />
                            </div>

                        </div>
                    </div>
                    {(isEditing || tempId !== null) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <FileUpload
                                propertyId={isEditing ? Number(id) : tempId!}
                                onUploadComplete={() => {
                                    if (isEditing) {
                                        fetchProperty();
                                    }
                                }}
                            />
                        </div>
                    )}
                    {/* Кнопки действий */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {t('cancel')}
                        </button>
                        {(!isEditing && tempId) ? (
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                {t('finish')}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isEditing ? t('save') : t('create')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
export default PropertyForm;
