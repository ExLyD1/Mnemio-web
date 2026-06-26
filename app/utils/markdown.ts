import { marked } from 'marked';
import DOMPurify from 'dompurify';

// GitHub-flavoured markdown with single-newline line breaks (chat-friendly).
marked.setOptions({ breaks: true, gfm: true });

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

/**
 * Render assistant chat markdown (e.g. `**bold**`, lists, links) to safe HTML.
 * Sanitised with DOMPurify on the client; on the server (no DOM) we fall back to
 * escaped plain text — chat threads load client-side, so this isn't user-visible.
 */
export const renderMarkdown = (src: string | null | undefined): string => {
    const text = src ?? '';
    if (!import.meta.client) {
        return escapeHtml(text);
    }
    const raw = marked.parse(text, { async: false });
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
};
