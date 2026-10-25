# Experimental transition

Page-transition trials, not wired anywhere (rejected for now: visual cost vs. value).

- `PageWarp.tsx` — vacuum swallow into a REC dot. Stage: `[data-page-warp]`.
- `ChannelSwitch.tsx` — digital channel zap: stepped macroblocks, RGB slip, tiled static. Stage: `[data-channel-stage]`. SVG filter cost is high on CPU raster.

Both are hooks returning `{ location, layer }`: render `<Routes location={location}>`, mount `layer`, pass the lagged `location` to `ScrollManager`.
