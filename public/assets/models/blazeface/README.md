# BlazeFace weights (vendored)

Face-detection model for the proctored assessment device check. Committed rather than fetched,
because `blazeface.load()` with no `modelUrl` downloads these from `tfhub.dev` **at exam time** —
now a three-hop redirect (tfhub.dev → kaggle.com → storage.googleapis.com) run by every student's
browser as they sit down to a graded assessment. Any hop blocked by a college firewall or captive
portal meant the model never loaded, which the device check reported as
*"No face detected. Please position yourself in front of the camera."*

| File | Bytes | SHA-256 |
|---|---|---|
| `model.json` | 64,036 | `7b6bb6f35e5a7899232de51dda8bf514ef9664ca7ec58388c9fecc088c883b58` |
| `group1-shard1of1.bin` | 401,768 | `60b481ab6c19352673cdb21e02e639f90883db1393ac52d07c7ea4e1e11cb2cd` |

Captured 2026-08-15 from the package default URL in
`@tensorflow-models/blazeface@^0.1.0` (`dist/blazeface.esm.js`, `BLAZEFACE_MODEL_URL`):

```
https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1/model.json?tfjs-format=file
https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1/group1-shard1of1.bin?tfjs-format=file
```

Integrity checked at capture: the manifest declares 67 weight tensors totalling exactly 401,768
bytes, matching the shard on disk; the graph loads and runs inference on the CPU backend in ~89 ms.

## Two constraints on this directory

**Keep it under `/assets/`.** `proxy.ts` bypasses auth for exactly `/images/`, `/videos/` and
`/assets/`. Anywhere else these 307 to `/login` and tfjs fails with a JSON parse error, silently
falling back to the CDN this vendoring exists to remove. Verified against a Netlify deploy preview.

**There is no vendor script.** The sibling pattern `scripts/vendor-noise-suppression.mjs` copies
RNNoise out of `node_modules` on postinstall; the blazeface package ships JavaScript only, so these
weights exist nowhere but the CDN. Fetching them at build time would just move the same fragile
dependency from exam time to deploy time.

To update: download both files from the URLs above, verify the byte counts and hashes, update this
table.
