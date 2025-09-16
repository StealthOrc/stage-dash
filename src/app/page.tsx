import fs from "fs/promises";
import path from "path";
import MasonryGallery, { type MasonryItem } from "./_components/MasonryGallery";

type ImageEntry = { src: string; alt: string };
type GalleryConfig = {
  [character: string]: {
    dir: string;
    img: string;
    subs: Array<{ name: string; dir: string; img: string }>;
  };
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
  const cfg: GalleryConfig = JSON.parse(configRaw);

  const publicDir = path.join(process.cwd(), "public");

  const items: MasonryItem[] = [];
  for (const [character, c] of Object.entries(cfg)) {
    items.push({ kind: "divider", level: "character", title: character, icon: c.img });
    const charAbs = path.join(process.cwd(), c.dir.replace(/^\/(public\/)?/, "public/"));

    if (c.subs && c.subs.length > 0) {
      for (const s of c.subs) {
        items.push({ kind: "divider", level: "stage", title: s.name, icon: s.img });
        const stageAbs = path.join(charAbs, s.dir);
        const files = await listImages(stageAbs);
        for (const f of files) {
          const rel = f.replace(publicDir, "").replace(/\\/g, "/");
          items.push({ kind: "image", src: rel, alt: path.basename(f) });
        }
      }
    } else {
      const files = await listImages(charAbs);
      for (const f of files) {
        const rel = f.replace(publicDir, "").replace(/\\/g, "/");
        items.push({ kind: "image", src: rel, alt: path.basename(f) });
      }
    }
  }

  return <MasonryGallery items={items} />;
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
