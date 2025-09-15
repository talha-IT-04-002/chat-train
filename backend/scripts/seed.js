const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');
const Organization = require('../models/Organization');
const TeamMember = require('../models/TeamMember');
const Trainer = require('../models/Trainer');
const ApiKey = require('../models/ApiKey');
const { run, disconnect } = require('../config/database');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await run();
    
    console.log('🧹 Clearing existing demo data if present...');
    await TeamMember.deleteMany({});
    await Trainer.deleteMany({});
    await ApiKey.deleteMany({});
    await User.deleteMany({ email: { $in: ['admin@demo.com', 'user@demo.com'] } });
    await Organization.deleteMany({ domain: 'demo.com' });
    
    console.log('🏢 Creating sample organization...');
    const organization = await Organization.create({
      name: 'Demo Company',
      description: 'A sample organization for testing the Chat Train platform',
      domain: 'demo.com',
      settings: {
        maxUsers: 50,
        maxTrainers: 20,
        features: ['basic-training', 'advanced-analytics', 'team-management'],
        branding: {
          primaryColor: '#3B82F6',
          logo: 'https://via.placeholder.com/150x50/3B82F6/FFFFFF?text=Demo+Co'
        }
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: ['basic-training', 'advanced-analytics', 'team-management', 'deployment-management']
      }
    });
    
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      email: 'admin@demo.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      emailVerified: true,
      lastLogin: new Date(),
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
    
    await TeamMember.create({
      organizationId: organization._id,
      userId: adminUser._id,
      status: 'active',
      joinedAt: new Date(),
      lastActive: new Date()
    });
    
    console.log('👤 Creating regular user...');
    const regularUser = await User.create({
      email: 'user@demo.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      emailVerified: true,
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });
    
    await TeamMember.create({
      organizationId: organization._id,
      userId: regularUser._id,
      status: 'active',
      joinedAt: new Date(),
      lastActive: new Date()
    });
    
    console.log('🔑 Creating sample API keys...');
    const openaiKey = await ApiKey.create({
      name: 'OpenAI Production',
      key: 'sk-sample-openai-key-1234567890abcdef',
      type: 'openai',
      organizationId: organization._id,
      createdBy: adminUser._id,
      permissions: ['completion', 'chat'],
      isActive: true,
      isVisible: true,
      settings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      }
    });
    
    const anthropicKey = await ApiKey.create({
      name: 'Anthropic Claude',
      key: 'sk-sample-anthropic-key-abcdef1234567890',
      type: 'anthropic',
      organizationId: organization._id,
      createdBy: adminUser._id,
      permissions: ['completion', 'chat'],
      isActive: true,
      isVisible: true,
      settings: {
        model: 'claude-3-sonnet',
        temperature: 0.8,
        maxTokens: 4000
      }
    });
    
    console.log('🤖 Creating sample trainers...');
    await Trainer.create({
      name: 'Compliance Training Bot',
      description: 'AI trainer for company compliance and policy training',
      type: 'compliance',
      organizationId: organization._id,
      category: 'legal',
      createdBy: adminUser._id,
      assignedTo: [regularUser._id],
      tags: ['compliance', 'legal', 'policies'],
      learningObjectives: 'Understand company policies, Learn compliance requirements, Practice ethical decision making',
      status: 'active',
      settings: {
        isPublic: false,
        allowAnonymous: false,
        maxSessionsPerUser: 5,
        sessionTimeout: 1800,
        requireCompletion: true,
        allowRetakes: true,
        maxRetakes: 3,
        passingScore: 80
      },
      metadata: {
        version: '1.0.0',
        totalSessions: 0,
        completionRate: 0,
        avgSessionTime: 0,
        totalInteractions: 0,
        estimatedDuration: 30
      },
      deployment: {
        isDeployed: true,
        deployedAt: new Date(),
        deployedBy: adminUser._id,
        environment: 'production',
        deploymentUrl: 'https://api.chattrain.com/trainers/compliance-bot',
        healthStatus: 'healthy',
        lastHealthCheck: new Date()
      },
      aiConfig: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful compliance training assistant.',
        apiKeyId: openaiKey._id
      }
    });
    
    await Trainer.create({
      name: 'Sales Skills Trainer',
      description: 'AI trainer for improving sales techniques and customer interaction',
      type: 'sales',
      organizationId: organization._id,
      category: 'business',
      createdBy: regularUser._id,
      assignedTo: [regularUser._id],
      tags: ['sales', 'customer-service', 'communication'],
      learningObjectives: 'Improve sales techniques, Handle customer objections, Build rapport with clients',
      status: 'draft',
      settings: {
        isPublic: false,
        allowAnonymous: false,
        maxSessionsPerUser: 10,
        sessionTimeout: 2700,
        requireCompletion: true,
        allowRetakes: true,
        maxRetakes: 5,
        passingScore: 75
      },
      metadata: {
        version: '0.9.0',
        totalSessions: 0,
        completionRate: 0,
        avgSessionTime: 0,
        totalInteractions: 0,
        estimatedDuration: 45
      },
      deployment: {
        isDeployed: false,
        environment: 'development',
        healthStatus: 'healthy'
      },
      aiConfig: {
        model: 'claude-3-sonnet',
        temperature: 0.8,
        maxTokens: 3000,
        systemPrompt: 'You are an experienced sales trainer helping improve sales skills.',
        apiKeyId: anthropicKey._id
      }
    });
    
    // Add a few more sample trainers for better testing
    await Trainer.create({
      name: 'Customer Service Excellence',
      description: 'AI trainer for customer service best practices and communication skills',
      type: 'customer-service',
      organizationId: organization._id,
      category: 'service',
      createdBy: adminUser._id,
      assignedTo: [regularUser._id],
      tags: ['customer-service', 'communication', 'support'],
      learningObjectives: 'Master customer service techniques, Handle difficult customers, Improve communication skills',
      status: 'active',
      settings: {
        isPublic: true,
        allowAnonymous: false,
        maxSessionsPerUser: 8,
        sessionTimeout: 2400,
        requireCompletion: true,
        allowRetakes: true,
        maxRetakes: 2,
        passingScore: 85
      },
      metadata: {
        version: '1.2.0',
        totalSessions: 15,
        completionRate: 87,
        avgSessionTime: 22,
        totalInteractions: 156,
        estimatedDuration: 25
      },
      deployment: {
        isDeployed: true,
        deployedAt: new Date(),
        deployedBy: adminUser._id,
        environment: 'production',
        deploymentUrl: 'https://api.chattrain.com/trainers/customer-service',
        healthStatus: 'healthy',
        lastHealthCheck: new Date()
      },
      aiConfig: {
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 2500,
        systemPrompt: 'You are a customer service expert helping improve service skills.',
        apiKeyId: openaiKey._id
      }
    });
    
    await Trainer.create({
      name: 'New Employee Onboarding',
      description: 'Comprehensive onboarding training for new hires',
      type: 'onboarding',
      organizationId: organization._id,
      category: 'hr',
      createdBy: adminUser._id,
      assignedTo: [],
      tags: ['onboarding', 'orientation', 'company-culture'],
      learningObjectives: 'Learn company policies, Understand company culture, Complete required training modules',
      status: 'testing',
      settings: {
        isPublic: false,
        allowAnonymous: false,
        maxSessionsPerUser: 3,
        sessionTimeout: 3600,
        requireCompletion: true,
        allowRetakes: true,
        maxRetakes: 1,
        passingScore: 90
      },
      metadata: {
        version: '0.8.0',
        totalSessions: 8,
        completionRate: 75,
        avgSessionTime: 35,
        totalInteractions: 89,
        estimatedDuration: 60
      },
      deployment: {
        isDeployed: false,
        environment: 'staging',
        healthStatus: 'warning'
      },
      aiConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: 'You are an HR specialist conducting new employee onboarding.',
        apiKeyId: openaiKey._id
      }
    });
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log(`   🏢 Organization: ${organization.name}`);
    console.log(`   👤 Admin User: ${adminUser.email} (password: admin123)`);
    console.log(`   👤 Regular User: ${regularUser.email} (password: user123)`);
    console.log(`   🔑 API Keys: 2 sample keys created`);
    console.log(`   🤖 Trainers: 4 sample trainers created`);
    console.log('\n🔗 You can now test the API with these credentials!');
    
    await disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    try { await disconnect(); } catch (_) {}
    process.exit(1);
  }
};

seedData();