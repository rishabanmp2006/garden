import json
from typing import List, Optional
from backend.database import get_db
from backend.schemas import MatchCandidateRequest, CandidateMatchResult

class MatchingService:
    def match_candidates(self, req: MatchCandidateRequest) -> List[CandidateMatchResult]:
        conn = get_db()
        cursor = conn.cursor()
        
        # Query real student profiles from database
        cursor.execute("SELECT id, display_name, skills, domains, availability FROM profiles WHERE role = 'student'")
        students = cursor.fetchall()
        
        results: List[CandidateMatchResult] = []
        req_skills_set = {s.lower().strip() for s in req.required_skills if s}

        for stu in students:
            stu_id = stu["id"]
            name = stu["display_name"] or "Student Researcher"
            stu_skills_raw = stu["skills"]
            try:
                stu_skills = json.loads(stu_skills_raw) if stu_skills_raw else []
            except Exception:
                stu_skills = [s.strip() for s in stu_skills_raw.split(",")] if stu_skills_raw else []
            
            stu_domains = stu["domains"] or ""
            availability = stu["availability"] or "10-20 hrs/week"

            # Query real verified credits from database
            cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = ?", (stu_id,))
            cred_row = cursor.fetchone()
            real_credits = cred_row["total"] if cred_row else 0

            stu_skills_set = {s.lower().strip() for s in stu_skills if s}
            common_skills = req_skills_set.intersection(stu_skills_set)
            missing_skills = req_skills_set - stu_skills_set

            # Base skill match percentage (up to 60 points)
            skill_score = (len(common_skills) / max(len(req_skills_set), 1)) * 60
            
            # Domain bonus (up to 20 points)
            domain_bonus = 20 if req.domain.lower() in stu_domains.lower() else 5
            
            # Real reputation bonus from verified ledger credits (up to 20 points)
            credit_bonus = min(real_credits / 5, 20)
            
            total_score = min(int(skill_score + domain_bonus + credit_bonus), 99)

            reasons: List[str] = []
            if common_skills:
                reasons.append(f"Matched skills: {', '.join(s.title() for s in common_skills)}")
            if missing_skills:
                reasons.append(f"Missing skills: {', '.join(s.title() for s in missing_skills)}")
            if req.domain.lower() in stu_domains.lower():
                reasons.append(f"Domain alignment in {req.domain}")
            if real_credits > 0:
                reasons.append(f"{real_credits} verified credits recorded on SHA-256 ledger")
            reasons.append(f"Declared availability: {availability}")

            tier = "exceptional" if total_score >= 85 else "strong" if total_score >= 70 else "qualified"

            results.append(
                CandidateMatchResult(
                    user_id=stu_id,
                    name=name,
                    compatibility_score=total_score,
                    match_reasons=reasons,
                    verified_credits=real_credits,
                    recommendation_tier=tier,
                )
            )

        conn.close()
        results.sort(key=lambda x: x.compatibility_score, reverse=True)
        return results

matching_service = MatchingService()

