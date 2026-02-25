# Business Partner Management System

## Overview

The Business Partner Management System allows M-Console operators to register real-world businesses as partners in the ARG/tactical operation. Each business partner can be linked to a specific grid location and associated with items, dead drops, and events.

## Features

### 1. Add Business Partner Dialog

**Location**: `src/components/AddBusinessPartnerDialog.tsx`

A comprehensive dialog for registering new business partners with:

#### Required Fields
- **Business Name**: The official name of the business
- **Owner/Contact Name**: Primary contact person

#### Optional Contact Information
- **Email**: Contact email address
- **Phone**: Contact phone number
- **Website**: Business website URL
- **Physical Address**: Street address of the business

#### Business Classification
- **Category**: 
  - 🍕 Food & Beverage
  - 🛍️ Retail
  - 🔧 Services
  - 🎭 Entertainment
  - 🏨 Lodging
  - 📦 Other

- **Participation Level**:
  - 💭 Interested (initial contact)
  - ⚡ Active (currently participating)
  - 🤝 Partner (formal partnership)
  - ⭐ Sponsor (financial or major support)

#### Grid Location
- **Grid Column (A-H)**: X-axis position on tactical map
- **Grid Row (1-8)**: Y-axis position on tactical map
- Visual confirmation of selected grid location (e.g., "Grid C4")

#### Additional Metadata
- **Tags**: Flexible tagging system for categorization
  - Add multiple tags with Enter key
  - Remove tags individually
- **Notes**: Free-form text field for additional information

### 2. Business Partner Data Structure

```typescript
interface BusinessPartner {
  id: string                    // Unique identifier
  businessName: string          // Business name
  ownerName: string            // Owner/contact name
  contactEmail?: string        // Email (optional)
  contactPhone?: string        // Phone (optional)
  website?: string             // Website URL (optional)
  address?: string             // Physical address (optional)
  gridX?: number               // Grid X coordinate (0-7)
  gridY?: number               // Grid Y coordinate (0-7)
  category: string             // Business category
  participationLevel: string   // Participation status
  notes?: string               // Additional notes
  tags?: string[]              // Custom tags
  createdAt: number           // Creation timestamp
  updatedAt: number           // Last update timestamp
  itemsCreated?: number       // Count of items crafted
  deadDropsHosted?: number    // Count of dead drops hosted
  eventsParticipated?: number // Count of events participated in
}
```

### 3. Integration with Existing Systems

#### App.tsx Integration

The business partner system is integrated into the main application with:

1. **Persistent Storage**: Uses `useKV` for data persistence
   ```typescript
   const [businessPartners, setBusinessPartners] = useKV<BusinessPartner[]>('business-partners', [])
   ```

2. **Dialog State Management**:
   ```typescript
   const [addBusinessDialogOpen, setAddBusinessDialogOpen] = useState(false)
   const [selectedGridForBusiness, setSelectedGridForBusiness] = useState<{ x: number; y: number } | undefined>()
   ```

3. **Event Handlers**:
   - `handleBusinessAdded`: Processes new business additions
   - Logs the addition to mission log
   - Broadcasts to operations feed
   - Updates business partners list

#### Grid Location Linkage

When a business partner is added with a grid location:
- The coordinates are stored as `gridX` and `gridY` (0-7 range)
- Visual representation shows as "Grid C4" format (A-H, 1-8)
- Can be used to:
  - Place markers on the Hybrid Tactical Map
  - Associate with dead drops at that location
  - Link items to business locations
  - Navigate to business location from directory

### 4. Workflow Examples

#### Example 1: Basic Business Registration
1. Click "Add Business Partner" button in M-Console mode
2. Fill in required fields:
   - Business Name: "The Coffee Shop"
   - Owner Name: "Jane Smith"
3. Optionally add contact info and grid location
4. Click "Add Business Partner"
5. Business appears in directory and logs

#### Example 2: Grid-Linked Business
1. Open Add Business Partner dialog
2. Enter business details
3. Select grid location:
   - Column: C (gridX = 2)
   - Row: 4 (gridY = 3)
4. Visual confirmation shows "Grid C4"
5. Business is now linked to that map location

#### Example 3: Tagged Business for Organization
1. Add business partner as normal
2. In the Tags field, add relevant tags:
   - "coffee" (press Enter)
   - "downtown" (press Enter)
   - "sponsor" (press Enter)
3. Tags help filter and organize businesses later

### 5. Future Integration Points

The business partner system is designed to integrate with:

#### Real-World Item Crafter
- Select business partner as item creator
- Link crafted items to business location
- Track items created per business

#### Dead Drop Manager
- Place dead drops at business locations
- Use business as dead drop host
- Track dead drops hosted per business

#### ARG Event System
- Associate events with business partners
- Track business participation in events
- Generate participation statistics

#### Business Partnership Directory
- Display all registered businesses
- Filter by category, participation level, tags
- View contact information
- Navigate to grid locations
- Show participation statistics

#### Business Map Overlay
- Visual representation on tactical map
- Click business markers to view details
- See all businesses at a glance
- Filter map by business category

### 6. Data Persistence

All business partner data is automatically persisted using the Spark KV system:
- Key: `'business-partners'`
- Survives page refreshes
- Shared across all M-Console sessions
- Can be accessed by other components via `useKV`

### 7. Mission Log Integration

When a business partner is added:
- **Mission Log Entry**: "Business Partner Added - [Business Name] - Grid [Location]"
- **Operations Feed Entry**: "Business partner registered: [Business Name]"
- Priority: Normal
- Type: Mission

### 8. Usage in M-Console Mode

The Add Business Partner dialog is only available in M-Console mode:
1. Toggle M Console mode using the M CONSOLE button in header
2. The Add Business Partner dialog appears at the top of M-Console tools
3. Click to open and register new partners
4. Partners are immediately available to other M-Console systems

### 9. Best Practices

1. **Always Fill Required Fields**: Business name and owner name are mandatory
2. **Use Grid Locations**: Link businesses to grid for map integration
3. **Tag Appropriately**: Use consistent tags for better organization
4. **Update Participation Levels**: Keep participation status current as relationships develop
5. **Add Contact Info**: Complete contact information enables better communication
6. **Write Descriptive Notes**: Use notes field for important details about partnership

### 10. Technical Implementation

#### Component Structure
```
AddBusinessPartnerDialog.tsx
├── Dialog (shadcn/ui)
│   ├── DialogTrigger (Button)
│   └── DialogContent
│       ├── Form Fields
│       │   ├── Business Name (Input)
│       │   ├── Owner Name (Input)
│       │   ├── Contact Fields (Input)
│       │   ├── Category (Select)
│       │   ├── Participation Level (Select)
│       │   ├── Grid Location (Select x2)
│       │   ├── Tags (Input + Badge list)
│       │   └── Notes (Textarea)
│       └── Actions
│           ├── Cancel Button
│           └── Submit Button
```

#### State Management
- Local component state for form inputs
- Controlled dialog open state (via props or internal)
- Tag management with add/remove functionality
- Grid coordinate conversion (A-H ↔ 0-7)

#### Validation
- Required field checks before submission
- Toast notifications for errors and success
- Grid location display with visual confirmation

## Summary

The Business Partner Management System provides a complete solution for registering and managing real-world business partnerships within the ARG tactical operation environment. It seamlessly integrates with grid locations, mission logs, and the broader M-Console ecosystem, setting the foundation for item crafting, dead drop management, and event coordination with local businesses.
