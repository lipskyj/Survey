import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { action, ...params } = body;

  if (action === 'getSurveyBySlug') {
    const surveys = await base44.asServiceRole.entities.Survey.filter({ share_slug: params.slug });
    return Response.json({ data: surveys });
  }

  if (action === 'getQuestions') {
    const questions = await base44.asServiceRole.entities.SurveyQuestion.filter(
      { survey_id: params.survey_id },
      'order_index'
    );
    return Response.json({ data: questions });
  }

  if (action === 'getResponse') {
    const responses = await base44.asServiceRole.entities.SurveyResponse.filter({ id: params.id });
    return Response.json({ data: responses });
  }

  if (action === 'createResponse') {
    const response = await base44.asServiceRole.entities.SurveyResponse.create(params.data);
    return Response.json({ data: response });
  }

  if (action === 'updateResponse') {
    const response = await base44.asServiceRole.entities.SurveyResponse.update(params.id, params.data);
    return Response.json({ data: response });
  }

  if (action === 'updateSurveyCount') {
    const allResponses = await base44.asServiceRole.entities.SurveyResponse.filter({
      survey_id: params.survey_id,
      is_complete: true
    });
    await base44.asServiceRole.entities.Survey.update(params.survey_id, {
      responses_count: allResponses.length
    });
    return Response.json({ data: { count: allResponses.length } });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});