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
    user: { id: number; name: string | null; email: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export default function DeleteUser({
    user,
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    const mutation = useMutation({
        mutationFn: () =>
            webApi.delete(route('admin.users.destroy', user.id)),
        onSuccess: () => {
            toast.success('User deleted successfully.');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: {
            response?: { data?: { message?: string } };
        }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete user.',
            );
        },
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete user?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete{' '}
                        {user.name || user.email}. This action cannot be undone.
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
