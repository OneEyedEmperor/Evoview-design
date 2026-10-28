(() => {
  const real = window.matchMedia.bind(window);
  const fake = (q, matches) => ({
    matches,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false; },
  });
  window.matchMedia = (q) => {
    if (/\(hover:\s*none\)/.test(q) || /\(pointer:\s*coarse\)/.test(q)) return fake(q, false);
    if (/\(hover:\s*hover\)/.test(q) || /\(pointer:\s*fine\)/.test(q)) return fake(q, true);
    return real(q);
  };
})();
