"use client";

import { useEffect, useRef, useState } from "react";

export type MasonryImage = { kind: "image"; src: string; alt: string };
export type MasonryDivider = {
	kind: "divider";
	level: "character" | "stage";
	title: string;
	icon: string; // public path
};
export type MasonryItem = MasonryImage | MasonryDivider;

type Props = {
	items: MasonryItem[];
	batchSize?: number;
};

export default function MasonryGallery({ items, batchSize = 60 }: Props) {
	const [count, setCount] = useState(Math.min(batchSize, items.length));
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						setCount((c) => Math.min(c + batchSize, items.length));
					}
				}
			},
			{ rootMargin: "2000px 0px 2000px 0px" },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [items.length, batchSize]);

	const visible = items.slice(0, count);

	return (
		<div className="w-full">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 px-4">
				{visible.map((it, idx) => {
					if (it.kind === "divider") {
						return (
							<div key={`divider-${idx}`} className="col-span-full">
								<div className="flex items-center gap-3 py-2">
									<img src={it.icon} alt="" className="h-8 w-8 object-contain" />
									<h2 className={it.level === "character" ? "text-2xl font-semibold" : "text-xl font-medium"}>
										{it.title}
									</h2>
									<div className="flex-1 border-t border-white/10" />
								</div>
							</div>
						);
					}

					return (
						<figure key={it.src} className="relative glass overflow-hidden rounded-lg">
							<div className="aspect-[4/3] w-full">
								<img
									src={it.src}
									alt={it.alt}
									loading="lazy"
									className="h-full w-full object-cover"
								/>
							</div>
						</figure>
					);
				})}
			</div>
			<div ref={sentinelRef} className="h-10" />
		</div>
	);
}


