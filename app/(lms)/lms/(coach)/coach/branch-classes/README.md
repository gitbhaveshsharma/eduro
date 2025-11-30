# Branch Classes Management - Component Documentation

## 📁 Component Structure

```
app/(coach-lms)/coach/branch-classes/
├── page.tsx                           # Main page with tabs (Dashboard/List)
└── _components/
    ├── dashboard.tsx                  # Dashboard with stats and overview
    ├── classes-table.tsx              # Sortable table with all classes
    ├── class-filters.tsx              # Search and filter controls
    ├── create-class-dialog.tsx        # Create new class form dialog
    ├── edit-class-dialog.tsx          # Edit existing class form dialog
    ├── class-details-dialog.tsx       # View detailed class information
    └── delete-class-dialog.tsx        # Delete confirmation dialog
```

## 🎯 Features Implemented

### ✅ Complete CRUD Operations

- **Create**: Full-featured form with validation, all fields supported
- **Read**: Dashboard overview + detailed table view + individual class details
- **Update**: Edit form with pre-filled data and validation
- **Delete**: Confirmation dialog with warnings for enrolled students

### ✅ Interactive Dashboard

- **Statistics Cards**:
  - Total Classes
  - Active Classes
  - Full Classes (at capacity)
  - Total Students Enrolled
- **Capacity Utilization**: Visual progress bar with percentage
- **Recent Classes List**: 5 most recently created classes
- **Classes by Subject**: Distribution chart

### ✅ Advanced Table Features

- **Sortable Columns**: Click headers to sort by:
  - Class name
  - Subject
  - Grade level
  - Capacity
  - Status
- **Row Actions Menu**: View, Edit, Delete for each class
- **Status Badges**: Color-coded (Active=green, Inactive=yellow, Full=red, Completed=gray)
- **Capacity Indicators**: Visual progress bars showing enrollment vs capacity

### ✅ Powerful Filtering & Search

- **Search**: Real-time search across name, subject, description
- **Status Filter**: Filter by Active, Inactive, Full, Completed
- **Grade Level Filter**: Filter by any grade level
- **Subject Filter**: Filter by subject
- **Availability Filter**: Show only classes with available seats
- **Active Filters Display**: Visual badges showing current filters
- **Clear All**: One-click to reset all filters

### ✅ Form Validation

- **Zod Schema Validation**: All inputs validated on client and server
- **Business Rules**:
  - Start date must be before end date
  - Start time must be before end time
  - At least 1 class day required
  - Max students between 1-500
- **Real-time Error Messages**: Inline validation feedback

### ✅ User Experience

- **Toast Notifications**: Success/error messages for all operations
- **Loading States**: Spinners and skeleton loaders
- **Empty States**: Helpful messages when no data
- **Responsive Design**: Works on all screen sizes
- **Keyboard Accessible**: Full keyboard navigation support

## 🔧 Component Details

### 1. Main Page (`page.tsx`)

Main container with tab navigation between Dashboard and List views.

**Props**: None (uses URL state if needed in future)

**Features**:

- Tab navigation (Dashboard/List)
- Create button in header
- Manages dialog open states

### 2. Dashboard (`dashboard.tsx`)

Comprehensive overview of all branch classes with statistics.

**Props**:

- `branchId?: string` - Optional branch ID to filter

**Features**:

- 4 statistics cards
- Capacity utilization with progress bar
- Recent classes list (5 most recent)
- Classes by subject breakdown
- Auto-fetch on mount
- Loading skeletons

**Data Flow**:

```typescript
useEffect -> fetchBranchStats + fetchBranchClasses -> Store -> UI
```

### 3. Classes Table (`classes-table.tsx`)

Full table view with sorting and actions.

**Props**: None (uses store state)

**Features**:

- Sortable columns (click header to sort)
- Row actions dropdown (View/Edit/Delete)
- Status badges with colors
- Capacity progress bars
- Empty state when no results
- Loading skeleton

**Data Flow**:

```typescript
useSearchResults -> Filter/Sort -> Display -> Actions -> Store Methods
```

### 4. Class Filters (`class-filters.tsx`)

Search and filter controls for finding classes.

**Props**: None (manages own state + updates store)

**Features**:

- Search input with debounce (300ms)
- Status dropdown (All/Active/Inactive/Full/Completed)
- Grade level dropdown
- Subject dropdown
- Available seats toggle
- Active filter badges
- Clear all button

**Data Flow**:

```typescript
User Input -> Local State -> Debounce -> Store Filters -> API Search
```

### 5. Create Class Dialog (`create-class-dialog.tsx`)

Full-featured form for creating new classes.

**Props**:

- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Callback for state changes
- `branchId?: string` - Pre-fill branch ID

**Form Fields**:

- **Basic Info**: Class name*, subject*, grade level\*, description, batch name
- **Schedule**: Start/end dates, class days (multi-select), start/end times
- **Capacity**: Max students*, fee frequency*
- **Status**: Status\*, visibility checkbox

**Validation**:

- All required fields marked with \*
- Zod schema validation
- Business rule checks (dates, times)

**Data Flow**:

```typescript
Form Submit -> Validation -> BranchClassesAPI.create -> Toast -> Close
```

### 6. Edit Class Dialog (`edit-class-dialog.tsx`)

Edit form with pre-filled data from existing class.

**Props**: None (uses store editing state)

**Features**:

- Auto-loads class data when editing starts
- Same fields as create dialog
- All fields optional (partial update)
- Validation on submit

**Data Flow**:

```typescript
startEditing(classId) -> Load Data -> Form -> Update -> Toast -> Close
```

### 7. Class Details Dialog (`class-details-dialog.tsx`)

Read-only view of complete class information.

**Props**: None (uses store selected class)

**Sections**:

- Header with status badge
- Description
- Class information (subject, grade, batch)
- Schedule (days, times, dates)
- Capacity with progress bar
- Status & visibility
- Prerequisites (if any)
- Materials required (if any)
- Created/Updated timestamps

**Actions**:

- Close button
- Edit button (opens edit dialog)
- Delete button (opens delete dialog)

**Data Flow**:

```typescript
setSelectedClass(id) -> Load from Store -> Display -> Actions
```

### 8. Delete Class Dialog (`delete-class-dialog.tsx`)

Confirmation dialog with warnings.

**Props**: None (uses store selected class)

**Features**:

- Shows class name
- Warning if class has enrolled students
- Destructive action styling
- Loading state during deletion
- Cannot be dismissed while deleting

**Data Flow**:

```typescript
Confirm -> BranchClassesAPI.delete -> Toast -> Close -> Refresh
```

## 📊 State Management

### Store Methods Used

```typescript
// Fetching
BranchClassesAPI.fetchBranchClasses(branchId);
BranchClassesAPI.search(filters, sort, pagination);
useBranchClassesStore.getState().fetchBranchStats(branchId);

// CRUD
BranchClassesAPI.create(input);
BranchClassesAPI.update(classId, input);
BranchClassesAPI.delete(classId);

// UI State
store.setSelectedClass(classId);
store.startEditing(classId);
store.cancelEditing();
store.setFilters(filters);
store.setSort(sort);

// Hooks
useClassesByBranch(branchId);
useSearchResults();
useBranchStats(branchId);
useSelectedClass();
useClassesLoading();
useClassesUI();
```

## 🎨 Design System

### Colors & Status

- **Active**: Green (#10b981)
- **Inactive**: Yellow (#eab308)
- **Full**: Red (#ef4444)
- **Completed**: Gray (#6b7280)

### Capacity Indicators

- **0-69%**: Green (healthy)
- **70-89%**: Orange (filling up)
- **90-100%**: Red (nearly full/full)

### Toast Notifications

- **Success**: Green background, white text, checkmark icon
- **Error**: Red background, white text, X icon
- **Loading**: Spinner animation
- **Auto-dismiss**: 4 seconds

## 🔐 Security & Validation

### Client-Side

- Zod schema validation on all forms
- TypeScript type safety throughout
- Input sanitization

### Server-Side

- RLS policies enforced (coach role required)
- Validation on service layer
- Proper error handling

## 🚀 Usage Examples

### Opening Create Dialog

```typescript
<Button onClick={() => setIsCreateDialogOpen(true)}>Create New Class</Button>
```

### Viewing Class Details

```typescript
// From table row
store.setSelectedClass(classItem.id);
// Details dialog automatically opens
```

### Editing Class

```typescript
// From table row or details dialog
store.startEditing(classItem.id);
// Edit dialog automatically opens with data
```

### Filtering Classes

```typescript
// Filters component handles this internally
// Updates happen automatically via store
```

## 📱 Responsive Behavior

- **Desktop**: Full layout with side-by-side cards
- **Tablet**: Stacked cards, responsive table
- **Mobile**: Single column, scrollable table

## ♿ Accessibility

- All interactive elements keyboard accessible
- Screen reader friendly labels
- Focus management in dialogs
- Semantic HTML structure
- ARIA labels where needed

## 🔄 Data Flow Summary

```
User Action
    ↓
Component Event Handler
    ↓
Store Action/API Call
    ↓
Supabase Service
    ↓
Database (with RLS)
    ↓
Service Response
    ↓
Store Update
    ↓
React Re-render
    ↓
Toast Notification
```

## 🐛 Error Handling

All operations include:

1. Try-catch blocks
2. Error toast notifications
3. Loading state management
4. Graceful fallbacks
5. User-friendly error messages

## 🎯 Best Practices Followed

✅ Component-based architecture
✅ Clean separation of concerns
✅ Type safety with TypeScript
✅ Reusable utility functions
✅ Consistent naming conventions
✅ Comprehensive documentation
✅ No hardcoded values
✅ Proper prop types
✅ Loading and error states
✅ Accessible UI components

## 🔮 Future Enhancements

Potential additions:

- Bulk operations (delete multiple, update status)
- Export to CSV/PDF
- Class scheduling calendar view
- Student enrollment management
- Teacher assignment interface
- Analytics and reporting
- Email notifications
- Class templates

## 📝 Notes

- All components use shadcn/ui for consistency
- Toast notifications from `lib/toast.tsx`
- Validation schemas from `lib/branch-system/branch-classes`
- All utilities from the centralized utils file
- No duplicate code or hardcoded values
- Clean, production-ready code
