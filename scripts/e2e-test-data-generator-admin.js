/**
 * End-to-End Test Data Generator (Firebase Admin SDK)
 * 
 * This script creates comprehensive test data for all entities using Firebase Admin SDK.
 * No user authentication required - uses service account.
 * 
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Save as serviceAccountKey.json in project root
 * 
 * Run with: node scripts/e2e-test-data-generator-admin.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let app;
try {
  const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    app = admin.app();
  }
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n💡 To use this script:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save as serviceAccountKey.json in project root');
  process.exit(1);
}

const db = admin.firestore();

// Store created IDs for relationships
const createdIds = {
  beneficiaries: [],
  programs: [],
  donations: [],
  grants: [],
  partners: [],
  projects: [],
  events: [],
  workflows: [],
};

// Helper function to generate random string
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

// ============================================
// BENEFICIARIES
// ============================================
async function createBeneficiaries() {
  console.log('\n📝 Creating Beneficiaries...');
  
  const beneficiaries = [
    {
      firstName: 'Amina',
      lastName: 'Mohammed',
      middleName: 'Hassan',
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1990-05-15')),
      gender: 'female',
      phoneNumber: '+2348012345678',
      email: 'amina.mohammed@example.com',
      address: {
        street: '123 Main Street',
        city: 'Kano',
        state: 'Kano',
        lga: 'Kano Municipal',
        country: 'Nigeria',
        postalCode: '700001',
      },
      gpsLocation: {
        latitude: 12.0022,
        longitude: 8.5919,
      },
      programParticipations: [],
      amountSpent: 0,
      impactMetrics: {
        programsCompleted: 0,
        totalBenefitAmount: 0,
      },
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: 'Test beneficiary for E2E testing - Created via automated script',
    },
    {
      firstName: 'Ibrahim',
      lastName: 'Aliyu',
      middleName: 'Musa',
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1985-08-20')),
      gender: 'male',
      phoneNumber: '+2348023456789',
      email: 'ibrahim.aliyu@example.com',
      address: {
        street: '456 Market Road',
        city: 'Lagos',
        state: 'Lagos',
        lga: 'Ikeja',
        country: 'Nigeria',
        postalCode: '100001',
      },
      gpsLocation: {
        latitude: 6.5244,
        longitude: 3.3792,
      },
      programParticipations: [],
      amountSpent: 50000,
      medicalBills: [
        {
          id: randomString(),
          description: 'Medical treatment for chronic condition',
          amount: 50000,
          date: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
          cleared: true,
          clearedDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-20')),
        },
      ],
      impactMetrics: {
        programsCompleted: 1,
        totalBenefitAmount: 50000,
      },
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: 'Test beneficiary with medical bills',
    },
    {
      firstName: 'Fatima',
      lastName: 'Yusuf',
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1992-03-10')),
      gender: 'female',
      phoneNumber: '+2348034567890',
      address: {
        street: '789 Independence Avenue',
        city: 'Abuja',
        state: 'FCT',
        lga: 'Abuja Municipal',
        country: 'Nigeria',
      },
      gpsLocation: {
        latitude: 9.0765,
        longitude: 7.3986,
      },
      programParticipations: [],
      amountSpent: 100000,
      bailBills: [
        {
          id: randomString(),
          description: 'Bail payment assistance',
          amount: 100000,
          date: admin.firestore.Timestamp.fromDate(new Date('2024-02-01')),
          cleared: true,
          clearedDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-05')),
        },
      ],
      impactMetrics: {
        programsCompleted: 0,
        totalBenefitAmount: 100000,
      },
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: 'Test beneficiary with bail bills',
    },
  ];

  for (const beneficiary of beneficiaries) {
    try {
      const docRef = await db.collection('beneficiaries').add(beneficiary);
      createdIds.beneficiaries.push(docRef.id);
      console.log(`  ✅ Created beneficiary: ${beneficiary.firstName} ${beneficiary.lastName} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create beneficiary ${beneficiary.firstName}:`, error.message);
    }
  }
}

// ============================================
// PARTNERS
// ============================================
async function createPartners() {
  console.log('\n🤝 Creating Partners...');
  
  const partners = [
    {
      name: 'Ministry of Health, Lagos State',
      category: 'government_ministry',
      type: 'government',
      contactPerson: 'Dr. Adebayo Ogunlesi',
      email: 'contact@lagoshealth.gov.ng',
      phoneNumber: '+2348011111111',
      address: 'Ministry of Health, Alausa, Ikeja, Lagos',
      website: 'https://health.lagosstate.gov.ng',
      status: 'active',
      relationshipRating: 'excellent',
      collaborationAreas: ['health', 'medical_outreach'],
      mouSigned: true,
      mouDate: admin.firestore.Timestamp.fromDate(new Date('2023-12-01')),
      mouDocumentUrl: 'https://example.com/mou/health-lagos.pdf',
      notes: 'Primary partner for health programs',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Kano General Hospital',
      category: 'hospital',
      type: 'government',
      contactPerson: 'Dr. Amina Bello',
      email: 'info@kanohospital.gov.ng',
      phoneNumber: '+2348022222222',
      address: 'Kano General Hospital, Kano',
      status: 'active',
      relationshipRating: 'very_good',
      collaborationAreas: ['health', 'medical_treatment'],
      mouSigned: true,
      mouDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
      notes: 'Partner hospital for medical services',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'International Development Foundation',
      category: 'international_agency',
      type: 'ngo',
      contactPerson: 'John Smith',
      email: 'contact@idf.org',
      phoneNumber: '+1-555-123-4567',
      address: '123 International Ave, New York, USA',
      website: 'https://idf.org',
      status: 'active',
      relationshipRating: 'excellent',
      collaborationAreas: ['funding', 'capacity_building', 'technical_support'],
      mouSigned: true,
      mouDate: admin.firestore.Timestamp.fromDate(new Date('2023-11-01')),
      notes: 'Major funding partner',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const partner of partners) {
    try {
      const docRef = await db.collection('partners').add(partner);
      createdIds.partners.push(docRef.id);
      console.log(`  ✅ Created partner: ${partner.name} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create partner ${partner.name}:`, error.message);
    }
  }
}

// ============================================
// PROGRAMS
// ============================================
async function createPrograms() {
  console.log('\n📋 Creating Programs...');
  
  const programs = [
    {
      title: 'Health Outreach Program 2024',
      objectives: [
        'Provide free medical checkups to 500 beneficiaries',
        'Distribute essential medicines',
        'Health education and awareness',
      ],
      description: 'Comprehensive health outreach program targeting underserved communities',
      type: 'health',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
      states: ['Lagos', 'Kano', 'FCT'],
      lgas: ['Ikeja', 'Kano Municipal', 'Abuja Municipal'],
      location: {
        address: 'Multiple locations',
        city: 'Various',
      },
      partners: createdIds.partners.slice(0, 2),
      partnerNames: ['Ministry of Health, Lagos State', 'Kano General Hospital'],
      targetBeneficiaries: 500,
      actualBeneficiaries: 150,
      beneficiaryIds: createdIds.beneficiaries.slice(0, 2),
      budget: {
        allocated: 5000000,
        spent: 500000,
        currency: 'NGN',
      },
      expenditures: [
        {
          id: randomString(),
          description: 'Medical supplies',
          amount: 300000,
          date: admin.firestore.Timestamp.fromDate(new Date('2024-02-15')),
          category: 'materials',
        },
        {
          id: randomString(),
          description: 'Transportation',
          amount: 200000,
          date: admin.firestore.Timestamp.fromDate(new Date('2024-03-01')),
          category: 'transport',
        },
      ],
      media: [],
      documentation: [],
      monitoringReports: [
        {
          id: randomString(),
          title: 'Q1 2024 Monitoring Report',
          reportDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-31')),
          reporter: 'Dr. Sarah Johnson',
          content: 'Program is progressing well. 150 beneficiaries reached in Q1. Health checkups completed successfully. Medicines distributed to all participants.',
          metrics: {
            beneficiariesReached: 150,
            satisfactionRate: 85,
            checkupsCompleted: 150,
          },
          attachments: [],
        },
      ],
      evaluationReports: [
        {
          id: randomString(),
          title: 'Mid-Year Evaluation Report',
          reportDate: admin.firestore.Timestamp.fromDate(new Date('2024-06-30')),
          evaluator: 'Dr. Michael Adeyemi',
          content: 'Comprehensive evaluation of program impact and effectiveness.',
          findings: [
            'High beneficiary satisfaction',
            'Effective medicine distribution',
            'Strong community engagement',
          ],
          recommendations: [
            'Expand to more locations',
            'Increase frequency of checkups',
            'Add mental health component',
          ],
          attachments: [],
        },
      ],
      impactScore: 75,
      impactMetrics: {
        beneficiariesReached: 150,
        objectivesAchieved: 2,
        totalObjectives: 3,
        satisfactionScore: 85,
        outcomes: [
          'Improved health awareness',
          'Access to essential medicines',
          'Early disease detection',
        ],
      },
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: 'Prison Clearance Initiative',
      objectives: [
        'Clear bail for 200 inmates',
        'Provide legal support',
        'Reintegration support',
      ],
      description: 'Initiative to help clear bail for deserving inmates and support reintegration',
      type: 'prison_clearance',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-11-30')),
      states: ['Lagos', 'Kano'],
      lgas: ['Ikeja', 'Kano Municipal'],
      location: {
        address: 'Various correctional facilities',
        city: 'Multiple',
      },
      partners: [],
      targetBeneficiaries: 200,
      actualBeneficiaries: 1,
      beneficiaryIds: [createdIds.beneficiaries[2]],
      budget: {
        allocated: 20000000,
        spent: 100000,
        currency: 'NGN',
      },
      expenditures: [
        {
          id: randomString(),
          description: 'Bail payment for beneficiary',
          amount: 100000,
          date: admin.firestore.Timestamp.fromDate(new Date('2024-02-01')),
          category: 'other',
        },
      ],
      media: [],
      documentation: [],
      monitoringReports: [],
      evaluationReports: [],
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: 'Women Empowerment Skills Training',
      objectives: [
        'Train 300 women in vocational skills',
        'Provide startup capital',
        'Create employment opportunities',
      ],
      description: 'Comprehensive skills training program for women empowerment',
      type: 'women_empowerment',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
      states: ['Lagos', 'FCT'],
      lgas: ['Ikeja', 'Abuja Municipal'],
      location: {
        address: 'Training Center, Ikeja',
        city: 'Lagos',
      },
      partners: [],
      targetBeneficiaries: 300,
      actualBeneficiaries: 0,
      beneficiaryIds: [],
      budget: {
        allocated: 10000000,
        spent: 0,
        currency: 'NGN',
      },
      expenditures: [],
      media: [],
      documentation: [],
      monitoringReports: [],
      evaluationReports: [],
      status: 'planning',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const program of programs) {
    try {
      const docRef = await db.collection('programs').add(program);
      createdIds.programs.push(docRef.id);
      console.log(`  ✅ Created program: ${program.title} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create program ${program.title}:`, error.message);
    }
  }
}

// ============================================
// DONATIONS
// ============================================
async function createDonations() {
  console.log('\n💰 Creating Donations...');
  
  const donations = [
    {
      donorId: 'donor-001',
      donorName: 'ABC Corporation',
      amount: 5000000,
      currency: 'NGN',
      donationDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
      paymentMethod: 'bank_transfer',
      receiptNumber: 'REC-2024-001',
      programId: createdIds.programs[0],
      programName: 'Health Outreach Program 2024',
      expenditures: [],
      balanceRemaining: 5000000,
      donorRestrictions: ['Health programs only'],
      donorReporting: {
        lastReportDate: null,
        nextReportDue: admin.firestore.Timestamp.fromDate(new Date('2024-04-15')),
        reportFrequency: 'quarterly',
        reports: [],
      },
      purpose: 'Support for health outreach activities',
      status: 'confirmed',
      notes: 'Corporate donation for health programs',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      donorId: 'donor-002',
      donorName: 'Individual Donor - Mr. James Wilson',
      amount: 500000,
      currency: 'NGN',
      donationDate: admin.firestore.Timestamp.fromDate(new Date('2024-02-10')),
      paymentMethod: 'online',
      receiptNumber: 'REC-2024-002',
      programId: createdIds.programs[1],
      programName: 'Prison Clearance Initiative',
      expenditures: [],
      balanceRemaining: 500000,
      purpose: 'General support',
      status: 'confirmed',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const donation of donations) {
    try {
      const docRef = await db.collection('donations').add(donation);
      createdIds.donations.push(docRef.id);
      console.log(`  ✅ Created donation: ${donation.donorName} - ${donation.amount} ${donation.currency} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create donation:`, error.message);
    }
  }
}

// ============================================
// GRANTS
// ============================================
async function createGrants() {
  console.log('\n🎓 Creating Grants...');
  
  const grants = [
    {
      grantor: 'International Development Foundation',
      grantName: 'Community Health Improvement Grant 2024',
      grantorContact: {
        email: 'grants@idf.org',
        phoneNumber: '+1-555-123-4567',
        contactPerson: 'Sarah Johnson',
      },
      amount: 10000000,
      currency: 'NGN',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
      purpose: 'Support community health initiatives',
      programIds: [createdIds.programs[0]],
      programNames: ['Health Outreach Program 2024'],
      termsAndConditions: 'Funds must be used for health-related activities only',
      conditions: [
        'Monthly reporting required',
        'Quarterly financial audits',
        'Impact assessment at end of grant period',
      ],
      disbursementSchedule: [
        {
          id: randomString(),
          scheduledDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
          amount: 2500000,
          status: 'disbursed',
          actualDisbursementDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-05')),
        },
        {
          id: randomString(),
          scheduledDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-01')),
          amount: 2500000,
          status: 'pending',
        },
        {
          id: randomString(),
          scheduledDate: admin.firestore.Timestamp.fromDate(new Date('2024-07-01')),
          amount: 2500000,
          status: 'pending',
        },
        {
          id: randomString(),
          scheduledDate: admin.firestore.Timestamp.fromDate(new Date('2024-10-01')),
          amount: 2500000,
          status: 'pending',
        },
      ],
      milestones: [
        {
          id: randomString(),
          title: 'Q1 Program Launch',
          description: 'Launch health outreach program',
          targetDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-31')),
          status: 'completed',
          completionDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-15')),
          deliverables: ['Program launched', '150 beneficiaries reached'],
        },
        {
          id: randomString(),
          title: 'Mid-Year Assessment',
          description: 'Conduct mid-year program assessment',
          targetDate: admin.firestore.Timestamp.fromDate(new Date('2024-06-30')),
          status: 'in_progress',
        },
      ],
      deliverables: [
        {
          id: randomString(),
          title: 'Q1 Progress Report',
          description: 'Quarterly progress report',
          dueDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-15')),
          status: 'submitted',
          submissionDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-10')),
        },
      ],
      reportingRequirements: {
        frequency: 'quarterly',
        nextReportDue: admin.firestore.Timestamp.fromDate(new Date('2024-07-15')),
        lastReportDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-10')),
        reports: [
          {
            id: randomString(),
            reportDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-10')),
            reportType: 'usage',
            content: 'Q1 2024 progress report - Program launched successfully',
            status: 'approved',
          },
        ],
      },
      usageReport: {
        totalDisbursed: 2500000,
        totalSpent: 500000,
        balanceRemaining: 2000000,
        spendingByProgram: {
          [createdIds.programs[0]]: 500000,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      complianceTracking: {
        isCompliant: true,
        lastComplianceCheck: admin.firestore.Timestamp.fromDate(new Date('2024-04-10')),
      },
      status: 'active',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const grant of grants) {
    try {
      const docRef = await db.collection('grants').add(grant);
      createdIds.grants.push(docRef.id);
      console.log(`  ✅ Created grant: ${grant.grantName} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create grant ${grant.grantName}:`, error.message);
    }
  }
}

// ============================================
// PROJECTS
// ============================================
async function createProjects() {
  console.log('\n🏗️ Creating Projects...');
  
  const projects = [
    {
      name: 'Community Health Center Construction',
      type: 'construction',
      description: 'Construction of a new community health center in Lagos',
      objectives: [
        'Build 10-room health center',
        'Install medical equipment',
        'Train staff',
      ],
      location: {
        address: '123 Health Street',
        city: 'Lagos',
        state: 'Lagos',
        lga: 'Ikeja',
        country: 'Nigeria',
        gpsLocation: {
          latitude: 6.5244,
          longitude: 3.3792,
        },
      },
      budget: {
        allocated: 50000000,
        spent: 10000000,
        currency: 'NGN',
        breakdown: [
          {
            id: randomString(),
            category: 'Construction',
            amount: 30000000,
            description: 'Building construction costs',
          },
          {
            id: randomString(),
            category: 'Equipment',
            amount: 15000000,
            description: 'Medical equipment',
          },
          {
            id: randomString(),
            category: 'Other',
            amount: 5000000,
            description: 'Miscellaneous expenses',
          },
        ],
      },
      timeline: {
        startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
        milestones: [
          {
            id: randomString(),
            title: 'Foundation Complete',
            description: 'Complete foundation work',
            targetDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-31')),
            status: 'completed',
            completionDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-25')),
          },
          {
            id: randomString(),
            title: 'Structure Complete',
            description: 'Complete building structure',
            targetDate: admin.firestore.Timestamp.fromDate(new Date('2024-06-30')),
            status: 'in_progress',
          },
        ],
      },
      contractors: [
        {
          id: randomString(),
          name: 'ABC Construction Ltd',
          type: 'contractor',
          contactPerson: 'Mr. Adebayo',
          email: 'contact@abcconstruction.com',
          phoneNumber: '+2348011111111',
          contractAmount: 30000000,
          contractStartDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
          contractEndDate: admin.firestore.Timestamp.fromDate(new Date('2024-10-31')),
          status: 'active',
        },
      ],
      partnerIds: [createdIds.partners[0]],
      partnerNames: ['Ministry of Health, Lagos State'],
      documents: [],
      activityLog: [
        {
          id: randomString(),
          date: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
          user: 'system',
          userName: 'System',
          action: 'Project Started',
          description: 'Project construction commenced',
        },
      ],
      progress: {
        percentage: 20,
        lastUpdated: admin.firestore.Timestamp.fromDate(new Date('2024-03-25')),
        notes: 'Foundation work completed ahead of schedule',
      },
      media: [],
      completionCertificate: null,
      impactSummary: {
        beneficiariesReached: 0,
        communitiesImpacted: 1,
        outcomes: ['Health center construction in progress'],
      },
      status: 'in_progress',
      notes: 'Major infrastructure project',
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const project of projects) {
    try {
      const docRef = await db.collection('projects').add(project);
      createdIds.projects.push(docRef.id);
      console.log(`  ✅ Created project: ${project.name} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create project ${project.name}:`, error.message);
    }
  }
}

// ============================================
// EVENTS (CALENDAR)
// ============================================
async function createEvents() {
  console.log('\n📅 Creating Events...');
  
  const events = [
    {
      title: 'Health Outreach Program Launch',
      description: 'Official launch of the Health Outreach Program 2024',
      type: 'program_launch',
      scope: 'national',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-15')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-15')),
      allDay: true,
      location: {
        address: 'Ikeja, Lagos',
        city: 'Lagos',
        state: 'Lagos',
      },
      reminders: [
        {
          id: randomString(),
          type: 'email',
          frequency: 'none',
          daysBefore: 7,
          enabled: true,
        },
      ],
      isRecurring: false,
      programId: createdIds.programs[0],
      programName: 'Health Outreach Program 2024',
      assignedTo: [],
      relatedBeneficiaryIds: createdIds.beneficiaries.slice(0, 2),
      relatedPartnerIds: [createdIds.partners[0]],
      status: 'scheduled',
      priority: 'high',
      color: '#3b82f6',
      tags: ['health', 'launch', 'program'],
      attachments: [],
      followUpRequired: true,
      followUpDate: admin.firestore.Timestamp.fromDate(new Date('2024-04-16')),
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: 'Monthly Team Meeting',
      description: 'Monthly coordination meeting for all program coordinators',
      type: 'meeting',
      scope: 'national',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-05-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-05-01')),
      allDay: false,
      startTime: '10:00',
      endTime: '12:00',
      timezone: 'Africa/Lagos',
      location: {
        address: 'Head Office, Abuja',
        city: 'Abuja',
        state: 'FCT',
      },
      reminders: [
        {
          id: randomString(),
          type: 'in_app',
          frequency: 'none',
          daysBefore: 1,
          enabled: true,
        },
      ],
      isRecurring: true,
      recurrencePattern: {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 1,
      },
      assignedTo: [],
      status: 'scheduled',
      priority: 'medium',
      color: '#10b981',
      tags: ['meeting', 'coordination'],
      attachments: [],
      followUpRequired: false,
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const event of events) {
    try {
      const docRef = await db.collection('calendarEvents').add(event);
      createdIds.events.push(docRef.id);
      console.log(`  ✅ Created event: ${event.title} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create event ${event.title}:`, error.message);
    }
  }
}

// ============================================
// WORKFLOWS
// ============================================
async function createWorkflows() {
  console.log('\n🔄 Creating Workflows...');
  
  const workflows = [
    {
      name: 'Beneficiary Registration Workflow',
      description: 'Standard workflow for registering new beneficiaries',
      category: 'beneficiary_management',
      status: 'active',
      steps: [
        {
          id: randomString(),
          name: 'Initial Registration',
          description: 'Collect basic beneficiary information',
          order: 1,
          required: true,
          assigneeRole: 'field_officer',
          status: 'pending',
        },
        {
          id: randomString(),
          name: 'Verification',
          description: 'Verify beneficiary information and documents',
          order: 2,
          required: true,
          assigneeRole: 'state_admin',
          status: 'pending',
        },
        {
          id: randomString(),
          name: 'Approval',
          description: 'Final approval by state admin',
          order: 3,
          required: true,
          assigneeRole: 'state_admin',
          status: 'pending',
        },
      ],
      triggers: [
        {
          id: randomString(),
          type: 'manual',
          condition: 'user_action',
        },
      ],
      conditions: [],
      actions: [],
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Program Approval Workflow',
      description: 'Workflow for approving new programs',
      category: 'program_management',
      status: 'active',
      steps: [
        {
          id: randomString(),
          name: 'Program Proposal',
          description: 'Submit program proposal',
          order: 1,
          required: true,
          assigneeRole: 'state_admin',
          status: 'pending',
        },
        {
          id: randomString(),
          name: 'Budget Review',
          description: 'Review and approve budget',
          order: 2,
          required: true,
          assigneeRole: 'finance',
          status: 'pending',
        },
        {
          id: randomString(),
          name: 'Final Approval',
          description: 'Final approval by national admin',
          order: 3,
          required: true,
          assigneeRole: 'national_admin',
          status: 'pending',
        },
      ],
      triggers: [
        {
          id: randomString(),
          type: 'automatic',
          condition: 'program_created',
        },
      ],
      conditions: [],
      actions: [],
      createdBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const workflow of workflows) {
    try {
      const docRef = await db.collection('workflows').add(workflow);
      createdIds.workflows.push(docRef.id);
      console.log(`  ✅ Created workflow: ${workflow.name} (${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create workflow ${workflow.name}:`, error.message);
    }
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('🚀 Starting E2E Test Data Generation (Admin SDK)...\n');
  console.log('='.repeat(60));
  
  try {
    // Create all entities in order (respecting dependencies)
    await createBeneficiaries();
    await createPartners();
    await createPrograms();
    await createDonations();
    await createGrants();
    await createProjects();
    await createEvents();
    await createWorkflows();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  ✅ Beneficiaries: ${createdIds.beneficiaries.length}`);
    console.log(`  ✅ Programs: ${createdIds.programs.length}`);
    console.log(`  ✅ Partners: ${createdIds.partners.length}`);
    console.log(`  ✅ Donations: ${createdIds.donations.length}`);
    console.log(`  ✅ Grants: ${createdIds.grants.length}`);
    console.log(`  ✅ Projects: ${createdIds.projects.length}`);
    console.log(`  ✅ Events: ${createdIds.events.length}`);
    console.log(`  ✅ Workflows: ${createdIds.workflows.length}`);
    
    console.log('\n✅ Test data generation completed successfully!');
    console.log('\n📝 Created IDs (save for reference):');
    console.log(JSON.stringify(createdIds, null, 2));
    
    // Save IDs to file
    const fs = await import('fs');
    fs.writeFileSync(
      'test-data-ids.json',
      JSON.stringify(createdIds, null, 2),
      'utf8'
    );
    console.log('\n💾 Created IDs saved to test-data-ids.json');
    
  } catch (error) {
    console.error('\n❌ Error during test data generation:', error);
    process.exit(1);
  }
}

// Run the script
main();

