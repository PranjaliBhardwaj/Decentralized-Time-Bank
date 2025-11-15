export type ListingPayload = {
  title: string
  description: string
  category: string
  ratePerHour: number
  contactMethod: string
  skills?: string[]
}

export type ListingRecord = ListingPayload & {
  cid: string
  url: string
  createdAt: string
  owner: string
}

export type ProfileData = {
  displayName: string
  bio: string
  contact: string
  skills: string[]
}


