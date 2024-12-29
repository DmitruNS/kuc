// frontend/src/types/index.ts

export type PropertyType = 'house' | 'apartment' | 'office';
export type DealType = 'sale' | 'rent';
export type PropertyStatus = 'ready' | 'new' | 'shared';

export interface PropertyDetail {
    id?: number;
    property_id?: number;
    language: string;
    city: string;
    district: string;
    address?: string;
    street_number?: string;
    floor_number?: number;
    total_floors?: number;
    living_area: number;
    rooms: number;
    bedrooms?: number;
    bathrooms?: number;
    plot_size?: number;
    plot_facilities?: any;
    registered?: boolean;
    equipment?: any;
    heating_type?: string;
    water_supply?: boolean;
    sewage?: boolean;
    road_access?: string;
    additional_info?: any;
    description?: string;
    price: number;
}

export interface Property {
    id?: number;
    agent_code?: string;
    property_code?: string;
    property_type: PropertyType;
    deal_type: DealType;
    status: PropertyStatus;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    details: PropertyDetail[];
    documents?: any[];
    owner?: any;
    history?: any[];
}

export interface ProtectedRouteProps {
    children: React.ReactNode;
}