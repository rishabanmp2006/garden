import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, Calendar, Coins,
  AlertCircle, CheckCircle2,
  ListTodo, Layers, Loader2, FolderKanban
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface MilestoneTask {
  id: string;
  milestone_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  credits_reward: number;
  created_at: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  deliverables: string[];
  acceptance_criteria: string;
  budget_allocation: number;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'accepted' | 'rejected';
  completed_at: string | null;
  created_at: string;
  tasks?: MilestoneTask[];
}

interface ProjectSummary {
  id: string;
  title: string;
  domain: string;
  status?: string;
  org_id: string;
}

export function MilestonesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Milestone Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAcceptance, setNewAcceptance] = useState('');
  const [newDeliverables, setNewDeliverables] = useState('');
  const [newBudget, setNewBudget] = useState('1000');
  const [newDueDate, setNewDueDate] = useState('');

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCredits, setTaskCredits] = useState('50');

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!user || !supabase || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      // For organizations, fetch their projects. For other roles, fetch projects they own or all accessible
      let query = supabase.from('projects').select('id, title, domain, org_id');
      if (user.role === 'organization') {
        query = query.eq('org_id', user.id);
      }

      const { data, error: projErr } = await query.order('created_at', { ascending: false });

      if (projErr) throw projErr;

      const projs = (data || []) as ProjectSummary[];
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedProjectId]);

  // Load milestones for selected project
  const loadMilestones = useCallback(async (projectId: string) => {
    if (!projectId || !supabase || !isSupabaseConfigured()) {
      setMilestones([]);
      return;
    }

    try {
      const { data: mData, error: mErr } = await supabase
        .from('milestones')
        .select('*, tasks(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (mErr) throw mErr;

      setMilestones((mData || []) as Milestone[]);
    } catch (err: any) {
      console.error('Error loading milestones:', err);
      setError(err.message || 'Failed to load milestones.');
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones(selectedProjectId);
    }
  }, [selectedProjectId, loadMilestones]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !supabase) return;

    setActionLoading(true);
    setError('');

    try {
      const deliverablesList = newDeliverables
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      const { data, error: insertErr } = await supabase
        .from('milestones')
        .insert({
          project_id: selectedProjectId,
          title: newTitle.trim(),
          description: newDescription.trim(),
          acceptance_criteria: newAcceptance.trim(),
          deliverables: deliverablesList,
          budget_allocation: parseFloat(newBudget) || 0,
          due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSuccess('Milestone created successfully.');
      setTimeout(() => setSuccess(''), 3000);
      setIsMilestoneModalOpen(false);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewAcceptance('');
      setNewDeliverables('');
      setNewBudget('1000');
      setNewDueDate('');

      await loadMilestones(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to create milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedMilestoneId || !supabase) return;

    setActionLoading(true);
    setError('');

    try {
      const { data, error: insertErr } = await supabase
        .from('tasks')
        .insert({
          milestone_id: selectedMilestoneId,
          project_id: selectedProjectId,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          credits_reward: parseInt(taskCredits, 10) || 25,
          status: 'todo',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSuccess('Task added to milestone.');
      setTimeout(() => setSuccess(''), 3000);
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskCredits('50');

      await loadMilestones(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to add task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, status: Milestone['status']) => {
    if (!supabase) return;
    try {
      const updates: any = { status };
      if (status === 'accepted') {
        updates.completed_at = new Date().toISOString();
      }

      const { error: upErr } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', milestoneId);

      if (upErr) throw upErr;

      await loadMilestones(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to update milestone status.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={28} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <p className="text-xs text-[#64748B]">Loading milestones...</p>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isOrgOwner = selectedProject && user?.id === selectedProject.org_id;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <CheckSquare size={20} className="text-[#1D4ED8]" />
            Project Milestones & Deliverables
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage research milestone contracts, acceptance criteria, and task rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] font-medium text-[#0F172A]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {isOrgOwner && (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsMilestoneModalOpen(true)}
            >
              New Milestone
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg">
          <AlertCircle size={14} className="text-[#B91C1C] flex-shrink-0" />
          <p className="text-xs text-[#B91C1C]">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
          <CheckCircle2 size={14} className="text-[#15803D] flex-shrink-0" />
          <p className="text-xs text-[#15803D]">{success}</p>
        </div>
      )}

      {/* No Projects State */}
      {projects.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FolderKanban size={36} className="mx-auto text-[#94A3B8] mb-3" />
            <h3 className="text-sm font-bold text-[#0F172A]">No Projects Available</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
              {user?.role === 'organization'
                ? 'Create your first research project to define milestones and track deliverables.'
                : 'You have not joined any research projects yet.'}
            </p>
            {user?.role === 'organization' && (
              <Button size="sm" onClick={() => navigate('/projects/create')}>
                Create Project
              </Button>
            )}
          </div>
        </Card>
      ) : milestones.length === 0 ? (
        /* Empty Milestones State */
        <Card padding="lg">
          <div className="text-center py-12">
            <Layers size={36} className="mx-auto text-[#94A3B8] mb-3" />
            <h3 className="text-sm font-bold text-[#0F172A]">No Milestones Configured</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
              Define milestone goals, acceptance standards, and reward allocations for "{selectedProject?.title}".
            </p>
            {isOrgOwner && (
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setIsMilestoneModalOpen(true)}>
                Create First Milestone
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Milestones List */
        <div className="space-y-4">
          {milestones.map((milestone, idx) => {
            const tasks = milestone.tasks || [];
            const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'approved').length;
            const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

            return (
              <Card key={milestone.id} padding="lg">
                <div className="space-y-4">
                  {/* Milestone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                          Milestone #{idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-[#0F172A]">{milestone.title}</h3>
                        <StatusBadge status={milestone.status} />
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl">
                        {milestone.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {milestone.budget_allocation > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A]">
                          <Coins size={13} className="text-[#B45309]" />
                          <span>${milestone.budget_allocation.toLocaleString()}</span>
                        </div>
                      )}
                      {milestone.due_date && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                          <Calendar size={13} />
                          <span>{new Date(milestone.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acceptance & Deliverables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <div>
                      <p className="font-semibold text-[#0F172A] mb-1">Acceptance Criteria</p>
                      <p className="text-[#64748B]">{milestone.acceptance_criteria || 'None specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A] mb-1">Deliverables</p>
                      <div className="flex flex-wrap gap-1">
                        {milestone.deliverables && milestone.deliverables.length > 0 ? (
                          milestone.deliverables.map((d, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] text-[#334155]"
                            >
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#94A3B8] italic">No specific deliverables listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ListTodo size={14} className="text-[#1D4ED8]" />
                        <span className="text-xs font-bold text-[#0F172A]">
                          Tasks ({completedTasks}/{tasks.length})
                        </span>
                        {tasks.length > 0 && (
                          <span className="text-[11px] text-[#64748B]">
                            — {progressPct}% complete
                          </span>
                        )}
                      </div>
                      {isOrgOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMilestoneId(milestone.id);
                            setIsTaskModalOpen(true);
                          }}
                          className="text-xs text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                        >
                          <Plus size={12} /> Add Task
                        </button>
                      )}
                    </div>

                    {tasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs hover:border-[#CBD5E1] transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                              <span className="font-medium text-[#0F172A]">{task.title}</span>
                              {task.description && (
                                <span className="text-[#94A3B8] truncate max-w-xs text-[11px]">
                                  — {task.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                                +{task.credits_reward} credits
                              </span>
                              <StatusBadge status={task.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#94A3B8] italic py-1">
                        No sub-tasks added to this milestone yet.
                      </p>
                    )}
                  </div>

                  {/* Organization Status Transition Controls */}
                  {isOrgOwner && (
                    <div className="pt-2 flex items-center justify-between border-t border-[#E2E8F0] flex-wrap gap-2 text-xs">
                      <span className="text-[11px] text-[#64748B]">Update status:</span>
                      <div className="flex items-center gap-1.5">
                        {milestone.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateMilestoneStatus(milestone.id, 'in_progress')}
                            className="px-2 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded text-[11px] font-medium text-[#334155] cursor-pointer"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {milestone.status !== 'review' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateMilestoneStatus(milestone.id, 'review')}
                            className="px-2 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded text-[11px] font-medium text-[#334155] cursor-pointer"
                          >
                            Submit for Review
                          </button>
                        )}
                        {milestone.status !== 'accepted' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateMilestoneStatus(milestone.id, 'accepted')}
                            className="px-2.5 py-1 bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7] rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Accept & Complete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: New Milestone */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Create New Milestone"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <Input
            label="Milestone Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Phase 1: Benchmark Dataset Collection & Preprocessing"
            required
          />

          <Textarea
            label="Detailed Scope & Objective"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Describe the research goals, methods, and technical parameters expected..."
            rows={3}
            required
          />

          <Textarea
            label="Acceptance Criteria"
            value={newAcceptance}
            onChange={(e) => setNewAcceptance(e.target.value)}
            placeholder="Specify verification criteria (e.g., Accuracy >= 94%, reproducible notebook, peer review approval)..."
            rows={2}
            required
          />

          <Input
            label="Deliverables (comma-separated)"
            value={newDeliverables}
            onChange={(e) => setNewDeliverables(e.target.value)}
            placeholder="Cleaned CSV, Trained Model Weights, Technical Report PDF"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Budget Allocation ($)"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="1000"
              min="0"
            />

            <Input
              label="Target Due Date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={actionLoading}>
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task to Milestone"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g., Write baseline evaluation script in PyTorch"
            required
          />

          <Textarea
            label="Description (Optional)"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Add relevant instructions or repository references..."
            rows={2}
          />

          <Input
            label="Credit Reward"
            type="number"
            value={taskCredits}
            onChange={(e) => setTaskCredits(e.target.value)}
            placeholder="50"
            min="5"
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={actionLoading}>
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
