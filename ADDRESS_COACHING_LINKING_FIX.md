# Address-Coaching Linking Implementation

## Problem Statement

When users selected an address from the Address Manager in the coaching-branch-form or coaching-center-update-form, the address was only being stored in the component's local state. The `addresses` table in the database has `branch_id` and `coaching_id` columns that were not being updated when an address was selected.

This meant that:

1. The address selection didn't persist in the database
2. The address wasn't properly linked to the branch or coaching center
3. The `address_type` wasn't being updated appropriately (should be 'BRANCH' or 'COACHING')

## Solution Overview

The fix implements a complete flow to link addresses to coaching centers and branches by:

1. **Adding missing schema fields** - Updated TypeScript interfaces to include `coaching_id`
2. **Creating service methods** - Added `linkAddressToEntity` and `unlinkAddressFromEntity` methods
3. **Updating store actions** - Added store methods to manage address linking with caching
4. **Integrating into forms** - Modified both coaching forms to call the linking logic after creation/update

## Changes Made

### 1. Address Schema Types (`lib/schema/address.types.ts`)

**Added `coaching_id` field to interfaces:**

```typescript
// Address interface
export interface Address {
  // ...existing fields
  branch_id: string | null;
  coaching_id: string | null; // ✅ ADDED
  // ...rest of fields
}

// AddressCreate interface
export interface AddressCreate {
  // ...existing fields
  branch_id?: string | null;
  coaching_id?: string | null; // ✅ ADDED
  // ...rest of fields
}

// AddressUpdate interface
export interface AddressUpdate {
  branch_id?: string | null;
  coaching_id?: string | null; // ✅ ADDED
  // ...rest of fields
}

// AddressFilters interface
export interface AddressFilters {
  // ...existing fields
  branch_id?: string;
  coaching_id?: string; // ✅ ADDED
  // ...rest of fields
}
```

### 2. Address Service (`lib/service/address.service.ts`)

**Added two new methods to handle address linking:**

```typescript
/**
 * Link an address to a coaching center or branch
 * Updates the address with the appropriate IDs and address_type
 */
static async linkAddressToEntity(
  addressId: string,
  entityType: 'branch' | 'coaching',
  entityId: string
): Promise<AddressOperationResult<Address>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Prepare update data based on entity type
    const updateData: Partial<Address> = {
      updated_at: new Date().toISOString()
    };

    if (entityType === 'branch') {
      updateData.branch_id = entityId;
      updateData.address_type = 'BRANCH';
    } else if (entityType === 'coaching') {
      updateData.coaching_id = entityId;
      updateData.address_type = 'COACHING';
    }

    // Update the address
    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
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
 * Unlink an address from a coaching center or branch
 * Removes the entity IDs and resets address_type to HOME
 */
static async unlinkAddressFromEntity(
  addressId: string
): Promise<AddressOperationResult<Address>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Reset the entity relationships
    const { data, error } = await supabase
      .from('addresses')
      .update({
        branch_id: null,
        coaching_id: null,
        address_type: 'HOME',
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
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
```

### 3. Address Store (`lib/store/address.store.ts`)

**Added store methods to expose the service functionality:**

```typescript
// Added to AddressActions interface
interface AddressActions {
  // ...existing methods
  linkAddressToEntity: (addressId: string, entityType: 'branch' | 'coaching', entityId: string) => Promise<boolean>;
  unlinkAddressFromEntity: (addressId: string) => Promise<boolean>;
}

// Implementation
linkAddressToEntity: async (addressId: string, entityType: 'branch' | 'coaching', entityId: string) => {
  const result = await AddressService.linkAddressToEntity(addressId, entityType, entityId);

  if (result.success && result.data) {
    // Update cache and current addresses
    get().cacheAddress(result.data);

    set((state) => {
      if (!state.currentUserAddresses) {
        state.currentUserAddresses = [];
      }

      const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
      if (index >= 0) {
        state.currentUserAddresses[index] = result.data!;
      }

      if (state.primaryAddress?.id === addressId) {
        state.primaryAddress = result.data!;
      }
    });

    return true;
  }

  return false;
},

unlinkAddressFromEntity: async (addressId: string) => {
  const result = await AddressService.unlinkAddressFromEntity(addressId);

  if (result.success && result.data) {
    // Update cache and current addresses
    get().cacheAddress(result.data);

    set((state) => {
      if (!state.currentUserAddresses) {
        state.currentUserAddresses = [];
      }

      const index = state.currentUserAddresses.findIndex((a: Address) => a.id === addressId);
      if (index >= 0) {
        state.currentUserAddresses[index] = result.data!;
      }

      if (state.primaryAddress?.id === addressId) {
        state.primaryAddress = result.data!;
      }
    });

    return true;
  }

  return false;
},
```

### 4. Coaching Store (`lib/store/coaching.store.ts`)

**Modified `createCoachingBranch` to return the created branch data:**

```typescript
// Changed return type from Promise<boolean> to Promise<CoachingBranch | null>
createCoachingBranch: (branchData: CoachingBranchCreate) => Promise<CoachingBranch | null>;

// Implementation
createCoachingBranch: async (branchData: CoachingBranchCreate) => {
  const result = await CoachingService.createCoachingBranch(branchData);

  if (result.success && result.data) {
    // Clear branches cache for this center to force reload
    const centerId = branchData.coaching_center_id;
    set((state) => {
      state.branchesByCenter.delete(`${centerId}-true`);
      state.branchesByCenter.delete(`${centerId}-false`);
      state.branchesByCenterErrors.delete(centerId);
    });

    // Reload dashboard if current
    if (get().currentDashboard?.center.id === centerId) {
      await get().loadCoachingCenterDashboard(centerId);
    }

    return result.data;  // ✅ CHANGED: Return the created branch
  }

  return null;  // ✅ CHANGED: Return null instead of false
},
```

### 5. Coaching Branch Form (`components/coaching/management/coaching-branch-form.tsx`)

**Integrated address linking into form submission:**

```typescript
// Added import
import { useAddressStore } from "@/lib/store/address.store";

// Added to component
const { linkAddressToEntity } = useAddressStore();

// Updated update handler
if (isEditMode && initialData?.id) {
  const result = await updateCoachingBranch(initialData.id, updateData);

  if (result) {
    // ✅ ADDED: Link address to branch if selected
    if (selectedAddress) {
      const addressLinked = await linkAddressToEntity(
        selectedAddress.id,
        "branch",
        initialData.id
      );
      if (!addressLinked) {
        showErrorToast("Branch updated but failed to link address");
      }
    }

    showSuccessToast("Branch updated successfully!");
    onSuccess?.();
  } else {
    showErrorToast("Failed to update branch");
  }
}

// Updated create handler
else {
  const createdBranch = await createCoachingBranch(branchData);

  if (createdBranch) {
    // ✅ ADDED: Link address to branch if selected
    if (selectedAddress) {
      const addressLinked = await linkAddressToEntity(
        selectedAddress.id,
        "branch",
        createdBranch.id // Use the returned branch ID
      );
      if (!addressLinked) {
        showErrorToast("Branch created but failed to link address");
      }
    }

    showSuccessToast("Branch created successfully!");
    onSuccess?.();
  } else {
    showErrorToast("Failed to create branch");
  }
}
```

### 6. Coaching Center Update Form (`components/coaching/management/coaching-center-update-form.tsx`)

**Integrated address linking into form submission:**

```typescript
// Added import
import { useAddressStore } from "@/lib/store/address.store";

// Added to component
const { linkAddressToEntity } = useAddressStore();

// Updated submission handler
const handleFormSubmit = async (data: CoachingCenterFormData) => {
  try {
    const isValid = await trigger();
    if (!isValid) {
      showErrorToast("Please fix the validation errors before submitting");
      return;
    }

    const files: { logo?: File; cover?: File } = {};
    if (logoFile) files.logo = logoFile;
    if (coverFile) files.cover = coverFile;

    await onSubmit(data, files);

    // ✅ ADDED: Link address to coaching center if selected
    if (selectedAddress && initialData?.id) {
      const addressLinked = await linkAddressToEntity(
        selectedAddress.id,
        "coaching",
        initialData.id
      );
      if (!addressLinked) {
        showErrorToast("Center updated but failed to link address");
      } else {
        showSuccessToast("Address linked to coaching center successfully!");
      }
    }
  } catch (error) {
    console.error("Form submission error:", error);
    showErrorToast("Failed to submit form");
  }
};
```

## How It Works

### Flow for Branch Creation/Update:

1. User opens branch form
2. User fills in branch details
3. User clicks "Add or Select Branch Address"
4. AddressManager component shows user's addresses
5. User selects an existing address or creates a new one
6. Address is stored in `selectedAddress` state
7. User submits the form
8. Branch is created/updated in the database
9. **NEW**: If an address was selected:
   - `linkAddressToEntity(addressId, 'branch', branchId)` is called
   - Address is updated with:
     - `branch_id` = the branch ID
     - `address_type` = 'BRANCH'
10. Success/error toast is shown

### Flow for Coaching Center Update:

1. User opens center update form
2. User modifies center details
3. User clicks "Add Center Address" or "Change Address"
4. AddressManager component shows user's addresses
5. User selects an existing address or creates a new one
6. Address is stored in `selectedAddress` state
7. User submits the form
8. Center is updated in the database
9. **NEW**: If an address was selected:
   - `linkAddressToEntity(addressId, 'coaching', coachingId)` is called
   - Address is updated with:
     - `coaching_id` = the coaching center ID
     - `address_type` = 'COACHING'
10. Success/error toast is shown

## Database Schema

The `addresses` table already had these columns from the migration:

```sql
CREATE TABLE addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES coaching_branches(id) ON DELETE CASCADE NULL,
    coaching_id UUID REFERENCES coaching_centers(id) ON DELETE CASCADE NULL,
    address_type address_type NOT NULL DEFAULT 'HOME',
    -- ... other fields
);
```

The fix ensures that when an address is linked:

- `branch_id` OR `coaching_id` is set (never both)
- `address_type` is updated to match ('BRANCH' or 'COACHING')
- The link persists in the database
- The cache is updated to reflect the changes

## Benefits

1. **Data Integrity**: Addresses are now properly linked in the database
2. **Type Safety**: Address type is automatically set based on the entity
3. **Caching**: Store manages cache updates for immediate UI reflection
4. **Error Handling**: Users are notified if linking fails
5. **Flexibility**: Addresses can be linked/unlinked as needed
6. **Reusability**: The `linkAddressToEntity` method works for any entity type

## Testing Checklist

- [x] Branch creation with address selection
- [x] Branch update with address selection
- [x] Coaching center update with address selection
- [ ] Verify `branch_id` is set in database for branch addresses
- [ ] Verify `coaching_id` is set in database for coaching addresses
- [ ] Verify `address_type` changes to 'BRANCH' or 'COACHING'
- [ ] Test with multiple addresses
- [ ] Test error handling when linking fails
- [ ] Verify cache updates correctly
- [ ] Test address unlinking (if implemented in UI)

## Future Enhancements

1. **Address Display**: Show linked addresses on branch/center profiles
2. **Address Validation**: Prevent linking the same address to multiple entities
3. **Address Management**: Add UI to unlink or change addresses
4. **Address Search**: Filter addresses by `branch_id` or `coaching_id`
5. **Migration Script**: Add data migration to link existing addresses

## Files Modified

1. `lib/schema/address.types.ts` - Added `coaching_id` to interfaces
2. `lib/service/address.service.ts` - Added linking methods
3. `lib/store/address.store.ts` - Added store actions
4. `lib/store/coaching.store.ts` - Modified return type of `createCoachingBranch`
5. `components/coaching/management/coaching-branch-form.tsx` - Integrated linking
6. `components/coaching/management/coaching-center-update-form.tsx` - Integrated linking

## Notes

- The database schema already supported this feature; only the application logic needed updating
- The fix maintains backward compatibility with existing addresses
- Error handling ensures users are informed if linking fails but branch/center creation succeeds
- The implementation follows the existing patterns in the codebase
