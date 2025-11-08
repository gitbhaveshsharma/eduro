# Coaching Search V2 - Quick Reference Guide

## 🚀 Quick Start

### Basic Search (Get All Centers)

```typescript
import { useCoachingStore } from "@/lib/store/coaching.store";

const { searchCoachingCenters, centerSearchResults } = useCoachingStore();

// Load first 20 centers
await searchCoachingCenters();
```

### Filter by Category

```typescript
await searchCoachingCenters(
  {
    category: "COMPETITIVE_EXAM",
  },
  "rating_high"
);
```

### Search by Location

```typescript
await searchCoachingCenters({
  city: "Mumbai",
  state: "Maharashtra",
  is_verified: true,
});
```

### Distance-Based Search

```typescript
await searchCoachingCenters(
  {
    latitude: 19.076,
    longitude: 72.8777,
    radius_meters: 5000, // 5km
  },
  "distance"
);
```

### Text Search

```typescript
await searchCoachingCenters({
  search_query: "IIT JEE coaching",
});
```

---

## 📊 Available Filters

| Filter          | Type               | Description                            | Example               |
| --------------- | ------------------ | -------------------------------------- | --------------------- |
| `search_query`  | `string`           | Free text search (name, subject, city) | `"IIT JEE"`           |
| `category`      | `CoachingCategory` | Filter by category                     | `"COMPETITIVE_EXAM"`  |
| `subjects`      | `string[]`         | Filter by subjects                     | `["Math", "Physics"]` |
| `state`         | `string`           | Filter by state                        | `"Maharashtra"`       |
| `district`      | `string`           | Filter by district                     | `"Mumbai"`            |
| `city`          | `string`           | Filter by city                         | `"Mumbai"`            |
| `village_town`  | `string`           | Filter by village/town                 | `"Andheri"`           |
| `latitude`      | `number`           | User latitude (-90 to 90)              | `19.0760`             |
| `longitude`     | `number`           | User longitude (-180 to 180)           | `72.8777`             |
| `radius_meters` | `number`           | Search radius in meters                | `5000`                |
| `min_rating`    | `number`           | Minimum rating (1-5)                   | `3`                   |
| `max_rating`    | `number`           | Maximum rating (1-5)                   | `5`                   |
| `is_verified`   | `boolean`          | Only verified centers                  | `true`                |
| `days_ago`      | `number`           | Created within N days                  | `30`                  |
| `branch_id`     | `string`           | Specific branch UUID                   | `"uuid..."`           |
| `center_id`     | `string`           | Specific center UUID                   | `"uuid..."`           |

---

## 🔄 Sort Options

| Sort By         | Description                      |
| --------------- | -------------------------------- |
| `'recent'`      | Newest first (default)           |
| `'rating_high'` | Highest rated first              |
| `'rating_low'`  | Lowest rated first               |
| `'distance'`    | Nearest first (requires lat/lng) |

---

## 📦 Response Structure

```typescript
interface CoachingCenterSearchResult {
  results: CoachingCenterSearchItem[]; // Array of centers
  total_count: number; // Total matching results
  page: number; // Current page
  per_page: number; // Results per page
  has_more: boolean; // More results available?
}

interface CoachingCenterSearchItem {
  center_id: string; // Center UUID
  center_slug: string; // SEO-friendly slug
  branch_id: string; // Branch UUID
  center_is_verified: boolean; // Verification status
  center_logo_url: string | null; // Logo URL
  center_name: string; // Center name
  center_category: CoachingCategory; // Category
  center_subjects: string[] | null; // Subjects array
  location_city: string | null; // City name
  avg_rating: number; // Average rating (0-5)
  total_reviews: number; // Review count
  location_state: string | null; // State name
  location_district: string | null; // District name
  distance_meters: number | null; // Distance in meters
  total_count: number; // Total results
}
```

---

## 🎯 Common Use Cases

### 1. Search Page with Filters

```typescript
const SearchPage = () => {
  const {
    searchCoachingCenters,
    centerSearchResults,
    centerSearchLoading,
    currentCenterFilters,
    updateCenterFilters,
  } = useCoachingStore();

  const handleSearch = (filters: Partial<CoachingCenterFilters>) => {
    updateCenterFilters(filters);
    searchCoachingCenters(
      { ...currentCenterFilters, ...filters },
      "recent",
      1,
      20
    );
  };

  return (
    <div>
      <Filters onFilterChange={handleSearch} />
      {centerSearchLoading && <Spinner />}
      <Results data={centerSearchResults?.results} />
    </div>
  );
};
```

### 2. Infinite Scroll

```typescript
const InfiniteSearchList = () => {
  const { searchCoachingCenters, centerSearchResults } = useCoachingStore();
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState<CoachingCenterSearchItem[]>([]);

  const loadMore = async () => {
    await searchCoachingCenters({}, "recent", page + 1, 20);
    if (centerSearchResults) {
      setAllResults([...allResults, ...centerSearchResults.results]);
      setPage(page + 1);
    }
  };

  return (
    <InfiniteScroll
      dataLength={allResults.length}
      next={loadMore}
      hasMore={centerSearchResults?.has_more || false}
    >
      {allResults.map((center) => (
        <CenterCard key={center.center_id} center={center} />
      ))}
    </InfiniteScroll>
  );
};
```

### 3. Location-Based "Near Me"

```typescript
const NearMeCenters = () => {
  const { searchCoachingCenters } = useCoachingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(async (position) => {
      await searchCoachingCenters(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius_meters: 10000, // 10km radius
          is_verified: true,
        },
        "distance",
        1,
        20
      );
      setLoading(false);
    });
  }, []);

  // Render results...
};
```

### 4. Category Landing Page

```typescript
const CategoryPage = ({ category }: { category: CoachingCategory }) => {
  const { searchCoachingCenters, centerSearchResults } = useCoachingStore();

  useEffect(() => {
    searchCoachingCenters(
      {
        category,
        is_verified: true,
      },
      "rating_high",
      1,
      20
    );
  }, [category]);

  // Render results...
};
```

### 5. Advanced Filter Panel

```typescript
const AdvancedFilters = () => {
  const { searchCoachingCenters } = useCoachingStore();
  const [filters, setFilters] = useState<CoachingCenterFilters>({});

  const applyFilters = () => {
    searchCoachingCenters(filters, "recent", 1, 20);
  };

  return (
    <div className="space-y-4">
      {/* Text Search */}
      <Input
        placeholder="Search..."
        onChange={(e) =>
          setFilters({ ...filters, search_query: e.target.value })
        }
      />

      {/* Category Select */}
      <Select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="COMPETITIVE_EXAM">Competitive Exam</option>
        {/* More options... */}
      </Select>

      {/* Location */}
      <Input
        placeholder="City"
        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
      />

      {/* Rating Range */}
      <div>
        <label>Min Rating</label>
        <input
          type="range"
          min="1"
          max="5"
          value={filters.min_rating || 1}
          onChange={(e) =>
            setFilters({ ...filters, min_rating: +e.target.value })
          }
        />
      </div>

      {/* Verified Only */}
      <Checkbox
        checked={filters.is_verified || false}
        onChange={(e) =>
          setFilters({ ...filters, is_verified: e.target.checked })
        }
      >
        Verified Only
      </Checkbox>

      <Button onClick={applyFilters}>Search</Button>
    </div>
  );
};
```

---

## ⚡ Performance Tips

### 1. Use Pagination

```typescript
// Good: Load in chunks
await searchCoachingCenters({}, "recent", 1, 20);

// Avoid: Loading too much at once
await searchCoachingCenters({}, "recent", 1, 100);
```

### 2. Cache Results

```typescript
// Results are automatically cached in store
const { centerSearchResults } = useCoachingStore();

// Reuse cached results when possible
if (centerSearchResults && !needsRefresh) {
  // Use cached data
}
```

### 3. Debounce Search Input

```typescript
import { useDebouncedCallback } from "use-debounce";

const handleSearchInput = useDebouncedCallback((query: string) => {
  searchCoachingCenters({ search_query: query });
}, 500); // Wait 500ms after typing stops
```

### 4. Optimize Distance Queries

```typescript
// Good: Reasonable radius
{
  radius_meters: 5000;
} // 5km

// Avoid: Too large radius (slow)
{
  radius_meters: 100000;
} // 100km
```

---

## 🐛 Common Issues & Solutions

### Issue: No results returned

```typescript
// Check if filters are too restrictive
console.log("Filters:", currentCenterFilters);

// Try without filters
await searchCoachingCenters({}, "recent", 1, 20);
```

### Issue: Distance sorting not working

```typescript
// Ensure lat/lng are provided
await searchCoachingCenters(
  {
    latitude: 19.076, // Required
    longitude: 72.8777, // Required
    radius_meters: 5000, // Optional but recommended
  },
  "distance"
);
```

### Issue: Slow searches

```typescript
// Use specific filters to reduce result set
await searchCoachingCenters(
  {
    city: "Mumbai", // Narrow down location
    category: "COMPETITIVE_EXAM", // Specific category
    is_verified: true, // Reduce results
  },
  "recent",
  1,
  20
);
```

---

## 🧪 Testing Examples

### Unit Test

```typescript
import { CoachingService } from "@/lib/service/coaching.service";

describe("searchCoachingCenters", () => {
  it("should return results", async () => {
    const result = await CoachingService.searchCoachingCenters();
    expect(result.success).toBe(true);
    expect(result.data?.results).toBeDefined();
  });

  it("should filter by category", async () => {
    const result = await CoachingService.searchCoachingCenters({
      category: "COMPETITIVE_EXAM",
    });
    result.data?.results.forEach((center) => {
      expect(center.center_category).toBe("COMPETITIVE_EXAM");
    });
  });
});
```

---

## 📝 TypeScript Intellisense

All methods are fully typed with TypeScript:

```typescript
// Auto-complete available for filters
searchCoachingCenters({
  // Press Ctrl+Space to see all options
  category: "...",
  subjects: [],
  // ...
});

// Sort options are type-safe
searchCoachingCenters({}, "recent"); // ✅
searchCoachingCenters({}, "invalid"); // ❌ TypeScript error
```

---

## 🔗 Related Files

- **Service**: `lib/service/coaching.service.ts`
- **Store**: `lib/store/coaching.store.ts`
- **Types**: `lib/schema/coaching.types.ts`
- **Validation**: `lib/validations/coaching.validation.ts`
- **RPC Function**: `supabase/migrations/019_coaching_search_rpc.sql`
- **Full Docs**: `COACHING_SEARCH_V2_IMPLEMENTATION.md`

---

**Last Updated**: November 8, 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready
