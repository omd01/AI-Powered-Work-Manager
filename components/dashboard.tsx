"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Users, Briefcase, CheckSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

interface DashboardProps {
  onViewChange: (view: "dashboard" | "projects" | "tasks") => void;
  onOpenCreateProject?: () => void;
  onOpenAITaskAssigner?: () => void;
  onOpenTeamSettings?: () => void;
}

interface DashboardStats {
  organization: {
    id: string;
    name: string;
    handle: string;
    inviteCode: string;
    adminId: string;
  };
  statistics: {
    memberCount: number;
    projectCount: number;
    activeProjects: number;
    taskCount: number;
    pendingTasks: number;
    completedTasks: number;
    aiAssignments: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    lead: string;
    status: string;
    progress: number;
  }>;
}

export default function Dashboard({
  onViewChange,
  onOpenCreateProject,
  onOpenAITaskAssigner,
  onOpenTeamSettings,
}: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/organizations/stats", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-9 w-12 bg-primary-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.statistics.projectCount || 0}
                </p>
              )}
              <Briefcase className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-9 w-12 bg-primary-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.statistics.memberCount || 0}
                </p>
              )}
              <Users className="w-8 h-8 text-accent opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-9 w-12 bg-primary-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.statistics.pendingTasks || 0}
                </p>
              )}
              <CheckSquare className="w-8 h-8 text-secondary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-9 w-12 bg-primary-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.statistics.aiAssignments || 0}
                </p>
              )}
              <Zap className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your most recently created projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-20 w-full bg-muted/50" />
                    <Skeleton className="h-20 w-full bg-muted/50" />
                    <Skeleton className="h-20 w-full bg-muted/50" />
                  </>
                ) : stats?.recentProjects && stats.recentProjects.length > 0 ? (
                  stats.recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {project.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Lead: {project.lead}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {project.progress}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No projects yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={onOpenCreateProject}
                    >
                      Create your first project
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onViewChange("projects")}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View Projects
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={onOpenCreateProject}
              >
                Create Project
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={onOpenAITaskAssigner}
              >
                Assign Tasks with AI
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={onOpenTeamSettings}
              >
                Team Settings
              </Button>
            </CardContent>
          </Card>

          {/* AI Feature Highlight
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI Task Assigner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Describe what needs to be done in natural language. AI
                automatically identifies the project and assigns the task to the
                right Lead.
              </p>
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={onOpenAITaskAssigner}
              >
                Try Now
              </Button>
            </CardContent>
          </Card> */}

          {/* Organization Info */}
          {stats?.organization && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Organization Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invite Code:</span>
                  <code className="font-mono font-bold">
                    {stats.organization.inviteCode}
                  </code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tasks:</span>
                  <span className="font-medium">
                    {stats.statistics.taskCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium text-green-600">
                    {stats.statistics.completedTasks}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
