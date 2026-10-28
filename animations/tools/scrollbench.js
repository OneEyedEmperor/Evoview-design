(async () => {
  const btn = [...document.querySelectorAll("button")].find((b) => /tout accepter/i.test(b.textContent));
  if (btn) btn.click();
  // Warm pass: mount lazy sections, decode media.
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1500));
  const longTasks = [];
  const po = new PerformanceObserver((list) => list.getEntries().forEach((e) => longTasks.push(e.duration)));
  try { po.observe({ type: "longtask", buffered: false }); } catch {}
  const deltas = [];
  let last = performance.now();
  const max = document.body.scrollHeight - innerHeight;
  await new Promise((done) => {
    const step = (t) => {
      deltas.push(t - last);
      last = t;
      const y = window.scrollY + 30;
      window.scrollTo(0, y);
      if (y >= max) return done();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  po.disconnect();
  deltas.shift();
  const sorted = [...deltas].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].toFixed(1);
  const janky = deltas.filter((d) => d > 25).length;
  return JSON.stringify({
    frames: deltas.length,
    avg: (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1),
    p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: sorted[sorted.length - 1].toFixed(1),
    over25ms: janky,
    longTasks: longTasks.length,
    longTaskMs: Math.round(longTasks.reduce((a, b) => a + b, 0)),
  });
})()
