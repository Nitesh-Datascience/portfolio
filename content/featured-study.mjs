// Original figures copied without alteration from the user's FORESIGHT repository.
export const featuredStudy = {
  source: 'https://github.com/Nitesh-Datascience/foresight_northbay',
  demo: 'https://foresightnorthbay-ufqepslzgzysttnkue79rx.streamlit.app/',
  charts: [
    {
      id: 'demand', label: 'Weekly demand', src: 'assets/foresight-demand.png', width: 1280, height: 640,
      alt: 'NorthBay weekly units sold from 2022 through the start of 2024, with fluctuations roughly between 89,000 and 102,000 units.',
      caption: 'Start with the demand pattern. Weekly sales vary across the observed period; this is historical demand, not the future forecast.',
      sourcePath: 'reports/charts/weekly_demand.png', sourceSha: 'f70a5e754cea6769d4024a36a2684d9a22431480',
    },
    {
      id: 'products', label: 'Product mix', src: 'assets/foresight-products.png', width: 1280, height: 640,
      alt: 'Horizontal bar chart of the ten products with the most historical units sold, led by P0016, P0020, and P0014.',
      caption: 'Compare the product mix. These ten products have similar historical volumes, so inventory decisions also need series-level demand and stock context.',
      sourcePath: 'reports/charts/top_products.png', sourceSha: '4448aa629dc4c251504d26ca1a7ebe4fcc9e49cb',
    },
    {
      id: 'risk', label: 'Inventory risk', src: 'assets/foresight-risk.png', width: 1280, height: 640,
      alt: 'Inventory decision grid with estimated stockout gaps around 1,500 to 2,100 units and zero overstock excess for the plotted snapshot.',
      caption: 'Inspect the planning scenario. This snapshot shows stockout gaps and no overstock excess under the configured assumptions; the scores are planning proxies.',
      sourcePath: 'reports/charts/risk_grid.png', sourceSha: '753ed47b5d5b8c1ca58f29c62d99ee9917664b7e',
    },
  ],
};
