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
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { AuthGate } from "@/components/auth-gate";
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
import {
  Archive,
  GearSix,
  House,
  MagnifyingGlass,
  Plus,
  SidebarSimple,
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
  openCreateTeam: () => {},
});

export const useTeamModal = () => useContext(TeamModalContext);

function DashboardTopBar() {
  const { toggleSidebar } = useSidebar();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 h-14 bg-white border-b border-neutral-200 z-30">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal"
            aria-label="Toggle Sidebar"
          >
            <SidebarSimple size={20} weight="light" />
          </button>

          <Link
            href="/discover"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center p-1 overflow-hidden">
              <Image
                src="/logo.svg"
                alt="Cani Logo"
                width={18}
                height={18}
                className="w-full h-full object-contain invert"
              />
            </div>
            <span className="font-serif text-2xl text-neutral-900 tracking-tight font-normal">
              Cani
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 font-serif text-xs flex items-center justify-center font-normal shrink-0">
                  {viewer?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="hidden sm:inline text-sm font-normal text-neutral-700">
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
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-neutral-200 shadow-sm py-1 z-40">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-3.5 py-2 text-sm font-normal text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition cursor-pointer flex items-center gap-2"
                >
                  <User size={16} weight="light" />
                  <span>Profile &amp; Settings</span>
                </Link>
                <div className="h-px bg-neutral-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    void signOut();
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm font-normal text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const menuButtonClassName =
  "h-10 text-[15px] font-normal px-3 gap-3 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden [&>svg]:size-5 [&>svg]:shrink-0";

function AppSidebarInner({ onOpenNewTeam }: { onOpenNewTeam: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTeamId = searchParams.get("id");
  const teams = useQuery(api.teams.listMine);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup className="p-3">
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

        <SidebarGroup className="p-3 pt-0">
          <SidebarGroupLabel className="text-xs font-normal text-neutral-500 normal-case px-3 mt-2">
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
                <div className="px-3 py-2 text-xs font-normal text-neutral-400 group-data-[collapsible=icon]:hidden">
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
        <Sidebar collapsible="icon" variant="sidebar">
          <SidebarContent>
            <SidebarGroup className="p-3">
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

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
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
      setCreateTeamError(
        err instanceof Error ? err.message : "Failed to create team."
      );
    } finally {
      setIsCreatingTeam(false);
    }
  };

  return (
    <AuthGate>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3.5rem",
            "--header-height": "3.5rem",
          } as React.CSSProperties
        }
      >
        <TeamModalContext.Provider
          value={{ openCreateTeam: () => setShowCreateTeamModal(true) }}
        >
          <DashboardTopBar />
          <div className="flex w-full pt-[var(--header-height)]">
            <AppSidebar
              onOpenNewTeam={() => setShowCreateTeamModal(true)}
            />
            <SidebarInset className="p-6 sm:p-8 bg-[#fafafa] min-h-[calc(100svh-var(--header-height))]">
              {children}
            </SidebarInset>
          </div>

          {/* Global Create Team Dialog */}
          {showCreateTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl text-neutral-900 font-normal">
                    Create a Team
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeamModal(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-900 transition cursor-pointer font-normal"
                  >
                    <X size={18} weight="light" />
                  </button>
                </div>

                {createTeamError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 font-normal">
                    <WarningCircle size={16} weight="light" />
                    <span>{createTeamError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-neutral-700 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      maxLength={50}
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g. Holiday Wishlist, Apartment Gear..."
                      className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTeamModal(false)}
                      className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingTeam || !newTeamName.trim()}
                      className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isCreatingTeam ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Create Team</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </TeamModalContext.Provider>
      </SidebarProvider>
    </AuthGate>
  );
}
