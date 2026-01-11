import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Sparkles, Heart, Brain, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_VALUES = [
  'כבוד הדדי',
  'אחריות אישית',
  'שיתוף פעולה'
];

const DEFAULT_KNOWLEDGE = [
  'הבנת הנושא המרכזי',
  'מודעות לתהליך',
  'היכרות עם כלים חדשים'
];

const DEFAULT_SKILLS = [
  'עבודת צוות',
  'חשיבה ביקורתית',
  'תקשורת בין-אישית'
];

export default function MeasurementTargets() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [survey, setSurvey] = useState(null);
  
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [selectedValues, setSelectedValues] = useState([]);
  const [customValue, setCustomValue] = useState('');
  
  const [knowledge, setKnowledge] = useState(DEFAULT_KNOWLEDGE);
  const [selectedKnowledge, setSelectedKnowledge] = useState([]);
  const [customKnowledge, setCustomKnowledge] = useState('');
  
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
          if (surveys[0].measurement_targets) {
            const mt = surveys[0].measurement_targets;
            if (mt.selected_values) setSelectedValues(mt.selected_values);
            if (mt.selected_knowledge) setSelectedKnowledge(mt.selected_knowledge);
            if (mt.selected_skills) setSelectedSkills(mt.selected_skills);
          }
          // Try to generate suggestions from file if available
          if (surveys[0].activity_file_url || surveys[0].activity_description) {
            generateSuggestions(surveys[0]);
          }
        }
      }
    };
    loadData();
  }, []);

  const generateSuggestions = async (surveyData) => {
    setIsGenerating(true);
    try {
      const prompt = `בהתבסס על פעילות חינוכית:
תיאור: ${surveyData.activity_description || 'לא צוין'}
${surveyData.activity_file_url ? 'יש קובץ מצורף עם מידע נוסף על הפעילות.' : ''}

הצע 3 ערכים, 3 נושאי ידע, ו-3 מיומנויות שניתן למדוד בפעילות זו.
כל פריט צריך להיות קצר (2-4 מילים).`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: surveyData.activity_file_url ? [surveyData.activity_file_url] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            values: { type: "array", items: { type: "string" } },
            knowledge: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      if (response.values?.length) setValues(response.values);
      if (response.knowledge?.length) setKnowledge(response.knowledge);
      if (response.skills?.length) setSkills(response.skills);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
    setIsGenerating(false);
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        measurement_targets: {
          selected_values: selectedValues,
          selected_knowledge: selectedKnowledge,
          selected_skills: selectedSkills
        },
        current_step: 'A9',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('EvaluationGoal') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('ContentFocus') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        measurement_targets: {
          selected_values: selectedValues,
          selected_knowledge: selectedKnowledge,
          selected_skills: selectedSkills
        },
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const addCustomItem = (type) => {
    switch(type) {
      case 'values':
        if (customValue.trim()) {
          setValues(prev => [...prev, customValue.trim()]);
          setSelectedValues(prev => [...prev, customValue.trim()]);
          setCustomValue('');
        }
        break;
      case 'knowledge':
        if (customKnowledge.trim()) {
          setKnowledge(prev => [...prev, customKnowledge.trim()]);
          setSelectedKnowledge(prev => [...prev, customKnowledge.trim()]);
          setCustomKnowledge('');
        }
        break;
      case 'skills':
        if (customSkill.trim()) {
          setSkills(prev => [...prev, customSkill.trim()]);
          setSelectedSkills(prev => [...prev, customSkill.trim()]);
          setCustomSkill('');
        }
        break;
    }
  };

  const toggleItem = (item, selected, setSelected) => {
    setSelected(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const renderSection = (title, icon, items, selectedItems, setSelectedItems, customInput, setCustomInput, type) => (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <label 
            key={item}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              selectedItems.includes(item) 
                ? 'bg-[#E85A24]/10 border border-[#E85A24]' 
                : 'bg-white border border-gray-200 hover:border-gray-300'
            }`}
          >
            <Checkbox
              checked={selectedItems.includes(item)}
              onCheckedChange={() => toggleItem(item, selectedItems, setSelectedItems)}
            />
            <span className="text-gray-700">{item}</span>
          </label>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="הוסף פריט משלך..."
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && addCustomItem(type)}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => addCustomItem(type)}
          disabled={!customInput.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <StepWrapper
      currentStep={9}
      totalSteps={11}
      stepLabel="מה נמדוד"
      title="ערכים, ידע ומיומנויות למדידה"
      subtitle="בחר מהרשימה או הוסף פריטים משלך"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={false}
      isLoading={isLoading}
    >
      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
          <span className="mr-3 text-gray-500">מנתח את הפעילות ומייצר הצעות...</span>
        </div>
      ) : (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {renderSection(
            'ערכים',
            <Heart className="w-5 h-5 text-pink-500" />,
            values,
            selectedValues,
            setSelectedValues,
            customValue,
            setCustomValue,
            'values'
          )}
          
          {renderSection(
            'ידע',
            <Brain className="w-5 h-5 text-blue-500" />,
            knowledge,
            selectedKnowledge,
            setSelectedKnowledge,
            customKnowledge,
            setCustomKnowledge,
            'knowledge'
          )}
          
          {renderSection(
            'מיומנויות',
            <Wrench className="w-5 h-5 text-green-500" />,
            skills,
            selectedSkills,
            setSelectedSkills,
            customSkill,
            setCustomSkill,
            'skills'
          )}
        </motion.div>
      )}
    </StepWrapper>
  );
}