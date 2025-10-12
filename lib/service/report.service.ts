/**
 * Report Service
 * 
 * Handles reporting functionality for posts, comments, LMS content, and users
 */

import { supabase } from '@/lib/supabase';
import type { 
  Report, 
  ReportCreate, 
  ReportOperationResult 
} from '@/lib/schema/report.types';

export class ReportService {
  /**
   * Submit a report
   */
  static async createReport(reportData: ReportCreate): Promise<ReportOperationResult<Report>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'You must be logged in to report content' };
      }

      // Check if user already reported this content
      const { data: existingReport, error: checkError } = await supabase
        .from('reports')
        .select('id')
        // many schemas use `user_id` as the FK — try that first
        .eq('user_id', user.id)
        .eq('target_type', reportData.target_type)
        .eq('target_id', reportData.target_id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing report:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingReport) {
        return { success: false, error: 'You have already reported this content' };
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          target_type: reportData.target_type,
          target_id: reportData.target_id,
          category: reportData.category,
          reason: reportData.description,
          metadata: reportData.metadata || {},
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting report:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if user has reported specific content
   */
  static async hasUserReported(targetType: string, targetId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (error) {
        console.error('Error checking hasUserReported:', error);
        return false;
      }

      return !!data;
    } catch {
      return false;
    }
  }
}