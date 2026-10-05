import { useState, useMemo } from 'react';
import {
  GitCommitHorizontal, Filter, Award,
  CheckCircle2, ExternalLink, Calendar, Code, FileText,
  Search, ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import {
  DEMO_CONTRIBUTIONS, DEMO_PROJECTS, DEMO_USERS
} from '../../lib/demo-data';

export function ContributionsPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAi, setSelectedAi] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredContributions = useMemo(() => {
    return DEMO_CONTRIBUTIONS.filter((c) => {
      const matchesType = selectedType === 'all' || c.type === selectedType;
      const matchesAi = selectedAi === 'all' || c.ai_involvement === selectedAi;
      const matchesSearch =
        search === '' ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        (c.artifact_url ? c.artifact_url.toLowerCase().includes(search.toLowerCase()) : false);
      return matchesType && matchesAi && matchesSearch;
    });
  }, [selectedType, selectedAi, search]);

  const totalCredits = filteredContributions.reduce((sum, c) => sum + c.credits_awarded, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <GitCommitHorizontal size={22} className="text-[#1D4ED8]" /> Verified Contributions Log
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Immutable log of research outputs, code deliverables, peer reviews, and verified credit earnings.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-xs">
          <Award size={16} className="text-[#B45309]" />
          <span className="text-xs font-bold text-[#0F172A]">{totalCredits} Total Credits Awarded</span>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search contributions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Contribution Types</option>
            <option value="code">Code Implementation</option>
            <option value="dataset">Dataset Curation</option>
            <option value="research">Literature & Research</option>
            <option value="review">Clinical & Peer Review</option>
            <option value="documentation">Documentation</option>
          </select>

          <select
            value={selectedAi}
            onChange={(e) => setSelectedAi(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          >
            <option value="all">All AI Involvement Levels</option>
            <option value="none">Pure Human Contribution</option>
            <option value="ai_assisted">AI-Assisted (Human Directed)</option>
            <option value="ai_generated">AI-Generated</option>
          </select>
        </div>
      </Card>

      {/* Contributions List */}
      <div className="space-y-3">
        {filteredContributions.map((contrib) => {
          const project = DEMO_PROJECTS.find((p) => p.id === contrib.project_id);
          const author = DEMO_USERS.find((u) => u.id === contrib.contributor_id);

          return (
            <Card key={contrib.id} className="p-4 bg-white hover:border-[#94A3B8] transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">{author?.display_name}</span>
                    <span className="text-xs text-[#64748B]">•</span>
                    <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded capitalize">
                      {contrib.type}
                    </span>
                    {contrib.ai_involvement !== 'none' ? (
                      <span className="text-[10px] font-semibold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FEF3C7]">
                        AI-Assisted
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7]">
                        100% Human
                      </span>
                    )}
                    <StatusBadge status={contrib.status} />
                  </div>

                  <p className="text-xs text-[#334155] leading-relaxed">{contrib.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B] pt-1">
                    <span>
                      Project: <strong className="text-[#0F172A]">{project?.title}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[#1D4ED8]">
                      <Code size={12} /> {contrib.artifact_url}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(contrib.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="md:w-36 text-right shrink-0 flex flex-col justify-between items-end">
                  <span className="text-sm font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#DCFCE7]">
                    +{contrib.credits_awarded} Credits
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1 mt-2">
                    <ShieldCheck size={11} className="text-[#15803D]" /> SHA-256 Verified
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
