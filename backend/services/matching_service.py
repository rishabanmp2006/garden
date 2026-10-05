from typing import List
from backend.schemas import MatchCandidateRequest, CandidateMatchResult

CANDIDATE_POOL = [
    {
        "user_id": "user-student-1",
        "name": "Rishaban MP",
        "skills": ["Python", "PyTorch", "Computer Vision", "Edge AI", "TensorFlow"],
        "domain": "Healthcare AI",
        "credits": 195,
        "availability_hrs": 20,
    },
    {
        "user_id": "user-student-2",
        "name": "Priya Sharma",
        "skills": ["Python", "Data Analysis", "NLP", "Statistics", "R"],
        "domain": "Biostatistics & Clinical",
        "credits": 95,
        "availability_hrs": 15,
    },
    {
        "user_id": "user-student-3",
        "name": "Arun Kumar",
        "skills": ["React", "TypeScript", "Edge Runtime", "C++", "Docker"],
        "domain": "Edge Systems & Web",
        "credits": 60,
        "availability_hrs": 25,
    },
]

class MatchingService:
    def match_candidates(self, req: MatchCandidateRequest) -> List[CandidateMatchResult]:
        results: List[CandidateMatchResult] = []
        req_skills_set = {s.lower() for s in req.required_skills}

        for cand in CANDIDATE_POOL:
            cand_skills_set = {s.lower() for s in cand["skills"]}
            common_skills = req_skills_set.intersection(cand_skills_set)
            
            # Base skill match percentage
            skill_score = (len(common_skills) / max(len(req_skills_set), 1)) * 60
            
            # Domain bonus
            domain_bonus = 20 if req.domain.lower() in cand["domain"].lower() else 5
            
            # Reputation bonus (credits)
            credit_bonus = min(cand["credits"] / 10, 20)
            
            total_score = min(int(skill_score + domain_bonus + credit_bonus), 98)

            reasons = []
            if common_skills:
                reasons.append(f"Matched {len(common_skills)} required skill(s): {', '.join(s.title() for s in common_skills)}")
            if req.domain.lower() in cand["domain"].lower():
                reasons.append(f"Direct domain match in {req.domain}")
            if cand["credits"] > 50:
                reasons.append(f"{cand['credits']} verified credits on ResearchMesh ledger")
            reasons.append(f"Available {cand['availability_hrs']} hrs/week for research milestones")

            tier = "exceptional" if total_score >= 85 else "strong" if total_score >= 70 else "qualified"

            results.append(
                CandidateMatchResult(
                    user_id=cand["user_id"],
                    name=cand["name"],
                    compatibility_score=total_score,
                    match_reasons=reasons,
                    verified_credits=cand["credits"],
                    recommendation_tier=tier,
                )
            )

        results.sort(key=lambda x: x.compatibility_score, reverse=True)
        return results

matching_service = MatchingService()
