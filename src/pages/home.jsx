import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import Pagination from '../components/Pagination';
import ExpensePieChart from '../chart/pieChart';
import './home.css';

const EXPENSE_TYPE_ICONS = {
  'Daily Expense': '📝',
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '💊',
  Education: '📚',
  Bills: '🧾',
  Other: '🔖',
};

const EXPENSE_TYPES = [
  'Daily Expense',
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Bills',
  'Other',
];

const initialForm = {
  expenseName: '',
  expenseType: 'Daily Expense',
  amount: '',
  expenseDate: '',
  image: null,
};

const initialColumnFilters = {
  name: '',
  type: '',
  amount: '',
  date: '',
};

const SEARCH_DEBOUNCE_MS = 600;

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [viewMode, setViewMode] = useState('expense');
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [draftColumnFilters, setDraftColumnFilters] =
    useState(initialColumnFilters);
  const [committedColumnFilters, setCommittedColumnFilters] =
    useState(initialColumnFilters);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const fileRef = useRef();
  const hasLoadedExpenses = useRef(false);
  const requestIdRef = useRef(0);
  const urlSyncRef = useRef(null);
  const columnFilterTimerRef = useRef(null);
  const initialPage = Math.max(
    1,
    Number.parseInt(searchParams.get('page'), 10) || 1
  );
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(initialPage);

  const fetchExpenses = async (
    filters = committedColumnFilters,
    nextPage = page
  ) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const showFullLoader = !hasLoadedExpenses.current;

    try {
      if (showFullLoader) setIsFetching(true);

      const res = await API.get('/expense/all', {
        params: { ...filters, page: nextPage, pageSize },
      });

      if (requestId !== requestIdRef.current) return;

      const responseExpenses = res.data.data ?? res.data.expenses ?? [];
      const expenseList = Array.isArray(responseExpenses)
        ? responseExpenses
        : [];
      setExpenses(expenseList);

      const serverTotal =
        typeof res.data.totalAmount === 'number' ? res.data.totalAmount : null;
      const fallbackTotal = expenseList.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      setTotalAmount(serverTotal !== null ? serverTotal : fallbackTotal);
      setTotalRecords(res.data.totalRecords || 0);
      setTotalPages(res.data.totalPages || 0);

      if (res.data.currentPage && res.data.currentPage !== nextPage) {
        setPage(res.data.currentPage);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        toast.error('Failed to load expenses');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        hasLoadedExpenses.current = true;
        setIsFetching(false);
      }
    }
  };

  useEffect(() => {
    fetchExpenses(committedColumnFilters, page);
  }, [committedColumnFilters, page, pageSize]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    next.set('pageSize', String(pageSize));

    const signature = `${page}:${pageSize}`;
    const currentSignature = `${searchParams.get('page')}:${searchParams.get(
      'pageSize'
    )}`;

    if (signature !== currentSignature) {
      urlSyncRef.current = signature;
      setSearchParams(next, { replace: true });
    } else {
      urlSyncRef.current = null;
    }

    localStorage.setItem('expensePageSize', String(pageSize));
  }, [page, pageSize]);

  useEffect(() => {
    const urlPage = Math.max(
      1,
      Number.parseInt(searchParams.get('page'), 10) || 1
    );
    const urlPageSize = Number.parseInt(searchParams.get('pageSize'), 10);
    const signature = `${urlPage}:${urlPageSize}`;

    if (urlSyncRef.current && urlSyncRef.current !== signature) return;

    urlSyncRef.current = null;
    if (urlPage !== page) setPage(urlPage);
    if (
      [5, 10, 25, 50, 100].includes(urlPageSize) &&
      urlPageSize !== pageSize
    ) {
      setPageSize(urlPageSize);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (columnFilterTimerRef.current !== null) {
        clearTimeout(columnFilterTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image') {
      const file = files[0];
      setFormData({ ...formData, image: file });
      if (file) setPreview(URL.createObjectURL(file));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleColumnFilterChange = (filterName, value) => {
    const nextFilters = {
      ...draftColumnFilters,
      [filterName]: value,
    };

    setDraftColumnFilters(nextFilters);

    if (columnFilterTimerRef.current !== null) {
      clearTimeout(columnFilterTimerRef.current);
    }

    columnFilterTimerRef.current = setTimeout(() => {
      columnFilterTimerRef.current = null;
      setPage(1);
      setCommittedColumnFilters(nextFilters);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.expenseName.trim() ||
      !formData.amount ||
      !formData.expenseDate
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    const data = new FormData();
    data.append('expenseName', formData.expenseName);
    data.append('expenseType', formData.expenseType);
    data.append('amount', formData.amount);
    data.append('expenseDate', formData.expenseDate);
    if (formData.image) data.append('image', formData.image);

    try {
      setIsLoading(true);

      if (isEditing) {
        await API.put(`/expense/${editId}`, data);
        toast.success('Expense updated successfully!');
      } else {
        await API.post('/expense/add', data);
        toast.success('Expense added successfully!');
      }

      handleCancel();
      fetchExpenses(committedColumnFilters, page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setIsEditing(true);
    setEditId(expense._id);
    setFormData({
      expenseName: expense.expenseName,
      expenseType: expense.expenseType,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      image: null,
    });
    setPreview(
      expense.image ? `http://localhost:2001/image/${expense.image}` : null
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?'))
      return;

    try {
      await API.delete(`/expense/${id}`);
      toast.success('Expense deleted!');
      fetchExpenses(committedColumnFilters, page);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    document
      .querySelector('.list-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePageSizeChange = (nextSize) => {
    setPage(1);
    setPageSize(Number(nextSize));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const clearFilters = () => {
    setDraftColumnFilters(initialColumnFilters);
    setCommittedColumnFilters(initialColumnFilters);
    setSearchTerm('');
    setFilterType('All');
    setPage(1);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchSearch = expense.expenseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchType =
      filterType === 'All' || expense.expenseType === filterType;
    return matchSearch && matchType;
  });

  const filteredTotal = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );
  const hasColumnFilters = Object.values(draftColumnFilters).some((value) =>
    value.toString().trim()
  );
  const hasActiveFilters =
    hasColumnFilters || searchTerm.trim() || filterType !== 'All';

  return (
    <div className="dashboard">
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`tab-button ${viewMode === 'chart' ? 'active' : ''}`}
          onClick={() => setViewMode('chart')}
        >
          Chart
        </button>
        <button
          type="button"
          className={`tab-button ${viewMode === 'expense' ? 'active' : ''}`}
          onClick={() => setViewMode('expense')}
        >
          Expenses
        </button>
      </div>

      {viewMode === 'chart' ? (
        <div className="chart-card-wrapper">
          <ExpensePieChart />
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card primary">
              <div className="stat-icon">💰</div>
              <div>
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value">
                  Rs {totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div>
                <div className="stat-label">Total Records</div>
                <div className="stat-value">
                  {totalRecords.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔎</div>
              <div>
                <div className="stat-label">Filtered Total</div>
                <div className="stat-value">
                  Rs {filteredTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="main-grid">
            <div className="form-panel">
              <h3 className="panel-title">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </h3>

              <form
                onSubmit={handleSubmit}
                className="expense-form"
                encType="multipart/form-data"
              >
                <div className="form-group">
                  <label>Expense Name *</label>
                  <input
                    type="text"
                    name="expenseName"
                    placeholder="e.g. Lunch, Petrol..."
                    value={formData.expenseName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Expense Type *</label>
                  <select
                    name="expenseType"
                    value={formData.expenseType}
                    onChange={handleChange}
                  >
                    {EXPENSE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {EXPENSE_TYPE_ICONS[type] || '🔖'} {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Billing Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    ref={fileRef}
                    className="file-input"
                  />
                  {preview && (
                    <div className="img-preview">
                      <img src={preview} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? 'Saving...'
                      : isEditing
                        ? 'Update Expense'
                        : 'Add Expense'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className="btn btn-cancel"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="list-panel">
              <div className="list-header">
                <h3 className="panel-title">Expense List</h3>

                <div className="list-controls">
                  <input
                    type="text"
                    placeholder="Global search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ marginRight: 8 }}
                  />
                  <button className="btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>

              {isFetching && !hasLoadedExpenses.current ? (
                <div
                  className="table-skeleton"
                  role="status"
                  aria-label="Loading expenses"
                >
                  {Array.from({ length: pageSize }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">No data</div>
                  <p>
                    {hasActiveFilters
                      ? 'No matching expenses found'
                      : 'No expenses found'}
                  </p>
                  <small>
                    {hasActiveFilters
                      ? 'Try changing or clearing the filters'
                      : 'Add your first expense using the form'}
                  </small>
                </div>
              ) : (
                <div className="expense-table-wrapper">
                  <table className="expense-table">
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Bill</th>
                        <th>Actions</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th>
                          <input
                            type="text"
                            placeholder="Search..."
                            value={draftColumnFilters.name}
                            onChange={(e) =>
                              handleColumnFilterChange('name', e.target.value)
                            }
                            className="search-input"
                          />
                        </th>
                        <th>
                          <select
                            value={draftColumnFilters.type || 'All'}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilterType(value === 'All' ? 'All' : value);
                              handleColumnFilterChange(
                                'type',
                                value === 'All' ? '' : value
                              );
                            }}
                            className="filter-select"
                          >
                            <option value="All">All Types</option>
                            {EXPENSE_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th>
                          <input
                            type="number"
                            placeholder="Search..."
                            value={draftColumnFilters.amount}
                            onChange={(e) =>
                              handleColumnFilterChange('amount', e.target.value)
                            }
                            className="search-input"
                          />
                        </th>
                        <th>
                          <input
                            type="date"
                            value={draftColumnFilters.date}
                            onChange={(e) =>
                              handleColumnFilterChange('date', e.target.value)
                            }
                            className="search-input"
                          />
                        </th>
                        <th>Bill</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((item, index) => (
                        <tr key={item._id}>
                          <td>{(page - 1) * pageSize + index + 1}</td>
                          <td className="expense-name">{item.expenseName}</td>
                          <td>
                            <span className="type-badge">
                              {EXPENSE_TYPE_ICONS[item.expenseType] || '🔖'}{' '}
                              {item.expenseType}
                            </span>
                          </td>
                          <td className="amount-cell">
                            Rs {Number(item.amount || 0).toLocaleString()}
                          </td>
                          <td>{item.expenseDate}</td>
                          <td>
                            {item.image ? (
                              <a
                                href={`http://localhost:2001/image/${item.image}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={`http://localhost:2001/image/${item.image}`}
                                  alt="bill"
                                  className="bill-thumb"
                                />
                              </a>
                            ) : (
                              <span className="no-bill">-</span>
                            )}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="btn-edit"
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(item._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={totalRecords}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                siblingCount={2}
                boundaryCount={1}
                loading={isFetching}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
