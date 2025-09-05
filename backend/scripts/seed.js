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
      role: 'admin',
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
      role: 'owner',
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
      role: 'trainer',
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
      role: 'trainer',
      status: 'active',
      joinedAt: new Date(),
      lastActive: new Date()
    });
    
    console.log('🔑 Creating sample API keys...');
    await ApiKey.create({
      name: 'OpenAI Production',
      key: 'sk-sample-openai-key',
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
    
    await ApiKey.create({
      name: 'Anthropic Claude',
      key: 'sk-sample-anthropic-key',
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
      category: 'legal',
      createdBy: adminUser._id,
      assignedTo: [regularUser._id],
      tags: ['compliance', 'legal', 'policies'],
      learningObjectives: 'Understand company policies, Learn compliance requirements, Practice ethical decision making',
      status: 'active',
      settings: {
        isPublic: false,
        allowAnonymous: false,
        maxSessionDuration: 30,
        maxSessionsPerUser: 5
      },
      metadata: {
        version: '1.0.0',
        totalSessions: 0,
        completionRate: 0,
        avgSessionTime: 0,
        totalInteractions: 0
      },
      deployment: {
        status: 'deployed',
        deployedAt: new Date(),
        deployedBy: adminUser._id,
        environment: 'production',
        url: 'https://api.chattrain.com/trainers/compliance-bot'
      },
      aiConfig: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful compliance training assistant.'
      }
    });
    
    await Trainer.create({
      name: 'Sales Skills Trainer',
      description: 'AI trainer for improving sales techniques and customer interaction',
      type: 'sales',
      category: 'business',
      createdBy: regularUser._id,
      assignedTo: [regularUser._id],
      tags: ['sales', 'customer-service', 'communication'],
      learningObjectives: 'Improve sales techniques, Handle customer objections, Build rapport with clients',
      status: 'draft',
      settings: {
        isPublic: false,
        allowAnonymous: false,
        maxSessionDuration: 45,
        maxSessionsPerUser: 10
      },
      metadata: {
        version: '0.9.0',
        totalSessions: 0,
        completionRate: 0,
        avgSessionTime: 0,
        totalInteractions: 0
      },
      aiConfig: {
        model: 'claude-3-sonnet',
        temperature: 0.8,
        maxTokens: 3000,
        systemPrompt: 'You are an experienced sales trainer helping improve sales skills.'
      }
    });
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log(`   🏢 Organization: ${organization.name}`);
    console.log(`   👤 Admin User: ${adminUser.email} (password: admin123)`);
    console.log(`   👤 Regular User: ${regularUser.email} (password: user123)`);
    console.log(`   🔑 API Keys: 2 sample keys created`);
    console.log(`   🤖 Trainers: 2 sample trainers created`);
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