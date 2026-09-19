import { marked } from 'marked';
import DOMPurify from 'dompurify';

// GitHub-flavoured markdown with single-newline line breaks (chat-friendly).
marked.setOptions({ breaks: true, gfm: true });

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

const CARET_HTML = '<span class="chat-caret" aria-hidden="true"></span>';

/**
 * Put the typing caret right after the last visible character. Appending it after
 * the rendered markdown would land it outside the last `<p>`/`<li>` and push it
 * onto its own line, so we insert it next to the last non-blank text node instead.
 */
const injectCaret = (root: DocumentFragment): void => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.textContent?.trim()) {
            last = n as Text;
        }
    }
    const caret = document.createRange().createContextualFragment(CARET_HTML);
    if (last?.parentNode) {
        // Keep trailing whitespace (e.g. the "\n" inside a <pre>) after the caret.
        const end = last.data.trimEnd().length;
        if (end < last.data.length) {
            last.splitText(end);
        }
        last.parentNode.insertBefore(caret, last.nextSibling);
    } else {
        root.appendChild(caret);
    }
};

/**
 * Render assistant chat markdown (e.g. `**bold**`, lists, links) to safe HTML.
 * Sanitised with DOMPurify on the client; on the server (no DOM) we fall back to
 * escaped plain text — chat threads load client-side, so this isn't user-visible.
 * `caret: true` appends an inline typing caret (for a reply still streaming).
 */
export const renderMarkdown = (
    src: string | null | undefined,
    opts: { caret?: boolean } = {},
): string => {
    const text = src ?? '';
    if (!import.meta.client) {
        return escapeHtml(text);
    }
    const raw = marked.parse(text, { async: false });
    if (!opts.caret) {
        return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    }
    const frag = DOMPurify.sanitize(raw, {
        USE_PROFILES: { html: true },
        RETURN_DOM_FRAGMENT: true,
    });
    injectCaret(frag);
    const box = document.createElement('div');
    box.appendChild(frag);
    return box.innerHTML;
};
