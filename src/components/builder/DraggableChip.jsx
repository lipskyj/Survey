import React from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DraggableChip({
  label,
  isSelected,
  onToggle,
  onRemove,
  isDraggable = false
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-all",
        "text-sm font-medium select-none",
        isSelected
          ? "bg-[#E85A24] text-white shadow-lg shadow-orange-200"
          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-[#E85A24] hover:text-[#E85A24]"
      )}
    >
      {isDraggable && (
        <GripVertical className="w-4 h-4 opacity-50" />
      )}
      <span>{label}</span>
      {isSelected && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}