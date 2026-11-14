import { useCallback, useEffect, useState } from 'react';
import {
    AlignEndVertical,
    AlignStartVertical,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIZE_OPTIONS = [
    { id: 'full', label: '100%', title: 'Resize full' },
    { id: 'medium', label: '50%', title: 'Resize half' },
    { id: 'small', label: '25%', title: 'Resize quarter' },
] as const;

type SizePreset = (typeof SIZE_OPTIONS)[number]['id'];

type PopButtonProps = {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
};

function PopButton({ title, onClick, children, className }: PopButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClick}
                    className={cn(
                        'h-8 min-w-8 px-2.5 text-xs font-semibold',
                        className,
                    )}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{title}</TooltipContent>
        </Tooltip>
    );
}

function computePopoverPosition(
    imageEl: HTMLImageElement,
    containerEl: HTMLElement,
): { toolbarTop: number; toolbarLeft: number } | null {
    const imgRect = imageEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    return {
        toolbarTop: imgRect.top - containerRect.top - 8,
        toolbarLeft: imgRect.left - containerRect.left + imgRect.width / 2,
    };
}

type Props = {
    imageEl: HTMLImageElement | null;
    containerEl: HTMLElement | null;
    onResize: (preset: SizePreset) => void;
    onFloatLeft: () => void;
    onFloatRight: () => void;
    onReset: () => void;
    onAltChange: (alt: string) => void;
    onRemove: () => void;
};

export default function ImagePopoverToolbar({
    imageEl,
    containerEl,
    onResize,
    onFloatLeft,
    onFloatRight,
    onReset,
    onAltChange,
    onRemove,
}: Props) {
    const [position, setPosition] = useState<{
        toolbarTop: number;
        toolbarLeft: number;
    } | null>(null);
    const [altValue, setAltValue] = useState('');

    const refresh = useCallback(() => {
        if (!imageEl || !containerEl) {
            setPosition(null);
            return;
        }
        setPosition(computePopoverPosition(imageEl, containerEl));
    }, [imageEl, containerEl]);

    useEffect(() => {
        setAltValue(imageEl?.getAttribute('alt') || '');
    }, [imageEl]);

    useEffect(() => {
        if (!imageEl || !containerEl) {
            setPosition(null);
            return undefined;
        }

        refresh();

        const editor = containerEl.querySelector('.ql-editor');
        const onScroll = () => refresh();
        const onWindowResize = () => refresh();

        window.addEventListener('resize', onWindowResize);
        editor?.addEventListener('scroll', onScroll);

        const observer = new ResizeObserver(() => refresh());
        observer.observe(imageEl);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            editor?.removeEventListener('scroll', onScroll);
            observer.disconnect();
        };
    }, [imageEl, containerEl, refresh]);

    const commitAlt = useCallback(() => {
        onAltChange(altValue);
    }, [altValue, onAltChange]);

    if (!imageEl || !position) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div
                className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full"
                data-image-popover=""
                style={{
                    top: position.toolbarTop,
                    left: position.toolbarLeft,
                }}
                onMouseDown={(e) => {
                    if (
                        e.target instanceof Element &&
                        e.target.closest('input, textarea')
                    ) {
                        return;
                    }
                    e.preventDefault();
                }}
            >
                <div className="flex min-w-[280px] max-w-[min(360px,90vw)] flex-col gap-1.5 rounded-md border bg-background px-2 py-1.5 shadow-lg">
                    <div className="flex items-center gap-0.5">
                        {SIZE_OPTIONS.map(({ id, label, title }) => (
                            <PopButton
                                key={id}
                                title={title}
                                onClick={() => onResize(id)}
                            >
                                {label}
                            </PopButton>
                        ))}

                        <div className="mx-0.5 h-5 w-px bg-border" />

                        <PopButton title="Reset size & style" onClick={onReset}>
                            <RotateCcw size={15} />
                        </PopButton>

                        <div className="mx-0.5 h-5 w-px bg-border" />

                        <PopButton
                            title="Float left — text flows on the right"
                            onClick={onFloatLeft}
                        >
                            <AlignStartVertical size={15} />
                        </PopButton>
                        <PopButton
                            title="Float right — text flows on the left"
                            onClick={onFloatRight}
                        >
                            <AlignEndVertical size={15} />
                        </PopButton>

                        <div className="mx-0.5 h-5 w-px bg-border" />

                        <PopButton
                            title="Remove image"
                            onClick={onRemove}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 size={15} />
                        </PopButton>
                    </div>

                    <Input
                        type="text"
                        value={altValue}
                        placeholder="Alt text (accessibility & SEO)"
                        aria-label="Image alt text"
                        className="h-8 text-xs"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setAltValue(e.target.value)}
                        onBlur={commitAlt}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                commitAlt();
                                e.currentTarget.blur();
                            }
                        }}
                    />
                </div>
            </div>
        </TooltipProvider>
    );
}
