import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { RolePermissionDto } from '../types/models';

export type RbacModuleKey =
  | 'LOCATIONS'
  | 'DEVICES'
  | 'CAMPAIGNS'
  | 'INCIDENTS'
  | 'USERS'
  | 'SETTINGS';

export interface ModulePermissionState {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isSuperAdmin: boolean;
  role: string;
}

const DEFAULT_SOTTTT_PERMS: Record<RbacModuleKey, Omit<ModulePermissionState, 'isSuperAdmin' | 'role'>> = {
  LOCATIONS: { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true },
  DEVICES: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
  CAMPAIGNS: { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true },
  INCIDENTS: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true },
  USERS: { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false },
  SETTINGS: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
};

const DEFAULT_COMMUNE_PERMS: Record<RbacModuleKey, Omit<ModulePermissionState, 'isSuperAdmin' | 'role'>> = {
  LOCATIONS: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
  DEVICES: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
  CAMPAIGNS: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
  INCIDENTS: { canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false },
  USERS: { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
  SETTINGS: { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false },
};

export function resolveModulePermission(moduleName: RbacModuleKey): ModulePermissionState {
  const user = authApi.getCurrentUser();
  const rawRole = user?.role || 'ROLE_SUPER_ADMIN';
  const isSuper = rawRole === 'ROLE_SUPER_ADMIN' || rawRole === 'ROLE_ADMIN';

  if (isSuper) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      isSuperAdmin: true,
      role: rawRole,
    };
  }

  const effectiveRole = rawRole === 'ROLE_DISTRICT_OFFICER' ? 'ROLE_COMMUNE_OFFICER' : rawRole;

  try {
    const cached = localStorage.getItem('wifi_rbac_permissions');
    if (cached) {
      const list = JSON.parse(cached) as RolePermissionDto[];
      if (Array.isArray(list) && list.length > 0) {
        const match =
          list.find((p) => p.roleName === effectiveRole && p.moduleName === moduleName) ||
          list.find((p) => p.roleName === rawRole && p.moduleName === moduleName);
        if (match) {
          return {
            canView: Boolean(match.canView),
            canCreate: Boolean(match.canCreate),
            canEdit: Boolean(match.canEdit),
            canDelete: Boolean(match.canDelete),
            canApprove: Boolean(match.canApprove),
            isSuperAdmin: false,
            role: rawRole,
          };
        }
      }
    }
  } catch {
    // fallback to defaults
  }

  const fallback =
    effectiveRole === 'ROLE_SOTTTT_ADMIN'
      ? DEFAULT_SOTTTT_PERMS[moduleName]
      : DEFAULT_COMMUNE_PERMS[moduleName];

  return {
    ...fallback,
    isSuperAdmin: false,
    role: rawRole,
  };
}

export function useRbac(moduleName: RbacModuleKey): ModulePermissionState {
  const [state, setState] = useState<ModulePermissionState>(() => resolveModulePermission(moduleName));

  const refresh = useCallback(() => {
    setState(resolveModulePermission(moduleName));
  }, [moduleName]);

  useEffect(() => {
    refresh();
    window.addEventListener('rbac-permissions-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('rbac-permissions-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return state;
}
