import { request } from './client.js';

export const authApi = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, token: null }),
  me: () => request('/api/auth/me')
};

export const categoryApi = {
  list: (page = 1, limit = 50) =>
    request(`/api/admin/categories?page=${page}&limit=${limit}`),
  create: (payload) => request('/api/admin/categories', { method: 'POST', body: payload }),
  update: (id, payload) =>
    request(`/api/admin/categories/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/categories/${id}`, { method: 'DELETE' })
};

export const subcategoryApi = {
  list: (page = 1, limit = 50) =>
    request(`/api/admin/subcategories?page=${page}&limit=${limit}`),
  listAttributes: (id) => request(`/api/admin/subcategories/${id}/attributes`),
  attachAttribute: (id, payload) =>
    request(`/api/admin/subcategories/${id}/attributes`, { method: 'POST', body: payload }),
  updateAttribute: (id, mapId, payload) =>
    request(`/api/admin/subcategories/${id}/attributes/${mapId}`, {
      method: 'PATCH',
      body: payload
    }),
  removeAttribute: (id, mapId) =>
    request(`/api/admin/subcategories/${id}/attributes/${mapId}`, { method: 'DELETE' })
};

export const attributeApi = {
  list: (page = 1, limit = 50) => request(`/api/admin/attributes?page=${page}&limit=${limit}`),
  create: (payload) => request('/api/admin/attributes', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/attributes/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/attributes/${id}`, { method: 'DELETE' }),
  listOptions: (id) => request(`/api/admin/attributes/${id}/options`),
  createOption: (id, payload) =>
    request(`/api/admin/attributes/${id}/options`, { method: 'POST', body: payload }),
  updateOption: (optionId, payload) =>
    request(`/api/admin/attributes/options/${optionId}`, { method: 'PATCH', body: payload }),
  deleteOption: (optionId) =>
    request(`/api/admin/attributes/options/${optionId}`, { method: 'DELETE' })
};

export const productApi = {
  list: (page = 1, limit = 50) =>
    request(`/api/admin/products?page=${page}&limit=${limit}`),
  getById: (id) => request(`/api/admin/products/${id}`),
  getStores: (id) => request(`/api/admin/products/${id}/stores`),
  listVariants: (id) => request(`/api/admin/products/${id}/variants`),
  createVariant: (id, payload) =>
    request(`/api/admin/products/${id}/variants`, { method: 'POST', body: payload }),
  updateVariant: (id, variantId, payload) =>
    request(`/api/admin/products/${id}/variants/${variantId}`, { method: 'PATCH', body: payload }),
  deleteVariant: (id, variantId) =>
    request(`/api/admin/products/${id}/variants/${variantId}`, { method: 'DELETE' }),
  create: (payload) => request('/api/admin/products', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/products/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' })
};

export const storeApi = {
  list: (page = 1, limit = 50, search = '') =>
    request(`/api/admin/stores?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getById: (id) => request(`/api/admin/stores/${id}`),
  create: (payload) => request('/api/admin/stores', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/stores/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/stores/${id}`, { method: 'DELETE' }),
  listPhones: (id) => request(`/api/admin/stores/${id}/phones`),
  createPhone: (id, payload) =>
    request(`/api/admin/stores/${id}/phones`, { method: 'POST', body: payload }),
  updatePhone: (id, phoneId, payload) =>
    request(`/api/admin/stores/${id}/phones/${phoneId}`, { method: 'PATCH', body: payload }),
  deletePhone: (id, phoneId) =>
    request(`/api/admin/stores/${id}/phones/${phoneId}`, { method: 'DELETE' }),
  listHours: (id) => request(`/api/admin/stores/${id}/hours`),
  upsertHours: (id, payload) =>
    request(`/api/admin/stores/${id}/hours`, { method: 'PUT', body: payload }),
  listProducts: (id, page = 1, limit = 50) =>
    request(`/api/admin/stores/${id}/products?page=${page}&limit=${limit}`),
  attachProduct: (id, payload) =>
    request(`/api/admin/stores/${id}/products`, { method: 'POST', body: payload }),
  updateProduct: (id, mapId, payload) =>
    request(`/api/admin/stores/${id}/products/${mapId}`, { method: 'PATCH', body: payload }),
  removeProduct: (id, mapId) =>
    request(`/api/admin/stores/${id}/products/${mapId}`, { method: 'DELETE' })
};

export const pagesApi = {
  list: (page = 1, limit = 50) => request(`/api/admin/pages?page=${page}&limit=${limit}`),
  getById: (id) => request(`/api/admin/pages/${id}`),
  create: (payload) => request('/api/admin/pages', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/pages/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/pages/${id}`, { method: 'DELETE' })
};

export const homeBannersApi = {
  list: (page = 1, limit = 50) => request(`/api/admin/home-banners?page=${page}&limit=${limit}`),
  getById: (id) => request(`/api/admin/home-banners/${id}`),
  create: (payload) => request('/api/admin/home-banners', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/home-banners/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/home-banners/${id}`, { method: 'DELETE' })
};

export const logsApi = {
  list: (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (filters.search) params.set('search', filters.search);
    if (filters.action) params.set('action', filters.action);
    if (filters.entity_type) params.set('entity_type', filters.entity_type);
    if (filters.user_id) params.set('user_id', String(filters.user_id));
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);

    return request(`/api/admin/activity-logs?${params.toString()}`);
  }
};

export const cartsApi = {
  list: (page = 1, limit = 50, search = '', status = '') =>
    request(
      `/api/admin/carts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${
        status ? `&status=${encodeURIComponent(status)}` : ''
      }`
    ),
  getById: (id) => request(`/api/admin/carts/${id}`),
  listItems: (id) => request(`/api/admin/carts/${id}/items`)
};

export const paymentsApi = {
  list: (page = 1, limit = 50, search = '', status = '', orderId = '') =>
    request(
      `/api/admin/payments?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${
        status ? `&status=${encodeURIComponent(status)}` : ''
      }${orderId ? `&order_id=${orderId}` : ''}`
    ),
  getById: (id) => request(`/api/admin/payments/${id}`),
  create: (payload) => request('/api/admin/payments', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/payments/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/payments/${id}`, { method: 'DELETE' })
};

export const usersApi = {
  list: (page = 1, limit = 50, search = '') =>
    request(`/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getById: (id) => request(`/api/admin/users/${id}`),
  create: (payload) => request('/api/admin/users', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  setRoles: (id, role_ids) =>
    request(`/api/admin/users/${id}/roles`, { method: 'PATCH', body: { role_ids } }),
  listAddresses: (id) => request(`/api/admin/users/${id}/addresses`),
  createAddress: (id, payload) =>
    request(`/api/admin/users/${id}/addresses`, { method: 'POST', body: payload }),
  updateAddress: (id, addressId, payload) =>
    request(`/api/admin/users/${id}/addresses/${addressId}`, { method: 'PATCH', body: payload }),
  deleteAddress: (id, addressId) =>
    request(`/api/admin/users/${id}/addresses/${addressId}`, { method: 'DELETE' })
};

export const rbacApi = {
  listRoles: () => request('/api/admin/rbac/roles'),
  createRole: (payload) => request('/api/admin/rbac/roles', { method: 'POST', body: payload }),
  updateRole: (roleId, payload) =>
    request(`/api/admin/rbac/roles/${roleId}`, { method: 'PATCH', body: payload }),
  deleteRole: (roleId) => request(`/api/admin/rbac/roles/${roleId}`, { method: 'DELETE' }),
  listRolePermissions: (roleId) => request(`/api/admin/rbac/roles/${roleId}/permissions`),
  setRolePermissions: (roleId, permission_ids) =>
    request(`/api/admin/rbac/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: { permission_ids }
    }),
  listPermissions: () => request('/api/admin/rbac/permissions'),
  createPermission: (payload) =>
    request('/api/admin/rbac/permissions', { method: 'POST', body: payload }),
  updatePermission: (permissionId, payload) =>
    request(`/api/admin/rbac/permissions/${permissionId}`, { method: 'PATCH', body: payload }),
  deletePermission: (permissionId) =>
    request(`/api/admin/rbac/permissions/${permissionId}`, { method: 'DELETE' })
};

export const adminOrdersApi = {
  list: (page = 1, limit = 50, search = '', status_id = '') =>
    request(
      `/api/admin/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${
        status_id ? `&status_id=${status_id}` : ''
      }`
    ),
  getById: (id) => request(`/api/admin/orders/${id}`),
  listStatuses: () => request('/api/admin/orders/statuses'),
  listItemStores: (orderId, itemId) =>
    request(`/api/admin/orders/${orderId}/items/${itemId}/stores`),
  assignItemStore: (orderId, itemId, store_id) =>
    request(`/api/admin/orders/${orderId}/items/${itemId}/store`, {
      method: 'PATCH',
      body: { store_id: store_id ?? null }
    }),
  updateStatus: (id, payload) =>
    request(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: payload })
};

export const ordersApi = {
  listMy: (page = 1, limit = 50) => request(`/api/orders/my?page=${page}&limit=${limit}`)
};
