/**
 * Stable DOM selectors for the @signkit/core demo app.
 *
 * Keep selectors as specific as needed but avoid binding to text labels that
 * may change.  Where possible use structural / class selectors instead.
 */

// ── App shell ────────────────────────────────────────────────────────────────
export const APP_ROOT = '.demo-root';
export const DEMO_SIDEBAR = '.demo-sidebar';
export const DEMO_INSPECT = '.demo-inspect';

/** Right-panel event log pre element. */
export const LOG_PRE = '.demo-inspect .log pre';
/** Right-panel manifest pre element. */
export const MANIFEST_PRE = '.demo-inspect .manifest pre';

// ── Navigation ───────────────────────────────────────────────────────────────
export const NAV_BUILDER = 'nav a[href="/builder"]';
export const NAV_SIGNER = 'nav a[href="/signer"]';
export const NAV_INTEGRITY = 'nav a[href="/integrity"]';
export const NAV_WEBCOMPONENT = 'nav a[href="/webcomponent"]';

// ── Form Builder ─────────────────────────────────────────────────────────────
export const BUILDER_ROOT = '.pdf-builder';
export const BUILDER_TOOLBAR = '.pdf-builder__toolbar';
/**
 * The template JSON textarea lives inside a .cardify block on the builder
 * page.  There may be multiple textareas; the builder one is the last.
 */
export const BUILDER_TEMPLATE_TEXTAREA = 'textarea';

// ── Signer ───────────────────────────────────────────────────────────────────
export const SIGNER_ROOT = '.signer-root';
export const SIGNER_PAGES = '.signer-root .pages';
export const SIGNER_FIELD_OVERLAY = '.field-overlay';
export const SIGNER_FINALIZE_BTN = 'button:has-text("Finalize")';
export const SIGNER_ERRORS = '.signer-root .errors';
export const PAGE_CANVAS = '.page-canvas';

/**
 * Signer controls are teleported into #left-panel-option.
 * The mode <select> is the only select element in those controls.
 */
export const SIGNER_CONTROLS = '.controls';
export const SIGNER_MODE_SELECT = '.controls select';
export const SIGNER_NAME_INPUT = '.controls label:has-text("Signer name") input';
export const SIGNER_EMAIL_INPUT = '.controls label:has-text("Signer email") input';

// ── Signature modal ───────────────────────────────────────────────────────────
export const SIG_MODAL_BACKDROP = '.modal-backdrop';
export const SIG_TYPE_TAB = '.choice-tabs button:has-text("Type")';
export const SIG_DRAW_TAB = '.choice-tabs button:has-text("Draw")';
export const SIG_TYPE_INPUT = 'input[placeholder="Type your name"]';
export const SIG_MODAL_SAVE = '.modal-actions button.primary';

// ── Integrity page ────────────────────────────────────────────────────────────
export const INTEGRITY_COMPUTE_BTN = 'button:has-text("Compute Hashes")';
export const INTEGRITY_LOAD_SAMPLE_BTN = 'button:has-text("Load Sample Template")';
export const INTEGRITY_HASH_VALUE = '.hash-value';
/** Selects the code element in the PDF Hash row. */
export const INTEGRITY_PDF_HASH = '.hash-row:has(.hash-label:has-text("PDF Hash:")) .hash-value';
/** Selects the code element in the Template Hash row. */
export const INTEGRITY_TPL_HASH =
  '.hash-row:has(.hash-label:has-text("Template Hash:")) .hash-value';
export const INTEGRITY_EXPECTED_PDF_INPUT = 'input[placeholder*="PDF hash"]';
export const INTEGRITY_EXPECTED_TPL_INPUT = 'input[placeholder*="template hash"]';
export const INTEGRITY_COMPARE_BTN = 'button:has-text("Compare All Hashes")';
export const INTEGRITY_VERIFY_STATUS = '.verify-status';
export const INTEGRITY_COMPARE_PRE = '.results pre';

// ── Web components ────────────────────────────────────────────────────────────
export const WC_BUILDER_EL = 'pdf-form-builder';
export const WC_SIGNER_EL = 'pdf-form-signer';
/** Manifest <pre> rendered by the WebComponentPage itself (not the sidebar). */
export const WC_MANIFEST_PRE = '.page pre';
export const WC_NO_MANIFEST_MSG = '.page .muted';
