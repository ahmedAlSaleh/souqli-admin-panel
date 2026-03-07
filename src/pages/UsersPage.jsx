import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Notice from '../components/Notice.jsx';
import { rbacApi, usersApi } from '../api/index.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Icon } from '../components/Icons.jsx';

const emptyUserForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  is_active: true,
  role_ids: []
};

const emptyAddressForm = {
  label: '',
  country: '',
  city: '',
  street: '',
  postal_code: '',
  notes: '',
  is_default: false
};

const emptyRoleForm = {
  name: '',
  description: ''
};

const emptyPermissionForm = {
  code: '',
  description: ''
};

const UsersPage = () => {
  const { t } = useI18n();

  const [tab, setTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [roles, setRoles] = useState([]);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermissionIds, setRolePermissionIds] = useState([]);

  const [permissions, setPermissions] = useState([]);
  const [permissionForm, setPermissionForm] = useState(emptyPermissionForm);
  const [editingPermissionId, setEditingPermissionId] = useState(null);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async (search = usersSearch) => {
    setUsersLoading(true);
    setError('');
    try {
      const data = await usersApi.list(1, 100, search);
      setUsers(data.items || []);
      setUsersPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || t('errors.users_load'));
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rbacApi.listRoles();
      setRoles(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.roles_load'));
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await rbacApi.listPermissions();
      setPermissions(data.items || []);
    } catch (err) {
      setError(err.message || t('errors.permissions_load'));
    }
  };

  useEffect(() => {
    loadUsers('');
    loadRoles();
    loadPermissions();
  }, []);

  useEffect(() => {
    loadUsers(usersSearch);
  }, [usersSearch]);

  useEffect(() => {
    const loadRolePermissions = async () => {
      if (!selectedRoleId) {
        setRolePermissionIds([]);
        return;
      }
      try {
        const data = await rbacApi.listRolePermissions(selectedRoleId);
        setRolePermissionIds(data.permission_ids || []);
      } catch (err) {
        setError(err.message || t('errors.roles_permissions_load'));
      }
    };

    loadRolePermissions();
  }, [selectedRoleId]);

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setEditingUserId(null);
    setAddresses([]);
    setAddressForm(emptyAddressForm);
    setEditingAddressId(null);
  };

  const handleUserChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUserRoleToggle = (roleId, checked) => {
    setUserForm((prev) => {
      const ids = new Set(prev.role_ids.map(Number));
      if (checked) ids.add(Number(roleId));
      else ids.delete(Number(roleId));
      return { ...prev, role_ids: Array.from(ids) };
    });
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      full_name: userForm.full_name.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim() || null,
      is_active: userForm.is_active,
      role_ids: userForm.role_ids
    };

    if (!editingUserId || userForm.password.trim()) {
      payload.password = userForm.password.trim();
    }

    try {
      if (editingUserId) {
        await usersApi.update(editingUserId, payload);
        setNotice(t('users.updated'));
      } else {
        await usersApi.create(payload);
        setNotice(t('users.created'));
      }

      await Promise.all([loadUsers(), loadRoles()]);
      if (editingUserId) {
        await handleEditUser({ id: editingUserId });
      }

      if (!editingUserId) {
        resetUserForm();
      }
    } catch (err) {
      setError(err.message || t('errors.users_save'));
    }
  };

  const handleEditUser = async (user) => {
    setError('');
    setNotice('');
    try {
      const details = await usersApi.getById(user.id);
      setEditingUserId(details.id);
      setUserForm({
        full_name: details.full_name || '',
        email: details.email || '',
        phone: details.phone || '',
        password: '',
        is_active: Boolean(details.is_active),
        role_ids: (details.roles || []).map((role) => Number(role.id))
      });
      setAddresses(details.addresses || []);
      setAddressForm(emptyAddressForm);
      setEditingAddressId(null);
    } catch (err) {
      setError(err.message || t('errors.users_load'));
    }
  };

  const handleDeleteUser = async (row) => {
    const confirmed = window.confirm(`${t('users.delete_confirm')} "${row.full_name}"?`);
    if (!confirmed) return;

    setError('');
    setNotice('');
    try {
      await usersApi.remove(row.id);
      setNotice(t('users.deleted'));
      if (editingUserId === row.id) {
        resetUserForm();
      }
      await Promise.all([loadUsers(), loadRoles()]);
    } catch (err) {
      setError(err.message || t('errors.users_delete'));
    }
  };

  const handleAddressChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!editingUserId) return;

    setError('');
    setNotice('');

    const payload = {
      label: addressForm.label.trim() || null,
      country: addressForm.country.trim() || null,
      city: addressForm.city.trim() || null,
      street: addressForm.street.trim() || null,
      postal_code: addressForm.postal_code.trim() || null,
      notes: addressForm.notes.trim() || null,
      is_default: addressForm.is_default
    };

    try {
      if (editingAddressId) {
        await usersApi.updateAddress(editingUserId, editingAddressId, payload);
        setNotice(t('users.address_updated'));
      } else {
        await usersApi.createAddress(editingUserId, payload);
        setNotice(t('users.address_created'));
      }

      const latest = await usersApi.listAddresses(editingUserId);
      setAddresses(latest.items || []);
      setAddressForm(emptyAddressForm);
      setEditingAddressId(null);
    } catch (err) {
      setError(err.message || t('errors.addresses_save'));
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || '',
      country: address.country || '',
      city: address.city || '',
      street: address.street || '',
      postal_code: address.postal_code || '',
      notes: address.notes || '',
      is_default: Boolean(address.is_default)
    });
  };

  const handleDeleteAddress = async (address) => {
    if (!editingUserId) return;
    const confirmed = window.confirm(`${t('users.address_delete_confirm')} "${address.label || address.id}"?`);
    if (!confirmed) return;

    setError('');
    setNotice('');
    try {
      await usersApi.deleteAddress(editingUserId, address.id);
      setNotice(t('users.address_deleted'));
      const latest = await usersApi.listAddresses(editingUserId);
      setAddresses(latest.items || []);
    } catch (err) {
      setError(err.message || t('errors.addresses_delete'));
    }
  };

  const resetRoleForm = () => {
    setRoleForm(emptyRoleForm);
    setEditingRoleId(null);
  };

  const handleRoleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim() || null
    };

    try {
      if (editingRoleId) {
        await rbacApi.updateRole(editingRoleId, payload);
        setNotice(t('users.role_updated'));
      } else {
        await rbacApi.createRole(payload);
        setNotice(t('users.role_created'));
      }
      resetRoleForm();
      await Promise.all([loadRoles(), loadUsers()]);
    } catch (err) {
      setError(err.message || t('errors.roles_save'));
    }
  };

  const handleDeleteRole = async (role) => {
    const confirmed = window.confirm(`${t('users.role_delete_confirm')} "${role.name}"?`);
    if (!confirmed) return;

    setNotice('');
    setError('');
    try {
      await rbacApi.deleteRole(role.id);
      setNotice(t('users.role_deleted'));
      if (Number(selectedRoleId) === Number(role.id)) {
        setSelectedRoleId('');
      }
      await Promise.all([loadRoles(), loadUsers()]);
    } catch (err) {
      setError(err.message || t('errors.roles_delete'));
    }
  };

  const toggleRolePermission = (permissionId, checked) => {
    setRolePermissionIds((prev) => {
      const ids = new Set(prev.map(Number));
      if (checked) ids.add(Number(permissionId));
      else ids.delete(Number(permissionId));
      return Array.from(ids);
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;

    setNotice('');
    setError('');
    try {
      await rbacApi.setRolePermissions(selectedRoleId, rolePermissionIds);
      setNotice(t('users.role_permissions_updated'));
      await loadRoles();
    } catch (err) {
      setError(err.message || t('errors.roles_permissions_save'));
    }
  };

  const resetPermissionForm = () => {
    setPermissionForm(emptyPermissionForm);
    setEditingPermissionId(null);
  };

  const handlePermissionSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const payload = {
      code: permissionForm.code.trim(),
      description: permissionForm.description.trim() || null
    };

    try {
      if (editingPermissionId) {
        await rbacApi.updatePermission(editingPermissionId, payload);
        setNotice(t('users.permission_updated'));
      } else {
        await rbacApi.createPermission(payload);
        setNotice(t('users.permission_created'));
      }
      resetPermissionForm();
      await Promise.all([loadPermissions(), loadRoles()]);
    } catch (err) {
      setError(err.message || t('errors.permissions_save'));
    }
  };

  const handleDeletePermission = async (permission) => {
    const confirmed = window.confirm(`${t('users.permission_delete_confirm')} "${permission.code}"?`);
    if (!confirmed) return;

    setNotice('');
    setError('');
    try {
      await rbacApi.deletePermission(permission.id);
      setNotice(t('users.permission_deleted'));
      await Promise.all([loadPermissions(), loadRoles()]);
    } catch (err) {
      setError(err.message || t('errors.permissions_delete'));
    }
  };

  return (
    <>
      <SectionHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        icon={<Icon name="users" className="icon" />}
        meta={usersPagination ? `${t('common.total')}: ${usersPagination.total}` : ''}
      />

      <Notice type="success" message={notice} />
      <Notice type="error" message={error} />

      <div className="tab-bar">
        <button
          className={`tab-button ${tab === 'users' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('users')}
        >
          {t('users.tab_users')}
        </button>
        <button
          className={`tab-button ${tab === 'roles' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('roles')}
        >
          {t('users.tab_roles')}
        </button>
        <button
          className={`tab-button ${tab === 'permissions' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('permissions')}
        >
          {t('users.tab_permissions')}
        </button>
      </div>

      {tab === 'users' && (
        <div className="card-stack">
          <div className="form-card">
            <form className="form-grid" onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label>{t('users.name')}</label>
                <input name="full_name" value={userForm.full_name} onChange={handleUserChange} required />
              </div>
              <div className="form-group">
                <label>{t('users.email')}</label>
                <input name="email" type="email" value={userForm.email} onChange={handleUserChange} required />
              </div>
              <div className="form-group">
                <label>{t('users.phone')}</label>
                <input name="phone" value={userForm.phone} onChange={handleUserChange} />
              </div>
              <div className="form-group">
                <label>{t('users.password')}</label>
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={handleUserChange}
                  required={!editingUserId}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={userForm.is_active}
                    onChange={handleUserChange}
                  />
                  {t('common.active')}
                </label>
              </div>

              <div className="form-group full-width">
                <label>{t('users.roles')}</label>
                <div className="selection-grid">
                  {roles.map((role) => {
                    const checked = userForm.role_ids.map(Number).includes(Number(role.id));
                    return (
                      <label className="checkbox-inline" key={role.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => handleUserRoleToggle(role.id, event.target.checked)}
                        />
                        {role.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingUserId ? t('common.update') : t('common.create')}
                </button>
                <button className="ghost-button" type="button" onClick={resetUserForm}>
                  {t('common.clear')}
                </button>
              </div>
            </form>
          </div>

          <div className="toolbar">
            <input
              type="text"
              placeholder={t('users.search_placeholder')}
              value={usersSearch}
              onChange={(event) => setUsersSearch(event.target.value)}
            />
            <span className="muted">
              {usersLoading ? t('common.loading') : `${users.length} ${t('common.results')}`}
            </span>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: t('table.id') },
              { key: 'full_name', label: t('table.name') },
              { key: 'email', label: t('table.email') },
              { key: 'phone', label: t('users.phone') },
              {
                key: 'roles',
                label: t('users.roles'),
                render: (row) => row.roles_text || '-'
              },
              {
                key: 'status',
                label: t('table.status'),
                render: (row) => (row.is_active ? t('status.active') : t('status.inactive'))
              },
              {
                key: 'actions',
                label: t('table.actions'),
                align: 'right',
                render: (row) => (
                  <div className="row-actions">
                    <button className="ghost-button" type="button" onClick={() => handleEditUser(row)}>
                      {t('common.edit')}
                    </button>
                    <button className="ghost-button danger" type="button" onClick={() => handleDeleteUser(row)}>
                      {t('common.delete')}
                    </button>
                  </div>
                )
              }
            ]}
            rows={users}
            emptyMessage={t('users.empty')}
          />

          {editingUserId && (
            <div className="form-card">
              <SectionHeader
                title={t('users.addresses_title')}
                subtitle={`#${editingUserId}`}
                icon={<Icon name="users" className="icon" />}
              />

              <form className="form-grid" onSubmit={handleAddressSubmit}>
                <div className="form-group">
                  <label>{t('users.address_label')}</label>
                  <input name="label" value={addressForm.label} onChange={handleAddressChange} />
                </div>
                <div className="form-group">
                  <label>{t('users.address_country')}</label>
                  <input name="country" value={addressForm.country} onChange={handleAddressChange} />
                </div>
                <div className="form-group">
                  <label>{t('users.address_city')}</label>
                  <input name="city" value={addressForm.city} onChange={handleAddressChange} />
                </div>
                <div className="form-group">
                  <label>{t('users.address_street')}</label>
                  <input name="street" value={addressForm.street} onChange={handleAddressChange} />
                </div>
                <div className="form-group">
                  <label>{t('users.address_postal_code')}</label>
                  <input name="postal_code" value={addressForm.postal_code} onChange={handleAddressChange} />
                </div>
                <div className="form-group">
                  <label>{t('users.address_notes')}</label>
                  <input name="notes" value={addressForm.notes} onChange={handleAddressChange} />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressChange}
                    />
                    {t('users.address_default')}
                  </label>
                </div>
                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    {editingAddressId ? t('common.update') : t('common.create')}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setAddressForm(emptyAddressForm);
                      setEditingAddressId(null);
                    }}
                  >
                    {t('common.clear')}
                  </button>
                </div>
              </form>

              <DataTable
                columns={[
                  { key: 'id', label: t('table.id') },
                  { key: 'label', label: t('users.address_label') },
                  { key: 'country', label: t('users.address_country') },
                  { key: 'city', label: t('users.address_city') },
                  { key: 'street', label: t('users.address_street') },
                  {
                    key: 'is_default',
                    label: t('users.address_default'),
                    render: (row) => (row.is_default ? t('common.active') : '-')
                  },
                  {
                    key: 'actions',
                    label: t('table.actions'),
                    align: 'right',
                    render: (row) => (
                      <div className="row-actions">
                        <button className="ghost-button" type="button" onClick={() => handleEditAddress(row)}>
                          {t('common.edit')}
                        </button>
                        <button
                          className="ghost-button danger"
                          type="button"
                          onClick={() => handleDeleteAddress(row)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={addresses}
                emptyMessage={t('users.addresses_empty')}
              />
            </div>
          )}
        </div>
      )}

      {tab === 'roles' && (
        <div className="card-stack">
          <div className="form-card">
            <form className="form-grid" onSubmit={handleRoleSubmit}>
              <div className="form-group">
                <label>{t('users.role_name')}</label>
                <input
                  name="name"
                  value={roleForm.name}
                  onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('users.role_description')}</label>
                <input
                  name="description"
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingRoleId ? t('common.update') : t('common.create')}
                </button>
                <button className="ghost-button" type="button" onClick={resetRoleForm}>
                  {t('common.clear')}
                </button>
              </div>
            </form>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: t('table.id') },
              { key: 'name', label: t('users.role_name') },
              { key: 'description', label: t('users.role_description') },
              { key: 'users_count', label: t('users.role_users_count') },
              { key: 'permissions_count', label: t('users.role_permissions_count') },
              {
                key: 'actions',
                label: t('table.actions'),
                align: 'right',
                render: (row) => (
                  <div className="row-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingRoleId(row.id);
                        setRoleForm({ name: row.name || '', description: row.description || '' });
                      }}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setSelectedRoleId(String(row.id))}
                    >
                      {t('users.manage_permissions')}
                    </button>
                    <button className="ghost-button danger" type="button" onClick={() => handleDeleteRole(row)}>
                      {t('common.delete')}
                    </button>
                  </div>
                )
              }
            ]}
            rows={roles}
            emptyMessage={t('users.roles_empty')}
          />

          <div className="form-card">
            <div className="form-grid">
              <div className="form-group">
                <label>{t('users.select_role')}</label>
                <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
                  <option value="">{t('users.select_role_placeholder')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button
                  className="primary-button"
                  type="button"
                  disabled={!selectedRoleId}
                  onClick={handleSaveRolePermissions}
                >
                  {t('users.save_role_permissions')}
                </button>
              </div>
            </div>

            {selectedRoleId && (
              <div className="selection-grid role-permission-grid">
                {permissions.map((permission) => (
                  <label className="checkbox-inline" key={permission.id}>
                    <input
                      type="checkbox"
                      checked={rolePermissionIds.map(Number).includes(Number(permission.id))}
                      onChange={(event) =>
                        toggleRolePermission(permission.id, event.target.checked)
                      }
                    />
                    <span>{permission.code}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="card-stack">
          <div className="form-card">
            <form className="form-grid" onSubmit={handlePermissionSubmit}>
              <div className="form-group">
                <label>{t('users.permission_code')}</label>
                <input
                  name="code"
                  value={permissionForm.code}
                  onChange={(event) =>
                    setPermissionForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('users.permission_description')}</label>
                <input
                  name="description"
                  value={permissionForm.description}
                  onChange={(event) =>
                    setPermissionForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingPermissionId ? t('common.update') : t('common.create')}
                </button>
                <button className="ghost-button" type="button" onClick={resetPermissionForm}>
                  {t('common.clear')}
                </button>
              </div>
            </form>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: t('table.id') },
              { key: 'code', label: t('users.permission_code') },
              { key: 'description', label: t('users.permission_description') },
              { key: 'roles_count', label: t('users.permission_roles_count') },
              {
                key: 'actions',
                label: t('table.actions'),
                align: 'right',
                render: (row) => (
                  <div className="row-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingPermissionId(row.id);
                        setPermissionForm({
                          code: row.code || '',
                          description: row.description || ''
                        });
                      }}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => handleDeletePermission(row)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )
              }
            ]}
            rows={permissions}
            emptyMessage={t('users.permissions_empty')}
          />
        </div>
      )}
    </>
  );
};

export default UsersPage;

