import { useEffect, useState } from 'react';

/** Live value of a data-* attribute on <html> (e.g. "theme", "mode"), for islands that restyle themselves. */
export function useRootAttr(name: 'theme' | 'mode'): string | undefined {
  const read = () => document.documentElement.dataset[name];
  const [value, setValue] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setValue(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: [`data-${name}`] });
    return () => mo.disconnect();
  }, [name]);
  return value;
}
