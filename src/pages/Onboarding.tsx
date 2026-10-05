import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, CheckCircle2, Building2, GraduationCap, ShieldCheck, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export function Onboarding() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'student';

  // Common / Student state
  const [displayName, setDisplayName] = useState(user?.display_name || profile?.display_name || '');
  const [institution, setInstitution] = useState(profile?.education || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || ['Python', 'PyTorch']);
  const [newSkill, setNewSkill] = useState('');
  const [domains, setDomains] = useState<string[]>(profile?.domains || ['Healthcare AI']);
  const [newDomain, setNewDomain] = useState('');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [availability, setAvailability] = useState(profile?.availability || 'Part-time (20 hrs/week)');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'student') {
        await updateProfile({
          display_name: displayName,
          education: institution,
          skills,
          domains,
          experience,
          availability,
          portfolio_links: portfolioLink ? [portfolioLink] : [],
          bio,
        });
      } else if (role === 'organization') {
        await updateProfile({
          display_name: orgName,
          org_name: orgName,
          org_description: orgDescription,
          domains,
          contact_email: contactEmail,
          bio: orgDescription,
        });
      } else {
        // Mentor
        await updateProfile({
          display_name: displayName,
          education: institution,
          skills,
          domains,
          experience: expertise,
          availability,
          bio,
        });
      }

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
            Complete Your Researcher Profile
          </h1>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Your profile parameters directly power the algorithmic AI matching engine and verified
            governance attribution across research workspaces.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 bg-white border-[#CBD5E1] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
                {error}
              </div>
            )}

            {/* Role Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              {role === 'student' && <GraduationCap size={18} className="text-[#1D4ED8]" />}
              {role === 'organization' && <Building2 size={18} className="text-[#1D4ED8]" />}
              {role === 'mentor' && <ShieldCheck size={18} className="text-[#1D4ED8]" />}
              <span className="text-sm font-bold text-[#0F172A] capitalize">
                {role} Profile Configuration
              </span>
            </div>

            {/* STUDENT FORM */}
            {role === 'student' && (
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
                    label="Portfolio / GitHub URL"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/your-username"
                  />
                </div>

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
            {role === 'organization' && (
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
            {role === 'mentor' && (
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
      </div>
    </div>
  );
}
