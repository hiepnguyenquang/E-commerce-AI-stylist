-- Database Schema Definition (PostgreSQL 14+)
-- File: .ai-knowledge/database_schema.sql

-- 1. KHOẢNG DỮ LIỆU ĐỘC LẬP (INDEPENDENT ENTITIES)

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    vip_tier VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL
);

-- 2. KHOẢNG DỮ LIỆU SẢN PHẨM & TỒN KHO (PRODUCT & INVENTORY)

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    metadata JSONB -- Lưu trữ siêu dữ liệu linh hoạt (chất liệu, phong cách, v.v.)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(19, 4) NOT NULL,
    inventory_quantity INTEGER NOT NULL DEFAULT 0,
    size VARCHAR(50),
    color VARCHAR(50)
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE products_vector (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    vector TEXT, -- Biểu diễn vector đặc trưng lưu tại LanceDB, tham chiếu ID tại đây
    category VARCHAR(100),
    metadata JSONB
);

-- 3. KHOẢNG DỮ LIỆU CÁ NHÂN HÓA (PERSONALIZATION)

CREATE TABLE ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    height DECIMAL(5, 2), -- cm
    weight DECIMAL(5, 2), -- kg
    base_body_image_url TEXT
);

CREATE TABLE user_closet_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    metadata JSONB,
    vector_status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

-- 4. KHOẢNG DỮ LIỆU AI STYLIST & VISION

CREATE TABLE stylist_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    reasoning TEXT,
    status VARCHAR(50) DEFAULT 'processing'
);

CREATE TABLE stylist_session_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES stylist_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    replaces_item_id UUID REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE vton_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    parent_job_id UUID REFERENCES vton_jobs(id) ON DELETE CASCADE,
    step VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    result_image_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE TABLE vton_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vton_jobs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- Quần áo từ shop
    closet_item_id UUID REFERENCES user_closet_items(id) ON DELETE CASCADE, -- Quần áo cá nhân
    is_anchor BOOLEAN DEFAULT FALSE,
    CHECK (product_id IS NOT NULL OR closet_item_id IS NOT NULL)
);

-- 5. KHOẢNG DỮ LIỆU GIAO DỊCH (TRANSACTIONS)

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_amount DECIMAL(19, 4) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_payment',
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255)
);

CREATE TABLE line_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(19, 4) NOT NULL,
    vton_job_id UUID REFERENCES vton_jobs(id) ON DELETE SET NULL, -- Ghi nhận chuyển đổi từ thử đồ ảo
    stylist_session_id UUID REFERENCES stylist_sessions(id) ON DELETE SET NULL, -- Ghi nhận chuyển đổi từ AI Stylist
    CHECK (cart_id IS NOT NULL OR order_id IS NOT NULL)
);

-- Chỉ mục tối ưu hóa truy vấn (Indexes)
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_line_item_order ON line_item(order_id);
CREATE INDEX idx_line_item_cart ON line_item(cart_id);
CREATE INDEX idx_vton_jobs_customer ON vton_jobs(customer_id);
CREATE INDEX idx_stylist_sessions_customer ON stylist_sessions(customer_id);
CREATE INDEX idx_metadata_gin ON products USING GIN (metadata);