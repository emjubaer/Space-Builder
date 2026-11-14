import Quill from 'quill';
import { Scope, StyleAttributor } from 'parchment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ImagePopoverToolbar from '@/components/rich-text-editor/image-popover-toolbar';
import ImageUploadDialog, {
    type ImageUploadOptions,
} from '@/components/rich-text-editor/image-upload-dialog';
import {
    pasteHtmlViaQuill,
    setEditorHtml,
} from '@/components/rich-text-editor/quill-html-utils';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import webApi from '@/lib/webApi';
import 'quill/dist/quill.snow.css';
import '../../css/rich-text-editor.css';

const GOOGLE_FONTS_HREF =
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap';

const FONT_LABELS: Record<string, string> = {
    arial: 'Arial',
    helvetica: 'Helvetica',
    georgia: 'Georgia',
    'times-new-roman': 'Times New Roman',
    'courier-new': 'Courier New',
    verdana: 'Verdana',
    tahoma: 'Tahoma',
    'trebuchet-ms': 'Trebuchet MS',
    palatino: 'Palatino',
    garamond: 'Garamond',
    roboto: 'Roboto',
    'open-sans': 'Open Sans',
    lato: 'Lato',
    montserrat: 'Montserrat',
    poppins: 'Poppins',
};

function ensureGoogleFontsLoaded(): void {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.querySelector(`link[href="${GOOGLE_FONTS_HREF}"]`)) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_HREF;
    document.head.appendChild(link);
}

function decoratePickerLabels(quill: Quill): void {
    const toolbar = quill.getModule('toolbar') as {
        container?: HTMLElement;
    } | null;
    const root = toolbar?.container;
    if (!root) {
        return;
    }

    root.querySelectorAll('.ql-size .ql-picker-item, .ql-size .ql-picker-label').forEach(
        (el) => {
            const value = el.getAttribute('data-value');
            if (!value) {
                el.setAttribute('data-label', 'Normal');
                return;
            }
            el.setAttribute('data-label', value.replace(/pt$/i, ''));
        },
    );

    root.querySelectorAll('.ql-font .ql-picker-item, .ql-font .ql-picker-label').forEach(
        (el) => {
            const value = el.getAttribute('data-value');
            if (!value) {
                el.setAttribute('data-label', 'Sans Serif');
                return;
            }
            const label = FONT_LABELS[value] ?? value.replace(/-/g, ' ');
            el.setAttribute('data-label', label);
            (el as HTMLElement).style.fontFamily = `"${label}", sans-serif`;
        },
    );
}

function syncActivePickerLabels(quill: Quill): void {
    const toolbar = quill.getModule('toolbar') as {
        container?: HTMLElement;
    } | null;
    const root = toolbar?.container;
    if (!root) {
        return;
    }

    root.querySelectorAll('.ql-size .ql-picker-label').forEach((el) => {
        const value = el.getAttribute('data-value');
        el.setAttribute(
            'data-label',
            value ? value.replace(/pt$/i, '') : 'Normal',
        );
    });

    root.querySelectorAll('.ql-font .ql-picker-label').forEach((el) => {
        const value = el.getAttribute('data-value');
        if (!value) {
            el.setAttribute('data-label', 'Sans Serif');
            return;
        }
        el.setAttribute(
            'data-label',
            FONT_LABELS[value] ?? value.replace(/-/g, ' '),
        );
    });
}

export const FONT_SIZE_PRESETS_PT = [
    '10',
    '11',
    '12',
    '14',
    '16',
    '18',
    '20',
    '24',
    '32',
] as const;

const presetSizeValues = FONT_SIZE_PRESETS_PT.map((n) => `${n}pt`);

export const FONT_FAMILIES = [
    'arial',
    'helvetica',
    'georgia',
    'times-new-roman',
    'courier-new',
    'verdana',
    'tahoma',
    'trebuchet-ms',
    'palatino',
    'garamond',
    'roboto',
    'open-sans',
    'lato',
    'montserrat',
    'poppins',
] as const;

const CSS_LENGTH_RE = /^(?:0|[0-9]*\.?[0-9]+)(?:px|pt|em|rem|%)$/i;

function isCssLength(value: unknown): boolean {
    return typeof value === 'string' && CSS_LENGTH_RE.test(value.trim());
}

function isSafeLineHeight(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }
    const v = value.trim().toLowerCase();
    if (v === 'normal') {
        return true;
    }
    if (/^(?:0|[0-9]*\.?[0-9]+)(?:px|pt|em|rem|%)$/i.test(v)) {
        return parseFloat(v) > 0;
    }
    if (/^[0-9]*\.?[0-9]+$/.test(v)) {
        const n = parseFloat(v);
        return n >= 0.5 && n <= 5;
    }
    return false;
}

class LengthStyleAttributor extends StyleAttributor {
    canAdd(_node: HTMLElement, value: string): boolean {
        return isCssLength(value);
    }
}

class LineHeightAttributor extends StyleAttributor {
    canAdd(_node: HTMLElement, value: string): boolean {
        return isSafeLineHeight(value);
    }
}

// Docs sizes (11pt, 13pt, 26pt, …) must survive paste, not only the toolbar presets.
// Quill's runtime registry types are loose; cast imports for registration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Size: any = Quill.import('attributors/style/size');
Size.whitelist = undefined;
Size.canAdd = (_node: HTMLElement, value: string) => isCssLength(value);
Quill.register(Size, true);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Font: any = Quill.import('formats/font');
Font.whitelist = [...FONT_FAMILIES];
Quill.register(Font, true);

const blockScope = { scope: Scope.BLOCK };
Quill.register(
    new LengthStyleAttributor('marginTop', 'margin-top', blockScope),
    true,
);
Quill.register(
    new LengthStyleAttributor('marginBottom', 'margin-bottom', blockScope),
    true,
);
Quill.register(
    new LineHeightAttributor('lineHeight', 'line-height', blockScope),
    true,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Delta: any = Quill.import('delta');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseImage: any = Quill.import('formats/image');

class ResizableImage extends BaseImage {
    static create(value: string | { src: string; alt?: string }): HTMLElement {
        const src =
            typeof value === 'object' && value !== null ? value.src : value;
        const node = super.create(src) as HTMLElement;
        node.setAttribute('class', 'ql-editor-image');

        const alt =
            typeof value === 'object' && value !== null ? value.alt : undefined;
        if (alt) {
            node.setAttribute('alt', alt);
        }

        return node;
    }

    static formats(domNode: HTMLElement): Record<string, string | undefined> {
        return {
            src: domNode.getAttribute('src') || undefined,
            alt: domNode.getAttribute('alt') || undefined,
            width: domNode.getAttribute('width') || undefined,
            style: domNode.getAttribute('style') || undefined,
            class: domNode.getAttribute('class') || undefined,
        };
    }

    format(name: string, value: string | null): void {
        if (name === 'alt') {
            if (value) {
                this.domNode.setAttribute('alt', value);
            } else {
                this.domNode.removeAttribute('alt');
            }
        } else if (name === 'width') {
            if (value) {
                this.domNode.setAttribute('width', value);
            } else {
                this.domNode.removeAttribute('width');
            }
        } else if (name === 'style') {
            if (value) {
                this.domNode.setAttribute('style', value);
            } else {
                this.domNode.removeAttribute('style');
            }
        } else if (name === 'class') {
            if (value) {
                this.domNode.setAttribute('class', value);
            } else {
                this.domNode.removeAttribute('class');
            }
        } else {
            super.format(name, value);
        }
    }
}

Quill.register(ResizableImage as never, true);

const IMAGE_WIDTH_PRESETS: Record<string, string> = {
    small: 'float: left; width: 25%; max-width: 25%; height: auto; margin: 0 1.25rem 0.75rem 0; clear: none; display: block;',
    medium: 'float: left; width: 50%; max-width: 50%; height: auto; margin: 0 1.25rem 0.75rem 0; clear: none; display: block;',
    full: 'width: 100%; height: auto; display: block; clear: both; float: none; margin: 0 0 0.75rem 0;',
};

const IMAGE_WRAP_PRESETS = {
    wrapLeft:
        'float: left; width: 50%; max-width: 50%; height: auto; margin: 0 1.25rem 0.75rem 0; clear: none; display: block;',
    wrapRight:
        'float: right; width: 50%; max-width: 50%; height: auto; margin: 0 0 0.75rem 1.25rem; clear: none; display: block;',
};

function setupClipboardMatchers(quill: Quill): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripFakeBold = (node: any, delta: any) => {
        const style =
            node instanceof HTMLElement ? node.getAttribute('style') || '' : '';
        if (!/font-weight\s*:\s*(normal|400)\b/i.test(style)) {
            return delta;
        }
        return delta.compose(
            new Delta().retain(delta.length(), { bold: null }),
        );
    };
    quill.clipboard.addMatcher('B', stripFakeBold);
    quill.clipboard.addMatcher('STRONG', stripFakeBold);
}

function findImageAtSelection(
    quill: Quill,
    selectedImage: HTMLImageElement | null,
): HTMLImageElement | null {
    const range = quill.getSelection(true);
    if (range) {
        const [blot] = quill.getLeaf(range.index);
        const node = blot?.domNode as HTMLElement | undefined;
        if (node?.tagName === 'IMG') {
            return node as HTMLImageElement;
        }
        if (range.index > 0) {
            const [prevBlot] = quill.getLeaf(range.index - 1);
            const prevNode = prevBlot?.domNode as HTMLElement | undefined;
            if (prevNode?.tagName === 'IMG') {
                return prevNode as HTMLImageElement;
            }
        }
    }
    return selectedImage;
}

function unwrapImageFromParagraph(img: HTMLImageElement): void {
    const parent = img.parentElement;
    if (!parent || parent.tagName !== 'P') {
        return;
    }

    const editor = parent.closest('.ql-editor');
    if (!editor) {
        return;
    }

    const meaningfulChildren = [...parent.childNodes].filter((node) => {
        if (node === img) {
            return true;
        }
        if (node.nodeName === 'BR') {
            return false;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            return (node.textContent || '').trim().length > 0;
        }
        return true;
    });

    if (meaningfulChildren.length !== 1 || meaningfulChildren[0] !== img) {
        return;
    }

    editor.insertBefore(img, parent);

    if (!parent.textContent?.trim() && !parent.querySelector('br')) {
        parent.innerHTML = '<br>';
    }
}

function focusTextBesideImage(quill: Quill, img: HTMLImageElement): void {
    const nextBlock = img.nextElementSibling;
    if (nextBlock?.tagName === 'P') {
        const blockBlot = Quill.find(nextBlock);
        if (blockBlot) {
            const index = quill.getIndex(blockBlot as never);
            quill.setSelection(index, 0, 'user');
            quill.focus();
            return;
        }
    }

    const blot = Quill.find(img);
    if (!blot) {
        return;
    }

    const index = quill.getIndex(blot as never) + 1;
    quill.setSelection(index, 0, 'user');
    quill.focus();
}

type Props = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    minHeight?: number;
};

export default function RichTextEditor({
    value,
    onChange,
    className,
    minHeight = 360,
}: Props) {
    const shellRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);
    const uploadingRef = useRef(false);
    const selectedImageRef = useRef<HTMLImageElement | null>(null);
    const pendingFileRef = useRef<File | null>(null);
    const savedRangeRef = useRef<{ index: number; length: number } | null>(
        null,
    );

    const [selectedImage, setSelectedImage] =
        useState<HTMLImageElement | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [pendingFileName, setPendingFileName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const setSelectedImageSafe = useCallback(
        (img: HTMLImageElement | null) => {
            selectedImageRef.current = img;
            setSelectedImage(img);
        },
        [],
    );

    const applyImageStyle = useCallback(
        (style: string, unwrap = false) => {
            const quill = quillRef.current;
            if (!quill) {
                return;
            }
            const img = findImageAtSelection(quill, selectedImageRef.current);
            if (!img || !style) {
                return;
            }

            img.removeAttribute('width');
            img.setAttribute('style', style);
            img.classList.add('ql-editor-image');

            if (unwrap) {
                unwrapImageFromParagraph(img);
                focusTextBesideImage(quill, img);
            }

            quill.update('user');
            onChangeRef.current(quill.root.innerHTML);
        },
        [],
    );

    const handleApplyWidth = useCallback(
        (preset: 'full' | 'medium' | 'small') => {
            if (preset === 'full') {
                applyImageStyle(IMAGE_WIDTH_PRESETS.full);
                return;
            }
            applyImageStyle(IMAGE_WIDTH_PRESETS[preset], true);
        },
        [applyImageStyle],
    );

    const handleFloatLeft = useCallback(() => {
        applyImageStyle(IMAGE_WRAP_PRESETS.wrapLeft, true);
    }, [applyImageStyle]);

    const handleFloatRight = useCallback(() => {
        applyImageStyle(IMAGE_WRAP_PRESETS.wrapRight, true);
    }, [applyImageStyle]);

    const handleResetImage = useCallback(() => {
        const quill = quillRef.current;
        const img = selectedImageRef.current;
        if (!quill || !img) {
            return;
        }

        img.removeAttribute('style');
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.classList.add('ql-editor-image');
        quill.update('user');
        onChangeRef.current(quill.root.innerHTML);
    }, []);

    const handleAltChange = useCallback((alt: string) => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }
        const img = findImageAtSelection(quill, selectedImageRef.current);
        if (!img) {
            return;
        }

        const trimmed = alt.trim();
        if (trimmed) {
            img.setAttribute('alt', trimmed);
        } else {
            img.removeAttribute('alt');
        }
        quill.update('user');
        onChangeRef.current(quill.root.innerHTML);
    }, []);

    const handleRemoveImage = useCallback(() => {
        const quill = quillRef.current;
        const img = selectedImageRef.current;
        if (!quill || !img) {
            return;
        }

        const blot = Quill.find(img);
        if (!blot) {
            return;
        }

        const index = quill.getIndex(blot as never);
        setSelectedImageSafe(null);
        quill.deleteText(index, 1, 'user');
        quill.setSelection(index, 0, 'user');
    }, [setSelectedImageSafe]);

    const openFilePicker = useCallback(() => {
        const quill = quillRef.current;
        if (!quill || uploadingRef.current) {
            return;
        }

        savedRangeRef.current = quill.getSelection(true);

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }
            pendingFileRef.current = file;
            setPendingFileName(file.name);
            setUploadDialogOpen(true);
        };
        input.click();
    }, []);

    const insertUploadedImage = useCallback(
        (url: string, alt: string) => {
            const quill = quillRef.current;
            if (!quill) {
                return;
            }

            const range =
                savedRangeRef.current ??
                quill.getSelection(true) ?? {
                    index: Math.max(0, quill.getLength() - 1),
                    length: 0,
                };
            const index = range.index;

            quill.insertEmbed(index, 'image', url, 'user');

            const [blot] = quill.getLeaf(index);
            const img = blot?.domNode as HTMLImageElement | undefined;
            if (img?.tagName === 'IMG') {
                if (alt.trim()) {
                    img.setAttribute('alt', alt.trim());
                }
                img.classList.add('ql-editor-image');
                setSelectedImageSafe(img);
                img.classList.add('is-selected');
            }

            quill.setSelection(index + 1);
            savedRangeRef.current = null;
        },
        [setSelectedImageSafe],
    );

    const uploadImageFile = useCallback(
        async (file: File, options: ImageUploadOptions) => {
            if (uploadingRef.current) {
                return;
            }

            uploadingRef.current = true;
            setUploading(true);

            try {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('alt', options.alt);
                formData.append('compress', options.compress ? '1' : '0');
                formData.append('quality', String(options.quality));
                formData.append('max_width', String(options.max_width));
                formData.append('format', options.format);

                const response = await webApi.post(
                    route('admin.blogs.media.store'),
                    formData,
                );
                const url = response.data?.url as string;
                const alt = (response.data?.alt as string) || options.alt;

                if (!url) {
                    throw new Error('Upload did not return a URL.');
                }

                insertUploadedImage(url, alt);
                setUploadDialogOpen(false);
                pendingFileRef.current = null;
                setPendingFileName(null);
            } catch {
                toast.error('Image upload failed. Please try again.');
            } finally {
                uploadingRef.current = false;
                setUploading(false);
            }
        },
        [insertUploadedImage],
    );

    const handleUploadConfirm = useCallback(
        (options: ImageUploadOptions) => {
            const file = pendingFileRef.current;
            if (!file) {
                setUploadDialogOpen(false);
                return;
            }
            void uploadImageFile(file, options);
        },
        [uploadImageFile],
    );

    useEffect(() => {
        if (!containerRef.current || quillRef.current) {
            return;
        }

        const editorHost = document.createElement('div');
        containerRef.current.appendChild(editorHost);

        const quill = new Quill(editorHost, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ header: [1, 2, 3, false] }],
                        [{ size: [...presetSizeValues, false] }],
                        [{ font: [...FONT_FAMILIES] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ script: 'sub' }, { script: 'super' }],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['blockquote', 'code-block'],
                        ['link', 'image'],
                        ['clean'],
                    ],
                    handlers: {
                        image: () => openFilePicker(),
                    },
                },
                uploader: {
                    handler: (
                        range: { index: number; length: number },
                        files: File[],
                    ) => {
                        const file = files?.[0];
                        if (!file || !file.type.startsWith('image/')) {
                            return;
                        }
                        savedRangeRef.current = range;
                        pendingFileRef.current = file;
                        setPendingFileName(file.name);
                        setUploadDialogOpen(true);
                    },
                },
            },
            formats: [
                'header',
                'size',
                'font',
                'bold',
                'italic',
                'underline',
                'strike',
                'script',
                'color',
                'background',
                'align',
                'list',
                'indent',
                'blockquote',
                'code-block',
                'link',
                'image',
                'marginTop',
                'marginBottom',
                'lineHeight',
            ],
        });

        quill.root.style.minHeight = `${minHeight}px`;
        setupClipboardMatchers(quill);
        ensureGoogleFontsLoaded();
        setEditorHtml(quill, value);
        decoratePickerLabels(quill);

        quill.on('text-change', () => {
            onChangeRef.current(quill.root.innerHTML);
        });

        quill.on('selection-change', () => {
            syncActivePickerLabels(quill);
        });

        const onPaste = (event: ClipboardEvent) => {
            const html = event.clipboardData?.getData('text/html');
            if (!html) {
                return;
            }

            const range = quill.getSelection(true) ?? {
                index: Math.max(0, quill.getLength() - 1),
                length: 0,
            };

            event.preventDefault();
            event.stopImmediatePropagation();

            const pasted = pasteHtmlViaQuill(
                quill,
                html,
                range.index,
                range.length,
            );
            if (pasted) {
                return;
            }

            const text = event.clipboardData?.getData('text/plain');
            if (!text) {
                return;
            }

            if (range.length > 0) {
                quill.deleteText(range.index, range.length, 'user');
            }
            quill.insertText(range.index, text, 'user');
            quill.setSelection(range.index + text.length, 0, 'silent');
        };

        quill.root.addEventListener('paste', onPaste, true);

        const root = quill.root;

        const clearImageSelection = () => {
            root.querySelectorAll('img.is-selected').forEach((node) => {
                node.classList.remove('is-selected');
            });
        };

        const onEmbedClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const img = target?.closest?.('img') as HTMLImageElement | null;

            if (img && root.contains(img)) {
                event.preventDefault();
                clearImageSelection();
                img.classList.add('is-selected');
                setSelectedImageSafe(img);
                return;
            }

            if (target?.closest?.('[data-image-popover]')) {
                return;
            }

            clearImageSelection();
            setSelectedImageSafe(null);
        };

        root.addEventListener('click', onEmbedClick);

        // Re-bind image handler after init (handlers in config can lose `this`).
        const toolbar = quill.getModule('toolbar') as {
            addHandler?: (name: string, handler: () => void) => void;
        } | null;
        toolbar?.addHandler?.('image', () => openFilePicker());

        quillRef.current = quill;

        return () => {
            quill.root.removeEventListener('paste', onPaste, true);
            quill.root.removeEventListener('click', onEmbedClick);
            quillRef.current = null;
            setSelectedImageSafe(null);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }

        if (value !== quill.root.innerHTML) {
            const selection = quill.getSelection();
            setEditorHtml(quill, value || '');
            if (selection) {
                quill.setSelection(selection);
            }
        }
    }, [value]);

    return (
        <div
            ref={shellRef}
            className={cn(
                'rich-text-editor relative overflow-visible rounded-md border bg-background',
                '[&_.ql-container]:border-0 [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0',
                '[&_.ql-editor_img.ql-editor-image]:max-w-full [&_.ql-editor_img.ql-editor-image]:h-auto',
                '[&_.ql-editor_img.ql-editor-image.is-selected]:outline [&_.ql-editor_img.ql-editor-image.is-selected]:outline-2 [&_.ql-editor_img.ql-editor-image.is-selected]:outline-primary [&_.ql-editor_img.ql-editor-image.is-selected]:outline-offset-2',
                className,
            )}
            style={
                {
                    '--rich-text-editor-min-h': `${minHeight}px`,
                } as React.CSSProperties
            }
        >
            <div ref={containerRef} />

            <ImagePopoverToolbar
                imageEl={selectedImage}
                containerEl={shellRef.current}
                onResize={handleApplyWidth}
                onFloatLeft={handleFloatLeft}
                onFloatRight={handleFloatRight}
                onReset={handleResetImage}
                onAltChange={handleAltChange}
                onRemove={handleRemoveImage}
            />

            <ImageUploadDialog
                open={uploadDialogOpen}
                fileName={pendingFileName}
                uploading={uploading}
                onOpenChange={(open) => {
                    if (!open && uploading) {
                        return;
                    }
                    setUploadDialogOpen(open);
                    if (!open) {
                        pendingFileRef.current = null;
                        setPendingFileName(null);
                    }
                }}
                onConfirm={handleUploadConfirm}
            />
        </div>
    );
}
