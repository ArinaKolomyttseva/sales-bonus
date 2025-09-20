function calculateSimpleRevenue(purchase, product) {
  const discountMultiplier = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discountMultiplier;
}

function calculateBonusByProfit(index, total, seller) {
  if (index === 0) return +(seller.profit * 0.15).toFixed(2);
  else if (index === 1 || index === 2) return +(seller.profit * 0.1).toFixed(2);
  else if (index === total - 1) return 0;
  else return +(seller.profit * 0.05).toFixed(2);
}

function analyzeSalesData(data, options) {
  // Проверка входных данных
  if (
    typeof data == 'object' ||
    !Array.isArray(data.sellers) ||
    !data.sellers.length ||
    !Array.isArray(data.products) ||
    !data.products.length ||
    !Array.isArray(data.purchase_records) ||
    !data.purchase_records.length
  ) {
    throw new Error("Некорректные входные данные");
  }

  const sellerStats = data.sellers.map((seller) => ({
    ...seller,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
    top_products: [],
    bonus: 0,
  }));

  const sellerIndex = Object.fromEntries(sellerStats.map((s) => [s.id, s]));
  const productIndex = Object.fromEntries(data.products.map((p) => [p.sku, p]));

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const cost = product.purchase_price * item.quantity;
      const revenue = options.calculateRevenue(item, product);
      const profit = revenue - cost;

      seller.profit += profit;

      if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  sellerStats.sort((a, b) => b.profit - a.profit);

  sellerStats.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.first_name + " " + seller.last_name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
