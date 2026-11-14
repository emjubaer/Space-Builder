import { X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ImagePreviewItem = {
    id?: number;
    url: string;
    name: string;
    file?: File;
};

type SingleProps = {
    label: string;
    value: ImagePreviewItem | null;
    onChange: (value: ImagePreviewItem | null) => void;
    multiple?: false;
};

type MultiProps = {
    label: string;
    value: ImagePreviewItem[];
    onChange: (value: ImagePreviewItem[]) => void;
    multiple: true;
};

type Props = SingleProps | MultiProps;

export default function ImageField(props: Props) {
    const inputId = useId();
    const [objectUrls, setObjectUrls] = useState<string[]>([]);

    useEffect(() => {
        return () => {
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [objectUrls]);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        const nextItems: ImagePreviewItem[] = Array.from(files).map((file) => {
            const url = URL.createObjectURL(file);
            return {
                url,
                name: file.name,
                file,
            };
        });

        setObjectUrls((current) => [
            ...current,
            ...nextItems.map((item) => item.url),
        ]);

        if (props.multiple) {
            props.onChange([...props.value, ...nextItems]);
            return;
        }

        props.onChange(nextItems[0] ?? null);
    };

    const items: ImagePreviewItem[] = props.multiple
        ? Array.isArray(props.value)
            ? props.value
            : []
        : props.value
          ? [props.value]
          : [];

    return (
        <div className="grid gap-2">
            <Label htmlFor={inputId}>{props.label}</Label>

            {items.length > 0 && (
                <div className="grid gap-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.name}-${item.id ?? index}`}
                            className="flex items-center gap-3 rounded-md border p-2"
                        >
                            <img
                                src={item.url}
                                alt=""
                                className="h-14 w-14 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.file ? 'New upload' : 'Saved image'}
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                    if (props.multiple) {
                                        props.onChange(
                                            props.value.filter(
                                                (_, i) => i !== index,
                                            ),
                                        );
                                        return;
                                    }
                                    props.onChange(null);
                                }}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Input
                id={inputId}
                type="file"
                accept="image/*"
                multiple={props.multiple === true}
                onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = '';
                }}
            />
        </div>
    );
}
