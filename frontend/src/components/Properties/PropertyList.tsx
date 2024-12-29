// frontend/src/components/Properties/PropertyList.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';

const PropertyList = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [language, setLanguage] = useState('ru');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, [language]);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/properties?language=${language}`, {
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
        <h1 className="text-3xl font-bold">Properties</h1>
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
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="text-xl font-semibold mb-2">
              {property.details[0]?.city}, {property.details[0]?.district}
            </div>
            <div className="text-gray-600 mb-4">
              {property.property_type} • {property.deal_type}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                €{property.details[0]?.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {property.details[0]?.living_area}m² • {property.details[0]?.rooms} rooms
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;