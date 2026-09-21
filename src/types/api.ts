export interface AdImage {
  id: number
  image: string
}

export type UserRole = 'customer' | 'master'

export interface User {
  id: number
  email: string
  role: UserRole
  first_name: string
  last_name: string
  phone_number: string
  patronymic?: string
  avatar?: string | null
  username?: string
}

export interface Ad {
  id: number
  title: string
  price: string | number
  currency: string
  city: string
  phone_number: string
  description: string
  images: AdImage[]
  author_name?: string
  is_favorite?: boolean
  author_id: number;
}

export interface AuthResponse {
  access: string
  refresh: string
}

export interface ApiErrorResponse {
  [key: string]: string | string[] | undefined
}
