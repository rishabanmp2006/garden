import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Coins,
  Send,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WorkspaceTasksProps {
  tasks: any[];
  milestones: any[];
  canCreateTask: boolean;
  canSubmitWork: boolean;
  onCreateTask: (payload: {
    milestone_id: string;
    title: string;
    description: string;
    credits_reward: number;
  }) => Promise<void>;
  onSubmitWork: (taskId: string, payload: {
    fileName: string;
    description: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function WorkspaceTasks({
  tasks,
  milestones,
  canCreateTask,
  canSubmitWork,
  onCreateTask,
  onSubmitWork,
  isLoading = false,
}: WorkspaceTasksProps) {
  // Create task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskReward, setTaskReward] = useState(25);
  const [milestoneId, setMilestoneId] = useState(milestones[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);

  // Submit work modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [fileName, setFileName] = useState('');
  const [submissionDesc, setSubmissionDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreateTask({
        milestone_id: milestoneId || milestones[0]?.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        credits_reward: Number(taskReward) || 25,
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
    } catch (err: any) {
      alert(`Error creating task: ${err.message || err}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !fileName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitWork(selectedTaskId, {
        fileName: fileName.trim(),
        description: submissionDesc.trim(),
      });
      setIsSubmitModalOpen(false);
      setFileName('');
      setSubmissionDesc('');
    } catch (err: any) {
      alert(`Error submitting work: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <CheckSquare size={16} className="text-[#1D4ED8]" />
            Milestones & Tasks
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Coordinate research deliverables, milestone completion, and contributor task assignments.
          </p>
        </div>

        {canCreateTask && (
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsTaskModalOpen(true)}
          >
            Create Task
          </Button>
        )}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading tasks from database...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
          No tasks defined for this project yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {task.title}
                  </span>
                  <StatusBadge status={task.status || 'open'} />
                  {task.credits_reward && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded">
                      <Coins size={11} /> {task.credits_reward} Credits
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {canSubmitWork && task.status !== 'completed' && task.status !== 'approved' && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Send size={12} />}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setIsSubmitModalOpen(true);
                  }}
                >
                  Submit Work
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Create Task</h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement CLAHE normalization"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Description
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Task instructions and acceptance criteria"
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Credit Reward
                  </label>
                  <input
                    type="number"
                    value={taskReward}
                    onChange={(e) => setTaskReward(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Milestone
                  </label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg"
                  >
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Submit Deliverable</h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWorkSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Deliverable Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. data_pipeline.py or analysis.pdf"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Notes & Summary
                </label>
                <textarea
                  value={submissionDesc}
                  onChange={(e) => setSubmissionDesc(e.target.value)}
                  placeholder="Explain your approach, testing, and deliverable highlights"
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
