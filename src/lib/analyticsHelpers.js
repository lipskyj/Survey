// Shared helpers for analytics

export function parseClassMeta(survey) {
  const desc = survey.activity_description || '';
  const metaMatch = desc.match(/__meta:(.+)$/);
  if (metaMatch) {
    try { return JSON.parse(metaMatch[1]); } catch {}
  }
  return null;
}

export function isClassSurvey(survey) {
  return (survey.activity_description || '').includes('__class_of:');
}

export function avg(nums) {
  const valid = nums.filter(n => n !== null && n !== undefined && !isNaN(n));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function getAnswerValues(responses, questionId, orderIndex) {
  return responses
    .flatMap(r => {
      const answers = r.answers || r.data?.answers || [];
      // First try exact question_id match
      const exact = answers.filter(a => a.question_id === questionId);
      if (exact.length > 0) return exact;
      // Fallback: match by order_index stored in the answer, or by position
      if (orderIndex !== undefined) {
        const byOrderIndex = answers.filter(a => a.order_index === orderIndex || a.order_index === String(orderIndex));
        if (byOrderIndex.length > 0) return byOrderIndex;
        // Last resort: positional match
        const byPos = answers.filter((_, i) => i === orderIndex);
        return byPos;
      }
      return [];
    })
    .map(a => {
      const v = a.numeric_value ?? parseFloat(a.value);
      return isNaN(v) ? null : v;
    })
    .filter(v => v !== null);
}

// Enrich class surveys with meta + filtered responses
export function buildEnrichedClasses(classSurveys, allResponses) {
  return classSurveys.map(s => {
    const meta = parseClassMeta(s);
    const responses = allResponses.filter(r => r.survey_id === s.id || r.data?.survey_id === s.id);
    // Normalize response shape so answers are always at top level
    const normalizedResponses = responses.map(r => ({
      ...r,
      answers: r.answers || r.data?.answers || [],
      survey_id: r.survey_id || r.data?.survey_id,
    }));
    return { ...s, meta, responses: normalizedResponses };
  });
}

// Aggregate enriched classes by a key function
export function aggregateBy(enrichedClasses, keyFn, scaleQuestions) {
  const map = {};
  enrichedClasses.forEach(c => {
    const key = keyFn(c) || 'לא ידוע';
    if (!map[key]) map[key] = { classes: [], responses: [] };
    map[key].classes.push(c);
    map[key].responses.push(...c.responses);
  });

  return Object.entries(map).map(([key, { classes, responses }]) => {
    const qAvgs = scaleQuestions.map((q) => {
      const vals = getAnswerValues(responses, q.id, q.order_index);
      const max = q.question_type === 'scale_7' ? 7 : 5;
      return { questionId: q.id, label: q.prompt_hebrew, avg: avg(vals), n: vals.length, max };
    });
    const overallAvg = avg(
      qAvgs.filter(q => q.avg !== null).map(q => (q.avg / q.max) * 5)
    );
    return { key, classCount: classes.length, responseCount: responses.length, qAvgs, overallAvg };
  });
}

// Compute per-question stats across all responses
export function computeQuestionStats(scaleQuestions, allResponses) {
  return scaleQuestions.map((q) => {
    const vals = getAnswerValues(allResponses, q.id, q.order_index);
    const max = q.question_type === 'scale_7' ? 7 : 5;
    const dist = Array.from({ length: max }, (_, i) => i + 1).map(v => ({
      v, count: vals.filter(x => x === v).length
    }));
    return {
      questionId: q.id,
      label: q.prompt_hebrew,
      questionType: q.question_type,
      avg: avg(vals),
      max,
      n: vals.length,
      dist,
    };
  });
}

// Compute per-question stats for aggregated groups
export function computeGroupQuestionAvgs(scaleQuestions, responses) {
  return scaleQuestions.map((q) => {
    const vals = getAnswerValues(responses, q.id, q.order_index);
    const max = q.question_type === 'scale_7' ? 7 : 5;
    return { questionId: q.id, label: q.prompt_hebrew, avg: avg(vals), n: vals.length, max };
  });
}