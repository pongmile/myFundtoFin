-- Insert user's actual cash account data
-- Run this in Supabase SQL Editor

-- SCB accounts
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('ธงชัย', 'ธนาคารไทยพาณิชย์', 1312501.58, 'THB'),
('ลงทุน', 'ธนาคารไทยพาณิชย์', 10000.00, 'THB'),
('ออม', 'ธนาคารไทยพาณิชย์', 1005000.00, 'THB'),
('เงินเดือน', 'ธนาคารไทยพาณิชย์', 10000.00, 'THB');

-- UOB account
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'ธนาคารยูโอบี', 22000.00, 'THB');

-- Kasikorn accounts
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'ธนาคารกสิกรไทย', 14000.00, 'THB'),
('คอนโด', 'ธนาคารกสิกรไทย', 1000.00, 'THB');

-- Dime account
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'Dime', 11000.00, 'THB');

-- TTB account
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'ธนาคารทหารไทยธนชาต', 107000.00, 'THB');

-- Krungsri account
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'ธนาคารกรุงศรีอยุธยา', 38500.00, 'THB');

-- GHB (Government Housing Bank)
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('หลัก', 'ธนาคารอาคารสงเคราะห์', 280.00, 'THB');

-- Kept Krungsri
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('กรุงศรี', 'Kept', 200.00, 'THB');

-- Foreign currency accounts
INSERT INTO cash_accounts (account_name, bank_name, amount, currency) VALUES
('dime', 'Dime', 46395.00, 'USD'),
('หลัก', 'อื่นๆ', 33301.11, 'CAD'),
('หลัก', 'อื่นๆ', 9925.47, 'GBP'),
('scb', 'ธนาคารไทยพาณิชย์', 4000.00, 'GBP');

-- Check results
SELECT 
    account_name,
    bank_name,
    amount,
    currency,
    created_at
FROM cash_accounts
ORDER BY created_at DESC;
