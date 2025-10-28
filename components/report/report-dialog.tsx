"use client";

import React, { useState } from "react";
import { CheckCircle, Flag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReportStore } from "@/lib/store/report.store";
import type { ReportTargetType, ReportCategory } from "@/lib/schema/report.types";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REPORT_CATEGORIES = [
  { value: "SPAM", label: "Spam or Unwanted Content", description: "Repetitive or promotional content" },
  { value: "HARASSMENT", label: "Harassment or Bullying", description: "Targeting or attacking someone" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content", description: "Offensive or disturbing material" },
  { value: "MISINFORMATION", label: "False Information", description: "Misleading or factually incorrect content" },
  { value: "COPYRIGHT", label: "Copyright Violation", description: "Unauthorized use of copyrighted material" },
  { value: "OTHER", label: "Other", description: "Something else not listed above" },
] as const;

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportDialogProps) {
  const [category, setCategory] = useState<ReportCategory>("SPAM");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { submitReport, submitting } = useReportStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const success = await submitReport({
      target_type: targetType,
      target_id: targetId,
      category,
      description: description.trim(),
      metadata: {
        target_title: targetTitle,
        submitted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });

    if (success) {
      setSubmitted(true);
      setDescription("");
      setCategory("SPAM");
    }
  };

  const getTargetTypeDisplay = () => {
    switch (targetType) {
      case "POST":
        return "post";
      case "COMMENT":
        return "comment";
      case "LMS_COURSE":
        return "course";
      case "LMS_MODULE":
        return "module";
      case "USER_PROFILE":
        return "user profile";
      case "COMMUNITY_POST":
        return "community post";
      default:
        return "content";
    }
  };

  // ✅ SUCCESS STATE
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Report Submitted Successfully
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Thank you for reporting this {getTargetTypeDisplay()}.
              Our moderation team will review it soon.
              If the issue is confirmed, you may not see this content again.
            </p>
            <Button
              variant="default"
              className="mt-4"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🧾 MAIN REPORT FORM
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Flag className="h-5 w-5 text-destructive" />
            Report {getTargetTypeDisplay()}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Help us understand what’s wrong with this {getTargetTypeDisplay()}.
            {targetTitle && (
              <span className="block mt-1 font-medium text-foreground">
                “{targetTitle}”
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 scrollbar-modern">
          {/* Category selection */}
          <div>
            <Label className="text-sm font-medium">What’s the issue?</Label>
            <RadioGroup
              value={category}
              onValueChange={(v) => setCategory(v as ReportCategory)}
              className="mt-3 space-y-3"
            >
              {REPORT_CATEGORIES.map((cat) => (
                <div key={cat.value} className="flex items-start gap-3">
                  <RadioGroupItem value={cat.value} id={cat.value} className="mt-0.5" />
                  <div>
                    <Label htmlFor={cat.value} className="text-sm font-medium cursor-pointer">
                      {cat.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide more context about the issue..."
              rows={4}
              className="mt-2 resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required. Help us understand the specific problem.
            </p>
          </div>

          {/* Warning */}
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-xs sm:text-sm">
              False reports may result in account restrictions. Please report only content that violates our guidelines.
            </AlertDescription>
          </Alert>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t flex justify-end gap-3 bg-muted/30">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
