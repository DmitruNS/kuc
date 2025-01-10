export type PropertyType = 'house' | 'apartment' | 'office';
export type DealType = 'sale' | 'rent';
export type PropertyStatus = 'ready' | 'new' | 'shared';
export type ContractStatus = 'active' | 'pending' | 'expired';

export interface PropertyDetail {
    id?: number;
    property_id?: number;
    language: string;
    
    // Переводимые поля
    city: string;
    district: string;
    address: string;
    heating_type: string;
    plot_facilities: any;    // Изменено с plot_equipment
    equipment: any;          // Изменено с home_equipment
    road_access: string;
    description: string;
    
    // Числовые поля
    floor_number: number;
    total_floors: number;
    living_area: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    plot_size: number;
    price: number;
    
    // Булевы поля
    registered: boolean;
    water_supply: boolean;
    sewage: boolean;
}

export interface PropertyOwner {
    id?: number;
    property_id?: number;
    properties_count: number;
    contract_status: ContractStatus;
    contract_number: string;
    contract_end_date: string;
    contract_file_path?: string;  
}

export interface Property {
    id?: number;
    agent_code?: string;
    property_code?: string;
    property_type: PropertyType;
    deal_type: DealType;
    status: PropertyStatus;
    is_active: boolean;
    details: PropertyDetail[];
    owner?: PropertyOwner;
    documents?: any[];
    created_at?: string;
    updated_at?: string;
}
export interface ProtectedRouteProps {
    children: React.ReactNode;
}