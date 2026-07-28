from PIL import Image
import numpy as np

def _runs(mask):
    """Yield (start, end) of contiguous True runs."""
    idx = np.where(mask)[0]
    if len(idx) == 0:
        return []
    splits = np.where(np.diff(idx) > 1)[0]
    out, start = [], idx[0]
    for s in splits:
        out.append((start, idx[s] + 1)); start = idx[s + 1]
    out.append((start, idx[-1] + 1))
    return out

def content_box(im, thr=62):
    """Largest contiguous band of non-dark rows/cols — strips phone UI chrome."""
    a = np.asarray(im.convert('RGB')).astype(float)
    rows = a.mean(axis=(1, 2)) > thr
    r = _runs(rows)
    if not r:
        return (0, 0, im.width, im.height)
    top, bot = max(r, key=lambda t: t[1] - t[0])
    band = a[top:bot]
    cols = band.mean(axis=(0, 2)) > thr
    c = _runs(cols)
    left, right = max(c, key=lambda t: t[1] - t[0]) if c else (0, im.width)
    return (int(left), int(top), int(right), int(bot))
