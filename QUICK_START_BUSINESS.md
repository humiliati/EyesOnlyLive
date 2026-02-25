# Quick Start: Real-World Business Participation System

## 5-Minute Setup Guide

### Step 1: Access M-Console Mode
1. Open the application
2. Click the "M CONSOLE" button in the top-right header
3. You're now in game master mode

### Step 2: Create Your First Real-World Item

1. **Scroll down to "Real World Item Crafter"**
   - It's in the M-Console section, near the top

2. **Click "Craft Item"**
   - This opens the crafting dialog

3. **Fill in Item Details:**
   ```
   Item Name: MYSTERY ENVELOPE
   Emoji: ✉️
   Type: Intel
   Rarity: Rare
   Description: Sealed envelope with classified documents
   One-Time Only: ✓ (checked)
   ```

4. **Fill in Business Owner Details:**
   ```
   Business Name: Joe's Coffee Shop
   Owner Name: Joe Smith
   Contact Email: joe@coffeeshop.com
   Contact Phone: 555-0123
   Address: 123 Main Street
   Grid X: 2  (Column C)
   Grid Y: 3  (Row 4)
   Notes: Willing to hide items behind counter
   ```

5. **Add Photos:**
   ```
   Click in photo URL field
   Type: /assets/images/envelope-front.jpg
   Click [+] button
   
   Repeat for more photos:
   /assets/images/envelope-seal.jpg
   /assets/images/coffee-shop-exterior.jpg
   ```

6. **Click "Craft Item"**
   - Item is created ✓
   - Debrief entry automatically generated ✓
   - Photos attached ✓

### Step 3: View in Debrief Feed

1. **Scroll down to "Debrief Feed"**
   - See your new item entry with timestamp
   - Business name and owner displayed
   - Photo thumbnails visible

2. **Click a Photo Thumbnail**
   - Media player opens above feed
   - Photo displays in 4:3 aspect ratio
   - Try the stretch mode toggle! 🎮

### Step 4: Deploy the Item

1. **Scroll back to "Real World Item Crafter"**
2. **Find your crafted item**
3. **Click "Deploy" button**
   - Status changes to "Deployed"
   - New debrief entry created
   - Item now in the field!

### Step 5: (Optional) Create a Dead Drop

1. **Scroll to "Dead Drop Manager"**
2. **Click "Create Dead Drop"**
3. **Fill in details:**
   ```
   Name: ALPHA CACHE
   Grid X: 2, Grid Y: 3  (Same as coffee shop)
   Select items to include
   Requires Code: ✓
   Code: SHADOW7
   ```
4. **Click "Create Drop"**
   - Debrief entry auto-created
   - Location marked on tactical map

## Real-World Workflow Example

### Scenario: Local Business ARG Partnership

**Week 1: Setup**
1. Visit "Joe's Coffee Shop" in real life
2. Talk to owner about ARG participation
3. Take photos of: business exterior, interior, hiding spot
4. Get business card for contact info

**Week 2: Digital Setup**
1. Create real-world item in system
2. Enter all business details
3. Upload 3-5 photos showing location and item
4. Deploy item digitally

**Week 3: Player Experience**
1. Players receive intel about "Coffee Shop Cache"
2. Game master tracks via tactical map
3. Photos help players identify exact location
4. Players visit real business during gameplay

**Week 4: Retrieval & Debrief**
1. Player retrieves item from coffee shop
2. Game master marks as retrieved in system
3. Debrief feed shows complete timeline
4. Business owner satisfied with participation

## Common Workflows

### Adding a Business Partner

```
1. RealWorldItemCrafter → "Craft Item"
2. Fill business details first
3. Add 2-3 photos minimum:
   - Business exterior
   - Contact person
   - Drop location (if visible)
4. Note participation details in notes field
```

### Tracking Multi-Item Event

```
1. Create multiple items for same business:
   - Each with unique ID
   - All reference same business name
   - Different grid locations (if spread out)
2. Deploy all items together
3. Monitor via Debrief Feed
4. Track retrievals individually
```

### Photo Documentation Best Practices

```
Photo 1: Wide shot of business exterior
Photo 2: Business signage/branding
Photo 3: Owner or contact person
Photo 4: Specific drop location
Photo 5: Item itself (if prepared beforehand)
```

## Quick Reference

### Photo Path Format
```
/assets/images/business-name-description.jpg
/assets/images/joes-coffee-exterior.jpg
/assets/images/envelope-sealed.jpg
```

### Grid Coordinates
```
gridX: 0-7 → Columns A-H
gridY: 0-7 → Rows 1-8
Example: gridX=2, gridY=3 → "Grid C4"
```

### Item Status Flow
```
Crafted → [Deploy] → Deployed → [Retrieve] → Retrieved
```

### Debrief Entry Types
```
🏢 item-crafted        - New item created
📦 item-deployed       - Item ready in field
✅ item-retrieved      - Item collected by player
🏪 business-participation - General business event
📸 photo-added         - New media uploaded
```

## Keyboard Shortcuts & Tips

### Navigation
- Scroll down in M-Console to see all tools
- Use browser search (Ctrl+F) to find specific businesses

### Media Player
- Click thumbnail to open player
- Toggle stretch mode for retro N64 style
- Click [X] to close and continue browsing

### Incinerator Usage
- 🔥 on entry = delete that entry only
- 🔥 Incinerate All = clear entire feed (with confirmation)
- Useful for starting fresh after testing

## Troubleshooting

### "Photos required" error
- Add at least 1 photo URL before crafting
- Check photo path is properly formatted
- Ensure path starts with `/assets/` or full URL

### Can't deploy item
- Check item status is "Crafted"
- Refresh page if button is disabled
- Verify item exists in list

### Debrief entry not appearing
- Check M-Console mode is enabled
- Verify DebriefMediaFeed component is visible
- Scroll down to find it below RealWorldItemCrafter

### Photo not displaying in player
- Verify file path is correct
- Check file exists at that location
- Try full URL instead of relative path

## Next Steps

### Expand Your System

1. **Add More Businesses**
   - Build your network of partners
   - Document each thoroughly
   - Maintain contact spreadsheet

2. **Create Item Categories**
   - Use types to organize (intel, tools, evidence)
   - Set rarity for game balance
   - Mark special items as one-time-only

3. **Coordinate with Map**
   - Use grid coordinates strategically
   - Spread items across play area
   - Create logical progression paths

4. **Document Everything**
   - Use Debrief Feed as audit trail
   - Track participation timeline
   - Generate reports for partners

### Integration with Other Systems

- **Dead Drops**: Link real items to dead drop system
- **ARG Events**: Include items in timed events
- **Equipment Inventory**: Track physical equipment
- **Tactical Map**: View business locations on grid

## Support & Resources

- Full Documentation: `REAL_WORLD_BUSINESS_TRACKING.md`
- System Architecture: `ARCHITECTURE_ARG.md`
- Live ARG Setup: `LIVE_ARG_SYSTEM.md`
- Equipment Guide: `EQUIPMENT_EXAMPLES.md`

## Example: Complete Item Creation

```typescript
// Item Details
Item Name: VINTAGE RADIO
Emoji: 📻
Type: Tool
Rarity: Epic
Description: Working 1950s radio with hidden compartment
One-Time Only: Yes

// Business Owner
Business Name: Vintage Electronics Emporium
Owner Name: Margaret Chen
Contact Email: margaret@vintage-electronics.com
Contact Phone: 555-0199
Address: 789 Retro Boulevard, Suite 4
Grid X: 5 (Column F)
Grid Y: 2 (Row 3)
Notes: Owner is vintage radio enthusiast, willing to demonstrate item to players who ask. Shop open Tue-Sat 10am-6pm.

// Photos
1. /assets/images/vintage-electronics-storefront.jpg
2. /assets/images/radio-exterior-view.jpg
3. /assets/images/radio-hidden-compartment.jpg
4. /assets/images/margaret-with-radio.jpg
5. /assets/images/shop-interior-display.jpg

// Result
✓ Real-world item created: RWI-1234567890-ABC123DEF
✓ Game item ID: ITM-1234567890-ABC123
✓ Business registered: BIZ-1234567890-ABC123
✓ 5 photos attached and ready for viewing
✓ Debrief entry created with full details
✓ Grid location F3 marked
✓ Ready to deploy!
```

---

**Pro Tip:** Start small with 2-3 friendly local businesses, perfect the workflow, then expand to your full partner network. Document your process as you go!
