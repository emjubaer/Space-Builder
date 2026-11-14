import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ImageUploadOptions = {
    alt: string;
    compress: boolean;
    quality: number;
    max_width: number;
    format: 'webp' | 'jpg' | 'png';
};

type Props = {
    open: boolean;
    fileName?: string | null;
    uploading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (options: ImageUploadOptions) => void;
};

const DEFAULT_OPTIONS: ImageUploadOptions = {
    alt: '',
    compress: true,
    quality: 80,
    max_width: 1600,
    format: 'webp',
};

export default function ImageUploadDialog({
    open,
    fileName,
    uploading = false,
    onOpenChange,
    onConfirm,
}: Props) {
    const [options, setOptions] = useState<ImageUploadOptions>(DEFAULT_OPTIONS);

    useEffect(() => {
        if (open) {
            setOptions({
                ...DEFAULT_OPTIONS,
                alt: fileName
                    ? fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
                    : '',
            });
        }
    }, [open, fileName]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Insert image</DialogTitle>
                    <DialogDescription>
                        Set SEO alt text and optional resize / optimize settings
                        before uploading.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    {fileName ? (
                        <p className="truncate text-xs text-muted-foreground">
                            File: {fileName}
                        </p>
                    ) : null}

                    <div className="grid gap-2">
                        <Label htmlFor="blog-editor-image-alt">Alt text</Label>
                        <Input
                            id="blog-editor-image-alt"
                            value={options.alt}
                            placeholder="Describe the image for SEO & accessibility"
                            onChange={(e) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    alt: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="blog-editor-image-compress"
                            checked={options.compress}
                            onCheckedChange={(checked) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    compress: checked === true,
                                }))
                            }
                        />
                        <Label htmlFor="blog-editor-image-compress">
                            Compress image
                        </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="blog-editor-image-quality">
                                Quality
                            </Label>
                            <Input
                                id="blog-editor-image-quality"
                                type="number"
                                min={40}
                                max={100}
                                value={options.quality}
                                disabled={!options.compress}
                                onChange={(e) =>
                                    setOptions((prev) => ({
                                        ...prev,
                                        quality: Number(e.target.value) || 80,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="blog-editor-image-max-width">
                                Max width (px)
                            </Label>
                            <Input
                                id="blog-editor-image-max-width"
                                type="number"
                                min={320}
                                max={4000}
                                value={options.max_width}
                                onChange={(e) =>
                                    setOptions((prev) => ({
                                        ...prev,
                                        max_width:
                                            Number(e.target.value) || 1600,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="blog-editor-image-format">Format</Label>
                        <select
                            id="blog-editor-image-format"
                            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={options.format}
                            onChange={(e) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    format: e.target.value as
                                        | 'webp'
                                        | 'jpg'
                                        | 'png',
                                }))
                            }
                        >
                            <option value="webp">WebP (recommended)</option>
                            <option value="jpg">JPEG</option>
                            <option value="png">PNG</option>
                        </select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={uploading}
                        onClick={() => onConfirm(options)}
                    >
                        {uploading ? 'Uploading…' : 'Upload & insert'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
