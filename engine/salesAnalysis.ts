import { SaleRecord } from "@/schemas";
import { SalesAnalysis, MonthlySalesVolumePoint, DishPopularityMetric } from "./types";

/**
 * Computes sales volume metrics and dish popularity distributions:
 * - Monthly volume breakdowns (overall and dish-by-dish)
 * - Dish popularity ranking, monthly averages, and market volume share
 */
export function calculateSalesAnalysis(sales: SaleRecord[]): SalesAnalysis {
  if (sales.length === 0) {
    return {
      monthlyVolumes: [],
      dishPopularity: [],
      totalVolumeAllTime: 0,
    };
  }

  const monthlyMap = new Map<
    string,
    { totalVolume: number; volumeByDish: Record<string, number> }
  >();

  const dishMap = new Map<
    string,
    { dishName: string; totalVolume: number }
  >();

  let totalVolumeAllTime = 0;

  for (const sale of sales) {
    totalVolumeAllTime += sale.quantity;

    // Monthly volume breakdown
    const monthEntry = monthlyMap.get(sale.date) || {
      totalVolume: 0,
      volumeByDish: {},
    };
    monthEntry.totalVolume += sale.quantity;
    monthEntry.volumeByDish[sale.dishId] =
      (monthEntry.volumeByDish[sale.dishId] || 0) + sale.quantity;
    monthlyMap.set(sale.date, monthEntry);

    // Cumulative dish popularity
    const dishEntry = dishMap.get(sale.dishId) || {
      dishName: sale.dishName,
      totalVolume: 0,
    };
    dishEntry.totalVolume += sale.quantity;
    dishMap.set(sale.dishId, dishEntry);
  }

  const sortedDates = Array.from(monthlyMap.keys()).sort();
  const monthlyVolumes: MonthlySalesVolumePoint[] = sortedDates.map((date) => ({
    date,
    totalVolume: monthlyMap.get(date)!.totalVolume,
    volumeByDish: monthlyMap.get(date)!.volumeByDish,
  }));

  const monthCount = sortedDates.length || 1;

  const dishPopularity: DishPopularityMetric[] = Array.from(dishMap.entries())
    .map(([dishId, data]) => ({
      dishId,
      dishName: data.dishName,
      totalVolume: data.totalVolume,
      monthlyAverageVolume: data.totalVolume / monthCount,
      volumeSharePercentage:
        totalVolumeAllTime > 0 ? (data.totalVolume / totalVolumeAllTime) * 100 : 0,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return {
    monthlyVolumes,
    dishPopularity,
    totalVolumeAllTime,
  };
}
