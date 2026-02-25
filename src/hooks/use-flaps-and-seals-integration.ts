import { useEffect, useState } from 'react'
import { gameStateSync } from '@/lib/gameStateSync'

export interface GameModifiers {
  lootTableMultiplier: number
  dropRateMultiplier: number
  overduePingCount: number
  gameMode: 'normal' | 'degraded' | 'critical'
  isFrozen: boolean
  emergencyPanicActive: boolean
}

export function useFlapsAndSealsIntegration() {
  const [modifiers, setModifiers] = useState<GameModifiers>({
    lootTableMultiplier: 1.0,
    dropRateMultiplier: 1.0,
    overduePingCount: 0,
    gameMode: 'normal',
    isFrozen: false,
    emergencyPanicActive: false
  })

  useEffect(() => {
    gameStateSync.startSync(2000)

    const updateModifiers = async () => {
      const gameState = await gameStateSync.getGameState()
      const gameStateForFlaps = await gameStateSync.getGameStateForFlapsAndSeals()

      setModifiers({
        ...gameStateForFlaps,
        isFrozen: gameState.frozen,
        emergencyPanicActive: gameState.emergencyPanicActive
      })
    }

    updateModifiers()

    const unsubscribeGameState = gameStateSync.onGameStateChange(async () => {
      await updateModifiers()
    })

    const unsubscribePingStatus = gameStateSync.onPingStatusChange(async () => {
      await updateModifiers()
    })

    const refreshInterval = setInterval(updateModifiers, 5000)

    return () => {
      gameStateSync.stopSync()
      unsubscribeGameState()
      unsubscribePingStatus()
      clearInterval(refreshInterval)
    }
  }, [])

  return modifiers
}

export function applyLootTableModifiers(baseLootTable: any[], modifier: number): any[] {
  return baseLootTable.map(item => ({
    ...item,
    dropRate: item.dropRate * modifier,
    quantity: Math.max(1, Math.floor((item.quantity || 1) * modifier))
  }))
}

export function applyDropRateModifiers(baseDropRate: number, modifier: number): number {
  return Math.max(0, Math.min(1, baseDropRate * modifier))
}

export function getGameModeMessage(mode: 'normal' | 'degraded' | 'critical', overduePingCount: number): string {
  switch (mode) {
    case 'critical':
      return `⚠️ CRITICAL: ${overduePingCount} unacknowledged M pings! Drop rates severely degraded!`
    case 'degraded':
      return `⚠️ WARNING: ${overduePingCount} unacknowledged M pings. Drop rates reduced.`
    default:
      return overduePingCount > 0 
        ? `⚠️ ${overduePingCount} unacknowledged ping(s). Slight penalty active.`
        : '✓ All systems nominal'
  }
}
