import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Heart } from 'lucide-react';

export default function RespondComplete() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <h1 className="text-3xl font-bold text-[#6B2D4A] mb-4">
          תודה רבה!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          התגובה נקלטה בהצלחה
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-orange-50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-center gap-2 text-[#E85A24] mb-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">המשוב שלך חשוב לנו</span>
          </div>
          <p className="text-gray-600 text-sm">
            התשובות שלך יעזרו לנו להשתפר ולהתאים את הפעילויות בצורה הטובה ביותר
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-400 mt-8"
        >
          ניתן לסגור את הדף
        </motion.p>
      </motion.div>
    </div>
  );
}