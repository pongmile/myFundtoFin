import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Wealth history data from your spreadsheet
const wealthHistoryData = [
  { date: '2025-04-28', total_wealth: 1609666.31, cash: 729392.89, crypto: 610817.32, stocks: 269456.10, liabilities: 0 },
  { date: '2025-05-18', total_wealth: 1752760.49, cash: 785104.50, crypto: 675063.17, stocks: 292592.82, liabilities: 0 },
  { date: '2025-06-18', total_wealth: 1775256.34, cash: 816001.63, crypto: 665396.89, stocks: 293857.82, liabilities: 0 },
  { date: '2025-06-27', total_wealth: 1818172.51, cash: 836324.18, crypto: 675131.23, stocks: 306717.09, liabilities: 0 },
  { date: '2025-06-30', total_wealth: 1826888.77, cash: 836010.19, crypto: 678902.69, stocks: 311975.90, liabilities: 0 },
  { date: '2025-07-02', total_wealth: 1834825.86, cash: 846024.23, crypto: 673902.99, stocks: 314898.64, liabilities: 0 },
  { date: '2025-07-04', total_wealth: 1849582.21, cash: 846246.31, crypto: 686916.64, stocks: 316419.26, liabilities: 0 },
  { date: '2025-07-06', total_wealth: 1861687.92, cash: 856053.90, crypto: 688522.54, stocks: 317111.48, liabilities: 0 },
  { date: '2025-07-08', total_wealth: 1867693.09, cash: 866256.39, crypto: 684673.32, stocks: 316763.38, liabilities: 0 },
  { date: '2025-07-10', total_wealth: 1878506.15, cash: 866284.32, crypto: 694719.58, stocks: 317502.24, liabilities: 0 },
  { date: '2025-07-12', total_wealth: 1916322.73, cash: 865852.66, crypto: 733117.30, stocks: 317352.76, liabilities: 0 },
  { date: '2025-07-14', total_wealth: 1990749.67, cash: 905823.65, crypto: 761709.02, stocks: 323217.00, liabilities: 0 },
  { date: '2025-07-16', total_wealth: 1970047.10, cash: 905848.69, crypto: 740301.99, stocks: 323896.42, liabilities: 0 },
  { date: '2025-07-18', total_wealth: 1985434.42, cash: 905637.02, crypto: 755215.72, stocks: 324581.68, liabilities: 0 },
  { date: '2025-07-20', total_wealth: 1983614.57, cash: 905656.02, crypto: 752863.32, stocks: 325095.23, liabilities: 0 },
  { date: '2025-07-22', total_wealth: 1990011.27, cash: 905406.31, crypto: 759635.71, stocks: 324969.25, liabilities: 0 },
  { date: '2025-07-24', total_wealth: 1986391.82, cash: 905728.56, crypto: 755309.17, stocks: 325354.09, liabilities: 0 },
  { date: '2025-07-26', total_wealth: 1980705.91, cash: 905750.39, crypto: 748063.02, stocks: 326892.50, liabilities: 0 },
  { date: '2025-07-28', total_wealth: 1999423.24, cash: 905711.19, crypto: 766909.57, stocks: 326802.48, liabilities: 0 },
  { date: '2025-07-30', total_wealth: 2006959.95, cash: 915509.64, crypto: 762297.40, stocks: 329152.91, liabilities: 0 },
  { date: '2025-08-01', total_wealth: 2001216.39, cash: 928344.33, crypto: 745407.65, stocks: 327464.41, liabilities: 0 },
  { date: '2025-08-03', total_wealth: 1999680.28, cash: 933035.39, crypto: 737631.46, stocks: 329013.44, liabilities: 0 },
  { date: '2025-08-05', total_wealth: 2009620.53, cash: 938063.61, crypto: 742464.50, stocks: 329092.42, liabilities: 0 },
  { date: '2025-08-07', total_wealth: 2028083.68, cash: 938114.12, crypto: 758500.71, stocks: 331468.85, liabilities: 0 },
  { date: '2025-08-09', total_wealth: 2029956.60, cash: 938041.92, crypto: 758658.32, stocks: 333256.36, liabilities: 0 },
  { date: '2025-08-11', total_wealth: 2032795.00, cash: 938110.91, crypto: 760797.32, stocks: 333886.77, liabilities: 0 },
  { date: '2025-08-13', total_wealth: 2060073.87, cash: 938136.46, crypto: 786958.46, stocks: 334978.96, liabilities: 0 },
  { date: '2025-08-15', total_wealth: 2065301.35, cash: 949670.16, crypto: 774768.88, stocks: 340862.31, liabilities: 0 },
  { date: '2025-08-17', total_wealth: 2082174.20, cash: 963123.23, crypto: 778311.98, stocks: 340738.99, liabilities: 0 },
  { date: '2025-08-19', total_wealth: 2072695.17, cash: 963217.75, crypto: 767877.49, stocks: 341599.93, liabilities: 0 },
  { date: '2025-08-21', total_wealth: 2084136.95, cash: 973251.75, crypto: 769334.39, stocks: 341550.81, liabilities: 0 },
  { date: '2025-08-23', total_wealth: 2101186.82, cash: 972895.45, crypto: 786675.97, stocks: 341615.40, liabilities: 0 },
  { date: '2025-08-25', total_wealth: 2074424.63, cash: 973044.56, crypto: 759534.42, stocks: 341845.66, liabilities: 0 },
  { date: '2025-08-27', total_wealth: 2092560.41, cash: 993064.79, crypto: 756992.27, stocks: 342503.35, liabilities: 0 },
  { date: '2025-08-29', total_wealth: 2099044.62, cash: 993161.45, crypto: 760465.04, stocks: 345418.13, liabilities: 0 },
  { date: '2025-08-31', total_wealth: 2077812.22, cash: 993084.72, crypto: 739900.21, stocks: 344827.29, liabilities: 0 },
  { date: '2025-09-02', total_wealth: 2098833.83, cash: 1002969.32, crypto: 750802.95, stocks: 345061.56, liabilities: 0 },
  { date: '2025-09-04', total_wealth: 2093740.61, cash: 1002744.79, crypto: 744412.49, stocks: 346583.33, liabilities: 0 },
  { date: '2025-09-06', total_wealth: 2112541.97, cash: 1015271.22, crypto: 749788.75, stocks: 347481.99, liabilities: 0 },
  { date: '2025-09-08', total_wealth: 2115604.31, cash: 1018358.83, crypto: 749461.15, stocks: 347784.32, liabilities: 0 },
  { date: '2025-09-10', total_wealth: 2119353.49, cash: 1024817.58, crypto: 747536.47, stocks: 346999.44, liabilities: 0 },
  { date: '2025-09-12', total_wealth: 2148608.09, cash: 1024758.66, crypto: 771088.79, stocks: 352760.64, liabilities: 0 },
  { date: '2025-09-14', total_wealth: 2156412.26, cash: 1024809.88, crypto: 778031.08, stocks: 353571.29, liabilities: 0 },
  { date: '2025-09-16', total_wealth: 2159590.87, cash: 1027975.62, crypto: 777456.35, stocks: 354158.90, liabilities: 0 },
  { date: '2025-09-18', total_wealth: 2168246.41, cash: 1032177.06, crypto: 782858.66, stocks: 353210.69, liabilities: 0 },
  { date: '2025-09-20', total_wealth: 2191191.47, cash: 1032507.54, crypto: 800759.80, stocks: 357924.13, liabilities: 0 },
  { date: '2025-09-22', total_wealth: 2174382.02, cash: 1032255.70, crypto: 783535.68, stocks: 358590.64, liabilities: 0 },
  { date: '2025-09-24', total_wealth: 2184753.11, cash: 1042265.65, crypto: 783151.92, stocks: 359335.54, liabilities: 0 },
  { date: '2025-09-26', total_wealth: 2173827.80, cash: 1045392.99, crypto: 766842.62, stocks: 361592.19, liabilities: 0 },
  { date: '2025-09-28', total_wealth: 2177647.58, cash: 1045329.89, crypto: 770673.23, stocks: 361644.46, liabilities: 0 },
  { date: '2025-09-30', total_wealth: 2209903.52, cash: 1045834.35, crypto: 801317.98, stocks: 362751.20, liabilities: 0 },
  { date: '2025-10-02', total_wealth: 2268718.03, cash: 1060093.75, crypto: 839475.43, stocks: 369148.85, liabilities: 0 },
  { date: '2025-10-04', total_wealth: 2311406.70, cash: 1059905.37, crypto: 874758.01, stocks: 376743.33, liabilities: 0 },
  { date: '2025-10-06', total_wealth: 2319499.15, cash: 1059937.93, crypto: 883398.68, stocks: 376162.53, liabilities: 0 },
  { date: '2025-10-08', total_wealth: 2364551.70, cash: 1075225.80, crypto: 907530.53, stocks: 381795.37, liabilities: 0 },
  { date: '2025-10-10', total_wealth: 2400498.35, cash: 1077227.50, crypto: 929300.64, stocks: 383970.21, liabilities: 0 },
  { date: '2025-10-12', total_wealth: 2333876.38, cash: 1110707.95, crypto: 841506.47, stocks: 381661.97, liabilities: 0 },
  { date: '2025-10-14', total_wealth: 2338711.02, cash: 1112821.94, crypto: 839904.09, stocks: 385984.99, liabilities: 0 },
  { date: '2025-10-16', total_wealth: 2331968.82, cash: 1112230.94, crypto: 834048.26, stocks: 385689.63, liabilities: 0 },
  { date: '2025-10-18', total_wealth: 2302404.06, cash: 1112970.35, crypto: 802238.50, stocks: 387195.20, liabilities: 0 },
  { date: '2025-10-20', total_wealth: 2328978.27, cash: 1112476.18, crypto: 829102.18, stocks: 387399.91, liabilities: 0 },
  { date: '2025-10-22', total_wealth: 2313463.90, cash: 1113052.38, crypto: 811063.44, stocks: 389348.08, liabilities: 0 },
  { date: '2025-10-24', total_wealth: 2335747.63, cash: 1113072.62, crypto: 832544.07, stocks: 390130.95, liabilities: 0 },
  { date: '2025-10-26', total_wealth: 2349490.78, cash: 1113784.14, crypto: 845501.74, stocks: 390204.90, liabilities: 0 },
  { date: '2025-10-28', total_wealth: 2354154.26, cash: 1113148.88, crypto: 846231.00, stocks: 394774.39, liabilities: 0 },
  { date: '2025-10-30', total_wealth: 2316474.51, cash: 1113078.51, crypto: 809570.09, stocks: 393825.90, liabilities: 0 },
  { date: '2025-11-01', total_wealth: 2360431.28, cash: 1153168.88, crypto: 813488.46, stocks: 393773.94, liabilities: 0 },
  { date: '2025-11-03', total_wealth: 2341473.56, cash: 1155182.55, crypto: 791668.84, stocks: 394622.16, liabilities: 0 },
  { date: '2025-11-05', total_wealth: 2305689.55, cash: 1165278.71, crypto: 744041.53, stocks: 396369.30, liabilities: 0 },
  { date: '2025-11-07', total_wealth: 2293669.26, cash: 1164896.71, crypto: 734574.12, stocks: 394198.43, liabilities: 0 },
  { date: '2025-11-09', total_wealth: 2310252.35, cash: 1164804.60, crypto: 751921.90, stocks: 393525.84, liabilities: 0 },
  { date: '2025-11-11', total_wealth: 2348838.95, cash: 1175058.60, crypto: 776667.35, stocks: 397113.00, liabilities: 0 },
  { date: '2025-11-13', total_wealth: 2282986.90, cash: 1175216.29, crypto: 708147.11, stocks: 399623.49, liabilities: 0 },
  { date: '2025-11-15', total_wealth: 2281958.29, cash: 1175017.19, crypto: 708741.16, stocks: 398199.95, liabilities: 0 },
  { date: '2025-11-17', total_wealth: 2291459.11, cash: 1185234.44, crypto: 707820.27, stocks: 398404.40, liabilities: 0 },
  { date: '2025-11-19', total_wealth: 2262620.37, cash: 1185268.49, crypto: 681301.13, stocks: 396050.76, liabilities: 0 },
  { date: '2025-11-21', total_wealth: 2200943.08, cash: 1185015.03, crypto: 621762.06, stocks: 394165.99, liabilities: 0 },
  { date: '2025-11-23', total_wealth: 2227387.87, cash: 1184933.98, crypto: 647663.20, stocks: 394790.69, liabilities: 0 },
  { date: '2025-11-25', total_wealth: 2234007.07, cash: 1184728.20, crypto: 648783.38, stocks: 400495.49, liabilities: 0 },
  { date: '2025-11-27', total_wealth: 2239726.35, cash: 1185716.64, crypto: 650793.11, stocks: 403216.60, liabilities: 0 },
  { date: '2025-11-29', total_wealth: 2262981.84, cash: 1185499.89, crypto: 669542.01, stocks: 407939.94, liabilities: 0 },
  { date: '2025-12-01', total_wealth: 2237776.11, cash: 1210398.74, crypto: 620151.45, stocks: 407225.93, liabilities: 0 },
  { date: '2025-12-03', total_wealth: 2255057.63, cash: 1211110.84, crypto: 634140.64, stocks: 409806.15, liabilities: 0 },
  { date: '2025-12-05', total_wealth: 2289236.23, cash: 1211375.93, crypto: 661009.68, stocks: 416850.62, liabilities: 0 },
  { date: '2025-12-07', total_wealth: 2288680.55, cash: 1211375.93, crypto: 660462.59, stocks: 416842.03, liabilities: 0 },
  { date: '2025-12-09', total_wealth: 2316326.23, cash: 1227320.67, crypto: 664262.25, stocks: 424743.31, liabilities: 0 },
  { date: '2025-12-11', total_wealth: 2310670.68, cash: 1227245.70, crypto: 657135.17, stocks: 426289.81, liabilities: 0 },
  { date: '2025-12-13', total_wealth: 2311663.23, cash: 1228856.92, crypto: 657305.91, stocks: 425500.40, liabilities: 0 },
  { date: '2025-12-15', total_wealth: 2285795.72, cash: 1228614.02, crypto: 632762.21, stocks: 424419.49, liabilities: 0 },
  { date: '2025-12-17', total_wealth: 2284822.30, cash: 1231901.89, crypto: 628636.45, stocks: 424283.96, liabilities: 0 },
  { date: '2025-12-19', total_wealth: 2287616.79, cash: 1244666.35, crypto: 615875.64, stocks: 427074.80, liabilities: 0 },
  { date: '2025-12-21', total_wealth: 2321190.59, cash: 1252926.55, crypto: 636079.69, stocks: 432184.34, liabilities: 0 },
  { date: '2025-12-23', total_wealth: 2319609.05, cash: 1258883.93, crypto: 624505.34, stocks: 436219.78, liabilities: 0 },
  { date: '2025-12-25', total_wealth: 2318943.26, cash: 1258745.16, crypto: 621638.35, stocks: 438559.75, liabilities: 0 },
  { date: '2025-12-27', total_wealth: 2327300.18, cash: 1258803.92, crypto: 624089.05, stocks: 444407.21, liabilities: 0 },
  { date: '2025-12-29', total_wealth: 2333086.92, cash: 1258804.47, crypto: 629875.23, stocks: 444407.21, liabilities: 0 },
  { date: '2025-12-31', total_wealth: 2348676.01, cash: 1261228.46, crypto: 641649.25, stocks: 445798.30, liabilities: 0 },
  { date: '2026-01-02', total_wealth: 2366724.16, cash: 1275329.72, crypto: 643365.85, stocks: 448028.59, liabilities: 0 },
  { date: '2026-01-04', total_wealth: 2406689.55, cash: 1295992.85, crypto: 657192.91, stocks: 453503.78, liabilities: 0 },
  { date: '2026-01-06', total_wealth: 2432855.14, cash: 1300187.65, crypto: 674923.04, stocks: 457744.45, liabilities: 0 },
  { date: '2026-01-08', total_wealth: 2427041.20, cash: 1302311.05, crypto: 660740.62, stocks: 463989.52, liabilities: 0 },
  { date: '2026-01-10', total_wealth: 2428636.42, cash: 1302207.31, crypto: 663569.74, stocks: 462859.37, liabilities: 0 },
  { date: '2026-01-12', total_wealth: 2432680.08, cash: 1304084.09, crypto: 662460.78, stocks: 466135.21, liabilities: 0 },
  { date: '2026-01-14', total_wealth: 2447645.29, cash: 1304769.96, crypto: 675166.22, stocks: 467709.11, liabilities: 0 },
  { date: '2026-01-16', total_wealth: 2475124.66, cash: 1308404.65, crypto: 698174.02, stocks: 468545.99, liabilities: 0 },
  { date: '2026-01-18', total_wealth: 2455104.73, cash: 1308284.94, crypto: 678141.45, stocks: 468678.34, liabilities: 0 },
  { date: '2026-01-20', total_wealth: 2432743.92, cash: 1307687.12, crypto: 659395.46, stocks: 465661.34, liabilities: 0 },
  { date: '2026-01-22', total_wealth: 2425649.69, cash: 1309565.18, crypto: 647437.35, stocks: 468647.16, liabilities: 0 },
  { date: '2026-01-24', total_wealth: 2423104.20, cash: 1309289.26, crypto: 645120.72, stocks: 468694.22, liabilities: 0 },
  { date: '2026-01-26', total_wealth: 2423829.35, cash: 1312766.41, crypto: 641392.27, stocks: 469670.68, liabilities: 0 },
  { date: '2026-01-28', total_wealth: 2426188.89, cash: 1312627.07, crypto: 643605.75, stocks: 469956.06, liabilities: 0 },
];

async function importWealthHistory() {
  console.log('Starting wealth history import...');
  console.log(`Total records to import: ${wealthHistoryData.length}`);

  try {
    // Upsert the data (insert or update if date exists)
    const { data, error } = await supabase
      .from('wealth_history')
      .upsert(wealthHistoryData, { 
        onConflict: 'date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error importing wealth history:', error);
      throw error;
    }

    console.log(`✅ Successfully imported ${wealthHistoryData.length} records`);
    
    // Verify the import
    const { data: verifyData, error: verifyError } = await supabase
      .from('wealth_history')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('Error verifying import:', verifyError);
    } else {
      console.log('\n📊 Latest 5 records:');
      verifyData?.forEach(record => {
        console.log(`${record.date}: ฿${record.total_wealth.toLocaleString()}`);
      });
    }

    return data;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Run the import
importWealthHistory()
  .then(() => {
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
