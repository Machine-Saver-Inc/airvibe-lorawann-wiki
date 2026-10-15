# AirVibe LoRaWAN marketplace documentation

The integrator wiki is the source for protocol and commissioning content. Marketplace exports are generated from `data/sections/`; edit those files rather than copies in a seller portal. Product descriptions live in `product.json` and cite wiki page IDs.

Run `npm run build` to generate the website and `dist/marketplace/` review package. Run `npm run marketplace:build` to regenerate just the package. The package includes a technical reference, quickstart, listing copy, an integration acceptance checklist, the published codec, and a manifest with source revision and SHA-256 checksums. HTML documents can be printed by a reviewer. Mermaid source remains visible as text in standalone exports; the interactive wiki renders diagrams.

## Publication and approval

Generated documents are marked Draft for technical review. Merging this change enables their distribution with the existing GitHub Pages deployment; it does not constitute hardware certification or marketplace approval. Review model and firmware applicability before linking these artifacts from a listing.

The ThingPark import interface warns that updating existing products resets submission status and hides them until review. Consequently this generator has no marketplace credentials, upload, submit, or email operation. Publish documentation through the existing site; coordinate listing-field changes with the marketplace reviewer. Confirm whether stable external documentation links are acceptable and which revisions require renewed review.

Before implementing an importer, obtain the seller-specific CSV/API contract and confirm add/update semantics, field ownership, approval effects, and document attachment support. Preserve a portal export, compare only owned fields, avoid duplicate queued SKUs, and verify the resulting listing after approval. A no-change release should not trigger an import. Price, stock, regional variants, taxes, shipping and certifications require their own approved source records.

## Source boundaries

`README.md` establishes this repository's ownership of integrator documentation. `utils/airvibeCodec.js` is the interactive codec implementation; `public/assets/AirVibe_TS013_Codec_v2.1.2.js` is the currently published downloadable codec. They are separate files: the manifest records both hashes, and technical review must establish which version is approved for each firmware/ThingPark driver combination. Never silently replace one with the other.

Use the hardware/firmware owners' evidence for dimensions, temperature ratings, battery life, mounting, approvals and regional ordering codes. Generate missing guides from verified inputs; obtain actual certificates and test results from their issuing authorities. Do not infer certification from protocol interoperability or an OTA capability.

Private seller records, commercial values, account paperwork, credentials, device keys and raw field telemetry belong outside this public repository.
