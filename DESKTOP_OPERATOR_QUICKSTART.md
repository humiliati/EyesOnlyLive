# Desktop Operator Quick Start Guide

**Goal:** Get M Console operators productive in 10 minutes

---

## 🚀 Accessing M Console Mode

1. Open the Field Telemetry app in your browser
2. Look for the **M CONSOLE / WATCH** toggle button in the top-right header
3. Click it to switch to **M CONSOLE** mode
4. The interface will expand to show all operator tools

**You now have access to:**
- Game Control (freeze/unfreeze)
- Event Sequencer
- Visual Timeline Editor
- Scenario Creator
- Red Team Management
- ARG System
- Business Tracking
- And 20+ more advanced features

---

## ⚡ Essential Workflows

### 1. Deploy Your First Scenario (2 minutes)

**What it does:** Activates a complete mission with lanes and objectives

```
Steps:
1. Scroll to "Scenario Creator" panel
2. Fill in:
   - Name: "OPERATION ALPHA"
   - Description: "Test mission deployment"
   - Threat Level: HIGH
3. Add an objective: "Secure the perimeter"
4. Create a lane:
   - Name: "North Patrol"
   - Start: A1, End: D1
   - Check 2 agents to assign
5. Click "DEPLOY SCENARIO"
6. Watch it broadcast to all field watches!
```

**What happens:**
- All watches receive the scenario
- Mission data updates
- Lanes appear on tactical maps
- Assets reposition if configured
- Logs in mission log and ops feed

---

### 2. Create an Automated Event Sequence (3 minutes)

**What it does:** Sends timed broadcasts automatically

```
Steps:
1. Find "Event Sequencer Panel"
2. Click "New Sequence"
3. Name: "Mission Briefing Cascade"
4. Click "Add Step"
   - Type: M-Ping
   - Delay: 0 seconds
   - Message: "Mission briefing in 60 seconds"
   - Priority: High
5. Click "Add Step" again
   - Type: Ops Update
   - Delay: 60 seconds
   - Message: "Mission is now ACTIVE"
6. Click "Save"
7. Click the Play button (▶️) to start
8. Watch it execute automatically!
```

**What happens:**
- First message sends immediately
- Second message sends 60 seconds later
- All watches receive broadcasts
- You can pause/resume anytime

---

### 3. Build a Conditional Timeline (5 minutes)

**What it does:** Creates adaptive narratives that respond to player actions

```
Steps:
1. Click "New Timeline" in Timeline Editor card
2. Add Step 1:
   - Type: Broadcast
   - Message: "Acknowledge if ready to proceed"
   - Check "Requires Acknowledgment"
   - Timeout: 30 seconds
3. Click "Branch" button on Step 1
4. Choose "Acknowledgment Received"
5. Inside that branch, add:
   - "Proceeding to next phase"
6. Click "Add Branch" again on Step 1
7. Choose "On Timeout (No ACK)"
8. Inside that branch, add:
   - "URGENT: Respond immediately"
9. Add Step 2 (after branches):
   - "Mission continues"
10. Click "Save Timeline"
```

**What happens:**
- If agents acknowledge → "Proceeding" message
- If no acknowledgment → "URGENT" message
- Then "Mission continues" regardless
- Timeline adapts to player behavior automatically!

---

### 4. Create an ARG Dead Drop (3 minutes)

**What it does:** Places collectible items at physical locations

```
Steps:
1. Open "ARG Event Creator"
2. Event Name: "Operation Alpha Items"
3. Click "Add Item":
   - ID: ITM-001
   - Name: "Tactical Radio"
   - Emoji: 📻
   - Type: tool
   - Rarity: uncommon
4. Save event
5. Go to "ARG Event Dashboard" → Click "Activate"
6. Open "Dead Drop Manager"
7. Create Drop:
   - Name: "Cache Alpha"
   - Grid: C3
   - Code: "NIGHTFALL"
   - Select item: Tactical Radio
8. Click "Create Drop"
```

**What happens:**
- Drop appears on tactical maps at C3
- Agents can enter code "NIGHTFALL" to discover
- Retrieved items add to agent inventory
- Tracked in mission logs

---

### 5. Track Real-World Business Participation (4 minutes)

**What it does:** Documents physical business owner involvement with photos

```
Steps:
1. Open "Real-World Item Crafter"
2. Fill in Business Info:
   - Business: "Joe's Coffee Shop"
   - Owner: "Joe Smith"
   - Email: joe@coffee.com
   - Grid: E5
3. Fill in Item Info:
   - Name: "Secret Document"
   - Emoji: 📄
   - Type: intel
   - Rarity: rare
   - Description: "Classified intel drop"
4. Upload Photos:
   - Click "Add Photo URL"
   - Paste photo URLs (required!)
5. Click "Craft Item"
```

**What happens:**
- Item linked to business owner
- Photos stored permanently
- Appears in Debrief Media Feed with adaptive player
- Shows on Business Map Overlay
- Tracked in Business Partnership Directory
- Can drag onto map to create dead drop

---

### 6. Freeze the Game (30 seconds)

**What it does:** Pauses all operations for technical issues or coordination

```
Steps:
1. Top of M Console: Find "Game Control Panel"
2. Enter reason: "Technical difficulty"
3. Click "FREEZE GAME"
4. All watches show "GAME FROZEN" banner
5. When ready: Click "RESUME GAME"
```

**What happens:**
- Immediate broadcast to all watches
- "GAME FROZEN" alert on all screens
- All telemetry updates pause
- Mission log records freeze
- Resume restarts everything

---

### 7. Monitor Red Team (1 minute)

**What it does:** Tracks Red Team player locations and vitals

```
Steps:
1. Add players in "Red Team Management Panel":
   - Callsign: "SHADOW-ALPHA"
   - Click "Add Player"
   - Enable "GPS Transmission"
2. View "Red Team Telemetry Panel"
3. See live data:
   - GPS coordinates
   - Grid position
   - Heart rate, stress, etc.
   - Auto-refreshes every 5s
```

**What happens:**
- Red Team players transmit telemetry
- You see positions on tactical map
- Monitor safety via biometrics
- Detect geofence breaches
- Color-coded alerts for issues

---

## 🎯 Quick Tips

### Most Powerful Features

1. **Visual Timeline Editor** → Adaptive narratives based on player responses
2. **Event Sequencer** → Automate complex multi-step operations
3. **ARG System** → Physical world integration with collectibles
4. **Business Tracking** → Document real participation with photos
5. **Game Control** → Master pause/resume for coordination

### Audio Alerts

The system plays sounds for:
- High priority M-Pings
- Critical operations feed entries
- Geofence breaches
- Emergency alerts

(Make sure your volume is on!)

### Common Pitfalls

❌ **Don't:**
- Modify running sequences (pause first)
- Delete deployed equipment/items (breaks audit trail)
- Forget to activate ARG events before creating drops
- Create sequences over 20 steps (performance issues)

✅ **Do:**
- Use broadcast templates for common messages
- Schedule broadcasts ahead of time
- Monitor acknowledgment trackers
- Clean up completed sequences
- Export logs regularly

### Recommended M Console Workflow

```
Pre-Game:
1. Add Red Team players
2. Create ARG events and activate
3. Build event sequences
4. Prepare broadcast templates
5. Set up business partnerships
6. Configure scenarios

During Game:
1. Deploy scenarios as needed
2. Start automated sequences
3. Monitor Red Team telemetry
4. Check acknowledgment trackers
5. Create dead drops on the fly
6. Freeze/unfreeze as needed

Post-Game:
1. Generate After Action Report
2. Export communications log
3. Review debrief media feed
4. Document business participation
5. Archive or delete old data
```

---

## 📚 Learn More

**Comprehensive Documentation:**
- `DESKTOP_SYNC_MASTER_GUIDE.md` - Complete system architecture (150+ pages)

**Feature-Specific Guides:**
- `EVENT_SEQUENCER.md` - Deep dive on automated sequences
- `VISUAL_TIMELINE_EDITOR.md` - Conditional branching logic
- `ARCHITECTURE_ARG.md` - ARG system architecture
- `GAME_STATE_SYNC.md` - Red Team and freeze controls
- `REAL_WORLD_BUSINESS_TRACKING.md` - Business participation system
- `M_CONSOLE_SYNC.md` - Broadcast architecture

**Quick Starts:**
- `QUICK_START_ARG.md` - ARG system basics
- `QUICK_START_BUSINESS.md` - Business tracking basics
- `QUICK_START_SEQUENCER.md` - Event sequencer basics

---

## 🆘 Getting Help

### Troubleshooting

**"Broadcasts not received"**
→ Toggle M Console mode off and back on

**"Sequence not executing"**
→ Check status is "active" (not paused)
→ Check browser console for errors

**"Telemetry not updating"**
→ Verify game is not frozen
→ Check GPS transmission enabled

**"Items not in inventory"**
→ Make sure ARG event is activated
→ Verify dead drop was retrieved (not just discovered)

### Browser Console

Press `F12` to open developer tools and check console for:
- Broadcast logs
- Sync errors
- Execution traces

### Reset Data

If things get broken:
1. Open browser dev tools (F12)
2. Go to Application → Storage
3. Clear Spark KV data
4. Refresh page
(Warning: This deletes everything!)

---

## 🎮 Practice Scenarios

Try these to master the M Console:

### Beginner: "The Briefing"
```
1. Deploy a scenario
2. Create a 3-step sequence
3. Monitor ops feed for activity
4. Freeze and unfreeze game
```

### Intermediate: "The Dead Drop"
```
1. Create ARG event with 3 items
2. Activate event
3. Create 2 dead drops at different grids
4. Track items in inventory viewer
5. Transfer item between agents
```

### Advanced: "The Adaptive Mission"
```
1. Build timeline with 2 branches
2. First step requires acknowledgment
3. Branch A: If ACK → proceed to objective
4. Branch B: If no ACK → send reminder
5. Add Red Team geofence at objective
6. Create dead drop at completion point
```

---

## 🌟 You're Ready!

You now have the essential knowledge to operate the M Console effectively. The system is deep—explore the comprehensive guides as you get comfortable.

**Remember:**
- Start simple and build up
- Test sequences before live deployment
- Monitor acknowledgment trackers
- Use freeze/unfreeze for coordination
- Export logs for debriefs

**Happy Operating! 🎯**
