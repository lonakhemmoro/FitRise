import supabase from './supabase.js';


export async function adjustGoals(goalData) {
  try {
    const goalID = goalData.id;
    const goalValue = goalData.value;
    const todayDate = new Date().toISOString().split('T')[0];

  // Fetch the last 7 activity records for this goal
    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('goal_id', goalID)
      .order('date', { ascending: false })
      .limit(7);

    if (actError) throw actError;

    let successDays = 0;
    for (const record of activities) {
      if (record.value >= record.adjusted_goal_value) {
        successDays++;
      }
    }

    let newValue = goalValue;
    let adjustment = 0;

    if (successDays >= 5) {
      newValue = Math.round(goalValue * 1.05);
      adjustment = 0.05;
    } else if (successDays <= 2) {
      newValue = Math.round(goalValue * 0.95);
      adjustment = -0.05;
    }

    // Update the goal record with new adjustment info
    const { error: goalUpdateError } = await supabase
      .from('goals')
      .update({  
        adjusted_by: newValue / goalValue, 
        date_last_adjusted: todayDate 
      })
      .eq('id', goalID);

    if (goalUpdateError) throw goalUpdateError;

    // Update daily_activities for today and future with new adjusted value
    const { error: dailyUpdateError } = await supabase
      .from('daily_activities')
      .update({ adjusted_goal_value: newValue })
      .eq('goal_id', goalID)
      .gte('date', todayDate);

    if (dailyUpdateError) throw dailyUpdateError;

  } catch (error) {
    console.error("Goal adjustment failed:", error);
  }
}


