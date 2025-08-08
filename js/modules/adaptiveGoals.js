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
      .eq('date', lastAdjusted)
  
      
    if (actError) throw actError;
    if (!activities || activities.length === 0) return;

    const yesterday = activities[0];
    const yesterdaySuccess = yesterday.value >= yesterday.adjusted_goal_value;
    

    let newValue = yesterday.adjusted_goal_value;
    let adjustment = 0;

    if (yesterdaySuccess) {
      newValue = Math.round(newValue * 1.05);
      adjustment = 0.05;
    } else {
      newValue = Math.round(newValue * 0.95);
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