# Equipment Inventory - Example Data

## Sample Equipment Items

Below are example equipment items to help you get started with the inventory system. These demonstrate the different categories and deployment scenarios.

### Weapons
```json
{
  "name": "Glock 19 Gen5",
  "category": "weapon",
  "serialNumber": "WPN-G19-7482",
  "priority": "high",
  "description": "9mm service pistol with night sights and extended magazine",
  "encrypted": false,
  "requiresAcknowledgment": true,
  "notes": "Requires qualification certification before assignment"
}
```

### Communications
```json
{
  "name": "AN/PRC-152 Radio",
  "category": "communication",
  "serialNumber": "COM-152-3329",
  "priority": "critical",
  "description": "Multi-band tactical radio with SATCOM capability",
  "encrypted": true,
  "requiresAcknowledgment": true,
  "accessCode": "ECHO-7-ALPHA",
  "notes": "Frequency-hopping secure channel. Battery life: 14 hours"
}
```

### Surveillance
```json
{
  "name": "IR Camera System",
  "category": "surveillance",
  "serialNumber": "SVL-IRC-9281",
  "priority": "high",
  "description": "Thermal imaging camera with 8x digital zoom and recording",
  "encrypted": true,
  "requiresAcknowledgment": true,
  "accessCode": "SIERRA-4-BRAVO",
  "notes": "256GB storage, night vision capable"
}
```

### Medical
```json
{
  "name": "IFAK Trauma Kit",
  "category": "medical",
  "serialNumber": "MED-IFAK-5563",
  "priority": "normal",
  "description": "Individual First Aid Kit with tourniquet and hemostatic agents",
  "encrypted": false,
  "requiresAcknowledgment": false,
  "notes": "Check expiration dates on medication"
}
```

### Explosives
```json
{
  "name": "Breaching Charge",
  "category": "explosive",
  "serialNumber": "EXP-BRC-1147",
  "priority": "critical",
  "description": "Door breaching explosive with remote detonator",
  "encrypted": true,
  "requiresAcknowledgment": true,
  "accessCode": "TANGO-9-CHARLIE",
  "notes": "EXTREME CAUTION - Requires dual authorization for deployment"
}
```

### Tools
```json
{
  "name": "Lock Pick Set",
  "category": "tool",
  "serialNumber": "TOOL-LPS-8891",
  "priority": "normal",
  "description": "Professional lock picking kit with tension wrenches",
  "encrypted": false,
  "requiresAcknowledgment": false,
  "notes": "Practice set - do not use on live targets"
}
```

### Documents
```json
{
  "name": "Intelligence Brief Delta",
  "category": "document",
  "serialNumber": "DOC-INT-4726",
  "priority": "critical",
  "description": "Classified intelligence report on Operation Nightfall",
  "encrypted": true,
  "requiresAcknowledgment": true,
  "accessCode": "WHISKEY-2-DELTA",
  "notes": "Destroy after reading - NO COPIES"
}
```

### Currency
```json
{
  "name": "Emergency Cash Fund",
  "category": "currency",
  "serialNumber": "CUR-USD-9932",
  "priority": "normal",
  "description": "$5,000 USD in mixed denominations",
  "encrypted": false,
  "requiresAcknowledgment": true,
  "notes": "For emergency extraction or bribery situations"
}
```

## Sample Dead Drop Deployment

### Scenario: Intelligence Document Dead Drop
```
Equipment: Intelligence Brief Delta (DOC-INT-4726)
Deployment Type: Dead Drop
Location Name: PARK BENCH ALPHA
Grid: C4
GPS: 40.712800, -74.006000
Expiration: 6 hours
Access Code: WHISKEY-2-DELTA
Notes: Under park bench, third from north entrance. Marked with chalk "X". Retrieve before 1800 hours.
```

### Scenario: Weapon Cache
```
Equipment: Glock 19 Gen5 (WPN-G19-7482)
Deployment Type: Geocache
Location Name: WAREHOUSE LOCKER #47
Grid: F6
GPS: 40.715200, -74.010500
Expiration: 24 hours
Access Code: N/A
Notes: Behind false panel in northwest corner. Combination lock: 23-47-11
```

### Scenario: Communications Equipment Assignment
```
Equipment: AN/PRC-152 Radio (COM-152-3329)
Deployment Type: Agent
Target: PHANTOM-3
Assignment: Radio assigned for duration of Operation Nightfall
Notes: Return to equipment pool upon mission completion
```

## Equipment Management Workflow Examples

### Pre-Mission Equipment Issue
1. Create equipment items for mission
2. Mark all as "available" in inventory
3. Deploy critical items to staging areas as geocaches
4. Assign personal equipment directly to agents
5. Set expiration times for temporary caches
6. Brief agents on access codes and locations

### During Mission
1. Monitor equipment locations on map overlay
2. Track expiration times for time-sensitive deployments
3. Mark equipment as "retrieved" when agents confirm pickup
4. Redeploy equipment to new locations as mission evolves
5. Mark compromised if locations are discovered

### Post-Mission
1. Retrieve all deployed equipment
2. Mark items as "retrieved" or "destroyed"
3. Review equipment history for accountability
4. Generate after-action report including equipment movements
5. Clean up expired deployments
6. Reset available equipment for next mission

## Integration Examples

### With Mission Log
Equipment actions automatically log to mission timeline:
- "Equipment Deployed: AN/PRC-152 Radio to DEAD-DROP: PARK BENCH ALPHA"
- "Equipment Retrieved: Intelligence Brief Delta from PARK BENCH ALPHA"
- "CRITICAL: Equipment Compromised - Breaching Charge at WAREHOUSE LOCKER #47"

### With Operations Feed
High-priority equipment generates ops feed entries:
- "DEAD-DROP established: PARK BENCH ALPHA - Intelligence Brief Delta"
- "Equipment retrieved: PHANTOM-3 recovered Glock 19 Gen5"
- "⚠️ ALERT: Breaching Charge marked as COMPROMISED"

### With Communications Log
Acknowledgment-required equipment creates comm log entries:
- Direction: Outgoing
- From: SHADOW-7
- To: ALL-STATIONS
- Message: "DEAD-DROP: PARK BENCH ALPHA at Grid C4 - ACK required"
- Priority: Critical
- Encrypted: Yes

## Security Considerations

### Access Codes
- Always use unique access codes per deployment
- Rotate codes after each use
- Store codes separately from deployment data
- Never transmit codes in clear text

### Expiration Times
- Set realistic expiration based on environment
- Dead drops in high-traffic areas: 2-6 hours
- Geocaches in secure locations: 24-48 hours
- Critical items: Shortest possible window
- Always retrieve before expiration

### Compromise Protocol
1. Immediately mark item as "compromised" in system
2. Log detailed notes about how compromise occurred
3. Generate mission log entry
4. Notify all agents via ops feed
5. Do not attempt retrieval if hostile presence confirmed
6. Update operational security procedures

### Chain of Custody
Every equipment item maintains complete history:
- Who created it
- When/where it was deployed
- Who deployed it
- All transfers and movements
- Retrieval information
- Final disposition

Use this history for:
- Accountability audits
- Post-mission analysis
- Training scenarios
- Operational improvements
