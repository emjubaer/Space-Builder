export type PermissionItem = {
    id: number;
    name: string;
    action?: string;
};

export type PermissionGroup = {
    groupName: string;
    label: string;
    permissions: PermissionItem[];
};

export function formatPermissionLabel(value: string): string {
    return String(value || '')
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function groupPermissions(
    permissions: PermissionItem[] = [],
): PermissionGroup[] {
    const groups: Record<string, PermissionItem[]> = {};

    permissions.forEach((permission) => {
        const tokens = String(permission.name || '')
            .split('_')
            .filter(Boolean);
        const action =
            tokens.length > 1 ? tokens[tokens.length - 1] : permission.name;
        const groupName =
            tokens.length > 1 ? tokens.slice(0, -1).join('_') : 'others';

        if (!groups[groupName]) {
            groups[groupName] = [];
        }

        groups[groupName].push({
            ...permission,
            action,
        });
    });

    return Object.entries(groups)
        .sort(([a], [b]) =>
            formatPermissionLabel(a).localeCompare(formatPermissionLabel(b)),
        )
        .map(([groupName, items]) => ({
            groupName,
            label: formatPermissionLabel(groupName),
            permissions: [...items].sort((a, b) =>
                formatPermissionLabel(a.action || a.name).localeCompare(
                    formatPermissionLabel(b.action || b.name),
                ),
            ),
        }));
}
