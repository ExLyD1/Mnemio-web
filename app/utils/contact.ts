/**
 * The single public contact address. Payment providers test it during review
 * and customers use it for refunds, so it must resolve to a real mailbox on the
 * site's own domain — the legal pages previously advertised two addresses on
 * mnemio.app, which is not this site.
 */
export const SUPPORT_EMAIL = 'hello@mnemio.xyz';
