import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Shield, Clock, Users,
  Building2, CheckCircle2, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SensitivityBadge, EngagementBadge } from '../../components/ui/Badge';
import { DEMO_PROJECTS } from '../../lib/demo-data';

export function ExploreProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedSensitivity, setSelectedSensitivity] = useState<string>('all');

  const domains = useMemo(() => {
    const list = Array.from(new Set(DEMO_PROJECTS.map((p) => p.domain)));
    return ['all', ...list];
  }, []);

  const filteredProjects = useMemo(() => {
    return DEMO_PROJECTS.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.public_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.required_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDomain = selectedDomain === 'all' || p.domain === selectedDomain;
      const matchesModel = selectedModel === 'all' || p.engagement_model === selectedModel;
      const matchesSensitivity = selectedSensitivity === 'all' || p.sensitivity_level === selectedSensitivity;

      return matchesSearch && matchesDomain && matchesModel && matchesSensitivity;
    });
  }, [searchQuery, selectedDomain, selectedModel, selectedSensitivity]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Explore Research Projects</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Discover peer-reviewed problem statements and apply for governed research workspaces.
          </p>
        </div>
        {user?.role === 'organization' && (
          <Button onClick={() => navigate('/projects/create')} icon={<Plus size={16} />}>
            Post Research Project
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by topic, keyword, or skill (e.g., PyTorch, Edge AI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full h-10 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            >
              <option value="all">All Domains</option>
              {domains.filter((d) => d !== 'all').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSensitivity}
              onChange={(e) => setSelectedSensitivity(e.target.value)}
              className="w-full h-10 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            >
              <option value="all">All Sensitivity Levels</option>
              <option value="low">Low (Public Open Research)</option>
              <option value="medium">Medium (Restricted Datasets)</option>
              <option value="high">High (Confidential IP / Local AI Only)</option>
              <option value="critical">Critical (Strict Local Isolation)</option>
            </select>
          </div>
        </div>

        {/* Engagement Model pills */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9] text-xs">
          <span className="text-[#64748B] font-medium mr-1">Engagement:</span>
          {['all', 'funded', 'stipend', 'knowledge_sharing'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModel(m)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer capitalize ${
                selectedModel === m
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#94A3B8]">
            Showing {filteredProjects.length} of {DEMO_PROJECTS.length} projects
          </span>
        </div>
      </Card>

      {/* Project Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-[#E2E8F0] p-8">
            <Search size={32} className="mx-auto text-[#94A3B8] mb-2" />
            <h3 className="text-sm font-semibold text-[#0F172A]">No research projects found</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Try adjusting your search filters or clear the active search criteria.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setSelectedModel('all');
                setSelectedSensitivity('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="p-5 hover:border-[#94A3B8] transition-all duration-150 cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2.5">
                  {/* Top tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
                      <Building2 size={13} className="text-[#64748B]" />
                      {project.organization?.name || 'Research Org'}
                    </span>
                    {project.organization?.verified && (
                      <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7]">
                        <CheckCircle2 size={10} className="mr-0.5" /> VERIFIED ORG
                      </span>
                    )}
                    <span className="text-[#CBD5E1]">•</span>
                    <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      {project.domain}
                    </span>
                    <SensitivityBadge level={project.sensitivity_level} />
                    <EngagementBadge model={project.engagement_model} />
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] hover:text-[#1D4ED8] transition-colors">
                      {project.title}
                    </h2>
                    <p className="text-xs text-[#475569] mt-1.5 line-clamp-2 leading-relaxed">
                      {project.public_summary}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-[#64748B]">Skills:</span>
                    {project.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] bg-[#F1F5F9] text-[#334155] px-2 py-0.5 rounded font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* AI Governance Banner */}
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 rounded">
                    {project.ai_policy.local_required ? (
                      <>
                        <Lock size={12} className="text-[#B45309]" />
                        <span className="font-medium text-[#B45309]">
                          Local AI Required:
                        </span>
                        <span>
                          Proprietary data isolated. Approved models:{' '}
                          <code className="text-[#0F172A] font-semibold">
                            {project.ai_policy.approved_models.join(', ') || 'Local Llama-3'}
                          </code>
                        </span>
                      </>
                    ) : (
                      <>
                        <Shield size={12} className="text-[#15803D]" />
                        <span className="font-medium text-[#15803D]">
                          Cloud AI Permitted:
                        </span>
                        <span>Open research data. Multi-agent assisted workflows active.</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side stats & CTA */}
                <div className="md:w-56 md:border-l md:border-[#E2E8F0] md:pl-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {project.budget > 0 ? (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
                          Escrow Budget
                        </span>
                        <p className="text-lg font-bold text-[#0F172A]">
                          ${project.budget.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
                          Engagement
                        </span>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          Non-monetary / Credits
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {project.duration_days} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {project.member_count} members
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full justify-center"
                    icon={<ChevronRight size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
