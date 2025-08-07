import supabase from './supabase.js';

export async function adjustGoals(goalData) {
  try {
    const goalID = goalData.id;
    const goalValue = goalData.value;
    const lastAdjusted = goalData.date_last_adjusted;
    const todayDate = new Date().toISOString().split('T')[0];

  // Fetch activity records after last adjustment
    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('goal_id', goalID)
      .gt('date', lastAdjusted)
      .order('date', { ascending: false })
      
    if (actError) throw actError;

    // If less than 3 activity records since last adjustment, skip adjustment
    if (activities.length < 3) return;

    let successDays = 0;
    for (const record of activities) {
      if (record.value >= record.adjusted_goal_value) {
        successDays++;
      }
    }

    let newValue = goalValue;
    let adjustment = 0;

    if (successDays >= 3) {
      newValue = Math.round(goalValue * 1.05);
      adjustment = 0.05;
    } else if (successDays == 0) {
      newValue = Math.round(goalValue * 0.95);
      adjustment = -0.05;
    } 

  // Update goal only if changed
    if (adjustment !== 0) {
      const { error: goalUpdateError } = await supabase
        .from('goals')
        .update({
          adjusted_by: newValue / goalValue,
          date_last_adjusted: todayDate
        })
        .eq('id', goalID);

      if (goalUpdateError) throw goalUpdateError;

      // Update daily_activities for today and future
      const { error: dailyUpdateError } = await supabase
        .from('daily_activities')
        .update({ adjusted_goal_value: newValue })
        .eq('goal_id', goalID)
        .gte('date', todayDate);

      if (dailyUpdateError) throw dailyUpdateError;
    }
  } catch (error) {
    console.error("Goal adjustment failed:", error);
  }
}


   


