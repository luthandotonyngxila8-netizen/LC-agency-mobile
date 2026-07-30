# Briefs for the remaining placeholder imagery

Twenty-one images. Every one is currently a generated placeholder with
*PLACEHOLDER IMAGE* written across it. These briefs work for a generation model
or as a shot list for a photographer — the sizes are what the layout expects,
and the notes about dead space are what actually matters for the page.

House look: Eastern Cape, warm afternoon light, matte, no gloss or studio
sparkle. Warm neutrals — ivory, sand, espresso — with cognac and coral as the
only colour. Photographic, not rendered. No text, no logos, no watermarks.

---

## Hide cards — 1000 × 1250 (4:5), on the home page

Shot close, the material filling the frame, raking light from the left so the
surface texture stands proud. No object, no styling, just the hide.

| File | Brief |
|---|---|
| `hide-ostrich` | Full-quill ostrich leather, tan-brown, the follicle bumps of the prime back standing proud in low raking light. Quill field running corner to corner. |
| `hide-crocodile` | Nile crocodile belly leather, dark cognac, the even rectangular scale run down the centre, scales tightening towards the edges. |
| `hide-nguni` | Nguni cowhide with the hair left on, irregular black and white markings, soft directional sheen along the lie of the hair. |

## Hide studies — 1400 × 933 (3:2), on the Skins page

Same materials, wider and flatter — a piece of hide laid on a worn wooden
bench, shot slightly from above. Room around the edges.

`skin-ostrich` · `skin-crocodile` · `skin-nguni` · `skin-springbok` ·
`skin-zebra`

Springbok: fine short hair, tan and white with the dark flank stripe.
Zebra: hair-on, crisp black and white, the mane running through the frame.

## Workshop and process — 1400 × 933 (3:2)

| File | Brief |
|---|---|
| `toggle-the-hide` | Raw hides sorted in stacks across a workshop table, afternoon light from a high window, dust in the air. |
| `toggle-the-hand` | Close on two hands pulling a saddle stitch through a leather panel held in a wooden stitching pony. Waxed thread, two needles. |
| `bespoke-process` | A workbench mid-commission: paper pattern, steel rule, round knife, a cut panel, a mug. Nobody in frame. |
| `heritage-archive` | A shelf of older, well-used leather pieces and worn wooden lasts, softly lit, the look of thirty years of work. |

## Wide crops — 1800 × 771

These sit **behind white text**, with a scrim darkening the bottom of the
frame. Keep the lower third quiet — no detail, no faces, nothing that matters.

| File | Brief |
|---|---|
| `craft-cutting-table` | A hide being cut by hand against a steel rule on a large cutting table, shot along the table so it recedes. Subject upper two-thirds. |
| `craft-east-london` | A modest industrial workshop building at the end of the day, Eastern Cape light, long shadows. Wide, calm, empty foreground. |

## Page headers — 1920 × 900 (2.13:1)

The headline sits over the **left third**, so that side must stay dark and
uncluttered. Put the subject right of centre.

| File | Brief |
|---|---|
| `skins-hero` | Several hides — ostrich, crocodile, hair-on cowhide — draped over a rail, dim workshop, one shaft of light. |
| `bespoke-hero` | Hands over a workbench discussing a paper pattern and a hide swatch, shot from above, close and warm. |
| `heritage-hero` | The workshop interior at dusk, benches and tools, nobody there, one lamp on. |

## Two singles

| File | Brief |
|---|---|
| `series-1999-circle` (900 × 900) | A single finished leather bag on a dark bench, top-down, lit from one side. Composed so a circular crop works. |
| `og-asekho-twaku` (1200 × 630) | The link thumbnail for WhatsApp and Facebook. One strong piece on a warm ground, centred, generous margin — it gets cropped hard. |

---

## Not this one

`founder-asekho-twaku` (900 × 900) is a portrait of a real, named person on his
own company's site. It needs an actual photograph of Asekho — a phone camera in
the workshop is fine. A generated face would be a fabricated likeness of a real
individual, and anyone who knows him would see it immediately.

`craft-east-london` is meant to be the real premises. Generated, it is mood
photography rather than a picture of the building — worth knowing before it goes
in front of customers.

## After generating

Each file needs a `.jpg` **and** a `.webp` sibling at the size above, into
`images/`, replacing what is there. `tools/build_products.py` has the framing
helper if anything comes back at the wrong aspect ratio.
