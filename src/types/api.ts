export interface AdImage {
  id: number
  image: string
}

export type UserRole = 'customer' | 'master'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
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
}

export interface AuthResponse {
  access: string
  refresh: string
}

export interface ApiErrorResponse {
  [key: string]: string | string[] | undefined
}
