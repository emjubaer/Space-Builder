import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type RoleOption = {
    id: number;
    name: string;
};

type Props = {
    roles: RoleOption[];
    value: number[];
    onChange: (value: number[]) => void;
};

export function RoleSelect({ roles, value, onChange }: Props) {
    const selected = roles.filter((role) => value.includes(role.id));

    return (
        <div className="grid gap-2">
            <Label>Roles</Label>
            <Select
                onValueChange={(roleId) => {
                    const id = Number(roleId);
                    if (value.includes(id)) {
                        return;
                    }
                    onChange([...value, id]);
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Add a role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1">
                {selected.map((role) => (
                    <Badge
                        key={role.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                            onChange(value.filter((id) => id !== role.id))
                        }
                    >
                        {role.name} ×
                    </Badge>
                ))}
            </div>
        </div>
    );
}
