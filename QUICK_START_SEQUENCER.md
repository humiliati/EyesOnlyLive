# Quick Start: Event Sequencer

## What is the Event Sequencer?

The Event Sequencer automates broadcast delivery by creating scheduled chains of events that trigger automatically. Perfect for game masters who want to run complex operations without constant manual intervention.

## 5-Minute Tutorial

### Step 1: Switch to M-Console Mode

1. Open your Watch app
2. Click the **"M CONSOLE"** button in the top header
3. Scroll down to find the **Event Sequencer** panel

### Step 2: Use a Template (Easiest Way)

1. Find the **Sequence Templates** panel below the Event Sequencer
2. Browse pre-built sequences like:
   - **Mission Kickoff**: Standard mission start with countdown
   - **Intel Discovery Arc**: Progressive intel reveal
   - **Threat Escalation**: Increasing danger levels
   - **Extraction Countdown**: Timed extraction sequence

3. Click any template to preview it
4. Click **"Use This Template"** to create it
5. The sequence appears in the Event Sequencer as "draft"

### Step 3: Start Your Sequence

1. In the Event Sequencer panel, find your new sequence
2. Click the **Play button** (▶️)
3. Watch the status change to **ACTIVE**
4. See the countdown: "Next in 10s..."

### Step 4: Monitor Progress

The sequence card shows:
- **Steps completed** (e.g., "2/5")
- **Next step timer** (countdown)
- **Status badge** (ACTIVE/PAUSED/COMPLETED)

All Watch apps receive the broadcasts automatically!

### Step 5: Control Execution

**Pause**: Click ⏸️ to suspend (can resume later)
**Resume**: Click ▶️ on paused sequence
**Cancel**: Click ⏹️ to stop permanently

## Common Sequences

### For Mission Start
Use **"Mission Kickoff"** template:
- Sends 60-second warning
- Broadcasts "MISSION ACTIVE"
- Marks objective on map

### For Story Moments
Use **"Intel Discovery Arc"** template:
- Shows decryption progress
- Creates suspense with timing
- Reveals location dramatically

### For Patrols
Use **"Hourly Patrol Reminder"** template:
- Repeats automatically
- Sends checkpoint reminders
- Requests status reports

### For Emergencies
Use **"Threat Escalation"** template:
- Raises threat levels progressively
- Creates safe zones
- Builds tension

## Creating Custom Sequences

### Method 1: From Scratch

1. Click **"New Sequence"** in Event Sequencer
2. Name it (e.g., "Custom Mission Brief")
3. Add description
4. Click **"Add Step"** for each event:
   - Choose type (M-Ping, Ops Update, etc.)
   - Set delay in seconds
   - Configure message/payload
5. Click **"Create Sequence"**

### Method 2: Clone & Modify

1. Find similar sequence
2. Click **Copy icon** (📋)
3. New copy appears as "{Name} (Copy)"
4. Modify as needed

## Best Practices

✅ **DO**:
- Test sequences before live gameplay
- Use templates as starting points
- Monitor active sequences
- Keep delays reasonable (not too fast)
- Name sequences clearly

❌ **DON'T**:
- Run 10+ sequences simultaneously
- Create 50+ step sequences (break into multiple)
- Forget to pause before mission changes
- Use confusing names

## Timing Guide

**Short Delays** (5-15 seconds):
- Quick acknowledgments
- Rapid status updates
- Action sequences

**Medium Delays** (30-120 seconds):
- Normal progression
- Story beats
- Intel reveals

**Long Delays** (5+ minutes):
- Patrol checkpoints
- Scheduled briefings
- Background events

## Troubleshooting

**Sequence won't start?**
- Check it's in "draft" status (not "scheduled")
- Verify at least one step exists
- Ensure M-Console sync is active

**Steps not executing?**
- Confirm status is "ACTIVE" (not paused)
- Check browser tab is active
- Verify M-Console connection

**Wrong timing?**
- Remember delays are from PREVIOUS step
- First step executes immediately + delay
- Each step waits for its own delay

**Watch apps not receiving?**
- Ensure Watch apps are in "WATCH" mode (not M-Console)
- Check M-Console sync status
- Verify broadcasts appear in M-Console first

## Pro Tips

🎯 **Dramatic Timing**: Use 2-3 minute delays for story reveals
🔄 **Repeating Patrols**: Enable repeat on patrol sequences
⏰ **Schedule Starts**: Set future start times for timed events
📋 **Template Library**: Build your own template collection
🎬 **Cascade Effects**: Chain multiple sequences for complex operations

## Example: Running Your First Mission

1. **Pre-Game Setup**:
   - Use "Mission Kickoff" template
   - Clone for backup
   - Review step timing

2. **Start Mission**:
   - Brief players verbally
   - Click ▶️ on sequence
   - Watch countdown begin

3. **During Mission**:
   - Monitor sequence progress
   - Pause if needed
   - Players receive broadcasts automatically

4. **Mission End**:
   - Sequence completes automatically
   - Status changes to "COMPLETED"
   - Review logs in Watch apps

## Next Steps

Once comfortable with templates:
1. **Create custom sequences** for your scenarios
2. **Combine with other M-Console tools** (scenarios, annotations)
3. **Build sequence library** for recurring missions
4. **Experiment with timing** to perfect pacing

## Need Help?

Check the full documentation in `EVENT_SEQUENCER.md` for:
- Advanced features
- Technical details
- API reference
- More examples

---

**Remember**: The Event Sequencer handles broadcast timing, so you can focus on running the game!
