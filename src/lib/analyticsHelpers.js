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

export function getAnswerValues(responses, questionId) {
  return responses
    .flatMap(r => r.answers || [])
    .filter(a => a.question_id === questionId)
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
    const responses = allResponses.filter(r => r.survey_id === s.id);
    return { ...s, meta, responses };
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
    const qAvgs = scaleQuestions.map(q => {
      const vals = getAnswerValues(responses, q.id);
      return { questionId: q.id, label: q.prompt_hebrew, avg: avg(vals), n: vals.length };
    });
    const overallAvg = avg(qAvgs.filter(q => q.avg !== null).map(q => q.avg));
    return { key, classCount: classes.length, responseCount: responses.length, qAvgs, overallAvg };
  });
}

// Compute per-question stats across all responses
export function computeQuestionStats(scaleQuestions, allResponses) {
  return scaleQuestions.map(q => {
    const vals = getAnswerValues(allResponses, q.id);
    const dist = [1,2,3,4,5].map(v => ({ v, count: vals.filter(x => x === v).length }));
    return {
      questionId: q.id,
      label: q.prompt_hebrew,
      avg: avg(vals),
      n: vals.length,
      dist,
    };
  });
}