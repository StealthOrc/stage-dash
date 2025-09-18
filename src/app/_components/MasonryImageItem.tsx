"use client";

interface MasonryImageItemProps {
  src: string;
  alt: string;
  icon?: string;
}

export default function MasonryImageItem({ src, alt, icon }: MasonryImageItemProps) {
  // Extract image number from filename
  const extractImageNumber = (filename: string): string => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Match patterns like "animal_6" or "animal_7_2"
    const regex = /(\d+)(?:_(\d+))?$/;
    const match = regex.exec(nameWithoutExt);
    
    if (!match) return "";
    
    const mainNumber: number = parseInt(match[1] ?? "0");
    const subNumber: number = parseInt(match[2] ?? "0");
    
    if (subNumber) {
      return `${mainNumber}.${subNumber}`;
    }
    
    return mainNumber.toString();
  };

  const imageNumber = extractImageNumber(alt);

  return (
    <figure className="relative glass overflow-hidden rounded-lg group">
      <div className="aspect-[4/3] w-full">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        
        {/* Overlay with three sections */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top section - 1/5 height */}
          <div className="h-1/5"></div>
          
          {/* Middle section - 2/5 height */}
          <div className="h-2/5"></div>
          
          {/* Bottom section - 2/5 height with left and right aligned content */}
          <div className="h-2/5 flex items-end justify-between px-2 pb-1">
            {/* Number on the left */}
            {imageNumber && (
              <div className="text-white text-shadow-lg bg-black/50 rounded-lg px-2 py-1 flex items-center gap-2">
                <div>
                  <span className="text-2xl font-semibold">
                    {imageNumber.split('.')[0]}.
                  </span>
                  {imageNumber.includes('.') && (
                    <span className="text-sm">
                      {imageNumber.split('.')[1]}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Icon on the right */}
            {icon && (
              <img 
                src={icon} 
                alt="" 
                className="h-full object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}