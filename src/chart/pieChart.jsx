import { useEffect, useMemo, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import API from '../api/axios';

const CATEGORY_ORDER = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Entertainment',
  'Other',
];

function ExpensePieChart() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await API.get('/expense/all', {
          params: { page: 1, pageSize: 100 },
        });

        setExpenses(response?.data?.data || []);
      } catch (err) {
        setError('Failed to load expense chart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const chartData = useMemo(() => {
    const totals = expenses.reduce((acc, item) => {
      const category = item?.expenseType || 'Other';
      acc[category] = (acc[category] || 0) + Number(item?.amount || 0);
      return acc;
    }, {});

    return CATEGORY_ORDER.filter((category) => totals[category]).map(
      (category) => ({
        id: category,
        value: totals[category],
        label: category,
      })
    );
  }, [expenses]);

  if (loading) {
    return (
      <div className="chart-card">
        <h3 className="panel-title">Expenses by Category</h3>
        <p>Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-card">
        <h3 className="panel-title">Expenses by Category</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="chart-card">
        <h3 className="panel-title">Expenses by Category</h3>
        <p>No expense data available yet.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3 className="panel-title">Expenses by Category</h3>

      <div style={{ width: '100%', height: 320 }}>
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { faded: 'global', highlighted: 'item' },
              faded: { innerRadius: 30, additionalRadius: -20 },
            },
          ]}
          width={400}
          height={300}
          slotProps={{ legend: { hidden: true } }}
        />
      </div>

      <div className="chart-summary-list">
        {chartData.map((item) => (
          <div key={item.id} className="chart-summary-item">
            <span>{item.label}</span>
            <strong>Rs {Number(item.value).toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpensePieChart;
