import { Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    value?: string | null;
    onChange: (file: File | null) => void;
    className?: string;
    disabled?: boolean;
    maxSizeMb?: number;
};

export default function ImageUpload({
    value = null,
    onChange,
    className,
    disabled = false,
    maxSizeMb = 2,
}: Props) {
    const [preview, setPreview] = useState<string | null>(value);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setError(`File size must be less than ${maxSizeMb}MB`);
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
                accept="image/*"
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
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}
