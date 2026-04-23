export type AttrPropMapping = { attr: string; prop: string; maxAttrLen?: number };

export function attachJsonProps(el: Element, mappings: AttrPropMapping[]) {
  const applyOne = (m: AttrPropMapping) => {
    const raw = el.getAttribute(m.attr);
    if (raw === null) return;
    const maxLen = m.maxAttrLen ?? 200000; // 200KB default guard
    if (raw.length > maxLen) {
      console.warn('JSON attribute too large; prefer passing as property', m.attr);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      try {
        (el as any)[m.prop] = parsed;
      } catch (e) {
        // last-resort: set attribute string
        (el as any)[m.prop] = parsed;
      }
    } catch (err) {
      // fallback to raw string
      try {
        (el as any)[m.prop] = raw;
      } catch (e) {}
      console.warn(`Failed to parse JSON from attribute ${m.attr}`);
    }
  };

  for (const m of mappings) applyOne(m);

  const observer = new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === 'attributes' && r.attributeName) {
        const mapping = mappings.find((mm) => mm.attr === r.attributeName);
        if (mapping) applyOne(mapping);
      }
    }
  });
  observer.observe(el, { attributes: true });
}
