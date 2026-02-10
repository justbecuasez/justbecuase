# API Client Usage Examples

This guide shows how to use the API client in your Next.js components.

## Import

```typescript
import { apiClient } from '@/lib/api-client';
```

## Authentication

### Register
```typescript
const handleRegister = async () => {
  try {
    const response = await apiClient.register({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe'
    });
    console.log('Registered:', response);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Login
```typescript
const handleLogin = async () => {
  try {
    const response = await apiClient.login({
      email: 'user@example.com',
      password: 'password123'
    });
    // Token is automatically stored
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Get Current User
```typescript
const getCurrentUser = async () => {
  try {
    const user = await apiClient.getMe();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to get user:', error);
  }
};
```

## Search

### Universal Search
```typescript
const searchAll = async (query: string) => {
  const results = await apiClient.search(query, {
    limit: 20
  });
  console.log('Search results:', results);
};
```

### Search Volunteers
```typescript
const searchVolunteers = async () => {
  const volunteers = await apiClient.searchVolunteers('react developer', {
    city: 'Bangalore',
    minRating: 4
  });
  console.log('Volunteers:', volunteers);
};
```

## Projects

### Browse Projects
```typescript
const browseProjects = async () => {
  const { projects, pagination } = await apiClient.getProjects({
    page: 1,
    limit: 20,
    causes: 'education',
    workMode: 'remote'
  });
  console.log('Projects:', projects);
};
```

### Create Project
```typescript
const createProject = async () => {
  const project = await apiClient.createProject({
    title: 'Website Development',
    description: 'Need a volunteer to build our NGO website',
    requiredSkills: ['react', 'nodejs'],
    causes: ['education'],
    workType: 'remote',
    compensationType: 'free'
  });
  console.log('Project created:', project);
};
```

### Apply to Project
```typescript
const applyToProject = async (projectId: string) => {
  const application = await apiClient.applyToProject(projectId, {
    coverMessage: 'I would love to help with this project!'
  });
  console.log('Application submitted:', application);
};
```

## Profiles

### Get Volunteer Profile
```typescript
const getProfile = async () => {
  const profile = await apiClient.getVolunteerProfile();
  console.log('Profile:', profile);
};
```

### Update Volunteer Profile
```typescript
const updateProfile = async () => {
  const updated = await apiClient.updateVolunteerProfile({
    headline: 'Full Stack Developer',
    bio: 'Passionate about helping NGOs',
    skills: [
      { categoryId: 'web-dev', subskillId: 'react', level: 'expert' }
    ],
    hoursPerWeek: 10,
    city: 'Bangalore'
  });
  console.log('Updated:', updated);
};
```

## Messaging

### Get Conversations
```typescript
const getConversations = async () => {
  const conversations = await apiClient.getConversations();
  console.log('Conversations:', conversations);
};
```

### Send Message
```typescript
const sendMessage = async (conversationId: string) => {
  const message = await apiClient.sendMessage(
    conversationId,
    'Hello! I'm interested in your project.'
  );
  console.log('Message sent:', message);
};
```

### Start Conversation
```typescript
const startChat = async (targetUserId: string) => {
  const { conversation, message } = await apiClient.startConversation(
    targetUserId,
    'Hi, I'd like to discuss the project opportunity.'
  );
  console.log('Conversation started:', conversation);
};
```

## Notifications

### Get Notifications
```typescript
const getNotifications = async () => {
  const { notifications } = await apiClient.getNotifications({
    page: 1,
    limit: 20
  });
  console.log('Notifications:', notifications);
};
```

### Mark as Read
```typescript
const markRead = async (notificationId: string) => {
  await apiClient.markAsRead(notificationId);
};
```

## Payments

### Create Subscription
```typescript
const subscribe = async () => {
  const { sessionUrl } = await apiClient.createSubscription('pro', 'stripe');
  // Redirect user to payment page
  window.location.href = sessionUrl;
};
```

### Unlock Profile
```typescript
const unlockProfile = async (volunteerId: string) => {
  const { sessionUrl } = await apiClient.unlockProfile(volunteerId, 'razorpay');
  window.location.href = sessionUrl;
};
```

## File Upload

### Upload Image
```typescript
const uploadAvatar = async (file: File) => {
  try {
    const { url, publicId } = await apiClient.uploadImage(file, 'avatars');
    console.log('Image uploaded:', url);
    
    // Update profile with new avatar URL
    await apiClient.updateVolunteerProfile({ avatar: url });
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## React Hook Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiClient.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    setUser(response.user);
    return response;
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  return { user, loading, login, logout, refetch: loadUser };
}
```

## Server Component Example

```typescript
// app/projects/page.tsx
import { apiClient } from '@/lib/api-client';

export default async function ProjectsPage() {
  // Fetch data on the server
  const { projects } = await apiClient.getProjects({ limit: 20 });

  return (
    <div>
      <h1>Projects</h1>
      {projects.map(project => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const result = await apiClient.createProject(data);
} catch (error) {
  if (error instanceof Error) {
    // Handle different error types
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      router.push('/login');
    } else if (error.message.includes('limit')) {
      // Show upgrade prompt
      showUpgradeModal();
    } else {
      // Show error toast
      toast.error(error.message);
    }
  }
}
```

## Environment Configuration

The API client automatically uses the correct endpoint based on `NEXT_PUBLIC_API_URL`:

- **Development**: `http://localhost:5001/api`
- **Production**: `https://your-app.onrender.com/api`

No code changes needed when deploying!
