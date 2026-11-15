import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function useCan(): (permission: string) => boolean {
    const { auth } = usePage<{ auth: Auth }>().props;
    const permissions = auth.user?.permissions ?? [];

    return (permission: string): boolean => permissions.includes(permission);
}

export function useCanAny(): (permissions: string[]) => boolean {
    const can = useCan();

    return (permissions: string[]): boolean =>
        permissions.some((permission) => can(permission));
}
