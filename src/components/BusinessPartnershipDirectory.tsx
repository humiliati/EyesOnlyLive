import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, 
  Package, 
  CheckCircle, 
  Clock, 
  MapPin, 
  TrendUp,
  Phone,
  EnvelopeSimple,
  Notepad,
  Plus,
  PencilSimple,
  Trash,
  MapTrifold,
  ChartBar,
  Star,
  User,
  Calendar
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { type RealWorldItem } from '@/components/RealWorldItemCrafter'

export interface BusinessPartner {
  id: string
  businessName: string
  ownerName: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  gridX?: number
  gridY?: number
  notes?: string
  addedAt: number
  addedBy: string
  tags?: string[]
  participationLevel?: 'new' | 'partner' | 'active' | 'elite'
  totalValue?: number
}

export interface BusinessContact {
  id: string
  businessId: string
  contactName: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  isPrimary?: boolean
  notes?: string
  addedAt: number
}

export interface BusinessParticipation {
  businessId: string
  totalItems: number
  craftedItems: number
  deployedItems: number
  retrievedItems: number
  totalPhotos: number
  firstInteraction: number
  lastInteraction: number
  gridLocations: Array<{ x: number; y: number }>
}

interface BusinessPartnershipDirectoryProps {
  maxHeight?: string
  onSelectBusiness?: (businessId: string) => void
  onNavigateToGrid?: (gridX: number, gridY: number) => void
  highlightedBusinessId?: string
}

export function BusinessPartnershipDirectory({ 
  maxHeight = '600px',
  onSelectBusiness,
  onNavigateToGrid,
  highlightedBusinessId
}: BusinessPartnershipDirectoryProps) {
  const [businesses, setBusinesses] = useKV<BusinessPartner[]>('business-partners', [])
  const [contacts, setContacts] = useKV<BusinessContact[]>('business-contacts', [])
  const [items] = useKV<RealWorldItem[]>('real-world-items', [])
  
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'directory' | 'stats' | 'map'>('directory')

  const [formData, setFormData] = useState<Partial<BusinessPartner>>({
    businessName: '',
    ownerName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    notes: '',
    tags: []
  })

  const [contactFormData, setContactFormData] = useState<Partial<BusinessContact>>({
    contactName: '',
    contactRole: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    isPrimary: false
  })

  const participationStats = useMemo((): Map<string, BusinessParticipation> => {
    const statsMap = new Map<string, BusinessParticipation>()

    items?.forEach(item => {
      const businessId = item.businessOwner.id
      const existing = statsMap.get(businessId) || {
        businessId,
        totalItems: 0,
        craftedItems: 0,
        deployedItems: 0,
        retrievedItems: 0,
        totalPhotos: 0,
        firstInteraction: item.createdAt,
        lastInteraction: item.createdAt,
        gridLocations: []
      }

      existing.totalItems++
      existing.totalPhotos += item.photos.length
      
      if (item.retrievedAt) {
        existing.retrievedItems++
      } else if (item.deployed) {
        existing.deployedItems++
      } else {
        existing.craftedItems++
      }

      if (item.createdAt < existing.firstInteraction) {
        existing.firstInteraction = item.createdAt
      }
      if (item.createdAt > existing.lastInteraction) {
        existing.lastInteraction = item.createdAt
      }

      if (item.businessOwner.gridX !== undefined && item.businessOwner.gridY !== undefined) {
        const gridKey = `${item.businessOwner.gridX},${item.businessOwner.gridY}`
        if (!existing.gridLocations.some(loc => loc.x === item.businessOwner.gridX && loc.y === item.businessOwner.gridY)) {
          existing.gridLocations.push({ x: item.businessOwner.gridX!, y: item.businessOwner.gridY! })
        }
      }

      statsMap.set(businessId, existing)
    })

    return statsMap
  }, [items])

  const getParticipationLevel = (itemCount: number): BusinessPartner['participationLevel'] => {
    if (itemCount >= 5) return 'elite'
    if (itemCount >= 3) return 'active'
    if (itemCount >= 1) return 'partner'
    return 'new'
  }

  const getParticipationBadge = (level?: BusinessPartner['participationLevel']) => {
    switch (level) {
      case 'elite': return { label: 'Elite', color: 'bg-accent text-accent-foreground', icon: <Star weight="fill" size={10} /> }
      case 'active': return { label: 'Active', color: 'bg-primary text-primary-foreground', icon: <TrendUp weight="bold" size={10} /> }
      case 'partner': return { label: 'Partner', color: 'bg-secondary text-secondary-foreground', icon: <CheckCircle weight="bold" size={10} /> }
      default: return { label: 'New', color: 'bg-muted text-muted-foreground', icon: <Clock weight="bold" size={10} /> }
    }
  }

  const enrichedBusinesses = useMemo(() => {
    return (businesses || []).map(business => {
      const stats = participationStats.get(business.id)
      return {
        ...business,
        participationLevel: stats ? getParticipationLevel(stats.totalItems) : 'new',
        stats
      }
    })
  }, [businesses, participationStats])

  const filteredBusinesses = useMemo(() => {
    return enrichedBusinesses.filter(business => {
      const matchesSearch = searchQuery === '' || 
        business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterTag === 'all' || 
        business.tags?.includes(filterTag) ||
        (filterTag === 'no-contact' && !business.contactPhone && !business.contactEmail)
      
      return matchesSearch && matchesFilter
    })
  }, [enrichedBusinesses, searchQuery, filterTag])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    businesses?.forEach(b => b.tags?.forEach(t => tags.add(t)))
    return Array.from(tags)
  }, [businesses])

  const selectedBusiness = useMemo(() => {
    return enrichedBusinesses.find(b => b.id === selectedBusinessId)
  }, [enrichedBusinesses, selectedBusinessId])

  const businessContacts = useMemo(() => {
    return (contacts || []).filter(c => c.businessId === selectedBusinessId)
  }, [contacts, selectedBusinessId])

  const overallStats = useMemo(() => {
    const totalBusinesses = enrichedBusinesses.length
    const totalItems = Array.from(participationStats.values()).reduce((sum, p) => sum + p.totalItems, 0)
    const totalPhotos = Array.from(participationStats.values()).reduce((sum, p) => sum + p.totalPhotos, 0)
    const craftedItems = Array.from(participationStats.values()).reduce((sum, p) => sum + p.craftedItems, 0)
    const deployedItems = Array.from(participationStats.values()).reduce((sum, p) => sum + p.deployedItems, 0)
    const retrievedItems = Array.from(participationStats.values()).reduce((sum, p) => sum + p.retrievedItems, 0)

    const byLevel = {
      elite: enrichedBusinesses.filter(b => b.participationLevel === 'elite').length,
      active: enrichedBusinesses.filter(b => b.participationLevel === 'active').length,
      partner: enrichedBusinesses.filter(b => b.participationLevel === 'partner').length,
      new: enrichedBusinesses.filter(b => b.participationLevel === 'new').length
    }

    return {
      totalBusinesses,
      totalItems,
      totalPhotos,
      craftedItems,
      deployedItems,
      retrievedItems,
      byLevel
    }
  }, [enrichedBusinesses, participationStats])

  const handleAddBusiness = () => {
    if (!formData.businessName || !formData.ownerName) {
      toast.error('Business name and owner name are required')
      return
    }

    const newBusiness: BusinessPartner = {
      id: `biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      address: formData.address,
      gridX: formData.gridX,
      gridY: formData.gridY,
      notes: formData.notes,
      tags: formData.tags || [],
      addedAt: Date.now(),
      addedBy: 'M-CONSOLE'
    }

    setBusinesses((current) => [...(current || []), newBusiness])
    toast.success(`Added ${newBusiness.businessName}`)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleUpdateBusiness = () => {
    if (!selectedBusinessId) return

    setBusinesses((current) => {
      return (current || []).map(b => 
        b.id === selectedBusinessId 
          ? { ...b, ...formData }
          : b
      )
    })
    toast.success('Business updated')
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteBusiness = (businessId: string) => {
    const business = enrichedBusinesses.find(b => b.id === businessId)
    if (!business) return

    if (confirm(`Delete ${business.businessName}? This cannot be undone.`)) {
      setBusinesses((current) => (current || []).filter(b => b.id !== businessId))
      setContacts((current) => (current || []).filter(c => c.businessId !== businessId))
      toast.success('Business deleted')
      setSelectedBusinessId(null)
    }
  }

  const handleAddContact = () => {
    if (!selectedBusinessId || !contactFormData.contactName) {
      toast.error('Contact name is required')
      return
    }

    const newContact: BusinessContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      businessId: selectedBusinessId,
      contactName: contactFormData.contactName!,
      contactRole: contactFormData.contactRole,
      contactPhone: contactFormData.contactPhone,
      contactEmail: contactFormData.contactEmail,
      isPrimary: contactFormData.isPrimary,
      notes: contactFormData.notes,
      addedAt: Date.now()
    }

    setContacts((current) => [...(current || []), newContact])
    toast.success(`Added contact ${newContact.contactName}`)
    setIsContactDialogOpen(false)
    resetContactForm()
  }

  const handleDeleteContact = (contactId: string) => {
    setContacts((current) => (current || []).filter(c => c.id !== contactId))
    toast.success('Contact removed')
  }

  const resetForm = () => {
    setFormData({
      businessName: '',
      ownerName: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      notes: '',
      tags: []
    })
  }

  const resetContactForm = () => {
    setContactFormData({
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      isPrimary: false
    })
  }

  const openEditDialog = (business: BusinessPartner) => {
    setSelectedBusinessId(business.id)
    setFormData({
      businessName: business.businessName,
      ownerName: business.ownerName,
      contactPhone: business.contactPhone,
      contactEmail: business.contactEmail,
      address: business.address,
      gridX: business.gridX,
      gridY: business.gridY,
      notes: business.notes,
      tags: business.tags
    })
    setIsEditDialogOpen(true)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <>
      <Card className="border-primary/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building weight="bold" className="text-primary" size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Business Partnership Directory</span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-7 px-2 text-[10px]"
          >
            <Plus weight="bold" size={12} className="mr-1" />
            Add Business
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="directory" className="text-[10px]">
              <Building weight="bold" size={12} className="mr-1" />
              Directory
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-[10px]">
              <ChartBar weight="bold" size={12} className="mr-1" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="map" className="text-[10px]">
              <MapTrifold weight="bold" size={12} className="mr-1" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filterTag === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterTag('all')}
                  className="h-6 px-2 text-[9px]"
                >
                  All ({enrichedBusinesses.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTag === 'no-contact' ? 'default' : 'outline'}
                  onClick={() => setFilterTag('no-contact')}
                  className="h-6 px-2 text-[9px]"
                >
                  No Contact Info
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={filterTag === tag ? 'default' : 'outline'}
                    onClick={() => setFilterTag(tag)}
                    className="h-6 px-2 text-[9px]"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <ScrollArea style={{ maxHeight }}>
              <div className="space-y-2 pr-2">
                {filteredBusinesses.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    {searchQuery ? 'No businesses match your search' : 'No businesses yet'}
                  </div>
                )}

                {filteredBusinesses.map((business) => {
                  const badge = getParticipationBadge(business.participationLevel)
                  const isHighlighted = business.id === highlightedBusinessId
                  const isSelected = business.id === selectedBusinessId
                  
                  return (
                    <Card 
                      key={business.id} 
                      className={`border-border p-3 space-y-2 cursor-pointer transition-all ${
                        isHighlighted ? 'border-accent border-2 shadow-lg' : ''
                      } ${isSelected ? 'bg-secondary/20' : ''}`}
                      onClick={() => {
                        setSelectedBusinessId(business.id === selectedBusinessId ? null : business.id)
                        onSelectBusiness?.(business.id)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{business.businessName}</div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <User weight="bold" size={10} />
                            {business.ownerName}
                          </div>
                        </div>
                        <Badge className={`${badge.color} text-[9px] px-2 py-0 flex-shrink-0 flex items-center gap-1`}>
                          {badge.icon}
                          {badge.label}
                        </Badge>
                      </div>

                      {business.stats && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-1.5 bg-muted/50 rounded">
                            <div className="font-bold tabular-nums">{business.stats.totalItems}</div>
                            <div className="text-[9px] text-muted-foreground">Items</div>
                          </div>
                          <div className="text-center p-1.5 bg-accent/10 rounded">
                            <div className="font-bold tabular-nums">{business.stats.deployedItems}</div>
                            <div className="text-[9px] text-muted-foreground">Deployed</div>
                          </div>
                          <div className="text-center p-1.5 bg-primary/10 rounded">
                            <div className="font-bold tabular-nums">{business.stats.retrievedItems}</div>
                            <div className="text-[9px] text-muted-foreground">Retrieved</div>
                          </div>
                        </div>
                      )}

                      {(business.contactPhone || business.contactEmail) && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            {business.contactPhone && (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <Phone weight="bold" className="text-primary" size={10} />
                                <span>{business.contactPhone}</span>
                              </div>
                            )}
                            {business.contactEmail && (
                              <div className="flex items-center gap-1.5 text-[10px] truncate">
                                <EnvelopeSimple weight="bold" className="text-primary" size={10} />
                                <span className="truncate">{business.contactEmail}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {business.address && (
                        <>
                          <Separator />
                          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                            <MapPin weight="bold" className="text-primary flex-shrink-0 mt-0.5" size={10} />
                            <span className="break-all">{business.address}</span>
                          </div>
                        </>
                      )}

                      {business.gridX !== undefined && business.gridY !== undefined && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-6 text-[9px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            onNavigateToGrid?.(business.gridX!, business.gridY!)
                            toast.success(`Navigate to Grid ${String.fromCharCode(65 + business.gridX!)}${business.gridY! + 1}`)
                          }}
                        >
                          <MapTrifold weight="bold" size={10} className="mr-1" />
                          Grid {String.fromCharCode(65 + business.gridX)}{business.gridY + 1}
                        </Button>
                      )}

                      {business.tags && business.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {business.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[8px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {isSelected && (
                        <>
                          <Separator />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-6 text-[9px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(business)
                              }}
                            >
                              <PencilSimple weight="bold" size={10} className="mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-6 text-[9px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsContactDialogOpen(true)
                              }}
                            >
                              <Plus weight="bold" size={10} className="mr-1" />
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-[9px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteBusiness(business.id)
                              }}
                            >
                              <Trash weight="bold" size={10} />
                            </Button>
                          </div>

                          {businessContacts.length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Contacts ({businessContacts.length})
                                </div>
                                {businessContacts.map(contact => (
                                  <Card key={contact.id} className="border-border p-2 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold flex items-center gap-1">
                                          {contact.contactName}
                                          {contact.isPrimary && (
                                            <Star weight="fill" className="text-accent" size={10} />
                                          )}
                                        </div>
                                        {contact.contactRole && (
                                          <div className="text-[10px] text-muted-foreground">{contact.contactRole}</div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteContact(contact.id)
                                        }}
                                      >
                                        <Trash weight="bold" size={10} />
                                      </Button>
                                    </div>
                                    {(contact.contactPhone || contact.contactEmail) && (
                                      <div className="space-y-0.5">
                                        {contact.contactPhone && (
                                          <div className="text-[9px] flex items-center gap-1">
                                            <Phone weight="bold" size={8} />
                                            {contact.contactPhone}
                                          </div>
                                        )}
                                        {contact.contactEmail && (
                                          <div className="text-[9px] flex items-center gap-1 truncate">
                                            <EnvelopeSimple weight="bold" size={8} />
                                            <span className="truncate">{contact.contactEmail}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Card>
                                ))}
                              </div>
                            </>
                          )}

                          {business.notes && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <Notepad weight="bold" size={10} />
                                  Notes
                                </div>
                                <div className="text-[10px] text-muted-foreground italic whitespace-pre-wrap">
                                  {business.notes}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-border p-3 space-y-1">
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Businesses</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tabular-nums">{overallStats.totalBusinesses}</div>
                  <Building weight="bold" className="text-primary" size={12} />
                </div>
              </Card>

              <Card className="border-border p-3 space-y-1">
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Total Items</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tabular-nums">{overallStats.totalItems}</div>
                  <Package weight="bold" className="text-primary" size={12} />
                </div>
              </Card>

              <Card className="border-border p-3 space-y-1">
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Photos</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold tabular-nums">{overallStats.totalPhotos}</div>
                  <span className="text-[10px]">📸</span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-bold tabular-nums">{overallStats.craftedItems}</div>
                <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                  <Clock weight="bold" size={10} />
                  Crafted
                </div>
              </div>
              <div className="text-center p-2 bg-accent/20 rounded">
                <div className="text-lg font-bold tabular-nums">{overallStats.deployedItems}</div>
                <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                  <TrendUp weight="bold" size={10} />
                  Deployed
                </div>
              </div>
              <div className="text-center p-2 bg-primary/20 rounded">
                <div className="text-lg font-bold tabular-nums">{overallStats.retrievedItems}</div>
                <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                  <CheckCircle weight="bold" size={10} />
                  Retrieved
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                By Participation Level
              </div>
              
              <div className="space-y-2">
                {[
                  { level: 'elite' as const, count: overallStats.byLevel.elite },
                  { level: 'active' as const, count: overallStats.byLevel.active },
                  { level: 'partner' as const, count: overallStats.byLevel.partner },
                  { level: 'new' as const, count: overallStats.byLevel.new }
                ].map(({ level, count }) => {
                  const badge = getParticipationBadge(level)
                  const percentage = overallStats.totalBusinesses > 0 
                    ? (count / overallStats.totalBusinesses * 100).toFixed(0)
                    : 0
                  
                  return (
                    <Card key={level} className="border-border p-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={`${badge.color} text-[9px] px-2 py-0 flex items-center gap-1`}>
                          {badge.icon}
                          {badge.label}
                        </Badge>
                        <div className="text-xs font-bold tabular-nums">{count}</div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground text-right mt-0.5">
                        {percentage}%
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Top Contributors
              </div>
              
              <ScrollArea style={{ maxHeight: '300px' }}>
                <div className="space-y-2 pr-2">
                  {enrichedBusinesses
                    .filter(b => b.stats && b.stats.totalItems > 0)
                    .sort((a, b) => (b.stats?.totalItems || 0) - (a.stats?.totalItems || 0))
                    .slice(0, 10)
                    .map((business, index) => {
                      const badge = getParticipationBadge(business.participationLevel)
                      return (
                        <Card key={business.id} className="border-border p-2">
                          <div className="flex items-start gap-2">
                            <div className="text-lg font-bold text-muted-foreground tabular-nums">
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-bold truncate">{business.businessName}</div>
                                <Badge className={`${badge.color} text-[8px] px-1.5 py-0 flex-shrink-0`}>
                                  {business.stats?.totalItems}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground">{business.ownerName}</div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-3">
            <div className="text-[10px] text-muted-foreground mb-2">
              Businesses with grid locations
            </div>

            <ScrollArea style={{ maxHeight }}>
              <div className="space-y-2 pr-2">
                {enrichedBusinesses
                  .filter(b => b.gridX !== undefined && b.gridY !== undefined)
                  .map(business => {
                    const badge = getParticipationBadge(business.participationLevel)
                    return (
                      <Card key={business.id} className="border-border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{business.businessName}</div>
                            <div className="text-xs text-muted-foreground truncate">{business.ownerName}</div>
                          </div>
                          <Badge className={`${badge.color} text-[9px] px-2 py-0 flex-shrink-0`}>
                            {badge.label}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          className="w-full h-8"
                          onClick={() => {
                            onNavigateToGrid?.(business.gridX!, business.gridY!)
                            toast.success(`Navigate to ${business.businessName}`)
                          }}
                        >
                          <MapTrifold weight="bold" size={12} className="mr-2" />
                          Grid {String.fromCharCode(65 + business.gridX!)}{business.gridY! + 1}
                        </Button>

                        {business.address && (
                          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                            <MapPin weight="bold" className="text-primary flex-shrink-0 mt-0.5" size={10} />
                            <span className="break-all">{business.address}</span>
                          </div>
                        )}
                      </Card>
                    )
                  })}

                {enrichedBusinesses.filter(b => b.gridX !== undefined && b.gridY !== undefined).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    No businesses have grid locations yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Business Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-xs">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerName" className="text-xs">Owner Name *</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-xs">Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="gridX" className="text-xs">Grid X</Label>
                <Input
                  id="gridX"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.gridX ?? ''}
                  onChange={(e) => setFormData({ ...formData, gridX: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gridY" className="text-xs">Grid Y</Label>
                <Input
                  id="gridY"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.gridY ?? ''}
                  onChange={(e) => setFormData({ ...formData, gridY: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddBusiness} className="text-xs">
              Add Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Business Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-businessName" className="text-xs">Business Name</Label>
              <Input
                id="edit-businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-ownerName" className="text-xs">Owner Name</Label>
              <Input
                id="edit-ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-contactPhone" className="text-xs">Phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-contactEmail" className="text-xs">Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-xs">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-gridX" className="text-xs">Grid X</Label>
                <Input
                  id="edit-gridX"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.gridX ?? ''}
                  onChange={(e) => setFormData({ ...formData, gridX: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-gridY" className="text-xs">Grid Y</Label>
                <Input
                  id="edit-gridY"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.gridY ?? ''}
                  onChange={(e) => setFormData({ ...formData, gridY: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleUpdateBusiness} className="text-xs">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs">Contact Name *</Label>
              <Input
                id="contact-name"
                value={contactFormData.contactName}
                onChange={(e) => setContactFormData({ ...contactFormData, contactName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-role" className="text-xs">Role/Position</Label>
              <Input
                id="contact-role"
                value={contactFormData.contactRole}
                onChange={(e) => setContactFormData({ ...contactFormData, contactRole: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" className="text-xs">Phone</Label>
                <Input
                  id="contact-phone"
                  value={contactFormData.contactPhone}
                  onChange={(e) => setContactFormData({ ...contactFormData, contactPhone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactFormData.contactEmail}
                  onChange={(e) => setContactFormData({ ...contactFormData, contactEmail: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="contact-primary"
                checked={contactFormData.isPrimary}
                onChange={(e) => setContactFormData({ ...contactFormData, isPrimary: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="contact-primary" className="text-xs">Primary Contact</Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-notes" className="text-xs">Notes</Label>
              <Textarea
                id="contact-notes"
                value={contactFormData.notes}
                onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddContact} className="text-xs">
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
