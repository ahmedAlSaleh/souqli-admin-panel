import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import SubcategoriesPage from './pages/SubcategoriesPage.jsx';
import AttributesPage from './pages/AttributesPage.jsx';
import SizeChartsPage from './pages/SizeChartsPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import CartsPage from './pages/CartsPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import PagesPage from './pages/PagesPage.jsx';
import HomeBannersPage from './pages/HomeBannersPage.jsx';
import RecordsPage from './pages/RecordsPage.jsx';
import { authApi, categoryApi } from './api/index.js';
import { useI18n } from './i18n/I18nProvider.jsx';
import { Icon } from './components/Icons.jsx';

const App = () => {
  const [view, setView] = useState('main_categories');
  const [token, setToken] = useState(() => localStorage.getItem('souqli_token'));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [sidebarCategories, setSidebarCategories] = useState([]);
  const [sidebarCategoriesLoading, setSidebarCategoriesLoading] = useState(false);
  const { t } = useI18n();

  const navItems = useMemo(
    () => [
      { id: 'main_categories', label: t('nav.main_categories'), icon: 'main_categories' },
      { id: 'subcategories', label: t('nav.subcategories'), icon: 'subcategories' },
      { id: 'attributes', label: t('nav.attributes'), icon: 'attributes' },
      { id: 'size_charts', label: t('nav.size_charts'), icon: 'size_charts' },
      { id: 'products', label: t('nav.products'), icon: 'products' },
      { id: 'stores', label: t('nav.stores'), icon: 'stores' },
      { id: 'orders', label: t('nav.orders'), icon: 'orders' },
      { id: 'carts', label: t('nav.carts'), icon: 'carts' },
      { id: 'payments', label: t('nav.payments'), icon: 'payments' },
      { id: 'users', label: t('nav.users'), icon: 'users' },
      { id: 'home_banners', label: t('nav.home_banners'), icon: 'home_banners' },
      { id: 'pages', label: t('nav.pages'), icon: 'pages' },
      { id: 'records', label: t('nav.records'), icon: 'records' }
    ],
    [t]
  );

  const title = useMemo(() => {
    const item = navItems.find((entry) => entry.id === view);
    return item ? item.label : t('nav.main_categories');
  }, [view, navItems, t]);

  const titleIcon = useMemo(() => {
    const item = navItems.find((entry) => entry.id === view);
    const iconName = item ? item.icon : 'main_categories';
    return <Icon name={iconName} className="icon" />;
  }, [view, navItems]);

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
      } catch (err) {
        localStorage.removeItem('souqli_token');
        setToken(null);
        setUser(null);
      }
    };

    loadMe();
  }, [token]);

  const loadSidebarCategories = async () => {
    if (!token) return;
    setSidebarCategoriesLoading(true);
    try {
      const data = await categoryApi.list(1, 200);
      setSidebarCategories(data.items || []);
    } catch (err) {
      // Keep the sidebar simple; ignore fetch errors here.
    } finally {
      setSidebarCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSidebarCategories();
    } else {
      setSidebarCategories([]);
    }
  }, [token]);

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('souqli_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      if (err.status === 401) {
        setAuthError(t('errors.invalid_credentials'));
      } else {
        setAuthError(err.message || t('errors.login_failed'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('souqli_token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} error={authError} loading={authLoading} />;
  }

  return (
    <div className="app">
      <Sidebar
        items={navItems}
        active={view}
        onSelect={setView}
        categories={sidebarCategories}
        categoriesLoading={sidebarCategoriesLoading}
        onRefresh={loadSidebarCategories}
      />
      <main className="main">
        <Topbar title={title} icon={titleIcon} user={user} onLogout={handleLogout} />
        <section className="content">
          {view === 'main_categories' && (
            <CategoriesPage onCategoriesChanged={loadSidebarCategories} />
          )}
          {view === 'subcategories' && (
            <SubcategoriesPage onCategoriesChanged={loadSidebarCategories} />
          )}
          {view === 'attributes' && <AttributesPage />}
          {view === 'size_charts' && <SizeChartsPage />}
          {view === 'products' && <ProductsPage />}
          {view === 'stores' && <StoresPage />}
          {view === 'orders' && <OrdersPage />}
          {view === 'carts' && <CartsPage />}
          {view === 'payments' && <PaymentsPage />}
          {view === 'users' && <UsersPage />}
          {view === 'home_banners' && <HomeBannersPage />}
          {view === 'pages' && <PagesPage />}
          {view === 'records' && <RecordsPage />}
        </section>
      </main>
    </div>
  );
};

export default App;
