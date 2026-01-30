# Quiz Security Enhancements

## Overview
Enhanced quiz security system to prevent cheating and ensure fair assessment conditions.

## Implemented Features

### 1. ✅ Webcam Cleanup on Quiz Submission
**Problem:** Webcam continued running even after quiz submission.

**Solution:** 
- Added `cleanup()` method to security hook that stops all webcam tracks
- Automatically called when quiz is submitted (both manual and auto-submit)
- Properly releases camera access when student completes the quiz

**Files Modified:**
- `hooks/use-quiz-security.ts` - Added cleanup function
- `app/(lms)/lms/(students)/student/[centerId]/quizzes/[quizId]/attempt/page.tsx` - Call cleanup on submit

---

### 2. ✅ Multiple Display Detection
**Problem:** Students could connect external monitors and view quiz answers on second screen without detection.

**Solution:**
- Uses `window.getScreenDetails()` API to detect display count changes
- Monitors for display configuration changes every 2 seconds
- Automatically submits quiz if display count changes during quiz
- Works with both modern Screen Details API and fallback methods

**Detection Logic:**
```typescript
// Detects when student:
- Connects external monitor during quiz
- Disconnects displays during quiz
- Changes display configuration
```

**Files Modified:**
- `hooks/use-quiz-security.ts` - Added display change detection

---

### 3. ✅ Fullscreen Re-entry with F Key
**Problem:** Once student exits fullscreen (ESC key), they couldn't re-enter fullscreen and were stuck.

**Solution:**
- Press **F key** to re-enter fullscreen mode anytime
- Toast notification shown every 10 seconds when not in fullscreen
- User-friendly way to recover from accidental fullscreen exit

**How it Works:**
```
Student presses ESC → Exits fullscreen → Sees warning
Student presses F → Re-enters fullscreen → Can continue quiz
```

**Files Modified:**
- `hooks/use-quiz-security.ts` - Added F key handler and 10s reminder interval

---

### 4. ✅ Fullscreen Violation Tracking (3 Warnings System)
**Problem:** No enforcement for fullscreen exits - students could repeatedly exit without consequences.

**Solution:**
- Track fullscreen exits separately from tab switches
- Both use 3-warning system before auto-submit
- Visual indicators show both violation counts
- Warnings displayed in security status bar

**Violation Tracking:**
```
Exit 1: Warning (1/3) - "Press F to re-enter fullscreen"
Exit 2: Warning (2/3) - "Press F to re-enter fullscreen"  
Exit 3: AUTO-SUBMIT - "Fullscreen exit limit exceeded"
```

**Files Modified:**
- `hooks/use-quiz-security.ts` - Added fullscreen exit counting
- `components/lms/quiz/quiz-security-status.tsx` - Display fullscreen violations
- `app/(lms)/lms/(students)/student/[centerId]/quizzes/[quizId]/attempt/page.tsx` - Pass fullscreen count

---

## Security Configuration

### Default Settings
```typescript
{
  requireFullscreen: true,
  requireWebcam: false,
  detectTabSwitch: true,
  maxTabSwitches: 3,
  maxFullscreenExits: 3,  // NEW
  preventCopyPaste: true,
  preventRightClick: true,
  detectDevTools: true,
}
```

### Violation Types
1. **Tab Switch** - Switching to another tab/window (max 3)
2. **Fullscreen Exit** - Exiting fullscreen mode (max 3)
3. **Display Change** - Connecting/disconnecting monitors (instant submit)
4. **Copy/Paste** - Attempting to copy quiz content
5. **Right Click** - Opening context menu
6. **Dev Tools** - Opening browser developer tools

---

## User Experience Improvements

### Toast Notifications
- **On fullscreen exit:** "Warning: Fullscreen exited (1/3). Press F to re-enter fullscreen."
- **Every 10 seconds (not fullscreen):** "Please return to fullscreen mode. Press F to continue."
- **On display change:** "Display configuration changed! This is not allowed during the quiz."
- **On limit exceeded:** "Fullscreen exit limit exceeded (3 violations). Your quiz will be submitted."

### Visual Indicators
Security status bar now shows:
- `FS` badge - Green when fullscreen, red when not
- `CAM` badge - Green when webcam active, red when not
- Violation count - Shows both tab switches and fullscreen exits
- Progress bar - Color-coded (green → amber → red)

---

## Technical Implementation

### Display Detection API
```typescript
// Modern browsers (Chrome 93+)
const screenDetails = await window.getScreenDetails();
const displayCount = screenDetails.screens.length;

// Fallback for older browsers
const isExtended = window.screen.isExtended;
```

### Cleanup Flow
```
Quiz Submit → Stop Webcam → Exit Fullscreen → Release Resources
```

### Event Listeners
- `fullscreenchange` - Detect fullscreen state changes
- `visibilitychange` - Detect tab switches
- `keydown` - Handle F key for fullscreen
- Display check interval - Monitor screen configuration

---

## Testing Checklist

- [x] Webcam stops after quiz submission
- [x] External monitor connection triggers warning
- [x] F key re-enters fullscreen
- [x] 10-second reminder shows when not fullscreen
- [x] 3 fullscreen exits = auto-submit
- [x] Both violation types tracked separately
- [x] Security status bar shows accurate counts
- [x] Cleanup happens on auto-submit
- [x] No TypeScript errors

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Fullscreen API | ✅ | ✅ | ✅ | ✅ |
| Webcam Access | ✅ | ✅ | ✅ | ✅ |
| Screen Details API | ✅ (93+) | ❌ | ❌ | ✅ (93+) |
| Display Detection (Fallback) | ✅ | ⚠️ | ⚠️ | ✅ |

**Note:** For browsers without Screen Details API, basic display detection using `screen.isExtended` is attempted.

---

## Future Enhancements (Not Implemented)

- Face detection via webcam (requires AI/ML)
- Eye tracking to detect looking away
- Screenshot detection
- Virtual machine detection
- Multiple person detection in webcam
- Proctoring dashboard for teachers

---

## Summary

All requested security enhancements have been implemented:

1. ✅ **Webcam cleanup** - Camera turns off after quiz submission
2. ✅ **Multiple display detection** - Detects external monitors during quiz
3. ✅ **F key fullscreen** - Easy re-entry to fullscreen mode
4. ✅ **10-second reminders** - Toast notifications when not fullscreen
5. ✅ **3-warning system** - Fullscreen exits tracked like tab switches

The quiz security system is now more robust and harder to circumvent while maintaining good user experience.
