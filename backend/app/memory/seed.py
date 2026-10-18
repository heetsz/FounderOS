import logging
import time
from app.memory.falkor import playbooks_graph, graph_for, bootstrap, init_founder_graph, write_curation

logger = logging.getLogger("founderos.seed")

PLAYBOOKS = [
    {
        "name": "Idea Validation Playbook",
        "agent": "validator",
        "version": 1,
        "steps": [
            "1. Pinpoint acute pain point and alternative workflows",
            "2. Identify specific Ideal Customer Profile (ICP)",
            "3. Surface key execution and adoption risks",
            "4. Calculate validation readiness score (0-100) with key reasons"
        ]
    },
    {
        "name": "Market Intelligence Playbook",
        "agent": "market_scout",
        "version": 1,
        "steps": [
            "1. Map direct competitors, indirect substitutes, and legacy incumbents",
            "2. Estimate TAM, SAM, and realistic SOM",
            "3. Identify industry tailwinds and regulatory shifts",
            "4. Highlight defensible wedge and whitespace opportunities"
        ]
    },
    {
        "name": "Business Model & Unit Economics Playbook",
        "agent": "business_model",
        "version": 1,
        "steps": [
            "1. Define Lean Canvas core: value proposition, channels, revenue streams",
            "2. Structure pricing tiers (usage-based, seat-based, or subscription)",
            "3. Estimate unit economics: CAC, LTV, Payback period, Gross Margins",
            "4. Establish early break-even milestones"
        ]
    },
    {
        "name": "Brand & Pitch Architecture Playbook",
        "agent": "brand_pitch",
        "version": 1,
        "steps": [
            "1. Craft memorable brand names and punchy one-line value taglines",
            "2. Formulate the 10-slide standard pitch deck outline",
            "3. Draft the one-pager founder memo for angel investors",
            "4. Refine the 30-second elevator hook"
        ]
    },
    {
        "name": "Launch Execution 30-60-90 Playbook",
        "agent": "launch_planner",
        "version": 1,
        "steps": [
            "1. Structure 30-day MVP validation and first 5 customer interviews",
            "2. Structure 60-day alpha product launch and closed beta feedback loop",
            "3. Structure 90-day public rollout, PR, and initial revenue target",
            "4. Detail legal setup, company formation, and compliance checklist"
        ]
    }
]

async def seed_global_playbooks():
    """Seed templates into the global fos_playbooks graph."""
    pg = playbooks_graph()
    try:
        await pg.query("CREATE INDEX FOR (p:Playbook) ON (p.name)")
    except Exception:
        pass

    for pb in PLAYBOOKS:
        query = """
        MERGE (p:Playbook {name: $name})
        ON CREATE SET p.agent = $agent, p.version = $ver, p.steps = $steps
        ON MATCH SET p.steps = $steps, p.version = $ver
        RETURN p.name
        """
        await pg.query(query, {
            "name": pb["name"],
            "agent": pb["agent"],
            "ver": pb["version"],
            "steps": pb["steps"]
        })
    logger.info("Global playbooks seeded successfully.")

async def copy_playbooks_to_founder(founder_id: str):
    """Copies global playbooks into the founder's graph so agents can reference and evolve them."""
    fg = graph_for(founder_id)
    for pb in PLAYBOOKS:
        query = """
        MERGE (p:Playbook {name: $name})
        ON CREATE SET p.agent = $agent, p.version = $ver, p.steps = $steps, p.success_count = 0
        RETURN p.name
        """
        await fg.query(query, {
            "name": pb["name"],
            "agent": pb["agent"],
            "ver": pb["version"],
            "steps": pb["steps"]
        })

async def seed_demo_founder(founder_id: str = "demo_founder") -> dict:
    """Pre-seeds a complete working founder environment for instant demo testing."""
    founder_name = "Alex Rivera"
    startup_name = "HealthSync AI"
    idea = "AI-powered diagnostic copilot and EHR triage workspace for independent primary care clinics"
    stage = "Idea Validation"

    await init_founder_graph(
        founder_id=founder_id,
        name=founder_name,
        startup_name=startup_name,
        idea=idea,
        stage=stage
    )
    await copy_playbooks_to_founder(founder_id)

    # Seed initial Episode 1 from Validator
    ep1_facts = [
        {"key": "icp", "kind": "customer", "text": "Independent primary care clinics with 2-10 physicians burdened by manual EHR documentation", "confidence": 0.94},
        {"key": "problem", "kind": "problem", "text": "Doctors spend 2.5 hours nightly completing SOAP notes, leading to physician burnout and delayed billing", "confidence": 0.96},
        {"key": "validation_score", "kind": "metric", "text": "Idea viability score: 86/100", "numeric_value": 86, "confidence": 0.88}
    ]
    ep1_decision = [
        {
            "id": "dec_niche_focus",
            "title": "Focus exclusively on independent practices before hospital enterprise",
            "rationale": "Shorter sales cycle (2 weeks vs 9 months) and no complex Epic integration barriers initially",
            "fact_keys": ["icp", "problem"]
        }
    ]
    ep1_tasks = [
        {"id": "task_1", "title": "Interview 5 primary care physicians about EHR triage pain", "timeframe": "30_days", "status": "done", "owner": "validator"},
        {"id": "task_2", "title": "Draft HIPAA compliance checklist and business associate agreements", "timeframe": "30_days", "status": "todo", "owner": "validator"}
    ]
    
    curation_1 = await write_curation(
        founder_id=founder_id,
        session_id=f"sess_{founder_id}_main",
        agent="validator",
        summary="Validated clinical problem statement and confirmed primary care ICP with 86/100 viability score.",
        new_facts=ep1_facts,
        decisions=ep1_decision,
        tasks=ep1_tasks
    )

    # Seed initial Episode 2 from Market Scout with Handoff
    ep2_facts = [
        {"key": "competitors", "kind": "competitor", "text": "Abridge, Nabla, and Suki focus on ambient scribe; HealthSync differentiates by combining triage automation with billing coding", "confidence": 0.91},
        {"key": "market_size", "kind": "market", "text": "TAM of $14.2B in US ambulatory health IT; serviceable addressable market of $1.8B in independent clinics", "confidence": 0.85},
        {"key": "pricing", "kind": "pricing", "text": "Initial pricing: $199/clinician/month with annual upfront discount", "confidence": 0.89}
    ]
    handoff_info = {
        "reason": "Validator requested competitive landscape and pricing benchmarks",
        "to": "market_scout"
    }

    await write_curation(
        founder_id=founder_id,
        session_id=f"sess_{founder_id}_main",
        agent="market_scout",
        summary="Mapped ambient AI competitor landscape and identified unaddressed triage-to-coding gap.",
        new_facts=ep2_facts,
        handoff=handoff_info,
        prev_episode_id=curation_1["episode_id"]
    )

    return {
        "founder_id": founder_id,
        "name": founder_name,
        "startup_name": startup_name,
        "status": "seeded"
    }

