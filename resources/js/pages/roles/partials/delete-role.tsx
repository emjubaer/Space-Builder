import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type Props = {
    id: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
};

export default function DeleteRole({
    id,
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    const mutation = useMutation({
        mutationFn: () => webApi.delete(route('admin.role.destroy', id)),
        onSuccess: (response) => {
            toast.success(
                response?.data?.message || 'Role deleted successfully.',
            );
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error: {
            response?: { data?: { message?: string } };
        }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete role.',
            );
        },
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Once deleted, this role and its permission assignments
                        will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            mutation.mutate();
                        }}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {mutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
