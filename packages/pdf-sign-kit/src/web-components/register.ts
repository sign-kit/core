import { defineCustomElement } from 'vue';
import FormBuilder from '../components/FormBuilder/FormBuilder.vue';
import Signer from '../components/Signer/Signer.vue';
import { attachJsonProps } from './ce-helpers';
import tokenStylesInline from '../styles/tokens.css?inline';
import baseStylesInline from '../styles/base.css?inline';
import buttonStylesInline from '../styles/buttons.css?inline';
import formStylesInline from '../styles/forms.css?inline';
import panelStylesInline from '../styles/panels.css?inline';
import overlayStylesInline from '../styles/overlays.css?inline';

const WC_TAGS = ['pdf-form-builder', 'pdf-form-signer'] as const;

const supportsConstructableStylesheets =
  typeof CSSStyleSheet !== 'undefined' &&
  typeof ShadowRoot !== 'undefined' &&
  'replaceSync' in CSSStyleSheet.prototype &&
  'adoptedStyleSheets' in ShadowRoot.prototype;

// Keep defaults in shadow-dom by translating token roots to :host.
const defaultTokenCssText = tokenStylesInline.replace(/:root\b/g, ':host');
const sharedStylesCssText = [
  baseStylesInline,
  buttonStylesInline,
  formStylesInline,
  panelStylesInline,
  overlayStylesInline,
]
  .join('\n')
  .replace(/:root\b/g, ':host');
const tokenNames = Array.from(
  new Set(defaultTokenCssText.match(/--sk-[a-z0-9-]+(?=\s*:)/gi) ?? []),
);

let runtimeThemeCssText = '';

function createStyleSheet(cssText: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  return sheet;
}

const sharedStylesSheet = supportsConstructableStylesheets
  ? createStyleSheet(sharedStylesCssText)
  : null;
const defaultTokenSheet = supportsConstructableStylesheets
  ? createStyleSheet(defaultTokenCssText)
  : null;
const runtimeThemeSheet = supportsConstructableStylesheets
  ? createStyleSheet(runtimeThemeCssText)
  : null;

function applyFallbackStyleTag(root: ShadowRoot, id: string, cssText: string) {
  const selector = `style[data-sk-wc-style="${id}"]`;
  const existing = root.querySelector(selector) as HTMLStyleElement | null;
  if (existing) {
    if (existing.textContent !== cssText) existing.textContent = cssText;
    return;
  }
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-sk-wc-style', id);
  styleEl.textContent = cssText;
  root.prepend(styleEl);
}

function ensureStylesOnShadowRoot(root: ShadowRoot) {
  if (
    supportsConstructableStylesheets &&
    sharedStylesSheet &&
    defaultTokenSheet &&
    runtimeThemeSheet
  ) {
    const adopted = root.adoptedStyleSheets;
    const ordered = [sharedStylesSheet, defaultTokenSheet, runtimeThemeSheet];
    const next = adopted.filter((sheet) => !ordered.includes(sheet)).concat(ordered);
    root.adoptedStyleSheets = next;
    return;
  }

  applyFallbackStyleTag(root, 'shared', sharedStylesCssText);
  applyFallbackStyleTag(root, 'tokens-default', defaultTokenCssText);
  applyFallbackStyleTag(root, 'tokens-runtime', runtimeThemeCssText);
}

function refreshMountedElementStyles() {
  if (typeof document === 'undefined') return;
  const nodes = document.querySelectorAll<HTMLElement>(WC_TAGS.join(','));
  for (const node of nodes) {
    if (node.shadowRoot) ensureStylesOnShadowRoot(node.shadowRoot);
  }
}

function normalizeThemeCss(theme: string | Record<string, string>) {
  if (typeof theme === 'string') return theme;
  const body = Object.entries(theme)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `:host {\n${body}\n}`;
}

function mountStyles(el: HTMLElement) {
  const apply = () => {
    const root = el.shadowRoot;
    if (!root) return false;
    ensureStylesOnShadowRoot(root);
    return true;
  };

  if (apply()) return;

  // Some CE runtimes attach shadow root after connectedCallback microtasks.
  queueMicrotask(() => {
    if (apply()) return;
    requestAnimationFrame(() => {
      if (apply()) return;
      setTimeout(() => {
        apply();
      }, 0);
    });
  });
}

const BuilderCE = defineCustomElement(FormBuilder as any);
class PdfFormBuilderElement extends BuilderCE {
  connectedCallback() {
    super.connectedCallback?.();
    mountStyles(this);
    attachJsonProps(this, [
      { attr: 'data-template', prop: 'template' },
      { attr: 'data-pdf', prop: 'pdf' },
    ]);
  }
}

if (!customElements.get('pdf-form-builder')) {
  customElements.define('pdf-form-builder', PdfFormBuilderElement);
}

const SignerCE = defineCustomElement(Signer as any);
class PdfFormSignerElement extends SignerCE {
  connectedCallback() {
    super.connectedCallback?.();
    mountStyles(this);
    attachJsonProps(this, [
      { attr: 'data-template', prop: 'template' },
      { attr: 'data-values', prop: 'values' },
    ]);
  }
}

if (!customElements.get('pdf-form-signer')) {
  customElements.define('pdf-form-signer', PdfFormSignerElement);
}

export function registerPdfSignKitElements() {
  if (!customElements.get('pdf-form-builder'))
    customElements.define('pdf-form-builder', PdfFormBuilderElement);
  if (!customElements.get('pdf-form-signer'))
    customElements.define('pdf-form-signer', PdfFormSignerElement);
}

export function setPdfSignKitTheme(theme: string | Record<string, string>) {
  runtimeThemeCssText = normalizeThemeCss(theme);

  if (supportsConstructableStylesheets && runtimeThemeSheet) {
    runtimeThemeSheet.replaceSync(runtimeThemeCssText);
  }

  refreshMountedElementStyles();
}

export function syncPdfSignKitThemeFromRoot(customTokenNames: string[] = tokenNames) {
  if (typeof document === 'undefined') return {} as Record<string, string>;

  const computed = getComputedStyle(document.documentElement);
  const resolved: Record<string, string> = {};

  for (const tokenName of customTokenNames) {
    const value = computed.getPropertyValue(tokenName).trim();
    if (value) resolved[tokenName] = value;
  }

  setPdfSignKitTheme(resolved);
  return resolved;
}
