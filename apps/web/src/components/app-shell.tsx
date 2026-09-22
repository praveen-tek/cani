"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  Suspense,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { AuthGate } from "@/components/auth-gate";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/rate-limit-error";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  Archive,
  Bell,
  Check,
  Eye,
  GearSix,
  House,
  MagnifyingGlass,
  Plus,
  SidebarSimple,
  SignOut,
  Sparkle,
  User,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

interface TeamModalContextType {
  openCreateTeam: () => void;
}

const TeamModalContext = createContext<TeamModalContextType>({
  openCreateTeam: () => { },
});

export const useTeamModal = () => useContext(TeamModalContext);

function DashboardTopBar() {
  const { toggleSidebar } = useSidebar();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const shouldFetch = isAuthenticated && !isLoading;

  const viewer = useQuery(api.users.viewer, shouldFetch ? {} : "skip");
  const profile = useQuery(api.profiles.me, shouldFetch ? {} : "skip");
  const setEmailAlerts = useMutation(api.profiles.setEmailAlerts);
  const unreadAlertCount =
    useQuery(api.monitors.getUnreadAlertCount, shouldFetch ? {} : "skip") ?? 0;
  const recentAlerts = useQuery(
    api.monitors.getAlerts,
    shouldFetch ? { limit: 5 } : "skip"
  );
  const markAlertAsRead = useMutation(api.monitors.markAlertAsRead);
  const markAllAlertsAsRead = useMutation(api.monitors.markAllAlertsAsRead);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        alertsRef.current &&
        !alertsRef.current.contains(event.target as Node)
      ) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) w-full items-center justify-between border-b border-neutral-200 bg-white pl-3 pr-4 sm:pr-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal shrink-0"
          aria-label="Toggle Sidebar"
        >
          <SidebarSimple size={20} weight="light" />
        </button>

        <Link
          href="/discover"
          className="flex items-center gap-2.5 group cursor-pointer shrink-0 whitespace-nowrap"
        >
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center p-1 shrink-0">
            <Image
              src="/logo.svg"
              alt="Cani Logo"
              width={18}
              height={18}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-serif text-2xl text-neutral-900 tracking-tight font-normal leading-none pr-1 select-none">
            Cani
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Alerts Popover */}
        <div className="relative" ref={alertsRef}>
          <button
            type="button"
            onClick={() => setIsAlertsOpen((prev) => !prev)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal relative"
            aria-label="Alerts"
          >
            <Bell size={20} weight="light" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-2xl border border-neutral-200 shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                <span className="font-serif text-sm text-neutral-900 font-normal">
                  Alerts {unreadAlertCount > 0 && `(${unreadAlertCount} new)`}
                </span>
                {unreadAlertCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAlertsAsRead({})}
                    className="text-2xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {recentAlerts && recentAlerts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentAlerts.map((a) => (
                    <div
                      key={a._id}
                      className={`p-2 rounded-xl text-xs space-y-1 transition ${a.read ? "bg-white text-neutral-600" : "bg-neutral-50 text-neutral-900 font-medium"
                        }`}
                    >
                      <div className="flex items-center justify-between text-2xs">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 font-mono uppercase text-[9px]">
                          {a.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-neutral-400 font-mono text-[10px]">
                          {new Date(a.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="line-clamp-1 font-serif text-xs">{a.title}</p>
                      <p className="line-clamp-2 text-2xs text-neutral-500 font-normal">{a.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400">
                  No alerts yet. Monitored items will show up here.
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-neutral-100 text-center">
                <Link
                  href="/watch"
                  onClick={() => setIsAlertsOpen(false)}
                  className="text-2xs text-neutral-900 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Eye size={12} weight="light" />
                  <span>Go to Watch Center</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {viewer === undefined ? (
          <>
            <div className="w-7 h-7 rounded-full bg-neutral-200 animate-pulse shrink-0" />
            <div className="hidden sm:block w-20 h-4 bg-neutral-200 rounded-md animate-pulse" />
          </>
        ) : (
          <>
            {viewer?.image ? (
              <img
                src={viewer.image}
                alt={viewer.name || "User"}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 font-serif text-xs flex items-center justify-center font-normal shrink-0 border border-neutral-200">
                {viewer?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-normal text-neutral-700 truncate max-w-[140px]">
              {viewer?.name || "Shopper"}
            </span>
          </>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal"
            aria-label="Settings"
          >
            <GearSix size={20} weight="light" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl border border-neutral-200 p-1 z-50">
              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-3 py-2 text-xs font-normal text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                <User size={16} weight="light" />
                <span>Profile &amp; Settings</span>
              </Link>
              <div className="px-3 py-2 flex items-center justify-between text-xs font-normal text-neutral-700">
                <span>Email alerts</span>
                <Switch
                  checked={profile?.emailAlerts !== false}
                  onCheckedChange={(checked) => setEmailAlerts({ enabled: checked })}
                />
              </div>
              <div className="h-px bg-neutral-100 my-1" role="separator" />
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  void signOut();
                }}
                className="w-full text-left px-3 py-2 text-xs font-normal text-red-600 hover:bg-red-50 focus:bg-red-50 rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                <SignOut size={16} weight="light" className="text-red-600 shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const menuButtonClassName =
  "h-10 text-[15px] font-normal px-2.5 gap-3 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden [&>svg]:size-5 [&>svg]:shrink-0";

function AppSidebarInner({ onOpenNewTeam }: { onOpenNewTeam: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTeamId = searchParams.get("id");
  const { isAuthenticated, isLoading } = useConvexAuth();
  const shouldFetch = isAuthenticated && !isLoading;

  const teams = useQuery(api.teams.listMine, shouldFetch ? {} : "skip");
  const unreadAlerts =
    useQuery(api.monitors.getUnreadAlertCount, shouldFetch ? {} : "skip") ?? 0;

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarContent>
        <SidebarGroup className="px-2 py-3">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/discover"}
                tooltip="Discover"
                className={menuButtonClassName}
              >
                <Link href="/discover">
                  <MagnifyingGlass size={20} weight="light" />
                  <span>Discover</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip="For you"
                className={menuButtonClassName}
              >
                <Link href="/dashboard">
                  <Sparkle size={20} weight="light" />
                  <span>For you</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/watch"}
                tooltip="Watch"
                className={menuButtonClassName}
              >
                <Link href="/watch">
                  <Eye size={20} weight="light" />
                  <span className="flex items-center justify-between flex-1">
                    <span>Watch</span>
                    {unreadAlerts > 0 && (
                      <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-mono flex items-center justify-center shrink-0">
                        {unreadAlerts > 9 ? "9+" : unreadAlerts}
                      </span>
                    )}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/profile"}
                tooltip="Profile"
                className={menuButtonClassName}
              >
                <Link href="/profile">
                  <User size={20} weight="light" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/archived"}
                tooltip="Archived Rooms"
                className={menuButtonClassName}
              >
                <Link href="/archived">
                  <Archive size={20} weight="light" />
                  <span>Archived</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-2 py-3 pt-0">
          <SidebarGroupLabel className="text-xs font-normal text-neutral-500 normal-case px-2.5 mt-2">
            Teams
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {teams === undefined ? (
                <>
                  <SidebarMenuSkeleton className="h-10" />
                  <SidebarMenuSkeleton className="h-10" />
                </>
              ) : teams.length === 0 ? (
                <div className="px-2.5 py-2 text-xs font-normal text-neutral-500 group-data-[collapsible=icon]:hidden">
                  No teams yet
                </div>
              ) : (
                teams.map((team) => {
                  const isActive =
                    pathname === "/team" && currentTeamId === team._id;
                  return (
                    <SidebarMenuItem key={team._id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={team.name}
                        className={menuButtonClassName}
                      >
                        <Link href={`/team?id=${team._id}`}>
                          <UsersThree size={20} weight="light" />
                          <span className="truncate">{team.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenNewTeam}
                  tooltip="New team"
                  className={menuButtonClassName}
                >
                  <Plus size={20} weight="light" />
                  <span>New team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AppSidebar({ onOpenNewTeam }: { onOpenNewTeam: () => void }) {
  return (
    <Suspense
      fallback={
        <Sidebar
          collapsible="icon"
          variant="sidebar"
          className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
        >
          <SidebarContent>
            <SidebarGroup className="px-2 py-3">
              <SidebarMenu className="gap-1">
                <SidebarMenuSkeleton className="h-10" />
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      }
    >
      <AppSidebarInner onOpenNewTeam={onOpenNewTeam} />
    </Suspense>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const createTeam = useMutation(api.teams.create);

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreatingTeam(true);
    setCreateTeamError(null);
    try {
      const teamId = await createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
      setShowCreateTeamModal(false);
      router.push(`/team?id=${teamId}`);
    } catch (err: unknown) {
      setCreateTeamError(getErrorMessage(err));
    } finally {
      setIsCreatingTeam(false);
    }
  };

  return (
    <AuthGate>
      <TooltipProvider>
        <div
          className="h-dvh overflow-hidden flex flex-col [--header-height:3.5rem]"
        >
          <SidebarProvider
            style={
              {
                "--sidebar-width": "16rem",
                "--sidebar-width-icon": "3.5rem",
                "--header-height": "3.5rem",
              } as React.CSSProperties
            }
            className="flex-col! h-full overflow-hidden"
          >
            <TeamModalContext.Provider
              value={{ openCreateTeam: () => setShowCreateTeamModal(true) }}
            >
              <DashboardTopBar />
              <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <AppSidebar
                  onOpenNewTeam={() => setShowCreateTeamModal(true)}
                />
                <SidebarInset
                  className={cn(
                    "bg-[#fafafa]",
                    pathname === "/discover"
                      ? "p-0 overflow-hidden"
                      : "p-6 sm:p-8"
                  )}
                >
                  {children}
                </SidebarInset>
              </div>

              {/* Global Create Team Dialog */}
              {showCreateTeamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
                  <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-2xl text-neutral-900 font-normal">
                        Create New Team
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateTeamModal(false);
                          setNewTeamName("");
                          setCreateTeamError(null);
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal"
                      >
                        <X size={16} weight="light" />
                      </button>
                    </div>

                    {createTeamError && (
                      <p className="mb-4 text-xs text-neutral-500 font-normal">
                        {createTeamError}
                      </p>
                    )}

                    <form onSubmit={handleCreateTeamSubmit} className="space-y-4 font-normal">
                      <div>
                        <label
                          htmlFor="team-name"
                          className="block text-xs text-neutral-500 font-normal mb-1.5"
                        >
                          Team Name
                        </label>
                        <input
                          id="team-name"
                          type="text"
                          required
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="e.g. Design Studio, Marketing, Family"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateTeamModal(false);
                            setNewTeamName("");
                            setCreateTeamError(null);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingTeam || !newTeamName.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-normal bg-neutral-900 text-white hover:bg-black transition cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingTeam ? "Creating..." : "Create Team"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </TeamModalContext.Provider>
          </SidebarProvider>
        </div>
      </TooltipProvider>
    </AuthGate>
  );
}
