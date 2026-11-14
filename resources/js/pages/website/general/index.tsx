import { Head, router } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import ImageField, { type ImagePreviewItem } from '@/components/image-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import OfficesSection, {
    type OfficeRow,
} from '@/pages/website/general/partials/offices-section';
import SocialLinksSection, {
    type SocialLinkRow,
} from '@/pages/website/general/partials/social-links-section';

type PlatformOption = {
    value: string;
    label: string;
};

type CompanyProfile = {
    id: number;
    company_name: string;
    tagline: string | null;
    description: string | null;
    logo: string | null;
    logo_url: string | null;
    favicon: string | null;
    favicon_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    website_url: string | null;
    copyright_text: string | null;
    latitude: number | null;
    longitude: number | null;
    social_links: SocialLinkRow[];
    offices: OfficeRow[];
};

type Props = {
    profile: CompanyProfile;
    platforms: PlatformOption[];
};

export default function WebsiteGeneralIndex({ profile, platforms }: Props) {
    const [companyName, setCompanyName] = useState(profile.company_name);
    const [tagline, setTagline] = useState(profile.tagline || '');
    const [description, setDescription] = useState(profile.description || '');
    const [email, setEmail] = useState(profile.email || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [address, setAddress] = useState(profile.address || '');
    const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '');
    const [copyrightText, setCopyrightText] = useState(
        profile.copyright_text || '',
    );
    const [latitude, setLatitude] = useState(
        profile.latitude !== null && profile.latitude !== undefined
            ? String(profile.latitude)
            : '',
    );
    const [longitude, setLongitude] = useState(
        profile.longitude !== null && profile.longitude !== undefined
            ? String(profile.longitude)
            : '',
    );
    const [logo, setLogo] = useState<ImagePreviewItem | null>(
        profile.logo_url
            ? {
                  url: profile.logo_url,
                  name: profile.logo?.split('/').pop() || 'logo',
              }
            : null,
    );
    const [favicon, setFavicon] = useState<ImagePreviewItem | null>(
        profile.favicon_url
            ? {
                  url: profile.favicon_url,
                  name: profile.favicon?.split('/').pop() || 'favicon',
              }
            : null,
    );
    const [removeLogo, setRemoveLogo] = useState(false);
    const [removeFavicon, setRemoveFavicon] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('company_name', companyName);
            formData.append('tagline', tagline);
            formData.append('description', description);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('website_url', websiteUrl);
            formData.append('copyright_text', copyrightText);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('remove_logo', removeLogo ? '1' : '0');
            formData.append('remove_favicon', removeFavicon ? '1' : '0');
            if (logo?.file) {
                formData.append('logo', logo.file);
            }
            if (favicon?.file) {
                formData.append('favicon', favicon.file);
            }

            return webApi.post(route('admin.website.general.update'), formData);
        },
        onSuccess: (response) => {
            toast.success(
                response.data.message ||
                    'Website general settings updated successfully.',
            );
            setErrors({});
            setRemoveLogo(false);
            setRemoveFavicon(false);
            router.reload({ only: ['profile'] });
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
                error.response?.data?.message ||
                    'Failed to update website general settings.',
            );
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    const refresh = () => {
        router.reload({ only: ['profile'] });
    };

    return (
        <>
            <Head title="Website General" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Website General"
                    description="Manage site branding, contact details, map coordinates, social links, and offices."
                />

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-md border p-4"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="company_name" required>
                                Company name
                            </Label>
                            <Input
                                id="company_name"
                                value={companyName}
                                onChange={(event) =>
                                    setCompanyName(event.target.value)
                                }
                            />
                            <InputError message={errors.company_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input
                                id="tagline"
                                value={tagline}
                                onChange={(event) =>
                                    setTagline(event.target.value)
                                }
                            />
                            <InputError message={errors.tagline} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                                id="website_url"
                                type="url"
                                value={websiteUrl}
                                onChange={(event) =>
                                    setWebsiteUrl(event.target.value)
                                }
                                placeholder="https://example.com"
                            />
                            <InputError message={errors.website_url} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="copyright_text">
                                Copyright text
                            </Label>
                            <Input
                                id="copyright_text"
                                value={copyrightText}
                                onChange={(event) =>
                                    setCopyrightText(event.target.value)
                                }
                            />
                            <InputError message={errors.copyright_text} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(event) =>
                                    setLatitude(event.target.value)
                                }
                                placeholder="23.8103000"
                            />
                            <InputError message={errors.latitude} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(event) =>
                                    setLongitude(event.target.value)
                                }
                                placeholder="90.4125000"
                            />
                            <InputError message={errors.longitude} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={5}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <ImageField
                        label="Logo"
                        value={logo}
                        onChange={(value) => {
                            setLogo(value);
                            setRemoveLogo(value === null);
                        }}
                    />
                    <InputError message={errors.logo} />

                    <ImageField
                        label="Favicon"
                        value={favicon}
                        onChange={(value) => {
                            setFavicon(value);
                            setRemoveFavicon(value === null);
                        }}
                    />
                    <InputError message={errors.favicon} />

                    <div>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending
                                ? 'Saving...'
                                : 'Save general settings'}
                        </Button>
                    </div>
                </form>

                <SocialLinksSection
                    links={
                        Array.isArray(profile.social_links)
                            ? profile.social_links
                            : []
                    }
                    platforms={Array.isArray(platforms) ? platforms : []}
                    onChanged={refresh}
                />

                <OfficesSection
                    offices={
                        Array.isArray(profile.offices) ? profile.offices : []
                    }
                    onChanged={refresh}
                />
            </div>
        </>
    );
}

WebsiteGeneralIndex.layout = {
    breadcrumbs: [
        {
            title: 'General',
            href: '/admin/website/general',
        },
    ],
};
