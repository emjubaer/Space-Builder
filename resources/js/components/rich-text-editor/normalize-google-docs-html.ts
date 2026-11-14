// Normalizer for Google Docs / Microsoft Word clipboard HTML.
// Keeps structure (headings, paragraphs, lists, tables), font size, and
// vertical spacing (margin-top/bottom, line-height). Strips only the
// fake-bold wrapper and styles Quill cannot store.

function unwrapNode(node: Node): void {
    const parent = node.parentNode;
    if (!parent) {
        return;
    }
    while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
}

function stripStyleProperty(el: Element | null | undefined, property: string): void {
    if (!(el instanceof HTMLElement) || !el.hasAttribute('style')) {
        return;
    }
    el.style.removeProperty(property);
    if (!el.getAttribute('style')?.trim()) {
        el.removeAttribute('style');
    }
}

function getStyle(el: Element | null | undefined): string {
    return el?.getAttribute?.('style') || '';
}

function isNormalFontWeight(style: string): boolean {
    return /font-weight\s*:\s*(normal|400)\b/i.test(style);
}

function isBoldFontWeight(style: string): boolean {
    return /font-weight\s*:\s*(bold|[5-9]00)\b/i.test(style);
}

const BULLET_CHAR_RE = /^[\s\u2022\u2023\u25E6\u2043\u2219•·◦\u00B7-]+\s*/;
const BLOCK_TAGS = new Set([
    'P',
    'OL',
    'UL',
    'TABLE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'BLOCKQUOTE',
    'PRE',
    'DIV',
]);

function stripLeadingBulletText(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = (node.textContent || '').replace(BULLET_CHAR_RE, '');
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const el = node as Element;
    const text = el.textContent?.trim() || '';
    if (/^[\u2022\u2023\u25E6\u2043\u2219•·◦\u00B7]$/.test(text)) {
        el.remove();
    }
}

function unwrapBlockInListItem(li: Element): void {
    [...li.children].forEach((child) => {
        if (child.tagName === 'P' || child.tagName === 'DIV') {
            const block = child;
            while (block.firstChild) {
                li.insertBefore(block.firstChild, block);
            }
            block.remove();
        }
    });
}

/** Google Docs emits invalid list HTML that breaks Quill's li::before bullets. */
function normalizeDocsLists(root: HTMLElement): void {
    let nestedFixed = true;
    while (nestedFixed) {
        nestedFixed = false;
        root.querySelectorAll('ul, ol').forEach((list) => {
            [...list.children].forEach((child) => {
                if (child.tagName !== 'UL' && child.tagName !== 'OL') {
                    return;
                }

                const prev = child.previousElementSibling;
                if (prev?.tagName === 'LI') {
                    prev.appendChild(child);
                } else {
                    const wrapper = root.ownerDocument.createElement('li');
                    list.insertBefore(wrapper, child);
                    wrapper.appendChild(child);
                }
                nestedFixed = true;
            });
        });
    }

    root.querySelectorAll('ul, ol').forEach((list) => {
        [
            'margin-left',
            'margin-right',
            'padding-left',
            'list-style-type',
            'list-style-position',
        ].forEach((prop) => stripStyleProperty(list, prop));
    });

    root.querySelectorAll('li').forEach((li) => {
        [
            'margin-left',
            'margin-right',
            'padding-left',
            'padding-right',
            'list-style-type',
            'list-style-position',
            'text-indent',
        ].forEach((prop) => stripStyleProperty(li, prop));

        unwrapBlockInListItem(li);

        li.querySelectorAll('span').forEach((span) => {
            const text = span.textContent?.trim() || '';
            if (/^[\u2022\u2023\u25E6\u2043\u2219•·◦\u00B7]$/.test(text)) {
                span.remove();
                return;
            }
            stripStyleProperty(span, 'margin-left');
            stripStyleProperty(span, 'padding-left');
        });

        const firstText = [...li.childNodes].find(
            (n) => n.nodeType === Node.TEXT_NODE,
        );
        if (firstText) {
            stripLeadingBulletText(firstText);
        }
    });

    [...root.children].forEach((child) => {
        if (child.tagName === 'LI') {
            const ul = root.ownerDocument.createElement('ul');
            root.insertBefore(ul, child);
            ul.appendChild(child);
        }
    });
}

function cleanTableStyles(table: Element): void {
    table.removeAttribute('width');
    table.removeAttribute('height');
    stripStyleProperty(table, 'width');
    stripStyleProperty(table, 'height');

    table.querySelectorAll('td, th').forEach((cell) => {
        stripStyleProperty(cell, 'width');
        stripStyleProperty(cell, 'height');

        if (!cell.innerHTML.trim()) {
            cell.innerHTML = '<br>';
        }
    });
}

/**
 * Docs wraps all content in <b style="font-weight:normal">.
 * Quill treats every <b> as bold, so unwrap the fake wrapper and convert
 * real bold spans (font-weight:700) into <strong>.
 */
function normalizeDocsBold(root: HTMLElement): void {
    const doc = root.ownerDocument;

    root.querySelectorAll('b, strong').forEach((el) => {
        const style = getStyle(el);
        if (isNormalFontWeight(style)) {
            unwrapNode(el);
            return;
        }

        const child = el.firstElementChild;
        if (
            el.childNodes.length === 1 &&
            child &&
            BLOCK_TAGS.has(child.tagName)
        ) {
            unwrapNode(el);
        }
    });

    root.querySelectorAll('span').forEach((span) => {
        const style = getStyle(span);
        if (!style.includes('font-weight')) {
            return;
        }

        if (isBoldFontWeight(style)) {
            stripStyleProperty(span, 'font-weight');
            const strong = doc.createElement('strong');
            const parent = span.parentNode;
            if (!parent) {
                return;
            }

            if (!getStyle(span).trim() && !span.id && !span.className) {
                while (span.firstChild) {
                    strong.appendChild(span.firstChild);
                }
                parent.replaceChild(strong, span);
            } else {
                parent.insertBefore(strong, span);
                strong.appendChild(span);
            }
            return;
        }

        if (isNormalFontWeight(style)) {
            stripStyleProperty(span, 'font-weight');
            if (!getStyle(span).trim() && !span.id && !span.className) {
                unwrapNode(span);
            }
        }
    });

    root.querySelectorAll('p, li, td, th, div, h1, h2, h3, h4, h5, h6').forEach(
        (el) => {
            stripStyleProperty(el, 'font-weight');
        },
    );
}

/**
 * Docs sometimes puts bare <br> between block siblings for blank lines.
 * Convert those into empty <p><br></p> so Enter spacing is preserved in Quill.
 */
function normalizeEmptyLines(root: HTMLElement): void {
    const doc = root.ownerDocument;
    [...root.querySelectorAll('br')].forEach((br) => {
        const parent = br.parentNode;
        if (!parent || !(parent instanceof Element)) {
            return;
        }

        const parentIsBlockWrapper =
            parent === root ||
            parent.tagName === 'B' ||
            parent.tagName === 'STRONG' ||
            parent.tagName === 'DIV' ||
            parent.tagName === 'BODY';

        if (!parentIsBlockWrapper) {
            return;
        }

        const prev = br.previousElementSibling;
        const next = br.nextElementSibling;
        const betweenBlocks =
            prev &&
            next &&
            BLOCK_TAGS.has(prev.tagName) &&
            BLOCK_TAGS.has(next.tagName);
        const aloneInParent = [...parent.childNodes].every(
            (n) =>
                n === br ||
                (n.nodeType === Node.TEXT_NODE && !n.textContent?.trim()),
        );

        if (!betweenBlocks && !aloneInParent) {
            return;
        }

        const p = doc.createElement('p');
        p.appendChild(doc.createElement('br'));
        parent.replaceChild(p, br);
    });
}

const SPACING_PROPS = ['marginTop', 'marginBottom', 'lineHeight'] as const;

/** `margin: 0 0 12pt` must become longhands before the shorthand is removed. */
function expandMarginShorthand(el: Element): void {
    if (!(el instanceof HTMLElement) || !el.hasAttribute('style')) {
        return;
    }
    const raw = el.getAttribute('style') || '';
    if (!/(?:^|;)\s*margin\s*:/i.test(raw)) {
        return;
    }

    const top = el.style.marginTop;
    const bottom = el.style.marginBottom;
    el.style.removeProperty('margin');
    if (top) {
        el.style.marginTop = top;
    }
    if (bottom) {
        el.style.marginBottom = bottom;
    }
}

/**
 * Docs usually sets spacing on the block, but sometimes only on an inner span.
 * Quill stores margin and line-height on the block, so copy them up first.
 */
function promoteSpacingToBlock(root: HTMLElement): void {
    root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((block) => {
        if (!(block instanceof HTMLElement)) {
            return;
        }
        const carriers = [...block.querySelectorAll('[style]')].filter(
            (el): el is HTMLElement => el instanceof HTMLElement,
        );
        SPACING_PROPS.forEach((prop) => {
            if (block.style[prop]) {
                return;
            }
            const carrier = carriers.find((el) => el.style[prop]);
            if (carrier) {
                block.style[prop] = carrier.style[prop];
            }
        });
    });
}

function stripHarmlessInlineNoise(el: Element): void {
    if (!(el instanceof HTMLElement) || !el.hasAttribute('style')) {
        return;
    }

    if (/^(normal|400)$/i.test(el.style.fontStyle || '')) {
        stripStyleProperty(el, 'font-style');
    }
    if ((el.style.textDecoration || '') === 'none') {
        stripStyleProperty(el, 'text-decoration');
    }
    if ((el.style.fontVariant || '') === 'normal') {
        stripStyleProperty(el, 'font-variant');
    }
    if ((el.style.verticalAlign || '') === 'baseline') {
        stripStyleProperty(el, 'vertical-align');
    }
    if (el.style.whiteSpace) {
        stripStyleProperty(el, 'white-space');
    }

    const color = (el.style.color || '').replace(/\s/g, '').toLowerCase();
    if (
        color === 'rgb(0,0,0)' ||
        color === '#000' ||
        color === '#000000' ||
        color === 'black'
    ) {
        stripStyleProperty(el, 'color');
    }

    const bg = (el.style.backgroundColor || '').replace(/\s/g, '').toLowerCase();
    if (bg === 'transparent' || bg === 'rgba(0,0,0,0)') {
        stripStyleProperty(el, 'background-color');
    }
}

function stripDocsNoiseStyles(root: HTMLElement): void {
    const noiseProps = [
        'margin',
        'margin-left',
        'margin-right',
        'padding',
        'padding-top',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'font-family',
        'text-indent',
        'letter-spacing',
        'orphans',
        'widows',
        'page-break-after',
        'page-break-before',
        'mso-spacerun',
        'mso-fareast-font-family',
        'mso-bidi-font-family',
        'mso-ansi-language',
        'mso-fareast-language',
        'mso-bidi-language',
    ];

    root.querySelectorAll('[style]').forEach((el) => {
        expandMarginShorthand(el);
        noiseProps.forEach((prop) => stripStyleProperty(el, prop));
        stripHarmlessInlineNoise(el);
    });

    root.querySelectorAll('o\\:p, w\\:sdt, meta, link, style, xml').forEach(
        (el) => el.remove(),
    );
    root.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            if (
                attr.name.startsWith('o:') ||
                attr.name.startsWith('w:') ||
                attr.name.startsWith('mso-')
            ) {
                el.removeAttribute(attr.name);
            }
        });
        if (
            el.className &&
            typeof el.className === 'string' &&
            /Mso/i.test(el.className)
        ) {
            el.removeAttribute('class');
        }
    });
}

/**
 * Keep every blank line the author entered in Docs.
 * Empty / whitespace-only paragraphs become <p><br></p> so Quill keeps them.
 */
function ensureParagraphBreaks(root: HTMLElement): void {
    root.querySelectorAll('p').forEach((block) => {
        const text = (block.textContent || '').replace(/\u00a0/g, ' ').trim();
        const hasMedia = block.querySelector('img, iframe, table, video');
        if (text || hasMedia) {
            return;
        }

        block.innerHTML = '<br>';
    });
}

export function isExternalEditorHtml(html: string): boolean {
    if (!html || typeof html !== 'string') {
        return false;
    }
    return (
        html.includes('docs-internal-guid') ||
        html.includes('id="docs-') ||
        html.includes('google-sheets-html-origin') ||
        html.includes('mso-') ||
        html.includes('MsoNormal') ||
        html.includes('Microsoft Word') ||
        html.includes('urn:schemas-microsoft-com:office') ||
        /<b[^>]*style=["'][^"']*font-weight\s*:\s*normal/i.test(html)
    );
}

export function normalizeGoogleDocsHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return html;
    }

    const isExternal = isExternalEditorHtml(html);
    const hasTable = /<table[\s>]/i.test(html);
    const hasList = /<ul[\s>]/i.test(html) || /<ol[\s>]/i.test(html);
    const hasFakeBold = /<b[^>]*font-weight\s*:\s*normal/i.test(html);
    const hasMultipleBlocks =
        /<(p|div|h[1-6]|li|br)[\s>/]/i.test(html) &&
        (html.match(/<p[\s>]/gi)?.length ?? 0) >= 2;

    // Always normalize multi-block / external paste so paragraph gaps survive.
    if (
        !isExternal &&
        !hasTable &&
        !hasList &&
        !hasFakeBold &&
        !hasMultipleBlocks
    ) {
        return html;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;
        if (!body) {
            return html;
        }

        body.querySelectorAll('[style]').forEach(expandMarginShorthand);
        promoteSpacingToBlock(body);

        body.querySelectorAll('span').forEach((span) => {
            const id = span.id || '';
            const className =
                typeof span.className === 'string' ? span.className : '';
            const style = getStyle(span);

            const keepExplicit =
                /underline|line-through|font-style\s*:\s*italic/i.test(style) ||
                isBoldFontWeight(style) ||
                /font-size\s*:/i.test(style) ||
                /margin-(top|bottom)|line-height/i.test(style) ||
                /highlight|marker/i.test(className);

            const isDocsWrapper =
                id.startsWith('docs-internal-guid-') ||
                className.includes('docs-') ||
                /margin|padding|line-height|font-family|color\s*:\s*#0{3,6}\b/i.test(
                    style,
                );

            // Keep spans that only carry spacing we already promoted, otherwise unwrap noise.
            if (keepExplicit || !isDocsWrapper) {
                return;
            }

            unwrapNode(span);
        });

        body.querySelectorAll('table').forEach(cleanTableStyles);

        if (isExternal || hasList) {
            normalizeDocsLists(body);
        }

        if (isExternal || hasFakeBold) {
            normalizeDocsBold(body);
            stripDocsNoiseStyles(body);
        }

        // Always preserve blank lines / empty paragraphs for multi-block paste.
        if (isExternal || hasFakeBold || hasMultipleBlocks) {
            normalizeEmptyLines(body);
            ensureParagraphBreaks(body);
        }

        return body.innerHTML.trim() || html;
    } catch {
        return html;
    }
}
