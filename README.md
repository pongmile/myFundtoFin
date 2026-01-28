# Wealth Portfolio Tracker

A comprehensive wealth portfolio management web application built with Next.js, TypeScript, and Supabase. Track your cash, stocks, ETFs, mutual funds, cryptocurrencies, and liabilities with real-time price updates.

## ✨ Features

### 📊 Dashboard
- **Pie chart** showing asset allocation
- **Total wealth summary** with daily and monthly changes
- **Growth chart** displaying 90-day wealth history
- Real-time profit/loss indicators
- Liabilities warning banner

### 📈 Wealth History
- Complete historical tracking of all assets
- Daily snapshots of cash, crypto, stocks
- Difference tracking (increases/decreases)
- Cost basis recording

### 💰 Cash Management
- Multi-bank account support
- Multi-currency support (THB, USD, CAD)
- Bank logo display
- Easy add/edit/delete functionality
- Automatic currency conversion to THB

### 📈 Stocks & Funds
- Thai stocks, international stocks, ETFs, and mutual funds
- Real-time price fetching from:
  - **Yahoo Finance** for international stocks/ETFs
  - **SCBAM** for Thai mutual funds (web scraping)
  - **FundSuperMart** for Thai funds
- Automatic profit/loss calculation
- Multi-currency support (THB/USD)
- Automatic USD to THB conversion
- 4 decimal precision for amounts
- 15-minute price caching with manual refresh

### ₿ Cryptocurrency
- Track multiple cryptocurrencies
- Real-time prices from:
  - **Bitkub API** (BTC, ETH, KUB, USDT, etc.)
  - **CryptoPrices.cc** as fallback
  - **CoinGecko** as secondary fallback
- Cost basis and profit/loss tracking
- 8 decimal precision for quantities
- 15-minute price caching

### 💳 Liabilities
- Credit card debt tracking
- Car loans, mortgages, and other debts
- Automatic deduction from total wealth
- Multi-currency support

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Web Scraping**: Cheerio
- **HTTP Client**: Axios

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account ([Create one here](https://supabase.com))

### Step 1: Clone or Navigate to Project

```bash
cd c:\Users\pongm\Documents\myFundtoFin
```

### Step 2: Install Dependencies

Already installed, but if you need to reinstall:

```bash
npm install
```

### Step 3: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings** > **API**
3. Copy your **Project URL** and **anon/public key**
4. Update `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-schema.sql` file in this project
3. Copy and paste the entire content into the SQL Editor
4. Click **Run** to create all tables and indexes

This will create:
- `cash_accounts` table
- `stocks` table
- `crypto` table
- `liabilities` table
- `wealth_history` table
- `price_cache` table (for 15-minute caching)

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New** > **Project**
4. Import your Git repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure project

# For production deployment
vercel --prod
```

### Setting Environment Variables on Vercel

After deployment, add environment variables:

1. Go to your project in Vercel dashboard
2. Click **Settings** > **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Redeploy for changes to take effect

## 📖 Usage Guide

### Adding Cash Accounts

1. Go to **เงินสด (Cash)** page
2. Click **เพิ่มบัญชี (Add Account)**
3. Enter bank name, amount, and currency
4. Click **บันทึก (Save)**

### Adding Stocks/ETFs/Funds

1. Go to **หุ้น & กองทุน (Stocks & Funds)** page
2. Click **เพิ่มรายการ (Add Item)**
3. Fill in:
   - **Symbol**: Stock ticker (e.g., AAPL, MSFT)
   - **Name**: Full name
   - **Type**: Thai stock, foreign stock, ETF, or fund
   - **Data Source**: Yahoo Finance, SCBAM, or FundSuperMart
   - **Quantity**: Number of shares
   - **Cost Basis**: Total cost in THB or USD
   - **Currency**: THB or USD
4. For Thai funds from SCBAM or FundSuperMart, paste the fund URL
5. Click **บันทึก (Save)**
6. Click **รีเฟรชราคา (Refresh Prices)** to fetch current prices

#### Example Fund URLs:
- SCBWORLD(E): `https://www.scbam.com/th/fund/foreign-investment-fund-equity/fund-information/scbworlde`
- SCBS&P500SSF: `https://www.scbam.com/th/fund/reduce-taxes/fund-information/scbs-p500-ssf`
- KKP INRMF: `https://www.fundsupermart.in.th/fund-info.aspx?fcode=014064`

### Adding Cryptocurrencies

1. Go to **Cryptocurrency** page
2. Click **เพิ่มรายการ (Add Item)**
3. Enter:
   - **Symbol**: BTC, ETH, KUB, etc.
   - **Name**: Full name (Bitcoin, Ethereum, etc.)
   - **Quantity**: Number of coins (up to 8 decimals)
   - **Cost Basis**: Total cost in THB
   - **API Source**: Bitkub, CoinRanking, or CryptoPrices
4. Click **บันทึก (Save)**
5. Prices auto-refresh every 15 minutes or click **รีเฟรชราคา**

### Adding Liabilities

1. Go to **หนี้สิน (Liabilities)** page
2. Click **เพิ่มหนี้สิน (Add Liability)**
3. Enter debt name, type, amount, and currency
4. Click **บันทึก (Save)**
5. Liabilities are automatically deducted from total wealth

## 🔧 Configuration

### Price Caching

Prices are cached for **15 minutes** to reduce API calls and improve performance. You can:
- Wait for auto-refresh (15 minutes)
- Click **รีเฟรชราคา (Refresh Prices)** button to force update
- If API fetch fails, the app uses cached prices as fallback

### Supported APIs

**Stocks & ETFs:**
- Yahoo Finance API (free, no key required)

**Thai Mutual Funds:**
- SCBAM (web scraping)
- FundSuperMart (web scraping)

**Cryptocurrencies:**
- Bitkub API (free, public endpoint)
- CryptoPrices.cc
- CoinGecko API (free tier)

**Exchange Rates:**
- ExchangeRate-API (free tier)
- Fallback hardcoded rates included

**Gold Prices:**
- Business Insider (web scraping)

## 🗂️ Project Structure

```
myFundtoFin/
├── app/
│   ├── api/
│   │   └── prices/
│   │       ├── stock/route.ts      # Yahoo Finance API
│   │       ├── fund/route.ts       # SCBAM/FundSuperMart scraping
│   │       ├── crypto/route.ts     # Bitkub/CoinGecko API
│   │       └── gold/route.ts       # Gold price scraping
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main page with navigation
├── components/
│   ├── Dashboard.tsx               # Dashboard with charts
│   ├── WealthHistory.tsx           # History table
│   ├── CashAccounts.tsx            # Cash management
│   ├── StocksAndFunds.tsx          # Stocks/ETF/Funds tracking
│   ├── Cryptocurrency.tsx          # Crypto tracking
│   └── Liabilities.tsx             # Debt tracking
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── cache.ts                    # Price caching utilities
├── types/
│   └── index.ts                    # TypeScript interfaces
├── supabase-schema.sql             # Database schema
├── .env.local                      # Environment variables (create this)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🎨 Customization

### Adding Bank Logos

Edit `components/CashAccounts.tsx` and update the `BANK_LOGOS` object:

```typescript
const BANK_LOGOS: Record<string, string> = {
  'SCB': 'https://your-logo-url.com/scb.png',
  'Kasikorn': 'https://your-logo-url.com/kbank.png',
  // Add more banks...
};
```

### Adding New Data Sources

1. Create a new API route in `app/api/prices/`
2. Implement fetching logic with caching
3. Update relevant components to use the new endpoint

## 🐛 Troubleshooting

### Supabase Connection Issues
- Check `.env.local` has correct URL and key
- Ensure Supabase project is active
- Check browser console for CORS errors

### Price Fetching Fails
- Check internet connection
- APIs may have rate limits
- Cached prices are used as fallback
- Check browser console for specific errors

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 📝 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to fork, modify, and enhance this project for your needs!

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Made with ❤️ using Next.js, TypeScript, and Supabase**
