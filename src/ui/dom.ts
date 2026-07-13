type Child = Node | string | null | undefined;

/** Tiny element builder: h('div', 'cls', child, child…) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const c of children) {
    if (c == null) continue;
    el.append(c);
  }
  return el;
}
