import { Button } from '@/components/ui/button';
import type { PermissionItem } from '@/lib/permissions';
import RoleFormModal from '@/pages/roles/partials/role-form-modal';

type Props = {
    permissions?: PermissionItem[];
    onSuccess?: () => void;
};

export default function CreateRole({ permissions = [], onSuccess }: Props) {
    return (
        <RoleFormModal
            mode="create"
            permissions={permissions}
            onSuccess={onSuccess}
            trigger={<Button>Create Role</Button>}
        />
    );
}
