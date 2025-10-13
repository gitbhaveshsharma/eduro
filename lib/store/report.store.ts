/**
 * Report Store
 * 
 * Manages report submission state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ReportService } from '@/lib/service/report.service';
import type { ReportCreate, ReportOperationResult } from '@/lib/schema/report.types';

interface ReportState {
  submitting: boolean;
  submitted: Set<string>; // target_type:target_id combinations
  errors: Map<string, string>;
}

interface ReportActions {
  submitReport: (reportData: ReportCreate) => Promise<boolean>;
  hasReported: (targetType: string, targetId: string) => boolean;
  clearErrors: () => void;
}

type ReportStore = ReportState & ReportActions;

const useReportStore = create<ReportStore>()(
  devtools(
    (set, get) => ({
      submitting: false,
      submitted: new Set(),
      errors: new Map(),

      submitReport: async (reportData: ReportCreate) => {
        const key = `${reportData.target_type}:${reportData.target_id}`;
        
        set({ submitting: true });
        const state = get();
        state.errors.delete(key);

        try {
          const result = await ReportService.createReport(reportData);
          
          if (result.success) {
            const newSubmitted = new Set(get().submitted);
            newSubmitted.add(key);
            set({ 
              submitted: newSubmitted,
              submitting: false 
            });
            return true;
          } else {
            const newErrors = new Map(get().errors);
            newErrors.set(key, result.error || 'Failed to submit report');
            set({ 
              errors: newErrors,
              submitting: false 
            });
            return false;
          }
        } catch (error) {
          const newErrors = new Map(get().errors);
          newErrors.set(key, 'Network error occurred');
          set({ 
            errors: newErrors,
            submitting: false 
          });
          return false;
        }
      },

      hasReported: (targetType: string, targetId: string) => {
        const key = `${targetType}:${targetId}`;
        return get().submitted.has(key);
      },

      clearErrors: () => {
        set({ errors: new Map() });
      }
    }),
    { name: 'report-store' }
  )
);

export { useReportStore };