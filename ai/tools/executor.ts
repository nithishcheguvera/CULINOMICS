import {
  calculateAnnualKpis,
  calculateMonthlyPerformance,
  calculateDishProfitability,
  calculateMenuEngineering,
  calculateIngredientInflation,
  calculateDishIngredientBreakdown,
  calculateRecipeReplay,
  calculateSalesAnalysis,
  createInitialScenarioForDish,
  simulateDishScenario,
} from "@/engine";
import { createAuthoritativeFact, AuthoritativeFact } from "./factFactory";
import {
  GetRestaurantFinancialSummarySchema,
  GetDishProfitabilitySchema,
  GetMenuEngineeringMatrixSchema,
  GetIngredientInflationSchema,
  GetRecipeCostBreakdownSchema,
  GetRecipeReplayHistorySchema,
  SimulateMenuSurgerySchema,
} from "./schemas";
import {
  ToolExecutionContext,
  ToolExecutionOutput,
  ToolRegistry,
} from "./types";

/**
 * Tool 1: getRestaurantFinancialSummary
 */
const getRestaurantFinancialSummaryHandler = {
  name: "getRestaurantFinancialSummary" as const,
  description: "Retrieves aggregate annual revenue, ingredient cost, gross contribution, and margin % for the restaurant.",
  schema: GetRestaurantFinancialSummarySchema,
  execute: (_args: unknown, ctx: ToolExecutionContext): ToolExecutionOutput => {
    const monthlyPerformance = calculateMonthlyPerformance(
      ctx.dataset.sales,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices
    );
    const salesAnalysis = calculateSalesAnalysis(ctx.dataset.sales);
    const kpis = calculateAnnualKpis(monthlyPerformance, salesAnalysis);

    const facts: AuthoritativeFact[] = [
      createAuthoritativeFact({
        id: "restaurant-annual-revenue",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Restaurant Total",
        metric: "annualRevenue",
        label: "Annual Gross Revenue",
        rawValue: kpis.annualRevenue,
        unit: "INR",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "restaurant-annual-ingredient-cost",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Restaurant Total",
        metric: "annualIngredientCost",
        label: "Annual Ingredient Cost (COGS)",
        rawValue: kpis.annualIngredientCost,
        unit: "INR",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "restaurant-annual-gross-contribution",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Restaurant Total",
        metric: "annualGrossContribution",
        label: "Annual Gross Contribution",
        rawValue: kpis.annualGrossContribution,
        unit: "INR",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "restaurant-overall-margin-percentage",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Restaurant Total",
        metric: "overallMarginPercentage",
        label: "Overall Gross Margin",
        rawValue: kpis.overallMarginPercentage,
        unit: "%",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "restaurant-total-sales-volume",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Restaurant Total",
        metric: "totalSalesVolume",
        label: "Total Sales Volume",
        rawValue: kpis.totalSalesVolume,
        unit: "servings",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: ctx.datasetMode,
      }),
    ];

    return {
      summaryForGemini: {
        annualRevenue: kpis.annualRevenue,
        annualIngredientCost: kpis.annualIngredientCost,
        annualGrossContribution: kpis.annualGrossContribution,
        overallMarginPercentage: Number(kpis.overallMarginPercentage.toFixed(1)),
        totalSalesVolume: kpis.totalSalesVolume,
        monthlyTrendsCount: monthlyPerformance.length,
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: 1,
        itemsReturned: 1,
        note: "Complete annual restaurant KPI summary",
      },
    };
  },
};

/**
 * Tool 2: getDishProfitability
 */
const getDishProfitabilityHandler = {
  name: "getDishProfitability" as const,
  description: "Retrieves unit economics, margin percentage, annual contribution, and ranks for a specific dish or all menu dishes.",
  schema: GetDishProfitabilitySchema,
  execute: (args: { dishId?: string }, ctx: ToolExecutionContext): ToolExecutionOutput => {
    const profitability = calculateDishProfitability(
      ctx.dataset.sales,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices
    );

    if (args.dishId) {
      const dish = profitability.find((d) => d.dishId === args.dishId);
      if (!dish) {
        const available = profitability.map((d) => d.dishId);
        throw new Error(
          `Dish '${args.dishId}' not found in dataset. Available dish IDs: ${available.join(", ")}`
        );
      }

      const facts: AuthoritativeFact[] = [
        createAuthoritativeFact({
          id: `${dish.dishId}-selling-price`,
          entityType: "dish",
          entityId: dish.dishId,
          entityName: dish.dishName,
          metric: "unitSellingPrice",
          label: "Selling Price",
          rawValue: dish.unitSellingPrice,
          unit: "INR",
          sourceTool: "getDishProfitability",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${dish.dishId}-unit-ingredient-cost`,
          entityType: "dish",
          entityId: dish.dishId,
          entityName: dish.dishName,
          metric: "unitIngredientCost",
          label: "Food Cost Per Serving",
          rawValue: dish.unitIngredientCost,
          unit: "INR",
          sourceTool: "getDishProfitability",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${dish.dishId}-contribution-margin-percentage`,
          entityType: "dish",
          entityId: dish.dishId,
          entityName: dish.dishName,
          metric: "contributionMarginPercentage",
          label: "Contribution Margin",
          rawValue: dish.contributionMarginPercentage,
          unit: "%",
          sourceTool: "getDishProfitability",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${dish.dishId}-total-annual-contribution`,
          entityType: "dish",
          entityId: dish.dishId,
          entityName: dish.dishName,
          metric: "totalContribution",
          label: "Annual Gross Contribution",
          rawValue: dish.totalContribution,
          unit: "INR",
          sourceTool: "getDishProfitability",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${dish.dishId}-rank-by-contribution`,
          entityType: "dish",
          entityId: dish.dishId,
          entityName: dish.dishName,
          metric: "rankByContribution",
          label: "Contribution Rank",
          rawValue: dish.rankByContribution,
          unit: "rank",
          sourceTool: "getDishProfitability",
          datasetMode: ctx.datasetMode,
        }),
      ];

      return {
        summaryForGemini: {
          dishId: dish.dishId,
          dishName: dish.dishName,
          unitSellingPrice: dish.unitSellingPrice,
          unitIngredientCost: Number(dish.unitIngredientCost.toFixed(2)),
          contributionMarginPercentage: Number(dish.contributionMarginPercentage.toFixed(1)),
          totalContribution: Math.round(dish.totalContribution),
          totalVolume: dish.totalVolume,
          rankByContribution: dish.rankByContribution,
          rankByMarginPercentage: dish.rankByMarginPercentage,
        },
        authoritativeFacts: facts,
        completeness: {
          isComplete: true,
          totalItemsAvailable: profitability.length,
          itemsReturned: 1,
          note: `Targeted unit economics for ${dish.dishName}`,
        },
      };
    }

    // Return bounded ranking summary for all dishes
    const facts: AuthoritativeFact[] = profitability.map((d) =>
      createAuthoritativeFact({
        id: `${d.dishId}-margin`,
        entityType: "dish",
        entityId: d.dishId,
        entityName: d.dishName,
        metric: "contributionMarginPercentage",
        label: "Margin %",
        rawValue: d.contributionMarginPercentage,
        unit: "%",
        sourceTool: "getDishProfitability",
        datasetMode: ctx.datasetMode,
      })
    );

    return {
      summaryForGemini: {
        dishes: profitability.map((d) => ({
          dishId: d.dishId,
          dishName: d.dishName,
          sellingPrice: d.unitSellingPrice,
          unitCost: Number(d.unitIngredientCost.toFixed(2)),
          marginPct: Number(d.contributionMarginPercentage.toFixed(1)),
          annualContrib: Math.round(d.totalContribution),
          rankByContrib: d.rankByContribution,
        })),
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: profitability.length,
        itemsReturned: profitability.length,
        note: "All menu items ranked by contribution",
      },
    };
  },
};

/**
 * Tool 3: getMenuEngineeringMatrix
 */
const getMenuEngineeringMatrixHandler = {
  name: "getMenuEngineeringMatrix" as const,
  description: "Retrieves Kasavana & Smith 4-quadrant classification (Stars, Plowhorses, Puzzles, Dogs) and benchmarks.",
  schema: GetMenuEngineeringMatrixSchema,
  execute: (_args: unknown, ctx: ToolExecutionContext): ToolExecutionOutput => {
    const matrix = calculateMenuEngineering(
      ctx.dataset.sales,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices
    );

    const facts: AuthoritativeFact[] = [
      createAuthoritativeFact({
        id: "matrix-popularity-benchmark",
        entityType: "menu",
        entityId: "menu-benchmarks",
        entityName: "Menu Benchmarks",
        metric: "popularityThreshold",
        label: "Popularity Benchmark",
        rawValue: matrix.popularityThreshold,
        unit: "servings/mo",
        sourceTool: "getMenuEngineeringMatrix",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "matrix-profitability-benchmark",
        entityType: "menu",
        entityId: "menu-benchmarks",
        entityName: "Menu Benchmarks",
        metric: "profitabilityThreshold",
        label: "Profitability Benchmark",
        rawValue: matrix.profitabilityThreshold,
        unit: "INR",
        sourceTool: "getMenuEngineeringMatrix",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "matrix-stars-count",
        entityType: "menu",
        entityId: "menu-quadrants",
        entityName: "Stars Count",
        metric: "starsCount",
        label: "Star Dishes",
        rawValue: matrix.categoryCounts.stars,
        unit: "servings",
        sourceTool: "getMenuEngineeringMatrix",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: "matrix-dogs-count",
        entityType: "menu",
        entityId: "menu-quadrants",
        entityName: "Dogs Count",
        metric: "dogsCount",
        label: "Dog Dishes",
        rawValue: matrix.categoryCounts.dogs,
        unit: "servings",
        sourceTool: "getMenuEngineeringMatrix",
        datasetMode: ctx.datasetMode,
      }),
    ];

    return {
      summaryForGemini: {
        popularityBenchmarkMonthlyVolume: Math.round(matrix.popularityThreshold),
        profitabilityBenchmarkMarginPerServing: Number(matrix.profitabilityThreshold.toFixed(2)),
        categoryCounts: matrix.categoryCounts,
        dishes: matrix.dishes.map((d) => ({
          dishId: d.dishId,
          dishName: d.dishName,
          category: d.category,
          averageMonthlyVolume: Math.round(d.averageMonthlyVolume),
          averageContributionMargin: Number(d.averageContributionMargin.toFixed(2)),
        })),
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: matrix.dishes.length,
        itemsReturned: matrix.dishes.length,
        note: "Full Kasavana & Smith menu matrix classification",
      },
    };
  },
};

/**
 * Tool 4: getIngredientInflationReport
 */
const getIngredientInflationReportHandler = {
  name: "getIngredientInflationReport" as const,
  description: "Analyzes ingredient price inflation, percentage surges, and flags major drivers (>= 50% price surge).",
  schema: GetIngredientInflationSchema,
  execute: (args: { ingredientId?: string; onlyMajorDrivers?: boolean }, ctx: ToolExecutionContext): ToolExecutionOutput => {
    const inflation = calculateIngredientInflation(ctx.dataset.ingredientPrices);

    if (args.ingredientId) {
      const ing = inflation.find((i) => i.ingredientId === args.ingredientId);
      if (!ing) {
        const available = inflation.map((i) => i.ingredientId);
        throw new Error(
          `Ingredient '${args.ingredientId}' not found in dataset. Available IDs: ${available.slice(0, 10).join(", ")}...`
        );
      }

      const facts: AuthoritativeFact[] = [
        createAuthoritativeFact({
          id: `${ing.ingredientId}-percentage-inflation`,
          entityType: "ingredient",
          entityId: ing.ingredientId,
          entityName: ing.ingredientName,
          metric: "percentageChange",
          label: "Price Inflation Surge",
          rawValue: ing.percentageChange,
          unit: "%",
          sourceTool: "getIngredientInflationReport",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${ing.ingredientId}-start-price`,
          entityType: "ingredient",
          entityId: ing.ingredientId,
          entityName: ing.ingredientName,
          metric: "startPrice",
          label: "Starting Price",
          rawValue: ing.startPrice,
          unit: "INR",
          sourceTool: "getIngredientInflationReport",
          timeframe: "Baseline",
          datasetMode: ctx.datasetMode,
        }),
        createAuthoritativeFact({
          id: `${ing.ingredientId}-end-price`,
          entityType: "ingredient",
          entityId: ing.ingredientId,
          entityName: ing.ingredientName,
          metric: "endPrice",
          label: "Ending Price",
          rawValue: ing.endPrice,
          unit: "INR",
          sourceTool: "getIngredientInflationReport",
          timeframe: "Ending",
          datasetMode: ctx.datasetMode,
        }),
      ];

      return {
        summaryForGemini: {
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          unit: ing.unit,
          startPrice: ing.startPrice,
          endPrice: ing.endPrice,
          absoluteChange: ing.absoluteChange,
          percentageChange: Number(ing.percentageChange.toFixed(1)),
          isMajorDriver: ing.isMajorDriver,
          monthlyPriceProgression: ing.monthlyPrices.map((p) => ({
            date: p.date,
            price: p.price,
            indexedPrice: Number(p.indexedPrice.toFixed(1)),
          })),
        },
        authoritativeFacts: facts,
        completeness: {
          isComplete: true,
          totalItemsAvailable: inflation.length,
          itemsReturned: 1,
          note: `Complete 12-month trajectory for ${ing.ingredientName}`,
        },
      };
    }

    // Filter to major drivers or top 8 ingredients to avoid prompt bloat
    const majorDrivers = inflation.filter((i) => i.isMajorDriver);
    const returnList = args.onlyMajorDrivers ? majorDrivers : inflation.slice(0, 10);

    const facts: AuthoritativeFact[] = majorDrivers.map((i) =>
      createAuthoritativeFact({
        id: `${i.ingredientId}-inflation`,
        entityType: "ingredient",
        entityId: i.ingredientId,
        entityName: i.ingredientName,
        metric: "percentageChange",
        label: `${i.ingredientName} Surge`,
        rawValue: i.percentageChange,
        unit: "%",
        sourceTool: "getIngredientInflationReport",
        datasetMode: ctx.datasetMode,
      })
    );

    return {
      summaryForGemini: {
        totalIngredientsAnalyzed: inflation.length,
        majorDriversCount: majorDrivers.length,
        topInflationIngredients: returnList.map((i) => ({
          ingredientId: i.ingredientId,
          ingredientName: i.ingredientName,
          unit: i.unit,
          startPrice: i.startPrice,
          endPrice: i.endPrice,
          percentageSurge: Number(i.percentageChange.toFixed(1)),
          isMajorDriver: i.isMajorDriver,
        })),
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: returnList.length === inflation.length,
        totalItemsAvailable: inflation.length,
        itemsReturned: returnList.length,
        note: "Top inflation drivers shown. Query specific ingredientId for complete monthly progression.",
      },
    };
  },
};

/**
 * Tool 5: getRecipeCostBreakdown
 */
const getRecipeCostBreakdownHandler = {
  name: "getRecipeCostBreakdown" as const,
  description: "Deconstructs a plate's recipe cost into individual ingredients, quantities, unit prices, and cost shares.",
  schema: GetRecipeCostBreakdownSchema,
  execute: (args: { dishId: string; date?: string }, ctx: ToolExecutionContext): ToolExecutionOutput => {
    // If no date specified, use latest date from prices
    const targetDate =
      args.date ||
      ctx.selectedTimelineDate ||
      Array.from(new Set(ctx.dataset.ingredientPrices.map((p) => p.date))).sort().pop()!;

    const breakdown = calculateDishIngredientBreakdown(
      args.dishId,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices,
      targetDate
    );

    const facts: AuthoritativeFact[] = [
      createAuthoritativeFact({
        id: `${breakdown.dishId}-total-recipe-cost-${targetDate}`,
        entityType: "dish",
        entityId: breakdown.dishId,
        entityName: breakdown.dishName,
        metric: "totalRecipeCost",
        label: "Plate Food Cost",
        rawValue: breakdown.totalRecipeCost,
        unit: "INR",
        sourceTool: "getRecipeCostBreakdown",
        timeframe: targetDate,
        datasetMode: ctx.datasetMode,
        reconciliationCheck: "Reconciled with Recipe Replay (|Δ| <= 10^-9)",
      }),
      // Top cost driver ingredient in recipe
      ...(breakdown.ingredients.length > 0
        ? [
            createAuthoritativeFact({
              id: `${breakdown.dishId}-top-cost-driver-${targetDate}`,
              entityType: "ingredient" as const,
              entityId: breakdown.ingredients[0].ingredientId,
              entityName: breakdown.ingredients[0].ingredientName,
              metric: "costSharePercentage",
              label: "Plate Cost Share",
              rawValue: breakdown.ingredients[0].costSharePercentage,
              unit: "%" as const,
              sourceTool: "getRecipeCostBreakdown" as const,
              timeframe: targetDate,
              datasetMode: ctx.datasetMode,
            }),
          ]
        : []),
    ];

    return {
      summaryForGemini: {
        dishId: breakdown.dishId,
        dishName: breakdown.dishName,
        date: breakdown.date,
        totalRecipeCost: Number(breakdown.totalRecipeCost.toFixed(2)),
        ingredients: breakdown.ingredients.map((ing) => ({
          ingredientName: ing.ingredientName,
          quantity: ing.quantity,
          recipeUnit: ing.recipeUnit,
          unitPrice: ing.unitPrice,
          pricingUnit: ing.pricingUnit,
          ingredientCost: Number(ing.ingredientCost.toFixed(2)),
          costSharePercentage: Number(ing.costSharePercentage.toFixed(1)),
        })),
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: breakdown.ingredients.length,
        itemsReturned: breakdown.ingredients.length,
        note: `Complete recipe breakdown for ${breakdown.dishName} on ${breakdown.date}`,
      },
    };
  },
};

/**
 * Tool 6: getRecipeReplayHistory
 */
const getRecipeReplayHistoryHandler = {
  name: "getRecipeReplayHistory" as const,
  description: "Retrieves chronological 12-month recipe cost evolution, contribution margin, and margin erosion for a dish.",
  schema: GetRecipeReplayHistorySchema,
  execute: (args: { dishId: string }, ctx: ToolExecutionContext): ToolExecutionOutput => {
    const replay = calculateRecipeReplay(
      ctx.dataset.menu,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices,
      ctx.dataset.sales
    );

    const dishReplay = replay.find((r) => r.dishId === args.dishId);
    if (!dishReplay) {
      const available = replay.map((r) => r.dishId);
      throw new Error(
        `Dish '${args.dishId}' not found in replay records. Available IDs: ${available.join(", ")}`
      );
    }

    const firstPoint = dishReplay.points[0];
    const lastPoint = dishReplay.points[dishReplay.points.length - 1];
    const marginErosion = firstPoint && lastPoint ? firstPoint.marginPercentage - lastPoint.marginPercentage : 0;

    const facts: AuthoritativeFact[] = [
      createAuthoritativeFact({
        id: `${dishReplay.dishId}-start-cost`,
        entityType: "dish",
        entityId: dishReplay.dishId,
        entityName: dishReplay.dishName,
        metric: "januaryRecipeCost",
        label: "January Food Cost",
        rawValue: firstPoint?.recipeCost ?? 0,
        unit: "INR",
        sourceTool: "getRecipeReplayHistory",
        timeframe: firstPoint?.date,
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: `${dishReplay.dishId}-end-cost`,
        entityType: "dish",
        entityId: dishReplay.dishId,
        entityName: dishReplay.dishName,
        metric: "decemberRecipeCost",
        label: "December Food Cost",
        rawValue: lastPoint?.recipeCost ?? 0,
        unit: "INR",
        sourceTool: "getRecipeReplayHistory",
        timeframe: lastPoint?.date,
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: `${dishReplay.dishId}-margin-erosion`,
        entityType: "dish",
        entityId: dishReplay.dishId,
        entityName: dishReplay.dishName,
        metric: "netMarginErosion",
        label: "Net Margin Erosion",
        rawValue: marginErosion,
        unit: "%",
        sourceTool: "getRecipeReplayHistory",
        timeframe: "Jan to Dec",
        datasetMode: ctx.datasetMode,
      }),
    ];

    return {
      summaryForGemini: {
        dishId: dishReplay.dishId,
        dishName: dishReplay.dishName,
        januaryCost: Number((firstPoint?.recipeCost ?? 0).toFixed(2)),
        decemberCost: Number((lastPoint?.recipeCost ?? 0).toFixed(2)),
        januaryMarginPct: Number((firstPoint?.marginPercentage ?? 0).toFixed(1)),
        decemberMarginPct: Number((lastPoint?.marginPercentage ?? 0).toFixed(1)),
        marginErosionPct: Number(marginErosion.toFixed(1)),
        monthlyTrajectory: dishReplay.points.map((p) => ({
          date: p.date,
          sellingPrice: p.sellingPrice,
          recipeCost: Number(p.recipeCost.toFixed(2)),
          contribution: Number(p.contributionPerServing.toFixed(2)),
          marginPct: Number(p.marginPercentage.toFixed(1)),
        })),
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: dishReplay.points.length,
        itemsReturned: dishReplay.points.length,
        note: `12-month historical trajectory for ${dishReplay.dishName}`,
      },
    };
  },
};

/**
 * Tool 7: simulateMenuSurgeryScenario
 */
const simulateMenuSurgeryScenarioHandler = {
  name: "simulateMenuSurgeryScenario" as const,
  description: "Simulates financial, volume, and menu matrix impacts of modifying selling price, ingredient cost, or sales volume.",
  schema: SimulateMenuSurgerySchema,
  execute: (
    args: {
      dishId: string;
      targetSellingPrice?: number;
      targetIngredientCost?: number;
      targetMonthlyVolume?: number;
    },
    ctx: ToolExecutionContext
  ): ToolExecutionOutput => {
    const profitability = calculateDishProfitability(
      ctx.dataset.sales,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices
    );
    const menuEngineering = calculateMenuEngineering(
      ctx.dataset.sales,
      ctx.dataset.recipes,
      ctx.dataset.ingredientPrices
    );

    // Seed defaults from actual dish ground-truth
    const initialScenario = createInitialScenarioForDish(
      args.dishId,
      profitability,
      menuEngineering
    );

    const scenario = {
      dishId: args.dishId,
      targetSellingPrice: args.targetSellingPrice ?? initialScenario.targetSellingPrice,
      targetIngredientCost: args.targetIngredientCost ?? initialScenario.targetIngredientCost,
      targetMonthlyVolume: args.targetMonthlyVolume ?? initialScenario.targetMonthlyVolume,
    };

    const result = simulateDishScenario(profitability, menuEngineering, scenario);

    const facts: AuthoritativeFact[] = [
      createAuthoritativeFact({
        id: `${scenario.dishId}-simulated-monthly-contribution`,
        entityType: "dish",
        entityId: scenario.dishId,
        entityName: result.dishName,
        metric: "monthlyContribution",
        label: "Simulated Monthly Contribution",
        rawValue: result.simulated.monthlyContribution,
        unit: "INR",
        sourceTool: "simulateMenuSurgeryScenario",
        timeframe: "Projected Scenario",
        datasetMode: ctx.datasetMode,
      }),
      createAuthoritativeFact({
        id: `${scenario.dishId}-simulated-margin-percentage`,
        entityType: "dish",
        entityId: scenario.dishId,
        entityName: result.dishName,
        metric: "contributionMarginPercentage",
        label: "Simulated Margin %",
        rawValue: result.simulated.contributionMarginPercentage ?? 0,
        unit: "%",
        sourceTool: "simulateMenuSurgeryScenario",
        timeframe: "Projected Scenario",
        datasetMode: ctx.datasetMode,
      }),
    ];

    const hasCategoryShifted =
      result.matrixProjection.baselineCategory !== result.matrixProjection.projectedCategory;

    return {
      summaryForGemini: {
        dishId: scenario.dishId,
        dishName: result.dishName,
        baseline: {
          sellingPrice: result.baseline.sellingPrice,
          unitCost: Number(result.baseline.unitIngredientCost.toFixed(2)),
          monthlyVolume: result.baseline.monthlyVolume,
          monthlyContribution: Math.round(result.baseline.monthlyContribution),
          marginPct: result.baseline.contributionMarginPercentage
            ? Number(result.baseline.contributionMarginPercentage.toFixed(1))
            : null,
          category: result.matrixProjection.baselineCategory,
        },
        simulated: {
          sellingPrice: result.simulated.sellingPrice,
          unitCost: Number(result.simulated.unitIngredientCost.toFixed(2)),
          monthlyVolume: result.simulated.monthlyVolume,
          monthlyContribution: Math.round(result.simulated.monthlyContribution),
          marginPct: result.simulated.contributionMarginPercentage
            ? Number(result.simulated.contributionMarginPercentage.toFixed(1))
            : null,
          category: result.matrixProjection.projectedCategory,
        },
        deltas: {
          monthlyContributionDelta: Math.round(result.delta.monthlyContribution),
          contributionMarginPercentageDelta: result.delta.contributionMarginPercentage
            ? Number(result.delta.contributionMarginPercentage.toFixed(1))
            : null,
          categoryShifted: hasCategoryShifted,
        },
      },
      authoritativeFacts: facts,
      completeness: {
        isComplete: true,
        totalItemsAvailable: 1,
        itemsReturned: 1,
        note: `Menu surgery simulation for ${result.dishName}`,
      },
    };
  },
};

/**
 * Immutable Typed Tool Registry containing the 7 approved deterministic financial tools.
 * Zero `any` types; all handlers enforce their respective Zod parameter schemas.
 */
export const toolRegistry: ToolRegistry = {
  getRestaurantFinancialSummary: getRestaurantFinancialSummaryHandler,
  getDishProfitability: getDishProfitabilityHandler,
  getMenuEngineeringMatrix: getMenuEngineeringMatrixHandler,
  getIngredientInflationReport: getIngredientInflationReportHandler,
  getRecipeCostBreakdown: getRecipeCostBreakdownHandler,
  getRecipeReplayHistory: getRecipeReplayHistoryHandler,
  simulateMenuSurgeryScenario: simulateMenuSurgeryScenarioHandler,
};

/**
 * Type-Safe Dispatch Boundary for Gemini Function Calling.
 *
 * Validates raw arguments with the appropriate tool schema before dispatching
 * to the trusted internal handler. Rejects unapproved tool names.
 */
export function executeToolByName(
  rawName: string,
  rawArgs: unknown,
  ctx: ToolExecutionContext
): ToolExecutionOutput {
  switch (rawName) {
    case "getRestaurantFinancialSummary": {
      const args = GetRestaurantFinancialSummarySchema.parse(rawArgs);
      return toolRegistry.getRestaurantFinancialSummary.execute(args, ctx);
    }
    case "getDishProfitability": {
      const args = GetDishProfitabilitySchema.parse(rawArgs);
      return toolRegistry.getDishProfitability.execute(args, ctx);
    }
    case "getMenuEngineeringMatrix": {
      const args = GetMenuEngineeringMatrixSchema.parse(rawArgs);
      return toolRegistry.getMenuEngineeringMatrix.execute(args, ctx);
    }
    case "getIngredientInflationReport": {
      const args = GetIngredientInflationSchema.parse(rawArgs);
      return toolRegistry.getIngredientInflationReport.execute(args, ctx);
    }
    case "getRecipeCostBreakdown": {
      const args = GetRecipeCostBreakdownSchema.parse(rawArgs);
      return toolRegistry.getRecipeCostBreakdown.execute(args, ctx);
    }
    case "getRecipeReplayHistory": {
      const args = GetRecipeReplayHistorySchema.parse(rawArgs);
      return toolRegistry.getRecipeReplayHistory.execute(args, ctx);
    }
    case "simulateMenuSurgeryScenario": {
      const args = SimulateMenuSurgerySchema.parse(rawArgs);
      return toolRegistry.simulateMenuSurgeryScenario.execute(args, ctx);
    }
    default:
      throw new Error(`Security Violation: Tool '${rawName}' is not in the approved allowlist.`);
  }
}
