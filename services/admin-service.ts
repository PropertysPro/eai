import { User } from '@/types/user';
import { supabase } from '@/config/supabase';

const getPendingVisibilityRequests = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('properties_market_status', 'pending_approval');

    if (error) {
      console.error('Error fetching pending visibility requests:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching pending visibility requests:', error);
    throw error;
  }
};

const updateVisibilityStatus = async (userId: string, status: string): Promise<void> => {
  try {
    const isApproved = status === 'approved';
    const { error } = await supabase
      .from('profiles')
      .update({ is_visible: isApproved, properties_market_status: status })
      .eq('id', userId);

    if (error) {
      console.error(`Error updating visibility status for user ${userId} to ${status}:`, error);
      throw error;
    }

    console.log(`Updating visibility status for user ${userId} to ${status}`);
  } catch (error: any) {
    console.error(`Error updating visibility status for user ${userId} to ${status}:`, error);
    throw error;
  }
};

export default { getPendingVisibilityRequests, updateVisibilityStatus };
