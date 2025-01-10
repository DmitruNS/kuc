-- backend/migrations/001_initial_schema.sql

-- Create enum types
CREATE TYPE user_role AS ENUM ('agent', 'guest');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'office');
CREATE TYPE deal_type AS ENUM ('sale', 'rent');
CREATE TYPE property_status AS ENUM ('ready', 'new', 'shared');

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    property_code VARCHAR(50) UNIQUE NOT NULL,
    property_type property_type NOT NULL,
    deal_type deal_type NOT NULL,
    status property_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create property_details table
CREATE TABLE property_details (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    language VARCHAR(2) NOT NULL,
    city TEXT,
    district TEXT,
    address TEXT,
    street_number TEXT,
    floor_number INTEGER,
    total_floors INTEGER,
    living_area DECIMAL,
    rooms INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    plot_size DECIMAL,
    plot_facilities JSONB,
    registered BOOLEAN,
    equipment JSONB,
    heating_type TEXT,
    water_supply BOOLEAN,
    sewage BOOLEAN,
    road_access TEXT,
    additional_info JSONB,
    description TEXT,
    price DECIMAL,
    UNIQUE (property_id, language)
);

-- Create property_documents table
CREATE TABLE property_documents (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    file_type VARCHAR(50),
    file_path TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create property_owners table
CREATE TABLE property_owners (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    properties_count INTEGER DEFAULT 1,
    contract_status TEXT,
    contract_number VARCHAR(50),
    contract_end_date DATE,
    contract_file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create property_history table
CREATE TABLE property_history (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    action_type TEXT NOT NULL,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_id INTEGER REFERENCES users(id),
    details JSONB
);

-- Insert demo user with bcrypt hash of password 'demo123'
INSERT INTO users (email, password_hash, role) VALUES
('agent@kuckuc.rs', '$2a$10$dYVuzSsCNMiDr.kHpwYFiOPGQNHZqqp.sDte.41DO2gL13agTGKQa', 'agent');

-- Insert demo properties
INSERT INTO properties (agent_code, property_code, property_type, deal_type, status) VALUES
('SALE001', 'PROP001', 'apartment', 'sale', 'ready'),
('RENT001', 'PROP002', 'house', 'rent', 'ready');

-- Insert demo property details for Serbian language
INSERT INTO property_details (property_id, language, city, district, price, living_area, rooms) VALUES
(1, 'sr', 'Београд', 'Нови Београд', 150000, 75.5, 3),
(2, 'sr', 'Београд', 'Земун', 800, 120, 4);

-- Insert demo property details for English language
INSERT INTO property_details (property_id, language, city, district, price, living_area, rooms) VALUES
(1, 'en', 'Belgrade', 'New Belgrade', 150000, 75.5, 3),
(2, 'en', 'Belgrade', 'Zemun', 800, 120, 4);

-- Insert demo property details for Russian language
INSERT INTO property_details (property_id, language, city, district, price, living_area, rooms) VALUES
(1, 'ru', 'Белград', 'Новый Белград', 150000, 75.5, 3),
(2, 'ru', 'Белград', 'Земун', 800, 120, 4);