import supabase from './supabase.js';


export async function adjustGoals(userId) {
  const goalTypes = [1, 2, 3];

  for (const goalType of goalTypes) {
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_type_id', goalType)
      .single();

    if (goalError || !goalData) continue;

    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_type_id', goalType)
      .order('date', { ascending: false })
      .limit(7);

    if (actError || !activities) continue;

    let successDays = 0;
    for (const record of activities) {
      if (record.value >= goalData.value) successDays++;
    }

    let newValue = goalData.value;
    let adjustment = 0;

    if (successDays >= 5) {
      newValue = Math.round(goalData.value * 1.05);
      adjustment = 0.05;
    } else if (successDays <= 2) {
      newValue = Math.round(goalData.value * 0.95);
      adjustment = -0.05;
    }

    if (newValue !== goalData.value) {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ value: newValue, adjusted_by: adjustment })
        .eq('id', goalData.id);

      if (updateError) {
        console.error('Error updating goal:', updateError);
      } else {
        console.log(
          `Goal updated for type ${goalType}: ${goalData.value} -> ${newValue}`
        );
      }
    }
  }
}


