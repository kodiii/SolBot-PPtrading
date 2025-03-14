import { http } from 'msw'
import { createServer, responseHelpers } from '../api-mocks'

// Example API types
interface User {
  id: number
  name: string
  email: string
}

interface CreateUserDto {
  name: string
  email: string
}

// Example API endpoints
const API_ENDPOINTS = {
  users: '/api/users',
  user: (id: number) => `/api/users/${id}`,
}

// Example test data
const testUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
]

import type { RequestInfo } from '../api-mocks'

// Example API handlers
const handlers = {
  // List users
  'GET /api/users': async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    if (search) {
      const filtered = testUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
      return responseHelpers.success(filtered)()
    }
    return responseHelpers.success(testUsers)()
  },

  // Get user by ID
  'GET /api/users/:id': ({ params }: { params: { id: string } }) => {
    const user = testUsers.find(u => u.id === Number(params.id))
    if (!user) {
      return responseHelpers.error('User not found', 404)()
    }
    return responseHelpers.success(user)()
  },

  // Create user
  'POST /api/users': async ({ request }: { request: Request }) => {
    const body: CreateUserDto = await request.json()
    
    if (!body.name || !body.email) {
      return responseHelpers.error('Name and email are required', 400)()
    }

    const newUser: User = {
      id: testUsers.length + 1,
      ...body
    }
    testUsers.push(newUser)
    
    return responseHelpers.success(newUser)()
  },

  // Update user
  'PUT /api/users/:id': async ({ request, params }: { request: Request, params: { id: string } }) => {
    const body = await request.json()
    const index = testUsers.findIndex(u => u.id === Number(params.id))
    
    if (index === -1) {
      return responseHelpers.error('User not found', 404)()
    }

    testUsers[index] = { ...testUsers[index], ...body }
    return responseHelpers.success(testUsers[index])()
  },

  // Delete user
  'DELETE /api/users/:id': ({ params }: { params: { id: string } }) => {
    const index = testUsers.findIndex(u => u.id === Number(params.id))
    
    if (index === -1) {
      return responseHelpers.error('User not found', 404)()
    }

    testUsers.splice(index, 1)
    return responseHelpers.success({ success: true })()
  },
}

// Create test server
const server = createServer(handlers)

describe('API Examples', () => {
  it('should list users', async () => {
    const response = await fetch(API_ENDPOINTS.users)
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data).toEqual(testUsers)
  })

  it('should filter users', async () => {
    const response = await fetch(`${API_ENDPOINTS.users}?search=john`)
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].name).toBe('John Doe')
  })

  it('should get user by id', async () => {
    const response = await fetch(API_ENDPOINTS.user(1))
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data).toEqual(testUsers[0])
  })

  it('should create user', async () => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com'
    }

    const response = await fetch(API_ENDPOINTS.users, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data).toMatchObject(newUser)
    expect(data.data.id).toBe(3)
  })

  it('should update user', async () => {
    const update = { name: 'Updated Name' }
    
    const response = await fetch(API_ENDPOINTS.user(1), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    })
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data.name).toBe(update.name)
    expect(data.data.id).toBe(1)
  })

  it('should delete user', async () => {
    const response = await fetch(API_ENDPOINTS.user(1), {
      method: 'DELETE'
    })
    const data = await response.json()
    
    expect(data.status).toBe(200)
    expect(data.data.success).toBe(true)
    expect(testUsers).toHaveLength(1)
  })
})
