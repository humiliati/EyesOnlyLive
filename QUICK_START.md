# Quick Start Guide: Red Team & Game State Sync

## For M Console Operators

### Freezing the Game
1. Click "M CONSOLE" button in header
2. Find "Game Control Panel" at top
3. Type freeze reason (e.g., "Technical issue")
4. Click "FREEZE GAME"
5. All watches pause within 1-2 seconds
6. Click "RESUME GAME" when ready

### Emergency Panic
1. In Game Control Panel
2. Click red "EMERGENCY PANIC" button
3. Immediate halt across all systems
4. Resume when situation resolved

### Monitoring Red Team
1. Enable "M CONSOLE" mode
2. Scroll to "Red Team Telemetry" panel
3. See all transmitting players
4. View GPS coordinates and vitals
5. Stale players (>30s) fade out

## For Red Team Players

### Accessing Your Watch
1. Go to flapsandseals.com (NOT /ops)
2. Login with Red Team credentials
3. See simplified red interface

### Transmitting GPS
1. Find "Transmission" card
2. Toggle "TRANSMITTING GPS" to ON
3. Your location streams to M Console
4. Toggle OFF to stop transmission

### Acknowledging M Pings
1. M Ping appears at top when issued
2. Read the message
3. Click "ACKNOWLEDGE" button
4. Choose response type if needed
5. **Must respond within 30 seconds!**

### What Happens If You Don't Respond
- Ping marked as "overdue" after 30s
- Flaps & Seals loot penalties apply
- 1-2 overdue: -15% loot
- 3-4 overdue: -40% loot
- 5+ overdue: -70% loot

## For Flaps & Seals Developers

### Adding the Integration Hook

```tsx
// 1. Import the hook
import { 
  useFlapsAndSealsIntegration, 
  applyLootTableModifiers,
  getGameModeMessage 
} from './hooks/use-flaps-and-seals-integration'

// 2. Use in your game component
function YourGame() {
  const modifiers = useFlapsAndSealsIntegration()
  
  // 3. Show status to player
  const statusMsg = getGameModeMessage(
    modifiers.gameMode, 
    modifiers.overduePingCount
  )
  
  // 4. Handle freeze
  if (modifiers.isFrozen) {
    return <div className="freeze-banner">
      Game Frozen - Check your watch
    </div>
  }
  
  // 5. Apply penalties to loot
  const baseLoot = [
    { item: 'sword', dropRate: 0.1, quantity: 1 },
    { item: 'coin', dropRate: 0.5, quantity: 10 }
  ]
  
  const actualLoot = applyLootTableModifiers(
    baseLoot, 
    modifiers.lootTableMultiplier
  )
  
  // 6. Generate loot using penalized table
  return <div>
    <div className="status">{statusMsg}</div>
    {/* Your game here */}
  </div>
}
```

### Testing Penalties

```tsx
// In dev tools console
await gameStateSync.recordPing({
  pingId: 'test-ping-1',
  targetAgentId: 'test-agent',
  targetCallsign: 'TEST',
  issuedAt: Date.now(),
  timeoutMs: 30000,
  acknowledged: false
})

// Wait 30+ seconds, then check
const state = await gameStateSync.getGameStateForFlapsAndSeals()
console.log(state)
// { lootTableMultiplier: 0.85, dropRateMultiplier: 0.8, ... }
```

## Common Issues

### Red Team GPS Not Showing
**Problem**: M Console shows "No Red Team players transmitting"
**Solution**: 
- Verify Red Team player has toggled "TRANSMITTING GPS" to ON
- Check player is online (not stale >30s)
- Refresh M Console panel

### Freeze Not Propagating
**Problem**: Watch doesn't show freeze banner
**Solution**:
- Check browser console for sync errors
- Verify KV storage is accessible
- Refresh the page
- Check freeze reason was entered

### Penalties Not Applying
**Problem**: Flaps & Seals loot is normal despite overdue pings
**Solution**:
- Verify `useFlapsAndSealsIntegration` hook is imported
- Check `applyLootTableModifiers` is called before loot generation
- Verify at least 30s have passed since ping was issued
- Check browser console for `game-state-sync:ping:` keys in KV

### Player Can't Acknowledge Ping
**Problem**: Acknowledge button doesn't work
**Solution**:
- Verify ping is still visible (not already acknowledged)
- Check game isn't frozen
- Refresh the watch
- Check browser console for errors

## Advanced: Manual KV Operations

### Check Game State
```tsx
const state = await spark.kv.get('game-state-sync:game-state')
console.log(state)
```

### View All Overdue Pings
```tsx
const overdue = await gameStateSync.getOverduePings()
console.log(overdue)
```

### Manually Freeze Game
```tsx
await gameStateSync.freezeGame('Test freeze', 'Admin')
```

### Manually Unfreeze
```tsx
await gameStateSync.unfreezeGame()
```

### Clear All Pings
```tsx
const keys = await spark.kv.keys()
const pingKeys = keys.filter(k => k.startsWith('game-state-sync:ping:'))
for (const key of pingKeys) {
  await spark.kv.delete(key)
}
```

### View Red Team Telemetry
```tsx
const telemetry = await gameStateSync.getAllTelemetry()
const redTeam = telemetry.filter(t => t.playerTeam === 'red')
console.log(redTeam)
```

## Tips & Best Practices

### For M Console Operators
- Always provide clear freeze reasons
- Use emergency panic only for critical situations
- Monitor Red Team telemetry panel regularly
- Track overdue ping count to gauge compliance
- Unfreeze promptly to maintain game flow

### For Red Team Players
- Enable GPS transmission at mission start
- Acknowledge all M Pings within 30 seconds
- Watch for freeze notifications
- Don't rely on Flaps & Seals if you're non-compliant

### For Game Masters
- Test freeze/resume before live exercises
- Brief Red Team players on M Ping importance
- Explain Flaps & Seals penalty system clearly
- Have backup plan if sync issues occur
- Monitor browser console for errors

## Support Resources

- **Technical Details**: See GAME_STATE_SYNC.md
- **Integration Guide**: See RED_TEAM_INTEGRATION.md
- **Architecture**: See IMPLEMENTATION_SUMMARY.md
- **Original Features**: See M_CONSOLE_SYNC.md
