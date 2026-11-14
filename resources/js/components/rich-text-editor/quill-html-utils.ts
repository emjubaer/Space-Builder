import Quill from 'quill';
import { normalizeGoogleDocsHtml } from '@/components/rich-text-editor/normalize-google-docs-html';

// Quill's Delta constructor is imported at runtime from the Quill package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Delta = Quill.import('delta') as new (...args: any[]) => any;

/**
 * Load HTML through Quill's clipboard converter so the document model stays in sync.
 */
export function setEditorHtml(quill: Quill, html: string): void {
    const raw = (html ?? '').trim();
    if (!raw || raw === '<p><br></p>') {
        quill.setText('');
        return;
    }

    const normalized = normalizeGoogleDocsHtml(raw) || raw;
    const delta = quill.clipboard.convert({ html: normalized, text: '' });
    quill.setContents(delta, 'silent');
}

/**
 * Paste HTML at the current selection using Quill's clipboard pipeline.
 * Empty <p><br></p> lines are preserved so Docs Enter spacing survives.
 */
export function pasteHtmlViaQuill(
    quill: Quill,
    html: string,
    index: number,
    length = 0,
): boolean {
    const normalized = normalizeGoogleDocsHtml(html) || html;
    if (!normalized.trim()) {
        return false;
    }

    const paste = quill.clipboard.convert({ html: normalized, text: '' });
    if (!paste || paste.length() === 0) {
        return false;
    }

    quill.updateContents(
        new Delta().retain(index).delete(length).concat(paste),
        'user',
    );
    quill.setSelection(index + paste.length(), 0, 'silent');
    return true;
}
