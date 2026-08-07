# The content plan: what gets posted, in what order, in what voice.
#
# Three posts a week is what a workshop this size can actually sustain, and it
# is enough to stay in front of people without becoming a full-time job.
#
#   Monday     a piece — one product, one price, one line about it
#   Wednesday  the material or the making — the thing nobody else can copy
#   Friday     the house, or an invitation to commission
#
# Captions are built from data/products.json, so a price change on the site
# changes the caption. Nothing is written twice.

CADENCE = ["Mon", "Wed", "Fri"]

# Voice: short declarative sentences. Concrete nouns. No hype, no exclamation
# marks, no emoji. The pieces are expensive; the writing should be calm.

BASE_TAGS = [
    "AsekhoTwaku", "ExoticLeather", "MadeInSouthAfrica", "EastLondon",
    "EasternCape", "Leathercraft", "HandmadeLeather", "SouthAfricanDesign",
    "ProudlySouthAfrican", "SlowFashion",
]

HIDE_TAGS = {
    "Ostrich":    ["OstrichLeather", "FullQuill", "ExoticSkins"],
    "Crocodile":  ["CrocodileLeather", "ExoticSkins"],
    "Nguni":      ["NguniHide", "NguniCattle", "HairOnHide"],
    "Zebra":      ["ZebraHide", "HairOnHide"],
    "Full-grain": ["FullGrainLeather", "VegTanned"],
}

CATEGORY_TAGS = {
    "Handbags":  ["Handbag", "LeatherBag"],
    "Backpacks": ["LeatherBackpack", "Backpack"],
    "Travel":    ["TravelBag", "Weekender", "LeatherLuggage"],
    "Business":  ["Briefcase", "LeatherWallet"],
    "Heritage":  ["Umthika", "XhosaCraft", "Heritage"],
    "Apparel":   ["LeatherTrousers", "LeatherClothing"],
    "Interiors": ["LeatherFurniture", "Upholstery"],
}

# --- caption shapes for a product ------------------------------------------
# Rotated so thirty product posts do not read as thirty of the same post.

SHAPES = [
    "{mood}\n\n{name} — {price}\n{material}\n\nMade to order in East London.",
    "{material}\n\n{mood}\n\n{name}, {price}. Cut for you, not off a shelf.",
    "{name} — {price}\n\n{mood}\n\n{material}\n\nWhatsApp the workshop to start one.",
    "{mood}\n\n{material}\n\n{name}. {price}. Six weeks, give or take, from the day you say go.",
]

# --- the posts that are not products ----------------------------------------
# Written by hand. These are the ones that build the brand rather than sell a
# specific bag, and they are why the feed is worth following.

EDITORIAL = [
    dict(key="hide-ostrich", image="hide-ostrich", tags=["OstrichLeather", "FullQuill"],
         text="Ostrich is read across a room.\n\nThe bumps are follicles — where the "
              "feathers were. They only stand proud on the prime back of the bird, so a "
              "full-quill panel costs hide, and costs it deliberately.\n\nNo two are the same."),

    dict(key="hide-nguni", image="hide-nguni", tags=["NguniHide", "NguniCattle"],
         text="Nguni is the cattle of this country.\n\nWe use the skin with the hair on, "
              "and every one is marked differently. That is the point, and it is also the "
              "problem: we cut for the marking and accept the waste.\n\nThe panel on your "
              "piece will not turn up on anybody else's."),

    dict(key="hide-zebra", image="skin-zebra", tags=["ZebraHide", "HairOnHide"],
         text="Cut around the mane, not through it.\n\nZebra is placed before it is cut, "
              "which means the panel decides the bag rather than the other way round. "
              "Every skin arrives with its paperwork and is checked against CITES before "
              "anything happens to it."),

    dict(key="hide-springbok", image="skin-springbok", tags=["Springbok", "HairOnHide"],
         text="Springbok. Tan over white, with the dark flank stripe running between.\n\n"
              "The shortest hair of any hide we work, and the least forgiving — there is "
              "nowhere for a bad cut to hide."),

    dict(key="hide-crocodile", image="hide-crocodile", tags=["CrocodileLeather"],
         text="Belly scale, centred by hand.\n\nOn crocodile the eye goes straight to the "
              "centre line. If it runs off true by a few millimetres you will feel that "
              "something is wrong before you can say what."),

    dict(key="craft-cut", image="craft-cutting-table", tags=["Leathercraft", "HandCut"],
         text="Every panel is cut by hand.\n\nA hide is not a rectangle. It has a spine, "
              "thin flanks, scars from a life. Where each panel comes from decides how the "
              "piece wears in ten years, and no machine makes that decision."),

    dict(key="craft-stitch", image="toggle-the-hand", tags=["SaddleStitch", "Handmade"],
         text="Two needles, one thread, pulled in opposite directions.\n\nA machine seam is "
              "one thread locked against itself — cut it anywhere and it runs. A saddle "
              "stitch cut anywhere stays put.\n\nIt is slower. That is the whole argument."),

    dict(key="craft-sorting", image="toggle-the-hide", tags=["Leathercraft", "RawMaterials"],
         text="Chosen wet, sorted dry, rejected often.\n\nRoughly one hide in four makes it "
              "to the bench. The rest go back. That decision happens before a single "
              "measurement is taken and it decides everything after it."),

    dict(key="house-since-99", image="craft-east-london", tags=["EastLondon", "SmallBusiness"],
         text="East London, Eastern Cape. Since 1999.\n\nTwenty-seven years in the same "
              "trade, in the same town. Shown in Casablanca, Addis Ababa, Paris, São Paulo, "
              "Moscow, Hong Kong, London, Dubai and New York — and still cut here."),

    dict(key="house-skills", image="heritage-archive", tags=["SkillsTransfer", "Mdantsane"],
         text="The trade only survives if it is handed on.\n\nWe run skills transfer in East "
              "London and Mdantsane, because a workshop that does not teach is a workshop "
              "with an expiry date."),

    dict(key="house-repair", image="bespoke-process", tags=["RepairDontReplace", "BuiltToLast"],
         text="We made it, so we can open it.\n\nBring a piece back whenever it needs "
              "attention, for as long as you own it — and regardless of who owned it "
              "first. Stitching, handles, lining, base.\n\nThings worth buying are things "
              "worth mending."),

    dict(key="commission", image="skins-hero", tags=["Bespoke", "MadeToOrder"],
         text="Most of what leaves this workshop was drawn for one person.\n\nBring a "
              "photograph, a sketch, or a bag you already ruined. Choose the hide. We cut "
              "it for you.\n\nWhatsApp the workshop and ask what it would take."),
]

# Where the closing line points. Instagram has one link, so the profile carries
# it and the caption says so; Facebook takes the URL inline.
SITE = "https://luthandotonyngxila8-netizen.github.io/LC-agency-mobile/"
WHATSAPP = "+27 79 644 8562"
