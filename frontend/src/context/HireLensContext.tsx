'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Job,
  Candidate,
  Interview,
  Evaluation,
  TeamMember,
  ActivityItem,
  NotificationItem,
  CandidateStage,
  JobStatus,
  InterviewStatus,
} from '@/lib/types';
import {
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_INTERVIEWS,
  INITIAL_EVALUATIONS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
} from '@/lib/mock-data';
import { checkBackendHealth } from '@/lib/api';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface HireLensContextType {
  // Domain data
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  evaluations: Evaluation[];
  teamMembers: TeamMember[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  
  // Backend health status
  backendStatus: 'checking' | 'connected' | 'disconnected';
  backendMessage: string;
  checkBackendConnection: () => Promise<void>;

  // Actions
  addJob: (jobData: Omit<Job, 'id' | 'createdAt' | 'candidatesCount'>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  addCandidate: (candidateData: Omit<Candidate, 'id' | 'appliedDate'>) => void;
  updateCandidateStage: (id: string, stage: CandidateStage) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id'>) => void;
  updateInterviewStatus: (id: string, status: InterviewStatus) => void;
  updateEvaluationNotes: (id: string, notes: string) => void;
  markEvaluationReviewed: (id: string) => void;
  addTeamMember: (memberData: Omit<TeamMember, 'id' | 'status' | 'avatarInitials' | 'activeInterviewsCount'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Modals & Drawers
  isCreateJobModalOpen: boolean;
  setIsCreateJobModalOpen: (open: boolean) => void;
  isScheduleInterviewModalOpen: boolean;
  setIsScheduleInterviewModalOpen: (open: boolean) => void;
  isInviteTeamModalOpen: boolean;
  setIsInviteTeamModalOpen: (open: boolean) => void;
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
  selectedEvaluationId: string | null;
  setSelectedEvaluationId: (id: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  
  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Toast feedback
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const HireLensContext = createContext<HireLensContextType | undefined>(undefined);

export function HireLensProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [interviews, setInterviews] = useState<Interview[]>(INITIAL_INTERVIEWS);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendMessage, setBackendMessage] = useState<string>('Connecting to FastAPI backend...');

  // Modal / drawer controls
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isScheduleInterviewModalOpen, setIsScheduleInterviewModalOpen] = useState(false);
  const [isInviteTeamModalOpen, setIsInviteTeamModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // FastAPI connection verification
  const checkBackendConnection = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const data = await checkBackendHealth();
      setBackendStatus('connected');
      setBackendMessage(`${data.service || 'FastAPI Backend'} online (200 OK)`);
    } catch {
      setBackendStatus('disconnected');
      setBackendMessage('Backend offline — relying on local demo data');
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    checkBackendHealth()
      .then((data) => {
        if (ignore) return;
        setBackendStatus('connected');
        setBackendMessage(`${data.service || 'FastAPI Backend'} online (200 OK)`);
      })
      .catch(() => {
        if (!ignore) {
          setBackendStatus('disconnected');
          setBackendMessage('Backend offline — relying on local demo data');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Actions
  const addJob = useCallback((jobData: Omit<Job, 'id' | 'createdAt' | 'candidatesCount'>) => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      createdAt: 'Just now',
      candidatesCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        type: 'job',
        title: 'Job opening created',
        description: `New position "${newJob.title}" added to active roles.`,
      },
      ...prev,
    ]);
    showToast(`Job "${newJob.title}" created successfully!`);
  }, [showToast]);

  const updateJobStatus = useCallback((id: string, status: JobStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status } : j))
    );
    showToast(`Job status updated to ${status}`);
  }, [showToast]);

  const addCandidate = useCallback((candidateData: Omit<Candidate, 'id' | 'appliedDate'>) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: `cand-${Date.now()}`,
      appliedDate: 'Just now',
    };
    setCandidates((prev) => [newCandidate, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        type: 'candidate',
        title: 'Candidate added',
        description: `${newCandidate.name} added to pipeline for ${newCandidate.role}.`,
      },
      ...prev,
    ]);
    showToast(`Candidate ${newCandidate.name} added successfully!`);
  }, [showToast]);

  const updateCandidateStage = useCallback((id: string, stage: CandidateStage) => {
    let candidateName = '';
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          candidateName = c.name;
          return { ...c, stage };
        }
        return c;
      })
    );
    if (candidateName) {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          type: 'candidate',
          title: 'Candidate stage updated',
          description: `${candidateName} moved to ${stage} stage.`,
        },
        ...prev,
      ]);
      showToast(`${candidateName} moved to ${stage}`);
    }
  }, [showToast]);

  const scheduleInterview = useCallback((interviewData: Omit<Interview, 'id'>) => {
    const newInterview: Interview = {
      ...interviewData,
      id: `int-${Date.now()}`,
    };
    setInterviews((prev) => [newInterview, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        type: 'interview',
        title: 'Interview scheduled',
        description: `${newInterview.type} with ${newInterview.candidateName} on ${newInterview.date}.`,
      },
      ...prev,
    ]);
    showToast(`Interview scheduled for ${newInterview.candidateName}!`);
  }, [showToast]);

  const updateInterviewStatus = useCallback((id: string, status: InterviewStatus) => {
    setInterviews((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    showToast(`Interview status marked as ${status}`);
  }, [showToast]);

  const updateEvaluationNotes = useCallback((id: string, notes: string) => {
    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, reviewerNotes: notes } : e))
    );
    showToast('Reviewer notes saved successfully!');
  }, [showToast]);

  const markEvaluationReviewed = useCallback((id: string) => {
    setEvaluations((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'Reviewed',
              reviewedBy: 'Alex Vance',
              reviewedAt: 'Today',
            }
          : e
      )
    );
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        type: 'evaluation',
        title: 'Evaluation completed',
        description: `Rubric review completed and signed off by Alex Vance.`,
      },
      ...prev,
    ]);
    showToast('Evaluation marked as Reviewed and signed off!');
  }, [showToast]);

  const addTeamMember = useCallback((memberData: Omit<TeamMember, 'id' | 'status' | 'avatarInitials' | 'activeInterviewsCount'>) => {
    const initials = memberData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    const newMember: TeamMember = {
      ...memberData,
      id: `tm-${Date.now()}`,
      status: 'Invited',
      avatarInitials: initials,
      activeInterviewsCount: 0,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    showToast(`Invitation sent to ${memberData.email}!`);
  }, [showToast]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  }, [showToast]);

  return (
    <HireLensContext.Provider
      value={{
        jobs,
        candidates,
        interviews,
        evaluations,
        teamMembers,
        activities,
        notifications,
        backendStatus,
        backendMessage,
        checkBackendConnection,
        addJob,
        updateJobStatus,
        addCandidate,
        updateCandidateStage,
        scheduleInterview,
        updateInterviewStatus,
        updateEvaluationNotes,
        markEvaluationReviewed,
        addTeamMember,
        markNotificationRead,
        markAllNotificationsRead,
        isCreateJobModalOpen,
        setIsCreateJobModalOpen,
        isScheduleInterviewModalOpen,
        setIsScheduleInterviewModalOpen,
        isInviteTeamModalOpen,
        setIsInviteTeamModalOpen,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedEvaluationId,
        setSelectedEvaluationId,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </HireLensContext.Provider>
  );
}

export function useHireLens() {
  const context = useContext(HireLensContext);
  if (!context) {
    throw new Error('useHireLens must be used within a HireLensProvider');
  }
  return context;
}
