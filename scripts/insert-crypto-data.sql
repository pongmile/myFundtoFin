-- Insert user's actual cryptocurrency data
-- Run this in Supabase SQL Editor
-- ระบบจะดึงราคาปัจจุบันและคำนวณกำไร/ขาดทุนอัตโนมัติ

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM crypto;

-- Insert crypto holdings
INSERT INTO crypto (symbol, name, quantity, cost_basis, api_source) VALUES
('KUB', 'Bitkub Coin', 70, 1000, 'coingecko'),
('BTC', 'Bitcoin (Muun)', 0.0003716, 490.00, 'coingecko'),
('CAKE', 'PancakeSwap', 46.81877, 10000, 'coingecko'),
('TWT', 'Trust Wallet Token', 119.506659, 0.001, 'coingecko'),
('BTC', 'Bitcoin (Upbit)', 0.00108376, 1618.07, 'coingecko'),
('ADA', 'Cardano', 10, 0.01, 'coingecko'),
('BTC', 'Bitcoin (Bitkub)', 0.0034387, 9350.16, 'coingecko'),
('APE', 'ApeCoin', 1.1471, 500.00, 'coingecko'),
('BTZ', 'Bitazza Token', 1083.68, 500.00, 'coingecko'),
('USDT', 'Tether', 102.16, 1800.00, 'coingecko'),
('BTC', 'Bitcoin (Trust)', 0.026518, 0.001, 'coingecko'),
('BTC', 'Bitcoin (Ledger)', 0.1272208, 20500.00, 'coingecko'),
('BTC', 'Bitcoin (Binance)', 0.00171082, 1601.257456, 'coingecko'),
('BTC', 'Bitcoin (WOS)', 0.0003, 0.001, 'coingecko'),
('BNB', 'Binance Coin', 6.10305203, 97764.99555, 'coingecko'),
('ETH', 'Ethereum', 0.2431966, 18149.77636, 'coingecko');

-- Check inserted data
SELECT 
    symbol,
    name,
    quantity,
    cost_basis,
    created_at
FROM crypto
ORDER BY cost_basis DESC;

-- Summary by symbol
SELECT 
    symbol,
    COUNT(*) as accounts,
    SUM(quantity) as total_quantity,
    SUM(cost_basis) as total_cost_basis
FROM crypto
GROUP BY symbol
ORDER BY total_cost_basis DESC;
