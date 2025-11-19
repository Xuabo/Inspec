
import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/Login';
import { LoginModal } from './components/LoginModal';
import { Pricing } from './components/Pricing';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectView } from './components/ProjectView';
import { AdminDashboard } from './components/AdminDashboard';
import * as backend from './services/backendService';
import type { User, Plan, Project, SalesInquiry, TeamMemberInquiry, RoboflowModel, Review } from './types';
import { Plan as PlanEnum } from './types';
import { PermissionPrimer } from './components/PermissionPrimer';

const App: React.FC = () => {
    // State
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [salesInquiries, setSalesInquiries] = useState<SalesInquiry[]>([]);
    const [teamMemberInquiries, setTeamMemberInquiries] = useState<TeamMemberInquiry[]>([]);
    const [roboflowModels, setRoboflowModels] = useState<RoboflowModel[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [activeModel, setActiveModel] = useState<RoboflowModel | null>(null);

    // Control State
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginModalView, setLoginModalView] = useState<'login' | 'register'>('login');
    const [isChangingPlan, setIsChangingPlan] = useState(false);
    const [showPermissionPrimer, setShowPermissionPrimer] = useState(false);

    // --- Data Loading and Hydration ---
    const loadUserData = useCallback(async (currentUser: User) => {
        if (currentUser.isAdmin) {
            const [users, projects, inquiries, teamInquiries] = await Promise.all([
                backend.getAllUsers(),
                backend.getAllProjects(),
                backend.getAllSalesInquiries(),
                backend.getAllTeamMemberInquiries(),
            ]);
            const nonAdminUsers = users.filter((u: User) => !u.isAdmin);
            const enrichedUsers = nonAdminUsers.map((u: User) => ({
                ...u,
                projectCount: projects.filter((p: Project) => p.userEmail === u.email).length
            }));
            setAllUsers(enrichedUsers);
            setSalesInquiries(inquiries);
            setTeamMemberInquiries(teamInquiries);
        } else {
            const projectOwnerEmail = currentUser.memberOf || currentUser.email;
            const [userProjects, allSystemUsers] = await Promise.all([
                backend.getProjectsForUser(projectOwnerEmail),
                backend.getAllUsers()
            ]);
            setProjects(userProjects);
            setAllUsers(allSystemUsers.filter((u: User) => !u.isAdmin));
        }
    }, []);
    
    useEffect(() => {
        const checkCameraPermission = async () => {
            if (navigator.permissions?.query) {
                try {
                    // FIX: Cast 'camera' to PermissionName to satisfy stricter TypeScript versions.
                    const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    if (status.state === 'prompt' && !localStorage.getItem('inspecai-permission-primer-dismissed')) {
                        setShowPermissionPrimer(true);
                    }
                } catch (e) {
                    console.warn("Camera permission query failed. The primer will not be shown.", e);
                }
            }
        };
        checkCameraPermission();
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            await backend.initializeData();
            const models = await backend.getRoboflowModels();
            const active = models.find((m: RoboflowModel) => m.isActive) || null;
            setRoboflowModels(models);
            setActiveModel(active);
            setReviews(await backend.getReviews());

            const sessionUser = backend.checkSession();
            if (sessionUser) {
                const checkedUser = await backend.checkSubscriptionStatus(sessionUser);
                setUser(checkedUser);
                await loadUserData(checkedUser);
            }
            setIsAppLoading(false);
        };
        initializeApp();
    }, [loadUserData]);

    // --- Auth Handlers ---
    const handleLoginSuccess = async (loggedInUser: User) => {
        const checkedUser = await backend.checkSubscriptionStatus(loggedInUser);
        setUser(checkedUser);
        await loadUserData(checkedUser);
        setIsLoginModalOpen(false);
    };

    const handleLogout = () => {
        backend.logout();
        setUser(null);
        setProjects([]);
        setActiveProjectId(null);
    };

    const handleOpenLogin = () => {
        setLoginModalView('login');
        setIsLoginModalOpen(true);
    };

    const handleOpenRegister = () => {
        setLoginModalView('register');
        setIsLoginModalOpen(true);
    };
    
    const handleDismissPrimer = () => {
        try {
            localStorage.setItem('inspecai-permission-primer-dismissed', 'true');
        } catch (e) {
            console.error("Could not write to localStorage.", e);
        }
        setShowPermissionPrimer(false);
    };


    // --- Data Mutation Handlers ---
    const handleUpdateProject = async (updatedProject: Project) => {
        await backend.saveProject(updatedProject);
        setProjects(currentProjects =>
            currentProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
        );
    };

    const handleUpdateProjects = async (newProjects: Project[]) => {
        if(!user) return;
        const ownerEmail = user.memberOf || user.email;
        await backend.saveProjectsForUser(ownerEmail, newProjects);
        setProjects(newProjects);
    }
    
    const handleUpdateAllUsers = async (updatedUsers: User[]) => {
        await backend.saveAllUsers(updatedUsers);
        const projects = await backend.getAllProjects();
        const enriched = updatedUsers.map((u: User) => ({...u, projectCount: projects.filter((p: Project) => p.userEmail === u.email).length }));
        setAllUsers(enriched);
    };
    
    const handleDeleteUser = async (userToDelete: User) => {
         if (!window.confirm(`Tem a certeza que quer remover o utilizador ${userToDelete.email}? Esta ação é irreversível e irá apagar todos os seus projetos.`)) {
            return;
        }
        await backend.deleteUserAndProjects(userToDelete.email);
        const users = await backend.getAllUsers();
        setAllUsers(users.filter((u: User) => !u.isAdmin));
    };
    
    const handlePlanSelect = async (plan: Plan, details?: any) => {
        if (!user) {
             handleOpenRegister();
             return;
        }
        const updatedUser = await backend.requestPlanChange(user, plan, details);
        setUser(updatedUser);
        if (user.isAdmin) await loadUserData(user); // Refresh admin view
        setIsChangingPlan(false);
    };

    const handleApproveRequest = async (inquiryId: string) => {
        const { updatedUser, updatedInquiries } = await backend.approvePlanInquiry(inquiryId);
        setSalesInquiries(updatedInquiries);
        setAllUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    };

    const handleRejectRequest = async (inquiryId: string) => {
        const { updatedUser, updatedInquiries } = await backend.rejectPlanInquiry(inquiryId);
        setSalesInquiries(updatedInquiries);
        setAllUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    };

    const handleApproveAddMemberRequest = async (inquiryId: string) => {
        const { updatedUsers, updatedInquiries } = await backend.approveTeamMemberInquiry(inquiryId);
        setTeamMemberInquiries(updatedInquiries);
        await handleUpdateAllUsers(updatedUsers.filter((u: User) => !u.isAdmin)); // Trigger a full user refresh
    };

    const handleRejectAddMemberRequest = async (inquiryId: string) => {
        const { updatedOwner, updatedInquiries } = await backend.rejectTeamMemberInquiry(inquiryId);
        setTeamMemberInquiries(updatedInquiries);
        if(user?.email === updatedOwner.email) setUser(updatedOwner);
        setAllUsers(prev => prev.map(u => u.email === updatedOwner.email ? updatedOwner : u));
    };
    
    const handleUpdateTeam = async (updatedOwner: User) => {
        const updatedUsers = await backend.updateTeamMembers(updatedOwner);
        if (user?.email === updatedOwner.email) setUser(updatedOwner);
        await handleUpdateAllUsers(updatedUsers.filter((u: User) => !u.isAdmin));
    };
    
    const handleRequestAddMember = async (memberEmail: string, paymentProofImage: string) => {
        if (!user) return;
        const updatedOwner = await backend.requestAddTeamMember(user, memberEmail, paymentProofImage);
        setUser(updatedOwner);
    };

    const handleMarkNotificationAsRead = async (notificationId: string) => {
        if (!user) return;
        const updatedUser = await backend.updateNotification(user.email, notificationId, { read: true });
        setUser(updatedUser);
    };

    const handleMarkAllNotificationsAsRead = async () => {
        if (!user) return;
        const updatedUser = await backend.markAllNotificationsAsRead(user.email);
        setUser(updatedUser);
    };

    // --- View Rendering ---
    if (isAppLoading) {
        return <div className="min-h-screen bg-brand-midnight" />;
    }

    const activeProject = projects.find(p => p.id === activeProjectId);

    const renderContent = () => {
        if (!user) {
            const featuredReviews = reviews.filter(r => r.isFeatured);
            return (
                <>
                    <LandingPage 
                        featuredReviews={featuredReviews}
                        onLoginClick={handleOpenLogin}
                        onRegisterClick={handleOpenRegister}
                    />
                    {isLoginModalOpen && (
                        <LoginModal 
                            initialView={loginModalView}
                            onLoginSuccess={handleLoginSuccess} 
                            onClose={() => setIsLoginModalOpen(false)} 
                        />
                    )}
                </>
            );
        }

        if (user.isAdmin) {
            return <AdminDashboard
                user={user}
                onLogout={handleLogout}
                allUsers={allUsers}
                updateUsers={handleUpdateAllUsers}
                deleteUser={handleDeleteUser}
                planRequests={salesInquiries}
                approveRequest={handleApproveRequest}
                rejectRequest={handleRejectRequest}
                teamMemberInquiries={teamMemberInquiries}
                approveAddMemberRequest={handleApproveAddMemberRequest}
                rejectAddMemberRequest={handleRejectAddMemberRequest}
                models={roboflowModels}
                onUpdateModels={async (m) => { await backend.saveRoboflowModels(m); setRoboflowModels(m); setActiveModel(m.find((model: RoboflowModel) => model.isActive) || null); }}
                reviews={reviews}
                onUpdateReviews={async (r) => { await backend.saveReviews(r); setReviews(r); }}
            />;
        }

        if (isChangingPlan) {
            return <Pricing onPlanSelect={handlePlanSelect} onBack={() => setIsChangingPlan(false)} />;
        }
        
        if (activeProject && activeModel) {
            return <ProjectView
                project={activeProject}
                user={user}
                allUsers={allUsers} // Pass allUsers to ProjectView
                activeModel={activeModel}
                onLogout={handleLogout}
                onChangePlan={() => setIsChangingPlan(true)}
                onBack={() => setActiveProjectId(null)}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                onUpdateProject={handleUpdateProject}
            />;
        }
        
        return <ProjectDashboard
            user={user}
            allUsers={allUsers}
            projects={projects}
            setProjects={handleUpdateProjects}
            onProjectSelect={(id: string) => setActiveProjectId(id)}
            onLogout={handleLogout}
            onChangePlan={() => setIsChangingPlan(true)}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onUpdateTeam={handleUpdateTeam}
            onRequestAddMember={handleRequestAddMember}
            isModelConfigured={!!activeModel}
            activeModelName={activeModel?.name}
        />;
    };

    return (
        <div className="min-h-screen bg-brand-midnight text-brand-light font-sans">
            {showPermissionPrimer && <PermissionPrimer onDismiss={handleDismissPrimer} />}
            <div className={showPermissionPrimer ? 'pt-20 sm:pt-14' : ''}>
                {renderContent()}
            </div>
        </div>
    );
};

export default App;
