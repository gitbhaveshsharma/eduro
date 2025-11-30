# Student Fees Management System

A comprehensive fee receipts management system for coaches with full CRUD operations, interactive dashboard, and advanced filtering capabilities.

## 📁 Component Structure

```
app/(coach-lms)/coach/student-fees/
├── page.tsx                          # Main page with tab navigation
└── _components/
    ├── dashboard.tsx                 # Revenue statistics & analytics
    ├── receipts-table.tsx           # Sortable receipts table
    ├── receipt-filters.tsx          # Advanced filtering controls
    ├── create-receipt-dialog.tsx    # Create new receipts
    ├── record-payment-dialog.tsx    # Record payments
    ├── receipt-details-dialog.tsx   # View receipt details
    ├── edit-receipt-dialog.tsx      # Edit receipt information
    └── cancel-receipt-dialog.tsx    # Cancel/refund receipts
```

## 🎯 Features

### Dashboard

- **Revenue Statistics**: Total revenue, collected, outstanding, overdue
- **Collection Overview**: Collection rate with progress tracking
- **Payment Methods Breakdown**: Distribution by payment type
- **Receipt Status Distribution**: Paid, pending, overdue, due soon
- **Overdue Receipts List**: Real-time list with days overdue
- **Financial Analytics**: Comprehensive revenue metrics

### Receipts Management

- **Sortable Table**: Sort by date, amount, balance, status
- **Status Badges**: Visual indicators for receipt status
- **Payment Progress**: Progress bars showing payment completion
- **Action Menu**: View, edit, record payment, cancel actions
- **Pagination**: Efficient browsing of large datasets
- **Responsive Design**: Works on all screen sizes

### Advanced Filtering

- **Search**: By receipt number or student name (debounced)
- **Status Filter**: Filter by receipt status (paid, pending, cancelled, refunded)
- **Payment Method Filter**: Filter by payment method
- **Quick Filters**: Overdue and outstanding balance toggles
- **Active Filters Display**: Visual chips showing applied filters
- **Clear All**: One-click filter reset

### Receipt Operations

1. **Create Receipt**

   - Multi-section form (student info, fee breakdown, dates)
   - Fee calculation (base, late fee, discount, tax)
   - Fee period configuration
   - Zod validation with business rules
   - Toast notifications for success/error

2. **Record Payment**

   - Payment amount with balance validation
   - Payment method selection
   - Payment reference tracking
   - Date recording with default to today
   - Internal notes for payment context
   - Automatic progress calculation

3. **View Details**

   - Complete fee breakdown
   - Payment history and status
   - Student and enrollment information
   - Overdue alerts with days count
   - Action buttons (edit, pay, cancel)
   - Metadata timestamps

4. **Edit Receipt**

   - Due date modification
   - Fee amount adjustments
   - Description and notes updates
   - Only editable before payment
   - Real-time validation

5. **Cancel/Refund**
   - Cancellation reason requirement (min 10 chars)
   - Optional refund amount
   - Status-based handling (cancel vs refund)
   - Warning messages
   - Confirmation dialog

## 🛠️ Technical Stack

### Core Technologies

- **React 18+**: Client components with hooks
- **TypeScript**: Strict type safety throughout
- **Zustand**: Global state management
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation with business rules

### UI Components (Shadcn/ui)

- Dialog, AlertDialog
- Form components (Input, Select, Textarea)
- Table with sorting
- Badge, Button, Card
- Progress, Skeleton
- ScrollArea, Separator
- Tabs, Label

### Custom Systems

- **Store**: `lib/branch-system/stores/fee-receipts.store`
- **Service**: `lib/branch-system/services/fee-receipts.service`
- **Types**: `lib/branch-system/types/fee-receipts.types`
- **Validations**: `lib/branch-system/validations/fee-receipts.validation`
- **Utilities**: `lib/branch-system/utils/fee-receipts.utils`
- **Toast**: `lib/toast.tsx` (custom toast system)

## 📊 Data Flow

```
User Action
    ↓
Component (React Hook Form)
    ↓
Zod Validation
    ↓
Zustand Store Action
    ↓
Service Layer (fee-receipts.service)
    ↓
Supabase Database
    ↓
Store State Update
    ↓
UI Re-render
    ↓
Toast Notification
```

## 🚀 Usage Examples

### Basic Setup

```tsx
// The main page handles all state management
import StudentFeesPage from "@/app/(coach-lms)/coach/student-fees/page";

// Simply render the page component
<StudentFeesPage />;
```

### Using Store Directly

```tsx
import { useFeeReceiptsStore } from "@/lib/branch-system/stores/fee-receipts.store";

function MyComponent() {
  const { receipts, fetchReceipts, createReceipt, recordPayment, isLoading } =
    useFeeReceiptsStore();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleCreateReceipt = async (data) => {
    const result = await createReceipt(data);
    if (result) {
      console.log("Receipt created:", result.receipt_number);
    }
  };

  return (
    <div>
      {receipts.map((receipt) => (
        <div key={receipt.id}>{receipt.receipt_number}</div>
      ))}
    </div>
  );
}
```

### Creating a Receipt

```tsx
const receipt = await createReceipt({
  student_id: "uuid",
  branch_id: "uuid",
  enrollment_id: "uuid",
  due_date: "2024-02-15",
  base_fee_amount: 5000,
  discount_amount: 500,
  description: "Monthly tuition fee",
});
```

### Recording Payment

```tsx
const payment = await recordPayment({
  receipt_id: "receipt-uuid",
  amount_paid: 5000,
  payment_method: PaymentMethod.UPI,
  payment_reference: "UPI123456789",
});
```

### Filtering Receipts

```tsx
setFilters({
  receipt_status: ReceiptStatus.PENDING,
  is_overdue: true,
  has_balance: true,
});
```

## 🎨 Styling & Theming

All components use Shadcn/ui components which follow your theme configuration. Key styling features:

- **Color Coding**:

  - Green: Paid receipts, positive metrics
  - Orange: Pending, outstanding balance
  - Red: Overdue, cancelled, errors
  - Blue: Info, metadata

- **Badges**: Status indicators with appropriate variants
- **Progress Bars**: Visual payment completion tracking
- **Responsive Grid**: 2-4 columns based on screen size

## 🔒 Security & Validation

### Input Validation (Zod)

- All forms use Zod schemas for validation
- Business rules enforced (discount ≤ base fee, payment ≤ balance)
- Date validations (due date ≥ today, payment date ≤ today)
- Amount validations (max 2 decimals, positive values)

### Permission Checks

- `canEditReceipt`: Only unpaid receipts can be edited
- `canRecordPayment`: Only pending receipts with balance
- `canCancelReceipt`: Not already cancelled/refunded

### Data Sanitization

- All inputs sanitized through Zod
- SQL injection prevention via Supabase RLS
- XSS prevention through React's built-in escaping

## 📱 Responsive Design

- **Mobile**: Stacked layout, simplified tables
- **Tablet**: 2-column grids, scrollable tables
- **Desktop**: Full 4-column layout, inline actions

## ⚡ Performance Optimizations

1. **Debounced Search**: 300ms delay to prevent excessive API calls
2. **Pagination**: Efficient loading of large datasets
3. **Skeleton Loaders**: Immediate feedback during data fetching
4. **Memoized Calculations**: Cached computed values
5. **Optimistic Updates**: Immediate UI updates before server confirmation

## 🐛 Error Handling

### User-Facing Errors

- Toast notifications for all operations
- Form validation errors with helpful messages
- Network error handling with retry suggestions

### Developer Errors

- Console logging for debugging
- Error boundaries (recommended to add)
- TypeScript compile-time safety

## 🧪 Testing Recommendations

```tsx
// Test receipt creation
it("should create a new receipt", async () => {
  const result = await createReceipt({
    student_id: "test-uuid",
    branch_id: "test-uuid",
    enrollment_id: "test-uuid",
    due_date: "2024-12-31",
    base_fee_amount: 1000,
  });

  expect(result).toBeDefined();
  expect(result.receipt_number).toMatch(/^[A-Z0-9]+-\d{2}-\d{2}-\d{4}$/);
});

// Test payment recording
it("should record payment correctly", async () => {
  const result = await recordPayment({
    receipt_id: "test-uuid",
    amount_paid: 1000,
    payment_method: PaymentMethod.UPI,
  });

  expect(result.is_fully_paid).toBe(true);
  expect(result.new_balance).toBe(0);
});
```

## 🔄 Future Enhancements

1. **Bulk Operations**

   - Create multiple receipts at once
   - Record bulk payments
   - Bulk status updates

2. **Export Functionality**

   - PDF receipts for students
   - CSV export for accounting
   - Excel reports with charts

3. **Payment Reminders**

   - Automated email reminders
   - SMS notifications for overdue
   - WhatsApp integration

4. **Analytics Dashboard**

   - Trend charts (line, bar, pie)
   - Forecasting and predictions
   - Comparison with previous periods

5. **Receipt Templates**

   - Custom receipt designs
   - Branded PDFs
   - Multi-language support

6. **Payment Gateway Integration**

   - Razorpay integration
   - Stripe integration
   - PayPal support

7. **Advanced Filters**

   - Date range pickers
   - Amount range sliders
   - Saved filter presets

8. **Student Portal**
   - View own receipts
   - Online payment
   - Payment history

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Receipts not loading

- Check network connection
- Verify branch_id is set correctly
- Check console for API errors

**Issue**: Payment not recording

- Verify amount doesn't exceed balance
- Check payment method requires reference
- Ensure receipt status is PENDING

**Issue**: Cannot edit receipt

- Check if payment already recorded
- Verify receipt not cancelled/refunded

### Debug Mode

Enable detailed logging:

```tsx
// In store or service files
const DEBUG = true;
if (DEBUG) console.log("Operation:", data);
```

## 👥 Contributing

When adding features:

1. Follow existing component patterns
2. Use TypeScript strict mode
3. Add Zod validation for new inputs
4. Update this README
5. Add toast notifications
6. Test responsive design
7. Handle loading states

## 📄 License

This system is part of the Eduro platform and follows the project's licensing terms.

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Maintained by**: Eduro Development Team
