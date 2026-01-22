import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDesign, DESIGNS } from "@/hooks/useDesign";
import { FolderOpen } from "lucide-react";

export default function CategoryCard({ category, onSelect }) {
  const { currentDesign, design } = useDesign();

  return (
    <button
      onClick={() => onSelect(category)}
      className={cn(
        "group p-3 text-left active:scale-95 h-full flex flex-col items-center justify-between",
        design.transition,
        currentDesign === DESIGNS.MODERN 
          ? "bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10" 
          : currentDesign === DESIGNS.MINIMAL 
          ? "bg-white rounded-none border-2 border-neutral-200 hover:border-black"
          : "bg-white rounded-xl border border-slate-200 hover:border-brand-orange hover:shadow-lg"
      )}
    >
      <div className="flex flex-col items-center text-center w-full">
        {/* Icon / Image Container */}
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center mb-1 sm:mb-2 overflow-hidden",
          currentDesign === DESIGNS.MODERN 
            ? "rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200" 
            : currentDesign === DESIGNS.MINIMAL 
            ? "rounded-none bg-neutral-100 group-hover:bg-neutral-200"
            : "rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-navy/10 group-hover:from-brand-orange/20 group-hover:to-brand-navy/20"
        )}>
          {category.image_url ? (
            <img 
              src={category.image_url} 
              alt={category.name_fr}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <FolderOpen className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7",
              currentDesign === DESIGNS.MODERN ? "text-purple-500" :
              currentDesign === DESIGNS.MINIMAL ? "text-black" : "text-brand-orange"
            )} />
          )}
        </div>

        {/* Name */}
        <h3 className={cn(
          "font-medium text-[10px] sm:text-xs line-clamp-2 mb-0.5 w-full",
          design.transition,
          currentDesign === DESIGNS.MODERN ? "text-slate-700 group-hover:text-purple-600" :
          currentDesign === DESIGNS.MINIMAL ? "text-black group-hover:text-neutral-600" : "text-brand-navy group-hover:text-brand-orange"
        )}>
          {category.name_fr}
        </h3>
      </div>

      {/* Count Badge */}
      <Badge 
        variant="secondary" 
        className={cn(
          "text-[9px] sm:text-[10px] px-1 sm:px-1.5 mt-auto",
          currentDesign === DESIGNS.MODERN ? "bg-purple-100 text-purple-600 rounded-full" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-200 text-black rounded-none" : "bg-slate-100 text-slate-600"
        )}
      >
        {category.product_count || 0}
      </Badge>
    </button>
  );
}
