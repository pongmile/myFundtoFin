-- ===================================================================
-- Sample Data for Testing (Optional)
-- ===================================================================
-- คุณสามารถรัน SQL นี้เพื่อใส่ข้อมูลตัวอย่างสำหรับทดสอบ
-- หรือข้ามไปเพิ่มข้อมูลผ่านเว็บแทนก็ได้

-- ===================================================================
-- 1. Cash Accounts (บัญชีเงินสด)
-- ===================================================================

INSERT INTO cash_accounts (bank_name, amount, currency, bank_logo) VALUES
('SCB ออม', 10000.00, 'THB', null),
('Kasikorn หลัก', 50000.00, 'THB', null),
('Bangkok Bank ออม', 25000.00, 'THB', null),
('USD Account', 1000.00, 'USD', null),
('CAD Account', 500.00, 'CAD', null);

-- ===================================================================
-- 2. Stocks/ETF/Funds (หุ้น/กองทุน)
-- ===================================================================

-- หุ้นต่างประเทศ (Yahoo Finance)
INSERT INTO stocks (symbol, name, type, quantity, cost_basis, currency, data_source) VALUES
('AAPL', 'Apple Inc.', 'stock_foreign', 10.0000, 50000.00, 'USD', 'yahoo'),
('MSFT', 'Microsoft Corporation', 'stock_foreign', 5.0000, 30000.00, 'USD', 'yahoo'),
('GOOGL', 'Alphabet Inc.', 'stock_foreign', 3.0000, 20000.00, 'USD', 'yahoo');

-- ETF
INSERT INTO stocks (symbol, name, type, quantity, cost_basis, currency, data_source) VALUES
('SPY', 'SPDR S&P 500 ETF', 'etf', 20.0000, 100000.00, 'USD', 'yahoo'),
('QQQ', 'Invesco QQQ Trust', 'etf', 10.0000, 50000.00, 'USD', 'yahoo');

-- กองทุนไทย (SCBAM)
INSERT INTO stocks (symbol, name, type, quantity, cost_basis, currency, data_source, data_url) VALUES
('SCBWORLD', 'SCBWORLD(E)', 'fund', 1000.0000, 15000.00, 'THB', 'scbam', 
 'https://www.scbam.com/th/fund/foreign-investment-fund-equity/fund-information/scbworlde');

INSERT INTO stocks (symbol, name, type, quantity, cost_basis, currency, data_source, data_url) VALUES
('SCBS&P500SSF', 'SCBS&P500SSF', 'fund', 500.0000, 8000.00, 'THB', 'scbam', 
 'https://www.scbam.com/th/fund/reduce-taxes/fund-information/scbs-p500-ssf');

-- กองทุนไทย (FundSuperMart)
INSERT INTO stocks (symbol, name, type, quantity, cost_basis, currency, data_source, data_url) VALUES
('KKP-INRMF', 'KKP INRMF', 'fund', 800.0000, 12000.00, 'THB', 'fundsupermart', 
 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=014064');

-- ===================================================================
-- 3. Cryptocurrency (เหรียญ Crypto)
-- ===================================================================

INSERT INTO crypto (symbol, name, quantity, cost_basis, api_source) VALUES
('BTC', 'Bitcoin', 0.50000000, 1000000.00, 'bitkub'),
('ETH', 'Ethereum', 5.00000000, 500000.00, 'bitkub'),
('KUB', 'Bitkub Coin', 1000.00000000, 10000.00, 'bitkub'),
('USDT', 'Tether', 10000.00000000, 350000.00, 'bitkub'),
('ADA', 'Cardano', 5000.00000000, 50000.00, 'coinranking');

-- ===================================================================
-- 4. Liabilities (หนี้สิน)
-- ===================================================================

INSERT INTO liabilities (name, type, amount, currency) VALUES
('บัตรเครดิต SCB', 'credit_card', 15000.00, 'THB'),
('สินเชื่อรถยนต์', 'car_loan', 500000.00, 'THB');

-- ===================================================================
-- 5. Wealth History (ประวัติ - ตัวอย่าง 7 วันล่าสุด)
-- ===================================================================

-- สัปดาห์ที่แล้ว
INSERT INTO wealth_history (date, total_wealth, cash, crypto, stocks, liabilities, cash_diff, crypto_diff, stocks_diff, crypto_cost_basis, stocks_cost_basis) VALUES
(CURRENT_DATE - INTERVAL '7 days', 2000000.00, 500000.00, 800000.00, 700000.00, 515000.00, 0, 0, 0, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '6 days', 2050000.00, 520000.00, 820000.00, 710000.00, 515000.00, 20000, 20000, 10000, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '5 days', 2080000.00, 520000.00, 850000.00, 710000.00, 515000.00, 0, 30000, 0, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '4 days', 2100000.00, 530000.00, 860000.00, 710000.00, 515000.00, 10000, 10000, 0, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '3 days', 2150000.00, 530000.00, 900000.00, 720000.00, 515000.00, 0, 40000, 10000, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '2 days', 2200000.00, 540000.00, 920000.00, 740000.00, 515000.00, 10000, 20000, 20000, 760000.00, 650000.00),
(CURRENT_DATE - INTERVAL '1 days', 2250000.00, 550000.00, 950000.00, 750000.00, 515000.00, 10000, 30000, 10000, 760000.00, 650000.00);

-- วันนี้
INSERT INTO wealth_history (date, total_wealth, cash, crypto, stocks, liabilities, cash_diff, crypto_diff, stocks_diff, crypto_cost_basis, stocks_cost_basis) VALUES
(CURRENT_DATE, 2300000.00, 560000.00, 980000.00, 760000.00, 515000.00, 10000, 30000, 10000, 760000.00, 650000.00);

-- ===================================================================
-- เสร็จสิ้น! ตอนนี้คุณมีข้อมูลตัวอย่างสำหรับทดสอบแล้ว
-- ===================================================================

-- ตรวจสอบข้อมูล:
SELECT 'Cash Accounts' as table_name, COUNT(*) as count FROM cash_accounts
UNION ALL
SELECT 'Stocks', COUNT(*) FROM stocks
UNION ALL
SELECT 'Crypto', COUNT(*) FROM crypto
UNION ALL
SELECT 'Liabilities', COUNT(*) FROM liabilities
UNION ALL
SELECT 'Wealth History', COUNT(*) FROM wealth_history;

-- ===================================================================
-- หมายเหตุ:
-- - ข้อมูลเหล่านี้เป็นตัวอย่างเท่านั้น
-- - คุณสามารถลบและเพิ่มข้อมูลจริงของคุณได้
-- - หรือจะเพิ่มผ่าน Web UI ก็ได้
-- ===================================================================

-- ถ้าต้องการลบข้อมูลตัวอย่างทั้งหมด:
-- DELETE FROM cash_accounts;
-- DELETE FROM stocks;
-- DELETE FROM crypto;
-- DELETE FROM liabilities;
-- DELETE FROM wealth_history;
