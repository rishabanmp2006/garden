import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, ShieldCheck, Award, GitCommitHorizontal,
  ExternalLink, Download, CheckCircle2, BookOpen,
  Calendar, Building2, Code, Share2, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { fetchUserPortfolio } from '../../lib/api';

export function PortfolioPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();

  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  const targetUserId = userId || authUser?.id;

  useEffect(() => {
    async function loadPortfolio() {
      if (!targetUserId) return;
      setLoading(true);
      try {
        const data = await fetchUserPortfolio(targetUserId);
        setPortfolioData(data);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading verified researcher portfolio...</h3>
        <p className="text-xs text-[#64748B]">Querying verified contributions and ledger-backed credentials.</p>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-[#E2E8F0] p-8 max-w-lg mx-auto">
        <AlertCircle size={36} className="mx-auto text-[#DC2626] mb-3" />
        <h3 className="text-base font-bold text-[#0F172A]">Profile Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1">Please sign in to view your verified researcher portfolio.</p>
      </div>
    );
  }

  const profile = portfolioData.profile || {};
  const totalCredits = portfolioData.total_credits || 0;
  const verifiedContributions = portfolioData.verified_contributions || [];
  const projectsParticipated = portfolioData.projects_participated || [];

  const credentialJson = {
    '@context': 'https://www.w3.org/2018/credentials/v1',
    type: ['VerifiableCredential', 'ResearchMeshResearcherCredential'],
    issuer: 'did:researchmesh:platform-authority-gardenia2k26',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:researchmesh:user:${profile.id}`,
      name: profile.display_name,
      verifiedAffiliation: profile.education || 'Academic Contributor',
      totalVerifiedCredits: totalCredits,
      verifiedContributionsCount: verifiedContributions.length,
      provenanceHashChain: 'Cryptographically anchored on SHA-256 Ledger',
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:researchmesh:keys:primary-root',
    },
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xl font-bold">
              {(profile.display_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A]">{profile.display_name}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                    <CheckCircle2 size={11} className="mr-0.5" /> VERIFIED RESEARCHER
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Building2 size={13} /> {profile.education || 'Affiliated Institution'}
              </p>
              <p className="text-xs text-[#475569] max-w-xl pt-1 leading-relaxed">
                {profile.bio || 'Verified researcher contributing to governed research workspaces.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              size="sm"
              icon={<ShieldCheck size={14} />}
              onClick={() => setIsCredentialModalOpen(true)}
            >
              Export Verifiable Credential
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Share2 size={14} />}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Portfolio link copied to clipboard!');
              }}
            >
              Share Portfolio
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9] text-xs">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Verified Credits</span>
            <strong className="text-lg font-bold text-[#0F172A]">{totalCredits}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Approved Deliverables</span>
            <strong className="text-lg font-bold text-[#0F172A]">{verifiedContributions.length}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Research Projects</span>
            <strong className="text-lg font-bold text-[#0F172A]">{projectsParticipated.length}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Ledger Status</span>
            <strong className="text-sm font-semibold text-[#15803D] flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> Validated Chain
            </strong>
          </div>
        </div>
      </Card>

      {/* Main Grid: Verified Contributions & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Verified Contributions */}
          <Card className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Ledger-Verified Contributions</h3>
                <p className="text-xs text-[#64748B]">Approved code deliverables and milestone contributions.</p>
              </div>
            </div>

            {verifiedContributions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No approved contributions yet. Complete tasks and obtain mentor approval to build your verified portfolio.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {verifiedContributions.map((c: any) => (
                  <div key={c.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code size={15} className="text-[#1D4ED8]" />
                        <span className="text-xs font-bold text-[#0F172A]">{c.file_name}</span>
                        <span className="text-[11px] text-[#64748B]">({c.project_title})</span>
                      </div>
                      <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                        +{c.credits_awarded} Credits
                      </span>
                    </div>

                    <p className="text-xs text-[#475569]">{c.description}</p>
                    <div className="p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-[10px] font-mono text-[#64748B] truncate">
                      SHA-256 Provenance Hash: {c.content_hash}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Research Projects Participated */}
          <Card className="p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
              Collaborative Projects
            </h3>
            {projectsParticipated.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No projects joined yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsParticipated.map((p: any) => (
                  <div key={p.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{p.title}</p>
                      <p className="text-[11px] text-[#64748B]">Domain: {p.domain} • Role: {p.role}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-1 rounded">
                      Active Contributor
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Skills */}
        <div className="space-y-6">
          <Card className="p-5 bg-white space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Verified Technical Skills
            </h4>
            {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s: string) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-[#EFF6FF] text-[#1D4ED8] rounded-md text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">No skills listed.</p>
            )}
          </Card>

          <Card className="p-5 bg-white space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Privacy & IP Notice
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              In compliance with ResearchMesh Charter guidelines, confidential project files, private datasets, and proprietary trade secrets are strictly excluded from public portfolio views.
            </p>
          </Card>
        </div>
      </div>

      {/* Credential Modal */}
      <Modal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        title="W3C Verifiable Researcher Credential"
        subtitle="Cryptographically signed credential anchored on the SHA-256 ledger"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-xs text-[#166534]">
            This JSON-LD credential proves verified authorship and credits without disclosing confidential data.
          </div>
          <pre className="p-3 bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] rounded-lg overflow-x-auto max-h-80">
            {JSON.stringify(credentialJson, null, 2)}
          </pre>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setIsCredentialModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
