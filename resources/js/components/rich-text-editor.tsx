import Quill from 'quill';
import { useEffect, useRef } from 'react';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import webApi from '@/lib/webApi';
import 'quill/dist/quill.snow.css';

const FONT_SIZES = [
    '10pt',
    '11pt',
    '12pt',
    '14pt',
    '16pt',
    '18pt',
    '20pt',
    '24pt',
    '32pt',
];

const Size = Quill.import('attributors/style/size') as {
    whitelist: string[] | undefined;
};
Size.whitelist = FONT_SIZES;
Quill.register(Size, true);

const Font = Quill.import('formats/font') as {
    whitelist: string[] | undefined;
};
Font.whitelist = [
    'sans-serif',
    'serif',
    'monospace',
    'arial',
    'georgia',
    'times-new-roman',
    'courier-new',
];
Quill.register(Font, true);

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
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);
    const uploadingRef = useRef(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

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
                        [{ size: FONT_SIZES }],
                        [{ font: Font.whitelist }],
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
                        image: () => {
                            if (!quillRef.current || uploadingRef.current) {
                                return;
                            }

                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async () => {
                                const file = input.files?.[0];
                                if (!file || !quillRef.current) {
                                    return;
                                }

                                uploadingRef.current = true;
                                try {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const response = await webApi.post(
                                        route('admin.blogs.media.store'),
                                        formData,
                                    );
                                    const url = response.data?.url as string;
                                    const range =
                                        quillRef.current.getSelection(true);
                                    const index = range?.index ?? 0;
                                    quillRef.current.insertEmbed(
                                        index,
                                        'image',
                                        url,
                                        'user',
                                    );
                                    quillRef.current.setSelection(index + 1);
                                } catch {
                                    // Keep editor usable if upload fails.
                                } finally {
                                    uploadingRef.current = false;
                                }
                            };
                            input.click();
                        },
                    },
                },
            },
        });

        quill.root.style.minHeight = `${minHeight}px`;
        if (value) {
            quill.root.innerHTML = value;
        }

        quill.on('text-change', () => {
            onChangeRef.current(quill.root.innerHTML);
        });

        quillRef.current = quill;

        return () => {
            quillRef.current = null;
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
            quill.root.innerHTML = value || '';
            if (selection) {
                quill.setSelection(selection);
            }
        }
    }, [value]);

    return (
        <div
            className={cn(
                'overflow-hidden rounded-md border bg-background [&_.ql-container]:border-0 [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0',
                className,
            )}
        >
            <div ref={containerRef} />
        </div>
    );
}
