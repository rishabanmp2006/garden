import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, ArrowLeft, CheckCircle2, Building2, GraduationCap, ShieldCheck, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

type OnboardingStep = 'role' | 'profile';

export function Onboarding() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Determine if user already completed role selection (has meaningful profile data)
  const hasCompletedProfile = profile && (profile.education || profile.org_name || profile.experience);

  // Step state — always start with explicit role selection on onboarding
  const [step, setStep] = useState<OnboardingStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>(profile?.role as UserRole || user?.role || 'student');
  const [roleLoading, setRoleLoading] = useState(false);

  // Common / Student state
  const [displayName, setDisplayName] = useState(user?.display_name || profile?.display_name || '');
  const [institution, setInstitution] = useState(profile?.education || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [domains, setDomains] = useState<string[]>(profile?.domains || []);
  const [newDomain, setNewDomain] = useState('');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [availability, setAvailability] = useState(profile?.availability || '');
  const [portfolioLink, setPortfolioLink] = useState(profile?.portfolio_links?.[0] || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Org state
  const [orgName, setOrgName] = useState(profile?.org_name || user?.display_name || '');
  const [orgDescription, setOrgDescription] = useState(profile?.org_description || '');
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || user?.email || '');

  // Mentor state
  const [expertise, setExpertise] = useState(profile?.experience || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleAddDomain = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      setDomains([...domains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  // Persist role to database, then advance to profile step
  const handleRoleConfirm = async () => {
    setRoleLoading(true);
    setError('');
    try {
      await updateProfile({ role: selectedRole } as any);
      await refreshProfile();
      setStep('profile');
    } catch (err: any) {
      setError(err.message || 'Failed to save role. Please try again.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedRole === 'student') {
        await updateProfile({
          role: selectedRole,
          display_name: displayName,
          education: institution,
          skills,
          domains,
          experience,
          availability,
          portfolio_links: portfolioLink ? [portfolioLink] : [],
          bio,
        } as any);
      } else if (selectedRole === 'organization') {
        await updateProfile({
          role: selectedRole,
          display_name: orgName,
          org_name: orgName,
          org_description: orgDescription,
          domains,
          contact_email: contactEmail,
          bio: orgDescription,
        } as any);
      } else {
        // Mentor
        await updateProfile({
          role: selectedRole,
          display_name: displayName,
          education: institution,
          skills,
          domains,
          experience: expertise,
          availability,
          bio,
        } as any);
      }

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white">
              <Hexagon size={16} />
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">ResearchMesh</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A]">
            {step === 'role' ? 'Select Your Role' : 'Complete Your Researcher Profile'}
          </h1>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {step === 'role'
              ? 'Choose the role that best describes how you will use ResearchMesh. This determines your workspace permissions and dashboard experience.'
              : 'Your profile parameters directly power the algorithmic AI matching engine and verified governance attribution across research workspaces.'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 'role' ? 'text-[#1D4ED8]' : 'text-[#15803D]'}`}>
            {step === 'profile' ? <CheckCircle2 size={14} /> : <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px]">1</span>}
            <span>Role Selection</span>
          </div>
          <div className="w-8 h-px bg-[#CBD5E1]" />
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 'profile' ? 'text-[#1D4ED8]' : 'text-[#94A3B8]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'profile' ? 'bg-[#1D4ED8] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>2</span>
            <span>Profile Setup</span>
          </div>
        </div>

        {/* ============= STEP 1: ROLE SELECTION ============= */}
        {step === 'role' && (
          <Card className="p-8 bg-white border-[#CBD5E1] shadow-sm">
            {error && (
              <div className="p-3 mb-5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
                {error}
              </div>
            )}

            <p className="text-xs font-semibold text-[#334155] mb-4">
              I am joining ResearchMesh as:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-5 rounded-lg border-2 text-left cursor-pointer transition-all duration-150 ${
                  selectedRole === 'student'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] shadow-sm'
                    : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'student' ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  <GraduationCap size={20} />
                </div>
                <p className={`text-sm font-bold mb-1 ${selectedRole === 'student' ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>
                  Student / Researcher
                </p>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Discover projects, contribute research, earn verified credits and build your academic portfolio.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('organization')}
                className={`p-5 rounded-lg border-2 text-left cursor-pointer transition-all duration-150 ${
                  selectedRole === 'organization'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] shadow-sm'
                    : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'organization' ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  <Building2 size={20} />
                </div>
                <p className={`text-sm font-bold mb-1 ${selectedRole === 'organization' ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>
                  Organization / Lab
                </p>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Post research projects, manage teams, fund milestones, and govern IP with charter enforcement.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('mentor')}
                className={`p-5 rounded-lg border-2 text-left cursor-pointer transition-all duration-150 ${
                  selectedRole === 'mentor'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] shadow-sm'
                    : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'mentor' ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  <ShieldCheck size={20} />
                </div>
                <p className={`text-sm font-bold mb-1 ${selectedRole === 'mentor' ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>
                  Mentor / Advisor
                </p>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Review milestones, mentor student researchers, approve contributions and award credits.
                </p>
              </button>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
              <Button
                type="button"
                size="lg"
                loading={roleLoading}
                icon={<ArrowRight size={16} />}
                onClick={handleRoleConfirm}
              >
                Continue as {selectedRole === 'organization' ? 'Organization' : selectedRole === 'mentor' ? 'Mentor' : 'Student'}
              </Button>
            </div>
          </Card>
        )}

        {/* ============= STEP 2: PROFILE FORM ============= */}
        {step === 'profile' && (
          <Card className="p-8 bg-white border-[#CBD5E1] shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
                  {error}
                </div>
              )}

              {/* Role Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  {selectedRole === 'student' && <GraduationCap size={18} className="text-[#1D4ED8]" />}
                  {selectedRole === 'organization' && <Building2 size={18} className="text-[#1D4ED8]" />}
                  {selectedRole === 'mentor' && <ShieldCheck size={18} className="text-[#1D4ED8]" />}
                  <span className="text-sm font-bold text-[#0F172A] capitalize">
                    {selectedRole} Profile Configuration
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="text-xs text-[#64748B] hover:text-[#1D4ED8] cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
                >
                  <ArrowLeft size={12} />
                  Change Role
                </button>
              </div>

              {/* STUDENT FORM */}
              {selectedRole === 'student' && (
                <>
                  <Input
                    label="Full Legal / Academic Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Rishaban MP"
                    required
                  />

                  <Input
                    label="Academic Institution / University"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., IIT Madras, Department of Computer Science"
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                      Technical Skills (Required for AI Matching)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add skill (e.g., PyTorch, Computer Vision, Edge AI)..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md"
                      />
                      <Button type="button" size="sm" variant="secondary" onClick={handleAddSkill}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#EFF6FF] text-[#1D4ED8] font-medium"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => setSkills(skills.filter((k) => k !== s))}
                            className="hover:text-[#B91C1C]"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g., Part-time (20 hrs/week)"
                      required
                    />

                    <Input
                      label="Research Experience Level"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g., 2 years ML research, 1 publication"
                    />
                  </div>

                  <Input
                    label="Portfolio / GitHub URL"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/your-username"
                  />

                  <Textarea
                    label="Research Interests & Experience Summary"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Summarize your prior ML/research experience, publications, or thesis focus..."
                    rows={3}
                    required
                  />
                </>
              )}

              {/* ORGANIZATION FORM */}
              {selectedRole === 'organization' && (
                <>
                  <Input
                    label="Organization / Entity Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g., Nova Biotech Labs"
                    required
                  />

                  <Input
                    label="Contact Email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@novabiotech.org"
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                      Research Areas & Specializations
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add research domain (e.g., Medical Imaging, Edge AI)..."
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={handleAddDomain}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md"
                      />
                      <Button type="button" size="sm" variant="secondary" onClick={handleAddDomain}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {domains.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#EFF6FF] text-[#1D4ED8] font-medium"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() => setDomains(domains.filter((item) => item !== d))}
                            className="hover:text-[#B91C1C]"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Organization Overview & Mission"
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    placeholder="Describe your research laboratory, enterprise mission, and focus..."
                    rows={4}
                    required
                  />
                </>
              )}

              {/* MENTOR FORM */}
              {selectedRole === 'mentor' && (
                <>
                  <Input
                    label="Full Legal / Academic Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Dr. Meera Krishnan"
                    required
                  />

                  <Input
                    label="Institutional Affiliation / Laboratory"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., Associate Professor, AIIMS / IIT"
                    required
                  />

                  <Input
                    label="Areas of Expertise"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g., Medical AI, Clinical Trial Validation, Computer Vision"
                    required
                  />

                  <Input
                    label="Weekly Mentorship Availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g., 5-10 hrs/week for milestone reviews"
                    required
                  />

                  <Textarea
                    label="Academic Background & Mentorship Philosophy"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your research publications and mentorship expectations..."
                    rows={3}
                    required
                  />
                </>
              )}

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                <Button type="submit" size="lg" loading={loading} icon={<ArrowRight size={16} />}>
                  Complete Onboarding & Enter Workspace
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
