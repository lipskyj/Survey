import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ChoiceCard({
  value,
  label,
  description,
  icon: Icon,
  isSelected,
  onClick,
  isMulti = false
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(value)}
      className={cn(
        "w-full text-right p-5 rounded-2xl border-2 transition-all duration-200",
        "flex items-start gap-4",
        isSelected
          ? "border-[#E85A24] bg-orange-50/50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      {/* Selection indicator */}
      <div className={cn(
        "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all",
        isMulti ? "rounded-md" : "rounded-full",
        isSelected
          ? "bg-[#E85A24] text-white"
          : "border-2 border-gray-300"
      )}>
        {isSelected && <Check className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isSelected ? "bg-[#E85A24]/10 text-[#E85A24]" : "bg-gray-100 text-gray-500"
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className={cn(
              "font-semibold text-lg",
              isSelected ? "text-[#6B2D4A]" : "text-gray-800"
            )}>
              {label}
            </h3>
            {description && (
              <p className="text-gray-500 text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}