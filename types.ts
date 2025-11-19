
// FIX: Re-added types for object detection, analysis reports, and images to resolve import errors.
export interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Detection {
    box: BoundingBox;
    label: string;
    confidence: number;
    severity: 'Baixa' | 'Média' | 'Alta';
}

export type DetectionReport = Detection[];

export interface Annotation {
    id: string;
    type: 'rect' | 'arrow';
    color: string;
    points: { x1: number, y1: number, x2: number, y2: number };
}

export interface Comment {
    id: string;
    authorEmail: string;
    authorName: string;
    text: string;
    createdAt: string;
}

export interface VoiceNote {
    id: string;
    audioUrl: string; // Blob URL for playback
    transcription: string;
    createdAt: string;
}

export interface AnalyzedImage {
    id: string;
    element: string;
    location: string;
    pinLabel?: string;
    previewUrl: string;
    report: DetectionReport | null;
    rootCauseAnalysis: string | null;
    costEstimation?: string | null;
    status: 'pending' | 'completed' | 'error';
    coordinates?: { x: number; y: number }; // Blueprint coordinates (0-1)
    geoLocation?: { lat: number; lng: number; altitude?: number }; // Real world GPS
    annotations?: Annotation[];
    comments?: Comment[];
    voiceNotes?: VoiceNote[];
}


export enum SubscriptionStatus {
    ACTIVE = 'active',
    PAST_DUE = 'past_due', // Grace period
    EXPIRED = 'expired',
    PAYMENT_PENDING = 'payment_pending', // When a renewal is submitted
}

export interface AppNotification {
    id: string;
    message: string;
    // FIX: Added 'error' to the possible types for notifications.
    type: 'success' | 'warning' | 'info' | 'error';
    createdAt: string;
    read: boolean;
}

export interface User {
  name: string;
  email: string;
  password?: string; // Only stored in localStorage, not in state
  isAdmin?: boolean; // Distinguishes admins from regular users
  // CRM Fields
  plan: Plan;
  pendingPlan?: Plan | null; // Indicates a plan change is awaiting approval
  lastLogin?: string;
  projectCount?: number;
  crmNotes?: string;
  // Subscription details for paid plans
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionStatus?: SubscriptionStatus;
  // Replaces the single notification modal
  notifications: AppNotification[];
  // Team Management fields
  team?: {
    members: string[]; // Array of member emails
    pendingMembers?: string[]; // Members awaiting admin approval
  };
  memberOf?: string; // Email of the team owner, if this user is a member
}

export enum Plan {
  FREE = 'Gratuito',
  PRO = 'Profissional',
  CUSTOM = 'Personalizado',
}

export interface ReportCustomization {
    logo?: string; // Base64 data URL
    primaryColor?: string; // Hex code
    footerText?: string;
    sections: {
        executiveSummary: boolean;
        costEstimation: boolean;
        blueprint: boolean;
        detailedStats: boolean;
        aiAnalysis: boolean;
    };
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  userEmail: string; // Projects belong to a single user
  // FIX: Added optional 'images' property to support project reports.
  images?: AnalyzedImage[];
  executiveSummary?: string; // AI Generated Project-Level Summary
  blueprint?: {
    name: string;
    image: string; // base64 data url
    annotations?: Annotation[]; // Drawings/sketches on the blueprint
  };
  reportSettings?: ReportCustomization;
}

export interface LoginPageContent {
    mainTitle: string;
    mainSubtitle: string;
    mainDescription: string;
    service1Title: string;
    service1Description: string;
    service2Title: string;
    service2Description: string;
}

export interface SalesInquiry {
    id: string;
    userEmail: string;
    userName: string;
    companyName?: string;
    teamSize?: string;
    useCase?: string;
    phone?: string;
    submittedAt: string;
    requestedPlan: Plan;
    status: 'pending' | 'approved' | 'rejected';
    paymentProofImage?: string; // Base64 image string - Optional, for PRO plan
}

export interface TeamMemberInquiry {
    id: string;
    ownerEmail: string;
    ownerName: string;
    memberEmail: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    paymentProofImage: string; // Base64 image string
}

export interface RoboflowModel {
    id: string;
    name: string;
    workflowUrl: string;
    apiKey: string;
    isActive: boolean;
}

export interface DroneTelemetry {
    model: string;
    battery: number;
    gps: number;
    altitude: number;
    missionType: 'Visual' | 'Térmica' | 'Estrutural' | '3D Mapping';
}

export interface Review {
    id: string;
    authorName: string;
    authorInfo: string; // e.g., "CEO, Construtora X"
    rating: number; // 1-5
    text: string;
    isFeatured: boolean;
}