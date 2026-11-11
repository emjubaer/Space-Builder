import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    formatPermissionLabel,
    groupPermissions,
    type PermissionItem,
} from '@/lib/permissions';

type Props = {
    permissions?: PermissionItem[];
    selectedPermissionIds?: number[];
    onSelectionChange?: (ids: number[]) => void;
};

export default function PermissionSelector({
    permissions = [],
    selectedPermissionIds = [],
    onSelectionChange,
}: Props) {
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >({});

    const permissionSet = useMemo(
        () => new Set(selectedPermissionIds),
        [selectedPermissionIds],
    );

    const groupedPermissions = useMemo(
        () => groupPermissions(permissions),
        [permissions],
    );

    const allSelected = useMemo(
        () =>
            permissions.length > 0 &&
            permissions.every((permission) => permissionSet.has(permission.id)),
        [permissions, permissionSet],
    );

    const setSelected = (nextSelected: number[]) => {
        onSelectionChange?.(nextSelected);
    };

    const togglePermission = (permissionId: number, enabled: boolean) => {
        if (!enabled) {
            setSelected(
                selectedPermissionIds.filter(
                    (selectedId) => selectedId !== permissionId,
                ),
            );

            return;
        }

        setSelected([...new Set([...selectedPermissionIds, permissionId])]);
    };

    const isGroupEnabled = (groupItems: PermissionItem[]) =>
        groupItems.length > 0 &&
        groupItems.every((permission) => permissionSet.has(permission.id));

    const handleGroupToggle = (
        groupName: string,
        groupItems: PermissionItem[],
        enabled: boolean,
    ) => {
        const groupIds = groupItems.map((permission) => permission.id);

        if (!enabled) {
            setSelected(
                selectedPermissionIds.filter(
                    (selectedId) => !groupIds.includes(selectedId),
                ),
            );
        } else {
            setSelected([
                ...new Set([...selectedPermissionIds, ...groupIds]),
            ]);
        }

        setExpandedGroups((prev) => ({
            ...prev,
            [groupName]: enabled,
        }));
    };

    const handleSelectAll = (enabled: boolean) => {
        setSelected(
            enabled ? permissions.map((permission) => permission.id) : [],
        );

        setExpandedGroups(
            groupedPermissions.reduce<Record<string, boolean>>((acc, group) => {
                acc[group.groupName] = enabled;

                return acc;
            }, {}),
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor="permission-select-all">
                    Attach all permissions
                </Label>
                <Checkbox
                    id="permission-select-all"
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                        handleSelectAll(checked === true)
                    }
                />
            </div>

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                {groupedPermissions.map((group) => {
                    const groupEnabled = isGroupEnabled(group.permissions);
                    const groupExpanded =
                        expandedGroups[group.groupName] ?? groupEnabled;

                    return (
                        <div key={group.groupName} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">
                                    {group.label}
                                </span>
                                <Checkbox
                                    checked={groupEnabled}
                                    onCheckedChange={(checked) =>
                                        handleGroupToggle(
                                            group.groupName,
                                            group.permissions,
                                            checked === true,
                                        )
                                    }
                                />
                            </div>

                            {groupExpanded && (
                                <div className="space-y-2 border-l pl-3">
                                    {group.permissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={permissionSet.has(
                                                    permission.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    togglePermission(
                                                        permission.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <span>
                                                {formatPermissionLabel(
                                                    permission.action ||
                                                        permission.name,
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
