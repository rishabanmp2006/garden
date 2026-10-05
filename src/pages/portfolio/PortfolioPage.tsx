import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, ShieldCheck, Award, GitCommitHorizontal,
  ExternalLink, Download, CheckCircle2, BookOpen,
  Calendar, Building2, Code, Share2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  DEMO_USERS, DEMO_PROFILES, DEMO_CONTRIBUTIONS,
  DEMO_CREDITS, DEMO_PROJECTS
} from '../../lib/demo-data';

export function PortfolioPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();

  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  // If userId provided in route, show that user, else show logged-in user or student-1
  const targetUserId = userId || authUser?.id || 'user-student-1';
  const profileUser = DEMO_USERS.find((u) => u.id === targetUserId) || DEMO_USERS[1];
  const profile = DEMO_PROFILES.find((p) => p.user_id === profileUser.id) || DEMO_PROFILES[0];
  const userContributions = DEMO_CONTRIBUTIONS.filter((c) => c.contributor_id === profileUser.id);
  const userCredits = DEMO_CREDITS.filter((c) => c.user_id === profileUser.id);
  const totalCredits = userCredits.reduce((sum, c) => sum + c.amount, 0);

  const credentialJson = {
    '@context': 'https://www.w3.org/2018/credentials/v1',
    type: ['VerifiableCredential', 'ResearchMeshResearcherCredential'],
    issuer: 'did:researchmesh:platform-authority-gardenia2k26',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:researchmesh:user:${profileUser.id}`,
      name: profileUser.display_name,
      verifiedAffiliation: profile.education || 'IIT Madras',
      totalVerifiedCredits: totalCredits,
      reputationRank: 'Top 5% Contributor',
      ledgerRootHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:researchmesh:keys:primary-root',
      jws: 'eyJhbGciOiJFZERTQSI...8f2a1c',
    },
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xl font-bold">
              {profileUser.display_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A]">{profileUser.display_name}</h1>
                {profileUser.verified && (
                  <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                    <CheckCircle2 size={11} className="mr-0.5" /> VERIFIED RESEARCHER
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Building2 size={13} /> {profile.education || 'Affiliated Institution'}
              </p>
              <p className="text-xs text-[#475569] max-w-xl pt-1 leading-relaxed">
                {profile.bio || 'Undergraduate researcher focused on deep learning for healthcare.'}
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
              onClick={() => alert('Portfolio public share link copied to clipboard!')}
            >
              Share Portfolio
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9] text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
              Verified Credits
            </span>
            <strong className="text-lg text-[#0F172A]">{totalCredits}</strong>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
              Contributions
            </span>
            <strong className="text-lg text-[#0F172A]">{userContributions.length}</strong>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
              Active Projects
            </span>
            <strong className="text-lg text-[#0F172A]">2</strong>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
              Authorship Eligible
            </span>
            <strong className="text-lg text-[#15803D]">Yes (25% Weight)</strong>
          </div>
        </div>
      </Card>

      {/* Skills & Verified Expertise */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center justify-between">
          <span>Peer-Endorsed Technical Skills</span>
          <span className="text-xs font-normal text-[#64748B]">Audited via project commits</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-[#F1F5F9] text-[#1E293B] text-xs font-medium rounded-md border border-[#E2E8F0] flex items-center gap-1.5"
            >
              <CheckCircle2 size={12} className="text-[#15803D]" />
              {skill}
            </span>
          ))}
        </div>
      </Card>

      {/* Verified Provenance Contributions */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <GitCommitHorizontal size={16} className="text-[#1D4ED8]" /> Cryptographically Logged Outputs
          </h3>
          <span className="text-xs text-[#64748B]">SHA-256 Backed</span>
        </div>

        <div className="space-y-3">
          {userContributions.map((contrib) => (
            <div key={contrib.id} className="p-4 rounded-lg border border-[#E2E8F0] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F172A] capitalize">{contrib.type}</span>
                  <span className="text-xs text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded font-mono">
                    +{contrib.credits_awarded} Credits
                  </span>
                  {contrib.ai_involvement !== 'none' && (
                    <span className="text-[10px] font-semibold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded">
                      AI-Assisted
                    </span>
                  )}
                </div>
                <span className="text-[#64748B] text-[11px]">
                  {new Date(contrib.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[#334155]">{contrib.description}</p>
              <div className="text-[11px] text-[#64748B] flex items-center gap-1 font-mono">
                <Code size={12} /> {contrib.artifact_url}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Publication Co-Authorship Eligibility */}
      <Card className="p-6 bg-white space-y-3">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <BookOpen size={16} className="text-[#1D4ED8]" /> Co-Authorship & Paper Pipeline
        </h3>
        <p className="text-xs text-[#475569] leading-relaxed">
          Based on ResearchMesh Charter Clause 1, contributors who earn &gt;15% of verified credits on a
          project are guaranteed co-authorship. Current status:
        </p>
        <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-xs space-y-1">
          <span className="font-bold text-[#166534]">
            "Low-cost Diabetic Retinopathy Detection on Edge Devices" — Target: IEEE JBHI 2027
          </span>
          <p className="text-[#15803D]">
            Contribution share: <strong>26.4% of total verified credits</strong> (Threshold: 15.0%).
            Co-authorship locked and verified on the immutable ledger.
          </p>
        </div>
      </Card>

      {/* Verifiable Credential Modal */}
      <Modal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        title="Verifiable Academic Credential (W3C Standard)"
        subtitle="Cryptographically signed researcher passport"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#475569]">
            This JSON-LD credential adheres to the W3C Verifiable Credentials Data Model v1.1. It can be
            independently verified without contacting a central server.
          </p>

          <pre className="p-3 bg-[#0F172A] text-[#93C5FD] font-mono text-[11px] rounded-lg overflow-x-auto max-h-[300px]">
            {JSON.stringify(credentialJson, null, 2)}
          </pre>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setIsCredentialModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              icon={<Download size={14} />}
              onClick={() => {
                const blob = new Blob([JSON.stringify(credentialJson, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `researchmesh-credential-${profileUser.id}.json`;
                a.click();
              }}
            >
              Download Signed JSON-LD
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
