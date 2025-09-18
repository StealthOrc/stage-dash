import fs from "fs/promises";
import path from "path";
import { type MasonryItem } from "./_components/MasonryGallery";
import FilteredMasonry from "./_components/FilteredMasonry";
import { normalizeKey } from "./_components/search/fuzzy";

type ImageEntry = { src: string; alt: string };
type GalleryConfig = {
  finals: Array<{ slug: string; abbr: string; img: string }>;
  dirs: Record<string, {
    abbr?: string;
    dir: string;
    img: string;
    subs?: Record<string, {
      abbr?: string;
      dir: string;
      img: string;
    }>;
  }>;
};

export type ImageMeta = {
  characterName: string;
  characterAbbr: string;
  stageName?: string;
  stageAbbr?: string;
  stageSlug?: string;
  finalsTokens: string[]; // slugs/abbrs of final folders in path
};

async function getImagesFromStages(): Promise<ImageEntry[]> {
  const publicDir = path.join(process.cwd(), "public");
  const stagesRoot = path.join(publicDir, "stages");
  async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) files.push(...(await walk(p)));
      else if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(e.name)) files.push(p);
    }
    return files;
  }
  let files: string[] = [];
  try {
    files = await walk(stagesRoot);
  } catch {
    files = [];
  }
  return files
    .map((abs) => abs.replace(publicDir, ""))
    .map((rel) => ({ src: rel.replace(/\\/g, "/"), alt: path.basename(rel) }));
}

export default async function Home() {
  // Read configuration
  const configPath = path.join(process.cwd(), "src/app/gallery.json");
  const configRaw = await fs.readFile(configPath, "utf8");
  const cfg: GalleryConfig = JSON.parse(configRaw) as GalleryConfig;

  const publicDir = path.join(process.cwd(), "public");

  const finalsEntries = (cfg.finals ?? []).map((f) => [f.slug, f.abbr] as const);

  const items: MasonryItem[] = [];
  const metaBySrc: Record<string, ImageMeta> = {};

  for (const [characterName, c] of Object.entries(cfg.dirs)) {
    items.push({ kind: "divider", level: "character", title: characterName, icon: c.img });
    const characterAbbr = c.abbr ?? normalizeKey(characterName);
    const charAbs = path.join(process.cwd(), c.dir.replace(/^\/(public\/)?/, "public/"));

    if (c.subs && Object.keys(c.subs).length > 0) {
      for (const [stageName, s] of Object.entries(c.subs)) {
        items.push({ kind: "divider", level: "stage", title: stageName, icon: s.img });
        const stageAbs = path.join(charAbs, s.dir);
        const stageAbbr = s.abbr ?? normalizeKey(stageName);
        const stageSlug = s.dir;
        
        // Unified image processing: handle both regular stage images and finals
        const files = await listImages(stageAbs);
        for (const f of files) {
          const rel = f.replace(publicDir, "").replace(/\\/g, "/");
          items.push({ kind: "image", src: rel, alt: path.basename(f) });
          
          // Detect if this image is in a finals subdirectory
          const pathSegments = rel.split("/").filter(Boolean);
          const stageIndex = pathSegments.findIndex(seg => normalizeKey(seg) === normalizeKey(stageSlug));
          const isInFinals = stageIndex !== -1 && stageIndex + 2 < pathSegments.length; // Need stage + finals dir + filename
          const finalDirName = isInFinals ? pathSegments[stageIndex + 1] : null;
          
          // Check if the subdirectory is a finals directory
          let finalSlug = null;
          let finalAbbr = null;
          if (isInFinals && finalDirName) {
            for (const [slug, abbr] of finalsEntries) {
              if (normalizeKey(finalDirName) === normalizeKey(slug) || normalizeKey(finalDirName) === normalizeKey(abbr)) {
                finalSlug = slug;
                finalAbbr = abbr;
                break;
              }
            }
          }
          
          // Build finals tokens
          const finalsTokens: string[] = [];
          if (finalSlug && finalAbbr) {
            finalsTokens.push(finalSlug, finalAbbr);
          } else {
            // For regular stage images, detect finals in path segments (legacy behavior)
            for (const seg of pathSegments) {
              for (const [slug, abbr] of finalsEntries) {
                if (normalizeKey(seg) === normalizeKey(slug)) finalsTokens.push(slug);
                if (normalizeKey(seg) === normalizeKey(abbr)) finalsTokens.push(abbr);
              }
            }
          }
          
          // Set metadata - all images from a stage (including finals) belong to that stage
          metaBySrc[rel] = {
            characterName,
            characterAbbr,
            stageName,
            stageAbbr,
            stageSlug,
            finalsTokens,
          };
        }
      }
    } else {
      const files = await listImages(charAbs);
      for (const f of files) {
        const rel = f.replace(publicDir, "").replace(/\\/g, "/");
        items.push({ kind: "image", src: rel, alt: path.basename(f) });
        const finalsTokens: string[] = [];
        const segments = rel.split("/");
        for (const seg of segments) {
          for (const [finalSlug, abbr] of finalsEntries) {
            if (normalizeKey(seg) === normalizeKey(finalSlug)) finalsTokens.push(finalSlug);
            if (normalizeKey(seg) === normalizeKey(abbr)) finalsTokens.push(abbr);
          }
        }
        metaBySrc[rel] = {
          characterName,
          characterAbbr,
          finalsTokens,
        };
      }
    }
  }

  return <FilteredMasonry items={items} metaBySrc={metaBySrc} galleryConfig={cfg} />;
}

async function listImages(absDir: string): Promise<string[]> {
  async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const files: string[] = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) files.push(...(await walk(p)));
      else if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(e.name)) files.push(p);
    }
    return files;
  }
  return await walk(absDir);
}
