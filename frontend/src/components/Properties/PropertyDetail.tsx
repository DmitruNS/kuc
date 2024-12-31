import React, { useState } from 'react';
import { Property } from '../../types';
import { useTranslation } from '../../localization/translations';

interface PropertyDetailProps {
    property: Property;
    onClose: () => void;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const t = useTranslation('ru');

    const details = property.details[0]; // берем первый язык для примера

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                        {details?.city}, {details?.district}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    {/* Image Gallery */}
                    <div className="mb-8">
                        {/* Main Image */}
                        <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
                            {selectedImage ? (
                                <img
                                    src={`https://kuckuc.rs/uploads/${selectedImage}`}
                                    alt="Selected view"
                                    className="w-full h-full object-contain"
                                />
                            ) : property.documents && property.documents.length > 0 ? (
                                <img
                                    src={`https://kuckuc.rs/uploads/${property.documents[0].file_path}`}
                                    alt="Main view"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <span className="text-gray-400">No image</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {property.documents && property.documents.length > 0 && (
                            <div className="grid grid-cols-6 gap-2">
                                {property.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedImage(doc.file_path)}
                                        className={`cursor-pointer h-24 rounded-lg overflow-hidden border-2 
                                            ${selectedImage === doc.file_path ? 'border-blue-500' : 'border-transparent'}`}
                                    >
                                        <img
                                            src={`https://kuckuc.rs/uploads/${doc.file_path}`}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Property Info */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">{t('basicInfo')}</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('propertyType')}:</span>
                                    <span className="font-medium">{t(property.property_type)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('dealType')}:</span>
                                    <span className="font-medium">{t(property.deal_type)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('price')}:</span>
                                    <span className="font-medium">
                                        €{details?.price.toLocaleString()}
                                        {property.deal_type === 'rent' && '/month'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">{t('propertyDetails')}</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('livingArea')}:</span>
                                    <span className="font-medium">{details?.living_area} m²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('rooms')}:</span>
                                    <span className="font-medium">{details?.rooms}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('bedrooms')}:</span>
                                    <span className="font-medium">{details?.bedrooms}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('bathrooms')}:</span>
                                    <span className="font-medium">{details?.bathrooms}</span>
                                </div>
                                {property.property_type === 'house' && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('plotSize')}:</span>
                                        <span className="font-medium">{details?.plot_size} m²</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Features */}
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">{t('features')}</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {details?.registered && (
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{t('registered')}</span>
                                </div>
                            )}
                            {details?.water_supply && (
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{t('waterSupply')}</span>
                                </div>
                            )}
                            {details?.sewage && (
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{t('sewage')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {details?.description && (
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-4">{t('description')}</h3>
                            <p className="text-gray-700 whitespace-pre-line">{details.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;