import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Phone, Envelope, Globe, User, Buildings, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface BusinessPartner {
  id: string
  businessName: string
  ownerName: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  address?: string
  gridX?: number
  gridY?: number
  category: 'food' | 'retail' | 'services' | 'entertainment' | 'lodging' | 'other'
  participationLevel: 'interested' | 'active' | 'partner' | 'sponsor'
  notes?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
  itemsCreated?: number
  deadDropsHosted?: number
  eventsParticipated?: number
}

interface AddBusinessPartnerDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onBusinessAdded: (business: BusinessPartner) => void
  preselectedGrid?: { x: number; y: number }
}

const GRID_SIZE = 8

export function AddBusinessPartnerDialog({
  open,
  onOpenChange,
  onBusinessAdded,
  preselectedGrid
}: AddBusinessPartnerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [gridX, setGridX] = useState<number | undefined>(preselectedGrid?.x)
  const [gridY, setGridY] = useState<number | undefined>(preselectedGrid?.y)
  const [category, setCategory] = useState<BusinessPartner['category']>('other')
  const [participationLevel, setParticipationLevel] = useState<BusinessPartner['participationLevel']>('interested')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const handleOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }

  const actualOpen = open !== undefined ? open : isOpen

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = () => {
    if (!businessName.trim()) {
      toast.error('Business name is required')
      return
    }

    if (!ownerName.trim()) {
      toast.error('Owner/contact name is required')
      return
    }

    const newBusiness: BusinessPartner = {
      id: `business-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      gridX,
      gridY,
      category,
      participationLevel,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemsCreated: 0,
      deadDropsHosted: 0,
      eventsParticipated: 0
    }

    onBusinessAdded(newBusiness)
    
    toast.success(`${businessName} added to directory`, {
      description: gridX !== undefined && gridY !== undefined 
        ? `Located at Grid ${String.fromCharCode(65 + gridX)}${gridY + 1}`
        : 'Grid location not specified'
    })

    setBusinessName('')
    setOwnerName('')
    setContactEmail('')
    setContactPhone('')
    setWebsite('')
    setAddress('')
    setGridX(preselectedGrid?.x)
    setGridY(preselectedGrid?.y)
    setCategory('other')
    setParticipationLevel('interested')
    setNotes('')
    setTags([])
    setTagInput('')
    handleOpen(false)
  }

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus weight="bold" size={16} />
          Add Business Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Buildings weight="bold" className="text-primary" size={20} />
            Add Business Partner
          </DialogTitle>
          <DialogDescription>
            Register a new business partner with contact information and grid location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name" className="flex items-center gap-2">
                <Buildings weight="bold" size={14} />
                Business Name *
              </Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., The Coffee Shop"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-name" className="flex items-center gap-2">
                <User weight="bold" size={14} />
                Owner/Contact Name *
              </Label>
              <Input
                id="owner-name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Jane Smith"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Envelope weight="bold" size={14} />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@business.com"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone weight="bold" size={14} />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe weight="bold" size={14} />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://business.com"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin weight="bold" size={14} />
              Physical Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Business Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as BusinessPartner['category'])}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">🍕 Food & Beverage</SelectItem>
                  <SelectItem value="retail">🛍️ Retail</SelectItem>
                  <SelectItem value="services">🔧 Services</SelectItem>
                  <SelectItem value="entertainment">🎭 Entertainment</SelectItem>
                  <SelectItem value="lodging">🏨 Lodging</SelectItem>
                  <SelectItem value="other">📦 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participation">Participation Level</Label>
              <Select value={participationLevel} onValueChange={(value) => setParticipationLevel(value as BusinessPartner['participationLevel'])}>
                <SelectTrigger id="participation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interested">💭 Interested</SelectItem>
                  <SelectItem value="active">⚡ Active</SelectItem>
                  <SelectItem value="partner">🤝 Partner</SelectItem>
                  <SelectItem value="sponsor">⭐ Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grid-x">Grid Column (A-H)</Label>
              <Select 
                value={gridX !== undefined ? String.fromCharCode(65 + gridX) : undefined} 
                onValueChange={(value) => setGridX(value.charCodeAt(0) - 65)}
              >
                <SelectTrigger id="grid-x">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <SelectItem key={i} value={String.fromCharCode(65 + i)}>
                      {String.fromCharCode(65 + i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grid-y">Grid Row (1-8)</Label>
              <Select 
                value={gridY !== undefined ? String(gridY + 1) : undefined} 
                onValueChange={(value) => setGridY(parseInt(value) - 1)}
              >
                <SelectTrigger id="grid-y">
                  <SelectValue placeholder="Select row" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {gridX !== undefined && gridY !== undefined && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded">
              <div className="text-xs text-muted-foreground">Grid Location</div>
              <div className="text-sm font-bold text-primary">
                Grid {String.fromCharCode(65 + gridX)}{gridY + 1}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add tag (press Enter)"
                className="font-mono"
              />
              <Button type="button" size="sm" onClick={handleAddTag}>
                <Plus weight="bold" size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X weight="bold" size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this business partner..."
              className="font-mono min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Plus weight="bold" size={16} className="mr-2" />
            Add Business Partner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
