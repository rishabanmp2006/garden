import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, GraduationCap, Building2, CheckCircle2,
  Mail, Clock, ExternalLink, BookOpen, Code, X,
  Save, Upload, FileText, AlertCircle, Briefcase, Globe,
  Award, Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { UserRole } from '../../types';

export function ProfilePage() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');

  // Contribution stats
  const [stats, setStats] = useState({
    projectCount: 0,
    contributionCount: 0,
    totalCredits: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load stats from Supabase
  useEffect(() => {
    async function loadStats() {
      if (!user || !isSupabaseConfigured() || !supabase) {
        setStatsLoading(false);
        return;
      }
      try {
        const [members, contributions, credits] = await Promise.all([
          supabase.from('project_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('contributions').select('id', { count: 'exact', head: true }).eq('contributor_id', user.id),
          supabase.from('credits').select('amount').eq('user_id', user.id),
        ]);
        setStats({
          projectCount: members.count || 0,
          contributionCount: contributions.count || 0,
          totalCredits: credits.data?.reduce((s, c) => s + c.amount, 0) || 0,
        });
      } catch {
        // stats are supplementary
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [user]);

  // Sync form state with profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.display_name || '');
      setBio(profile.bio || profile.org_description || '');
      setEducation(profile.education || '');
      setExperience(profile.experience || '');
      setAvailability(profile.availability || '');
      setSkills(profile.skills || []);
      setDomains(profile.domains || []);
      setPortfolioLinks(profile.portfolio_links || []);
      setContactEmail(profile.contact_email || user?.email || '');
      setOrgName(profile.org_name || profile.display_name || user?.display_name || '');
      setOrgDescription(profile.org_description || profile.bio || '');
    }
  }, [profile, user]);

  if (!user || !profile) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={28} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <p className="text-xs text-[#64748B]">Loading profile...</p>
      </div>
    );
  }

  const role = (profile.role || user.role) as UserRole;
  const isStudent = role === 'student';
  const isOrg = role === 'organization';
  const isMentor = role === 'mentor';

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.display_name || user?.display_name || '');
      setBio(profile.bio || profile.org_description || '');
      setEducation(profile.education || '');
      setExperience(profile.experience || '');
      setAvailability(profile.availability || '');
      setSkills(profile.skills || []);
      setDomains(profile.domains || []);
      setPortfolioLinks(profile.portfolio_links || []);
      setContactEmail(profile.contact_email || user?.email || '');
      setOrgName(profile.org_name || profile.display_name || user?.display_name || '');
      setOrgDescription(profile.org_description || profile.bio || '');
    }
    setEditing(false);
    setError('');
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleAddDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      setDomains([...domains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const handleAddLink = () => {
    if (newLink.trim() && !portfolioLinks.includes(newLink.trim())) {
      setPortfolioLinks([...portfolioLinks, newLink.trim()]);
      setNewLink('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates: Record<string, any> = {
        bio,
        skills,
        domains,
        availability,
        portfolio_links: portfolioLinks,
      };

      if (isStudent || isMentor) {
        updates.display_name = displayName;
        updates.education = education;
        updates.experience = experience;
        updates.bio = bio;
      }

      if (isOrg) {
        const effectiveOrgName = orgName || displayName || user.display_name;
        updates.org_name = effectiveOrgName;
        updates.display_name = effectiveOrgName;
        updates.org_description = orgDescription;
        updates.bio = orgDescription || bio;
        updates.contact_email = contactEmail;
      }

      await updateProfile(updates);
      await refreshProfile();
      setEditing(false);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || err.details || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitial = (profile.display_name || user.display_name || 'U').charAt(0).toUpperCase();

  const RoleIcon = isOrg ? Building2 : isMentor ? ShieldCheck : GraduationCap;
  const roleLabel = isOrg ? 'Organization' : isMentor ? 'Mentor / Advisor' : 'Student / Researcher';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#0F172A]">Research Identity</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Your verified academic profile and research credentials on ResearchMesh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} icon={<Save size={14} />} onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Status messages */}
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

      {/* ====== PROFILE HEADER CARD ====== */}
      <Card padding="lg">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              avatarInitial
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {editing ? (
                <input
                  value={isOrg ? orgName : displayName}
                  onChange={(e) => isOrg ? setOrgName(e.target.value) : setDisplayName(e.target.value)}
                  className="text-lg font-bold text-[#0F172A] bg-transparent border-b border-[#1D4ED8] focus:outline-none pb-0.5"
                  placeholder={isOrg ? "Organization Name" : "Display Name"}
                />
              ) : (
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {isOrg
                    ? (profile.org_name || profile.display_name || user.display_name)
                    : (profile.display_name || user.display_name)}
                </h2>
              )}
              {profile.verified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] text-[10px] font-bold border border-[#DCFCE7]">
                  <CheckCircle2 size={10} /> VERIFIED
                </span>
              )}
              {!profile.verified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] text-[10px] font-bold border border-[#FDE68A]">
                  UNVERIFIED
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                <RoleIcon size={12} className="text-[#1D4ED8]" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                <Mail size={12} />
                {user.email}
              </span>
              {profile.availability && !editing && (
                <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                  <Clock size={12} />
                  {profile.availability}
                </span>
              )}
            </div>

            {/* Quick Stats */}
            {!statsLoading && (
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-[#0F172A]">{stats.projectCount}</p>
                  <p className="text-[10px] text-[#64748B]">Projects</p>
                </div>
                <div className="w-px h-6 bg-[#E2E8F0]" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[#0F172A]">{stats.contributionCount}</p>
                  <p className="text-[10px] text-[#64748B]">Contributions</p>
                </div>
                <div className="w-px h-6 bg-[#E2E8F0]" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[#0F172A]">{stats.totalCredits}</p>
                  <p className="text-[10px] text-[#64748B]">Credits Earned</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ====== LEFT COLUMN: BIO + DETAILS ====== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Bio */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#1D4ED8]" />
                  {isOrg ? 'Organization Overview' : 'Professional Bio'}
                </span>
              </CardTitle>
            </CardHeader>
            {editing ? (
              <Textarea
                value={isOrg ? orgDescription : bio}
                onChange={(e) => isOrg ? setOrgDescription(e.target.value) : setBio(e.target.value)}
                placeholder={isOrg ? 'Describe your organization, research areas, and mission...' : 'Write about your research interests, experience, and academic background...'}
                rows={5}
              />
            ) : (
              <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                {(isOrg ? (profile.org_description || profile.bio) : (profile.bio || profile.org_description)) || (
                  <span className="text-[#94A3B8] italic">No bio provided yet. Click "Edit Profile" to add one.</span>
                )}
              </p>
            )}
          </Card>

          {/* Education & Experience — Student / Mentor */}
          {(isStudent || isMentor) && (
            <Card padding="lg">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-[#1D4ED8]" />
                    Education & Experience
                  </span>
                </CardTitle>
              </CardHeader>
              {editing ? (
                <div className="space-y-4">
                  <Input
                    label="Education / Institution"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g., IIT Madras, Department of Computer Science"
                  />
                  <Input
                    label={isMentor ? 'Areas of Expertise' : 'Research Experience'}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={isMentor ? 'e.g., Medical AI, Clinical Trial Validation' : 'e.g., 2 years in NLP research'}
                  />
                  <Input
                    label="Availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder={isMentor ? 'e.g., 5-10 hrs/week for milestone reviews' : 'e.g., Part-time (20 hrs/week)'}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.education && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap size={14} className="text-[#1D4ED8]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">Education</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{profile.education}</p>
                      </div>
                    </div>
                  )}
                  {profile.experience && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase size={14} className="text-[#1D4ED8]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">{isMentor ? 'Expertise' : 'Experience'}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{profile.experience}</p>
                      </div>
                    </div>
                  )}
                  {!profile.education && !profile.experience && (
                    <p className="text-xs text-[#94A3B8] italic">No education or experience details added.</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Organization Details — Org only */}
          {isOrg && (
            <Card padding="lg">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#1D4ED8]" />
                    Organization Details
                  </span>
                </CardTitle>
              </CardHeader>
              {editing ? (
                <div className="space-y-4">
                  <Input
                    label="Contact Email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organization.org"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {(profile.contact_email || profile.email || user.email) && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Mail size={13} className="text-[#1D4ED8]" />
                      <span>{profile.contact_email || profile.email || user.email}</span>
                    </div>
                  )}
                  {!profile.contact_email && !profile.email && !user.email && (
                    <p className="text-xs text-[#94A3B8] italic">No contact details added.</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* CV / Resume Section */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-[#1D4ED8]" />
                  {isOrg ? 'Documents' : 'CV / Resume'}
                </span>
              </CardTitle>
            </CardHeader>
            <div className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-6 text-center bg-[#F8FAFC]">
              <Upload size={24} className="mx-auto text-[#94A3B8] mb-2" />
              <p className="text-xs font-semibold text-[#334155]">
                {isOrg ? 'Upload Organization Documents' : 'Upload Your CV / Resume'}
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                PDF, DOCX up to 10MB
              </p>
              <div className="mt-3 p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md">
                <p className="text-[11px] text-[#92400E] flex items-center justify-center gap-1">
                  <AlertCircle size={11} />
                  Supabase Storage integration is the next implementation step.
                  File upload will be functional once a storage bucket is configured.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ====== RIGHT COLUMN: SKILLS, DOMAINS, LINKS ====== */}
        <div className="space-y-6">
          {/* Skills / Technical Stack */}
          {(isStudent || isMentor) && (
            <Card padding="lg">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-1.5">
                    <Code size={14} className="text-[#1D4ED8]" />
                    Technical Skills
                  </span>
                </CardTitle>
              </CardHeader>
              {editing ? (
                <div>
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add skill..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddSkill}>+</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#EFF6FF] text-[#1D4ED8] font-medium">
                        {s}
                        <button type="button" onClick={() => setSkills(skills.filter((k) => k !== s))} className="hover:text-[#B91C1C] cursor-pointer bg-transparent border-none p-0">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((s: string) => (
                      <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#EFF6FF] text-[#1D4ED8] font-medium">
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic">No skills added yet.</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Research Domains */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-[#1D4ED8]" />
                  Research Domains
                </span>
              </CardTitle>
            </CardHeader>
            {editing ? (
              <div>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                    placeholder="Add domain..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddDomain}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {domains.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#F0FDF4] text-[#15803D] font-medium">
                      {d}
                      <button type="button" onClick={() => setDomains(domains.filter((k) => k !== d))} className="hover:text-[#B91C1C] cursor-pointer bg-transparent border-none p-0">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.domains && profile.domains.length > 0 ? (
                  profile.domains.map((d: string) => (
                    <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#F0FDF4] text-[#15803D] font-medium">
                      {d}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[#94A3B8] italic">No research domains added.</p>
                )}
              </div>
            )}
          </Card>

          {/* Portfolio / Links */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-[#1D4ED8]" />
                  {isOrg ? 'Website & Links' : 'Portfolio & Publications'}
                </span>
              </CardTitle>
            </CardHeader>
            {editing ? (
              <div>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                    placeholder="https://..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddLink}>+</Button>
                </div>
                <div className="space-y-1.5">
                  {portfolioLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <ExternalLink size={11} className="text-[#64748B] flex-shrink-0" />
                      <span className="truncate text-[#1D4ED8] flex-1">{link}</span>
                      <button type="button" onClick={() => setPortfolioLinks(portfolioLinks.filter((_, i) => i !== idx))} className="hover:text-[#B91C1C] text-[#94A3B8] cursor-pointer bg-transparent border-none p-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {profile.portfolio_links && profile.portfolio_links.length > 0 ? (
                  profile.portfolio_links.map((link: string, idx: number) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#1D4ED8] hover:underline"
                    >
                      <ExternalLink size={11} className="flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-[#94A3B8] italic">No links added yet.</p>
                )}
              </div>
            )}
          </Card>

          {/* Verification Status */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#1D4ED8]" />
                  Verification Status
                </span>
              </CardTitle>
            </CardHeader>
            <div className={`p-3 rounded-lg border ${profile.verified ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {profile.verified ? (
                  <CheckCircle2 size={16} className="text-[#15803D]" />
                ) : (
                  <AlertCircle size={16} className="text-[#B45309]" />
                )}
                <span className={`text-xs font-bold ${profile.verified ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                  {profile.verified ? 'Identity Verified' : 'Pending Verification'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                {profile.verified
                  ? 'Your institutional identity has been verified. Your contributions carry verified provenance.'
                  : 'Your profile is not yet verified. An admin will review your credentials.'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
