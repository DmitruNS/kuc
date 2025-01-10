// frontend/src/components/Properties/PropertyFilters.tsx
import React from 'react';
import { PropertyType, DealType } from '../../types';

interface FilterValues {
  property_type: string;
  deal_type: string;
  city: string;
  price_min: string;
  price_max: string;
  rooms_min: string;
  rooms_max: string;
  area_min: string;
  area_max: string;
}

interface PropertyFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({ filters, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <select
            name="property_type"
            value={filters.property_type}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="office">Office</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal Type
          </label>
          <select
            name="deal_type"
            value={filters.deal_type}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Deals</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="Enter city"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              name="price_min"
              value={filters.price_min}
              onChange={handleChange}
              placeholder="Min"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              name="price_max"
              value={filters.price_max}
              onChange={handleChange}
              placeholder="Max"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rooms
            </label>
            <input
              type="number"
              name="rooms_min"
              value={filters.rooms_min}
              onChange={handleChange}
              placeholder="Min"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Rooms
            </label>
            <input
              type="number"
              name="rooms_max"
              value={filters.rooms_max}
              onChange={handleChange}
              placeholder="Max"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Area
            </label>
            <input
              type="number"
              name="area_min"
              value={filters.area_min}
              onChange={handleChange}
              placeholder="Min m²"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Area
            </label>
            <input
              type="number"
              name="area_max"
              value={filters.area_max}
              onChange={handleChange}
              placeholder="Max m²"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;