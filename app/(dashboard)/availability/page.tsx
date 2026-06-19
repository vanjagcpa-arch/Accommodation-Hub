import { CalendarDays, Bed, Bath, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { PropertyStatusBadge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { PropertyStatus } from '@/types'

const availableProperties = [
  { id: 'p2', unit: '102', building: 'Parkview Apartments', suburb: 'Southbank', type: 'Studio', beds: 0, baths: 1, rent: 1650, status: 'available' as PropertyStatus, available: '1 Jul 2026', agentVisible: true, features: ['Air conditioning', 'Built-in robes', 'Intercom'] },
  { id: 'p4', unit: '202', building: 'Parkview Apartments', suburb: 'Southbank', type: '1 Bedroom', beds: 1, baths: 1, rent: 2100, status: 'available' as PropertyStatus, available: '15 Jul 2026', agentVisible: true, features: ['Air conditioning', 'Built-in robes', 'Balcony', 'Dishwasher'] },
  { id: 'p7', unit: '1B', building: 'University Gardens', suburb: 'Carlton', type: 'Studio', beds: 0, baths: 1, rent: 1450, status: 'available' as PropertyStatus, available: '1 Jul 2026', agentVisible: true, features: ['Furnished', 'High-speed internet', 'Study desk'] },
  { id: 'p9', unit: '2B', building: 'University Gardens', suburb: 'Carlton', type: '1 Bedroom', beds: 1, baths: 1, rent: 1950, status: 'coming_soon' as PropertyStatus, available: '1 Aug 2026', agentVisible: true, features: ['Furnished', 'High-speed internet', 'Study desk', 'Air conditioning'] },
  { id: 'p11', unit: '502', building: 'Monash Towers', suburb: 'Caulfield East', type: 'Studio', beds: 0, baths: 1, rent: 1550, status: 'available' as PropertyStatus, available: '1 Jul 2026', agentVisible: true, features: ['Air conditioning', 'City views', 'Gym access'] },
  { id: 'p12', unit: '1201', building: 'Docklands Point', suburb: 'Docklands', type: '1 Bedroom', beds: 1, baths: 1, rent: 2450, status: 'available' as PropertyStatus, available: '1 Jul 2026', agentVisible: true, features: ['Harbour views', 'Air conditioning', 'Balcony', 'Gym access', 'Concierge'] },
  { id: 'p13', unit: 'G01', building: 'Brunswick Studios', suburb: 'Brunswick', type: 'Studio', beds: 0, baths: 1, rent: 1200, status: 'available' as PropertyStatus, available: '25 Jun 2026', agentVisible: true, features: ['Courtyard access', 'Bike storage'] },
  { id: 'p14', unit: 'A01', building: 'Hawthorn Court', suburb: 'Hawthorn', type: '1 Bedroom', beds: 1, baths: 1, rent: 2200, status: 'available' as PropertyStatus, available: '10 Jul 2026', agentVisible: true, features: ['Air conditioning', 'Balcony', 'Secure parking'] },
  { id: 'p15', unit: 'B01', building: 'Hawthorn Court', suburb: 'Hawthorn', type: 'Studio', beds: 0, baths: 1, rent: 1750, status: 'available' as PropertyStatus, available: '1 Aug 2026', agentVisible: true, features: ['Air conditioning', 'Study nook', 'Secure parking'] },
  { id: 'p16', unit: '101', building: 'Footscray Heights', suburb: 'Footscray', type: 'Studio', beds: 0, baths: 1, rent: 1100, status: 'available' as PropertyStatus, available: '1 Jul 2026', agentVisible: true, features: ['Budget-friendly', 'Train access'] },
]

export default function AvailabilityPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {availableProperties.filter(p => p.status === 'available').length} available now &middot;{' '}
            {availableProperties.filter(p => p.status === 'coming_soon').length} coming soon
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Eye className="h-4 w-4 text-green-600" />
          <span>Agent-visible properties shown</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Buildings</option>
          <option>Parkview Apartments</option>
          <option>University Gardens</option>
          <option>Monash Towers</option>
          <option>Docklands Point</option>
          <option>Brunswick Studios</option>
          <option>Hawthorn Court</option>
          <option>Footscray Heights</option>
        </select>
        <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Property Types</option>
          <option>Studio</option>
          <option>1 Bedroom</option>
          <option>2 Bedroom</option>
          <option>3 Bedroom</option>
        </select>
        <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Statuses</option>
          <option value="available">Available Now</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Available from:</label>
          <input type="date" className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Max rent (any)</option>
          <option value="1500">Under $1,500/wk</option>
          <option value="2000">Under $2,000/wk</option>
          <option value="2500">Under $2,500/wk</option>
          <option value="3000">Under $3,000/wk</option>
        </select>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {availableProperties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all overflow-hidden group"
          >
            {/* Card top color bar */}
            <div className={`h-1.5 w-full ${property.status === 'available' ? 'bg-green-500' : 'bg-purple-400'}`} />

            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{property.building}</p>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">Unit {property.unit}</h3>
                  <p className="text-xs text-slate-500">{property.suburb}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PropertyStatusBadge status={property.status} />
                  {!property.agentVisible && (
                    <span title="Not visible to agents">
                      <EyeOff className="h-3.5 w-3.5 text-slate-300" />
                    </span>
                  )}
                </div>
              </div>

              {/* Type and rooms */}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="font-medium">{property.type}</span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-slate-400" />
                  {property.beds === 0 ? 'Studio' : `${property.beds} bed`}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-slate-400" />
                  {property.baths}
                </span>
              </div>

              {/* Available date */}
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-green-500" />
                <span className="text-slate-600">Available <strong>{property.available}</strong></span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1">
                {property.features.slice(0, 3).map((f) => (
                  <span key={f} className="text-xs px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500">
                    {f}
                  </span>
                ))}
                {property.features.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-400">
                    +{property.features.length - 3} more
                  </span>
                )}
              </div>

              {/* Footer: rent + action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(property.rent)}</span>
                  <span className="text-xs text-slate-400">/wk</span>
                </div>
                <Link href={`/applications/new?property=${property.id}`}>
                  <button className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 group-hover:underline">
                    Apply <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
