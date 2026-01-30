# 📁 Project Structure

```
myFundtoFin/
│
├── 📱 app/                                    # Next.js App Router
│   ├── api/                                   # API Routes
│   │   └── prices/                            # Price fetching endpoints
│   │       ├── stock/
│   │       │   └── route.ts                   # Yahoo Finance API
│   │       ├── fund/
│   │       │   └── route.ts                   # SCBAM/FundSuperMart scraping
│   │       ├── crypto/
│   │       │   └── route.ts                   # Bitkub/CoinGecko API
│   │       └── gold/
│   │           └── route.ts                   # Gold price scraping
│   │
│   ├── globals.css                            # Global CSS with Tailwind
│   ├── layout.tsx                             # Root layout (HTML wrapper)
│   └── page.tsx                               # Main page with navigation
│
├── 🧩 components/                             # React Components
│   ├── Dashboard.tsx                          # หน้าแรก - Charts & Summary
│   ├── WealthHistory.tsx                      # ประวัติ Wealth
│   ├── CashAccounts.tsx                       # Cash
│   ├── StocksAndFunds.tsx                     # หุ้น/ETF/กองทุน
│   ├── Cryptocurrency.tsx                     # Crypto
│   └── Liabilities.tsx                        # หนี้สิน
│
├── 🔧 lib/                                    # Utilities & Helpers
│   ├── supabase.ts                            # Supabase client setup
│   └── cache.ts                               # Price caching (15 min)
│
├── 📘 types/                                  # TypeScript Types
│   └── index.ts                               # All interface definitions
│
├── 💾 Database Files
│   ├── supabase-schema.sql                    # Database schema (REQUIRED)
│   └── sample-data.sql                        # Sample data (OPTIONAL)
│
├── 📚 Documentation
│   ├── README.md                              # Main documentation
│   ├── QUICKSTART.md                          # Quick start guide (Thai)
│   ├── DEPLOYMENT.md                          # Vercel deployment guide
│   ├── PROJECT_SUMMARY.md                     # Project completion summary
│   ├── CHECKLIST.md                           # Setup checklist
│   └── STRUCTURE.md                           # This file
│
├── ⚙️ Configuration Files
│   ├── .env.local                             # Environment variables (DO NOT COMMIT)
│   ├── .gitignore                             # Git ignore rules
│   ├── next.config.ts                         # Next.js configuration
│   ├── tailwind.config.ts                     # Tailwind CSS config
│   ├── tsconfig.json                          # TypeScript config
│   ├── postcss.config.mjs                     # PostCSS config
│   ├── package.json                           # Dependencies
│   └── package-lock.json                      # Lock file
│
└── 📦 Generated Folders (Don't edit)
    ├── node_modules/                          # Dependencies (ignored by git)
    └── .next/                                 # Build output (ignored by git)
```

---

## 📄 File Descriptions

### 🔥 Critical Files (Must configure)

#### `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```
**Purpose**: Store Supabase credentials
**Action Required**: ✅ Update with your Supabase details

#### `supabase-schema.sql`
**Purpose**: Database structure definition
**Action Required**: ✅ Run in Supabase SQL Editor

---

### 📱 Application Files

#### `app/page.tsx`
- Main entry point
- Contains sidebar navigation
- Renders different components based on active tab
- **Features**: Collapsible sidebar, responsive design

#### `app/layout.tsx`
- Root HTML structure
- Loads global CSS
- Sets page metadata (title, description)

#### `app/globals.css`
- Tailwind CSS imports
- Custom styles
- Scrollbar styling
- Print styles

---

### 🧩 Component Details

#### `components/Dashboard.tsx`
**What it does:**
- Displays total wealth summary
- Shows pie chart (asset allocation)
- Shows line chart (90-day growth)
- Displays daily/monthly changes
- Warns about liabilities

**Features:**
- Auto-calculates totals from all sources
- Multi-currency conversion
- Refresh button
- Color-coded profit/loss

#### `components/WealthHistory.tsx`
**What it does:**
- Shows historical wealth records
- Displays in table format
- Shows differences (increases/decreases)

**Features:**
- Date-based sorting
- Color-coded changes
- Thai date formatting

#### `components/CashAccounts.tsx`
**What it does:**
- Manage bank accounts
- Add/Edit/Delete accounts
- Multi-currency support

**Features:**
- Bank logos (customizable)
- Currency: THB, USD, CAD
- Auto-converts to THB
- Modal form

#### `components/StocksAndFunds.tsx`
**What it does:**
- Track stocks, ETFs, and mutual funds
- Fetch real-time prices
- Calculate profit/loss

**Features:**
- Yahoo Finance integration
- SCBAM scraping
- FundSuperMart scraping
- 4 decimal precision
- Refresh prices button
- 15-minute caching

#### `components/Cryptocurrency.tsx`
**What it does:**
- Track crypto holdings
- Fetch real-time crypto prices
- Calculate profit/loss

**Features:**
- Bitkub API
- CoinGecko fallback
- 8 decimal precision (quantity)
- 4 decimal precision (prices)
- Shows total cost vs. value

#### `components/Liabilities.tsx`
**What it does:**
- Track debts
- Auto-deducts from wealth

**Features:**
- Credit cards, loans, mortgages
- Multi-currency
- Warning banner

---

### 🔌 API Routes

#### `app/api/prices/stock/route.ts`
**Endpoint**: `/api/prices/stock?symbol=AAPL`
**Data Source**: Yahoo Finance
**Returns**: Stock/ETF prices in USD
**Features**: 15-min cache, fallback to cache on error

#### `app/api/prices/fund/route.ts`
**Endpoint**: `/api/prices/fund?url=...&source=scbam`
**Data Sources**: SCBAM, FundSuperMart
**Method**: Web scraping (Cheerio)
**Returns**: Thai fund NAV prices in THB

#### `app/api/prices/crypto/route.ts`
**Endpoint**: `/api/prices/crypto?symbol=BTC`
**Data Sources**: Bitkub → CryptoPrices → CoinGecko
**Returns**: Crypto prices in THB
**Features**: Multiple fallbacks

#### `app/api/prices/gold/route.ts`
**Endpoint**: `/api/prices/gold`
**Data Source**: Business Insider
**Returns**: Gold price per oz in USD

---

### 🔧 Utility Files

#### `lib/supabase.ts`
**Purpose**: Initialize Supabase client
**Exports**: `supabase` - Configured client instance

#### `lib/cache.ts`
**Purpose**: Price caching logic
**Functions**:
- `getCachedPrice()` - Retrieve from cache
- `setCachedPrice()` - Store in cache
- `getExchangeRate()` - Get currency rates

**Cache Duration**: 15 minutes

---

### 📘 Type Definitions

#### `types/index.ts`
**Contains**:
- `PriceData` - Price API response
- `ExchangeRates` - Currency rates
- `StockData` - Stock/fund data
- `CryptoData` - Crypto data
- `CashAccount` - Bank account data
- `Liability` - Debt data
- `WealthHistory` - Historical record

---

### ⚙️ Configuration Files

#### `next.config.ts`
- Enables remote image domains
- Configures Next.js behavior

#### `tailwind.config.ts`
- Defines Tailwind CSS paths
- Custom theme colors
- Plugin configuration

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases (@/* → ./*)
- Strict mode enabled

#### `postcss.config.mjs`
- PostCSS plugins
- Tailwind CSS PostCSS plugin

#### `package.json`
**Scripts**:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Start production server

**Dependencies**:
- Next.js 16+
- React 19+
- Supabase JS
- Recharts (charts)
- Cheerio (scraping)
- Lucide React (icons)

---

## 🗄️ Database Tables

### `cash_accounts`
```
id (UUID)
bank_name (TEXT)
bank_logo (TEXT)
amount (DECIMAL 15,4)
currency (TEXT)
created_at
updated_at
```

### `stocks`
```
id (UUID)
symbol (TEXT)
name (TEXT)
type (TEXT) - stock_thai/stock_foreign/etf/fund
quantity (DECIMAL 15,4)
cost_basis (DECIMAL 15,4)
currency (TEXT)
data_source (TEXT)
data_url (TEXT)
xpath_selector (TEXT)
created_at
updated_at
```

### `crypto`
```
id (UUID)
symbol (TEXT)
name (TEXT)
quantity (DECIMAL 15,8)
cost_basis (DECIMAL 15,4)
api_source (TEXT)
api_url (TEXT)
created_at
updated_at
```

### `liabilities`
```
id (UUID)
name (TEXT)
type (TEXT)
amount (DECIMAL 15,4)
currency (TEXT)
created_at
updated_at
```

### `wealth_history`
```
id (UUID)
date (DATE)
total_wealth (DECIMAL 15,4)
cash (DECIMAL 15,4)
crypto (DECIMAL 15,4)
stocks (DECIMAL 15,4)
liabilities (DECIMAL 15,4)
cash_diff (DECIMAL 15,4)
crypto_diff (DECIMAL 15,4)
stocks_diff (DECIMAL 15,4)
crypto_cost_basis (DECIMAL 15,4)
stocks_cost_basis (DECIMAL 15,4)
created_at
```

### `price_cache`
```
id (UUID)
asset_type (TEXT)
symbol (TEXT)
price (DECIMAL 15,8)
currency (TEXT)
source (TEXT)
cached_at (TIMESTAMP)
```

---

## 🔄 Data Flow

### 1. Price Fetching Flow
```
User clicks "Refresh" 
    ↓
Component calls API route
    ↓
API checks cache (15 min)
    ↓
If cached: Return cached price
If not: Fetch from external API
    ↓
Store in cache
    ↓
Return to component
    ↓
Update UI
```

### 2. Data Saving Flow
```
User fills form
    ↓
Clicks "Save"
    ↓
Component validates
    ↓
Call Supabase insert/update
    ↓
Database updated
    ↓
Reload data
    ↓
Update UI
```

### 3. Dashboard Calculation Flow
```
Dashboard loads
    ↓
Fetch all data (cash, stocks, crypto, liabilities)
    ↓
For each asset:
  - Convert currency to THB
  - Fetch current prices
  - Calculate values
    ↓
Sum totals
    ↓
Calculate profit/loss
    ↓
Generate charts
    ↓
Display
```

---

## 🎨 Styling

### Tailwind CSS Classes Used
- Layout: `flex`, `grid`, `gap-*`
- Spacing: `p-*`, `m-*`, `space-y-*`
- Colors: `bg-*`, `text-*`, `border-*`
- Responsive: `md:`, `lg:`, `xl:`
- Effects: `hover:`, `transition-*`, `shadow-*`

### Custom CSS
- Scrollbar styling
- Print styles (hide buttons when printing)

---

## 🚀 Deployment

### Vercel
- Automatically detects Next.js
- Zero configuration needed
- Just add environment variables
- Deploy on every git push

### Requirements
1. Git repository
2. Vercel account
3. Environment variables set
4. Supabase project running

---

## 📖 Documentation Index

1. **README.md** - Complete feature documentation
2. **QUICKSTART.md** - Fast setup guide (Thai)
3. **DEPLOYMENT.md** - Vercel deployment steps
4. **PROJECT_SUMMARY.md** - What we built
5. **CHECKLIST.md** - Setup verification
6. **STRUCTURE.md** - This file

---

## 🎯 Key Concepts

### Server vs Client Components
- **Server**: API routes, data fetching
- **Client**: Interactive UI components

### State Management
- Local state (useState)
- No global state (can add Redux/Zustand if needed)

### Data Fetching
- Client-side fetching (useEffect)
- API routes as middleware
- Caching in database

### Styling
- Tailwind utility classes
- Component-scoped styles
- Responsive design

---

**That's the complete structure! 🎉**

ทุกไฟล์ทุก folder มีจุดประสงค์ชัดเจน และทำงานร่วมกันเป็นระบบ Wealth Portfolio Tracker ที่สมบูรณ์!
