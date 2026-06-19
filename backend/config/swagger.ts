import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Axiora AI API',
      version: '1.0.0',
      description: 'Backend API for the Axiora AI creative partner application.',
    },
    servers: [
      { url: process.env.BACKEND_URL || 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            bio: { type: 'string' },
            avatarUrl: { type: 'string' },
            subscriptionTier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
            paymentStatus: { type: 'string', enum: ['active', 'inactive', 'canceled'] },
            energy: { type: 'integer' },
            provider: { type: 'string', enum: ['email', 'google', 'github'] },
            isVerified: { type: 'boolean' },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            title: { type: 'string' },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' },
                  type: { type: 'string', enum: ['text', 'image'] },
                  imageUrl: { type: 'string' },
                },
              },
            },
            lastActive: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
            400: { description: 'Validation error or user exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
            403: { description: 'Email not verified' },
          },
        },
      },
      '/api/auth/verify-email/{token}': {
        get: {
          tags: ['Authentication'],
          summary: 'Verify email address with token',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Email verified successfully' },
            400: { description: 'Invalid or expired token' },
          },
        },
      },
      '/api/auth/resend-verification': {
        post: {
          tags: ['Authentication'],
          summary: 'Resend verification email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: {
            200: { description: 'Verification email sent' },
            404: { description: 'User not found' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Send password reset email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { 200: { description: 'Reset email sent' } },
        },
      },
      '/api/auth/reset-password/{resetToken}': {
        put: {
          tags: ['Authentication'],
          summary: 'Reset password with token',
          parameters: [{ name: 'resetToken', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string', minLength: 6 } } } } },
          },
          responses: { 200: { description: 'Password reset successful' }, 400: { description: 'Invalid or expired token' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Current user data' }, 401: { description: 'Not authorized' } },
        },
      },
      '/api/auth/google': {
        get: {
          tags: ['OAuth'],
          summary: 'Initiate Google OAuth login',
          responses: { 302: { description: 'Redirect to Google consent screen' } },
        },
      },
      '/api/auth/github': {
        get: {
          tags: ['OAuth'],
          summary: 'Initiate GitHub OAuth login',
          responses: { 302: { description: 'Redirect to GitHub consent screen' } },
        },
      },
      '/api/chat': {
        get: {
          tags: ['Chat'],
          summary: 'Get paginated chat history for current user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } },
          ],
          responses: {
            200: {
              description: 'Paginated chat list',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, total: { type: 'integer' }, page: { type: 'integer' }, totalPages: { type: 'integer' }, data: { type: 'array', items: { $ref: '#/components/schemas/Chat' } } } } } },
            },
          },
        },
        post: {
          tags: ['Chat'],
          summary: 'Send a message and get AI response',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, chatId: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'AI response' }, 403: { description: 'Energy depleted' } },
        },
      },
      '/api/chat/save-image': {
        post: {
          tags: ['Chat'],
          summary: 'Save an image generation to chat',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { prompt: { type: 'string' }, imageUrl: { type: 'string' }, chatId: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Image saved to chat' } },
        },
      },
      '/api/chat/{id}': {
        get: {
          tags: ['Chat'],
          summary: 'Get a single chat by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Chat data' }, 404: { description: 'Chat not found' } },
        },
        put: {
          tags: ['Chat'],
          summary: 'Rename a chat',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' } } } } } },
          responses: { 200: { description: 'Chat renamed' } },
        },
        delete: {
          tags: ['Chat'],
          summary: 'Delete a chat',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Chat deleted' } },
        },
      },
      '/api/user/update-details': {
        put: {
          tags: ['User'],
          summary: 'Update profile details',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, bio: { type: 'string' }, avatarUrl: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Profile updated' } },
        },
      },
      '/api/user/update-password': {
        put: {
          tags: ['User'],
          summary: 'Update password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } } } },
          },
          responses: { 200: { description: 'Password updated' } },
        },
      },
      '/api/user/upload-avatar': {
        post: {
          tags: ['User'],
          summary: 'Upload avatar image',
          security: [{ bearerAuth: [] }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Avatar uploaded' } },
        },
      },
      '/api/user/delete-account': {
        delete: {
          tags: ['User'],
          summary: 'Delete user account',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Account deleted' } },
        },
      },
      '/api/images/generate': {
        post: {
          tags: ['Images'],
          summary: 'Generate an image with DALL-E',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { prompt: { type: 'string' }, size: { type: 'string' }, quality: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Generated image URL' } },
        },
      },
      '/api/images/history': {
        get: {
          tags: ['Images'],
          summary: 'Get image generation history',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Image history' } },
        },
      },
      '/api/payments/razorpay/create-order': {
        post: {
          tags: ['Payments'],
          summary: 'Create a Razorpay order',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Order created' } },
        },
      },
      '/api/payments/razorpay/verify': {
        post: {
          tags: ['Payments'],
          summary: 'Verify Razorpay payment',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Payment verified' } },
        },
      },
    },
  },
  apis: [],
};

export default swaggerJsdoc(options);
