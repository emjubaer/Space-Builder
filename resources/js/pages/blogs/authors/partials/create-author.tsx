import { useMutation, useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/image-upload';
import InputError from '@/components/input-error';
import UserCombobox, {
    type ComboboxUser,
} from '@/components/user-combobox';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type Props = {
    onSuccess: () => void;
};

type FormState = {
    user_id: number | null;
    name: string;
    email: string;
    mobile: string;
    password: string;
    password_confirmation: string;
    bio: string;
    designation: string;
};

const initialState: FormState = {
    user_id: null,
    name: '',
    email: '',
    mobile: '',
    password: '',
    password_confirmation: '',
    bio: '',
    designation: '',
};

export default function CreateAuthor({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('existing');
    const [userSearch, setUserSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<ComboboxUser | null>(null);
    const [avatar, setAvatar] = useState<File | null>(null);
    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(userSearch), 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const { data: usersData = [], isFetching } = useQuery({
        queryKey: ['blog-author-users', debouncedSearch],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.blogs.authors.users'),
                {
                    params: {
                        search: debouncedSearch || undefined,
                    },
                },
            );

            return (response.data?.data || []) as ComboboxUser[];
        },
        enabled: open && tab === 'existing',
    });

    const mutation = useMutation({
        mutationFn: async () => {
            if (tab === 'existing') {
                return webApi.post(route('admin.blogs.authors.store'), {
                    user_id: form.user_id,
                    bio: form.bio || null,
                    designation: form.designation || null,
                });
            }

            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('mobile', form.mobile);
            formData.append('password', form.password);
            formData.append('password_confirmation', form.password_confirmation);
            if (form.bio) {
                formData.append('bio', form.bio);
            }
            if (form.designation) {
                formData.append('designation', form.designation);
            }
            if (avatar) {
                formData.append('avatar', avatar);
            }

            return webApi.post(route('admin.blogs.authors.store'), formData);
        },
        onSuccess: () => {
            toast.success('Author created successfully.');
            setOpen(false);
            setForm(initialState);
            setSelectedUser(null);
            setAvatar(null);
            setErrors({});
            setTab('existing');
            onSuccess();
        },
        onError: (error: {
            response?: {
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }) => {
            const serverErrors = error.response?.data?.errors || {};
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([field, messages]) => {
                mapped[field] = messages[0];
            });
            setErrors(mapped);
            toast.error(
                error.response?.data?.message || 'Failed to create author.',
            );
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setForm(initialState);
                    setSelectedUser(null);
                    setAvatar(null);
                    setErrors({});
                    setTab('existing');
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Create Author</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Author</DialogTitle>
                    <DialogDescription>
                        Attach an existing user or create a new author account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="existing">
                                Existing User
                            </TabsTrigger>
                            <TabsTrigger value="new">New User</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existing" className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>User</Label>
                                <UserCombobox
                                    value={form.user_id}
                                    selectedUser={selectedUser}
                                    users={usersData}
                                    loading={isFetching}
                                    search={userSearch}
                                    onSearchChange={setUserSearch}
                                    onChange={(user) => {
                                        setSelectedUser(user);
                                        setForm((current) => ({
                                            ...current,
                                            user_id: user?.id ?? null,
                                        }));
                                    }}
                                />
                                <InputError message={errors.user_id} />
                            </div>
                        </TabsContent>

                        <TabsContent value="new" className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Avatar</Label>
                                <ImageUpload
                                    onChange={(file) => setAvatar(file)}
                                />
                                <InputError message={errors.avatar} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author-name">Name</Label>
                                <Input
                                    id="author-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author-email">Email</Label>
                                <Input
                                    id="author-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            email: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author-mobile">Mobile</Label>
                                <Input
                                    id="author-mobile"
                                    value={form.mobile}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            mobile: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.mobile} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author-password">
                                    Password
                                </Label>
                                <Input
                                    id="author-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            password: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author-password-confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="author-password-confirmation"
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            password_confirmation:
                                                event.target.value,
                                        }))
                                    }
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-2">
                        <Label htmlFor="author-designation">Designation</Label>
                        <Input
                            id="author-designation"
                            value={form.designation}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    designation: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.designation} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="author-bio">Bio</Label>
                        <Textarea
                            id="author-bio"
                            value={form.bio}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    bio: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.bio} />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
