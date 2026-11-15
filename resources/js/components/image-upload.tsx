import { Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp';

type Props = {
    value?: string | null;
    onChange: (file: File | null) => void;
    className?: string;
    disabled?: boolean;
    maxSizeMb?: number;
    accept?: string;
};

function formatAcceptLabels(accept: string): string {
    const labels = new Set<string>();

    accept.split(',').forEach((part) => {
        const value = part.trim().toLowerCase();

        if (value === 'image/jpeg' || value === '.jpg' || value === '.jpeg') {
            labels.add('JPG');
            return;
        }

        if (value === 'image/png' || value === '.png') {
            labels.add('PNG');
            return;
        }

        if (value === 'image/webp' || value === '.webp') {
            labels.add('WEBP');
            return;
        }

        if (value === 'image/gif' || value === '.gif') {
            labels.add('GIF');
            return;
        }

        if (value.startsWith('.')) {
            labels.add(value.slice(1).toUpperCase());
        }
    });

    return labels.size > 0 ? Array.from(labels).join(', ') : 'Images';
}

function formatMaxSize(maxSizeMb: number): string {
    if (Number.isInteger(maxSizeMb)) {
        return `${maxSizeMb} MB`;
    }

    return `${maxSizeMb} MB`;
}

export default function ImageUpload({
    value = null,
    onChange,
    className,
    disabled = false,
    maxSizeMb = 2,
    accept = DEFAULT_ACCEPT,
}: Props) {
    const [preview, setPreview] = useState<string | null>(value);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hint = useMemo(() => {
        return `${formatAcceptLabels(accept)}. Max ${formatMaxSize(maxSizeMb)}.`;
    }, [accept, maxSizeMb]);

    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFile = (file: File | undefined) => {
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
            setError(`File size must be less than ${formatMaxSize(maxSizeMb)}`);
            return;
        }

        setError('');
        const reader = new FileReader();
        reader.onloadend = () => setPreview(String(reader.result));
        reader.readAsDataURL(file);
        onChange(file);
    };

    const clear = () => {
        setPreview(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange(null);
    };

    return (
        <div className={cn('w-full', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled}
                onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {preview ? (
                <div className="relative inline-block">
                    <div className="group relative h-24 w-24 overflow-hidden rounded-2xl border">
                        <img
                            src={preview}
                            alt="Upload preview"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-full bg-white p-1.5"
                            >
                                <Upload className="size-3.5 text-zinc-700" />
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={clear}
                                className="rounded-full bg-white p-1.5"
                            >
                                <X className="size-3.5 text-zinc-700" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => {
                        event.preventDefault();
                        if (!disabled) {
                            setIsDragging(true);
                        }
                    }}
                    onDragLeave={(event) => {
                        event.preventDefault();
                        setIsDragging(false);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        event.preventDefault();
                        setIsDragging(false);
                        if (!disabled) {
                            handleFile(event.dataTransfer.files?.[0]);
                        }
                    }}
                    className={cn(
                        'flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground transition-colors hover:bg-muted/40',
                        isDragging && 'border-primary bg-muted/60',
                    )}
                >
                    <Upload className="mb-1 size-5" />
                    <span className="text-[10px]">Upload</span>
                </button>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}
