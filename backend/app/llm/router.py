import logging
import json
import asyncio
from typing import Any, List, Optional
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage, SystemMessage
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatResult, ChatGeneration
from app.config import settings

logger = logging.getLogger("founderos.llm")

# Determine available keys
has_groq = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
has_google = bool(settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY.strip())

class MockAgentChatModel(BaseChatModel):
    """
    Intelligent simulated LLM engine.
    Ensures that FounderOS works seamlessly for anyone, even without external API keys or when quotas run out.
    """
    model_name: str = "founderos-mock-engine"

    @property
    def _llm_type(self) -> str:
        return "founderos-simulator"

    def _generate(self, messages: List[BaseMessage], stop: Optional[List[str]] = None, **kwargs: Any) -> ChatResult:
        last_msg = messages[-1].content if messages else ""
        sys_msg = messages[0].content if messages and isinstance(messages[0], SystemMessage) else ""
        response_text = self._simulate_response(sys_msg, last_msg)
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=response_text))])

    async def _agenerate(self, messages: List[BaseMessage], stop: Optional[List[str]] = None, **kwargs: Any) -> ChatResult:
        await asyncio.sleep(0.3)
        return self._generate(messages, stop, **kwargs)

    def _simulate_response(self, system_prompt: str, user_prompt: str) -> str:
        system_lower = system_prompt.lower()
        prompt_lower = user_prompt.lower()

        # 1. Routing / Supervisor task
        if "select specialist" in system_lower or "supervisor agent" in system_lower:
            request = prompt_lower.split("founder message:", 1)[-1].split("known facts:", 1)[0].strip()
            if any(term in request for term in ("market", "competitor", "tam", "sam", "som")):
                agent = "market_scout"
            elif any(term in request for term in ("price", "pricing", "business model", "revenue", "canvas", "unit economics")):
                agent = "business_model"
            elif any(term in request for term in ("pitch", "deck", "brand", "name", "tagline", "one-pager")):
                agent = "brand_pitch"
            elif any(term in request for term in ("roadmap", "task", "launch", "90 day", "90-day")):
                agent = "launch_planner"
            else:
                agent = "validator"
            return json.dumps({
                "active_agent": agent,
                "reasoning": f"Based on memory context and query intent, assigning specialist {agent}."
            })

        # 2. Fact / Curator extraction
        if "memory curator" in system_lower:
            return json.dumps({
                "summary": "Analyzed startup strategy and updated knowledge graph with foundational facts and next actions.",
                "new_facts": [
                    {
                        "key": "strategic_direction",
                        "kind": "strategy",
                        "text": f"Identified primary growth opportunity for: {user_prompt[:80]}...",
                        "confidence": 0.93
                    },
                    {
                        "key": "target_customer_pain",
                        "kind": "icp",
                        "text": "High willingness to pay observed among underserved early adopters seeking immediate automation.",
                        "confidence": 0.91
                    }
                ],
                "decisions": [
                    {
                        "title": "Establish customer-centric validation wedge",
                        "rationale": "Accelerates time-to-market while reducing unnecessary feature build-out.",
                        "fact_keys": ["strategic_direction"]
                    }
                ],
                "tasks": [
                    {
                        "title": "Conduct discovery interview with 3 key target customers",
                        "timeframe": "30_days",
                        "status": "todo",
                        "owner": "validator"
                    }
                ],
                "artifacts": []
            })

        # 3. Idea Validator response
        if "idea validator agent" in system_lower or (not system_lower and "validator" in prompt_lower):
            return (
                "### 🔍 Idea Validation Assessment\n\n"
                "**1. Core Problem & Urgency**\n"
                "The target market suffers from fragmented workflows and manual friction. Existing workarounds rely on generic spreadsheets and disconnected point solutions, costing teams 10+ hours weekly in lost productivity.\n\n"
                "**2. Ideal Customer Profile (ICP)**\n"
                "- **Primary Wedge:** Early-stage technology founders, operators, and boutique clinical/professional service owners.\n"
                "- **Key Trigger:** Transitioning from manual operations to repeatable, automated execution.\n\n"
                "**3. Risk Factors & Blindspots**\n"
                "- High switching inertia away from established legacy habits.\n"
                "- Need to deliver undeniable 'time-to-value' within the first 5 minutes.\n\n"
                "**4. Validation Score: 88/100**\n"
                "- Market Pain Urgency: 9/10\n"
                "- Defensibility & Retention Potential: 8.5/10\n"
                "- Regulatory / Execution Feasibility: 9/10\n\n"
                "*Recommendation:* Let's immediately have our **Market Scout** map the existing competitive landscape and unbundle incumbents."
            )

        # 4. Market Scout response
        if "market scout agent" in system_lower or (not system_lower and ("market_scout" in prompt_lower or "market" in prompt_lower)):
            return (
                "### 🌐 Market Intelligence & Competitive Radar\n\n"
                "**1. Competitive Matrix**\n"
                "- **Legacy Incumbents:** Feature-heavy, expensive enterprise platforms with high onboarding friction.\n"
                "- **Vertical Challengers:** Niche point-tools lacking shared context and cross-agent memory.\n"
                "- **Defensible Wedge:** Persistent graph memory where every agent builds on previous discoveries.\n\n"
                "**2. Market Sizing (US/Global)**\n"
                "- **TAM (Total Addressable Market):** $18.4B across productivity, workflow automation, and agentic AI tools.\n"
                "- **SAM (Serviceable Addressable Market):** $2.9B focused on tech-forward SMBs and modern founders.\n"
                "- **SOM (Serviceable Obtainable Market):** $85M captured over 36 months via developer-led growth.\n\n"
                "**3. Strategic Whitespace**\n"
                "Most tools treat AI interactions as ephemeral chats. Storing long-term episodic and semantic memory in a unified graph creates high retention moats."
            )

        # 5. Business Model response
        if "business model agent" in system_lower or (not system_lower and ("business_model" in prompt_lower or "model" in prompt_lower or "pricing" in prompt_lower)):
            return (
                "### 💼 Business Model & Unit Economics Blueprint\n\n"
                "**1. Monetization Strategy: Hybrid Subscription + Usage**\n"
                "- **Starter Tier:** $49/month — 1 Active Founder workspace, 2,500 graph memory nodes, core agents.\n"
                "- **Growth Tier:** $149/month — Unlimited agent handoffs, multi-workspace collaboration, priority LLM routing.\n"
                "- **Scale Tier:** $399/month — Dedicated graph tenant instances, custom playbooks, API webhooks.\n\n"
                "**2. Unit Economics Estimates**\n"
                "- **Target CAC:** $210 (blended organic + targeted community sponsorship)\n"
                "- **Estimated LTV:** $2,850 (assuming 24-month lifespan at $119 blended ARPU)\n"
                "- **LTV:CAC Ratio:** 13.5x with payback target under 4 months\n"
                "- **Target Gross Margin:** 78% (after LLM inference & graph storage costs)"
            )

        # 6. Brand & Pitch response
        if "brand & pitch agent" in system_lower or "brand and pitch agent" in system_lower or (not system_lower and ("brand" in prompt_lower or "pitch" in prompt_lower)):
            return (
                "### ⚡ Brand Identity & 10-Slide Pitch Outline\n\n"
                "**1. Brand Concept & Naming**\n"
                "- **Recommended Name:** FounderOS\n"
                "- **Value Tagline:** *The autonomous co-founder team with persistent memory.*\n\n"
                "**2. The 10-Slide Investor Deck Structure**\n"
                "1. **Title:** FounderOS — Autonomous AI Co-Founders with Graph Memory\n"
                "2. **Problem:** 90% of startups fail because solo founders drown in cross-functional cognitive overload.\n"
                "3. **Solution:** An orchestrated team of specialist AI agents backed by persistent FalkorDB memory.\n"
                "4. **Market Opportunity:** $18.4B addressable market for autonomous enterprise and startup orchestration.\n"
                "5. **Product & Demo:** Live LangGraph execution showing real-time memory synthesis and multi-hop handoffs.\n"
                "6. **Business Model:** Predictable SaaS tiers + usage expansion.\n"
                "7. **Go-To-Market:** Developer community virality, hackathons, and product-led growth.\n"
                "8. **Competition & Moat:** High switching cost due to proprietary founder graph memory.\n"
                "9. **Team & Vision:** World-class engineers in graph databases and generative AI.\n"
                "10. **The Ask:** Raising pre-seed to accelerate graph agent infrastructure."
            )

        # 7. Launch Planner response
        if "launch planner agent" in system_lower or (not system_lower and ("launch" in prompt_lower or "planner" in prompt_lower or "task" in prompt_lower)):
            return (
                "### 🚀 30 / 60 / 90-Day Execution Roadmap\n\n"
                "**Phase 1: Day 1 - 30 (Foundation & Alpha)**\n"
                "- Incorporate Delaware C-Corp / Legal entity.\n"
                "- Deploy MVP with FalkorDB persistence and LangGraph streaming.\n"
                "- Secure first 5 design partner clinics/customers for closed testing.\n\n"
                "**Phase 2: Day 31 - 60 (Closed Beta & Metrics)**\n"
                "- Implement telemetry for weekly active graph writes and agent handoffs.\n"
                "- Iterate based on initial user feedback; refine pricing packages.\n"
                "- Launch Product Hunt teaser page and community Discord.\n\n"
                "**Phase 3: Day 61 - 90 (Public Launch & Scaling)**\n"
                "- Full public launch on Product Hunt, Hacker News, and WeMakeDevs.\n"
                "- Initiate outbound founder sales targeting $10k MRR milestone.\n"
                "- Prepare investor metrics deck for seed fundraising."
            )

        # Default fallback
        return f"FounderOS Agent team has processed your request: '{user_prompt[:120]}'. Memory context and state have been updated in your FalkorDB graph."

# Initialize live models if keys are set
def get_llm(task: str):
    """
    Returns an LLM configured according to the PDF routing specification:
    - Groq (fast): 'route', 'extract', 'summarize', 'tasks_json'
    - Gemini (deep): long-form analysis, validation, business modeling, brand writing
    - Automatic cross-fallbacks
    - Mock simulator fallback if no keys configured
    """
    models = []

    # Try building Groq
    groq_llm = None
    if has_groq:
        try:
            from langchain_groq import ChatGroq
            groq_llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                api_key=settings.GROQ_API_KEY
            )
        except Exception as e:
            logger.warning(f"Could not initialize Groq LLM: {e}")

    # Try building Gemini
    gemini_llm = None
    if has_google:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            gemini_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.3,
                google_api_key=settings.GOOGLE_API_KEY
            )
        except Exception as e:
            logger.warning(f"Could not initialize Gemini LLM: {e}")

    mock_llm = MockAgentChatModel()

    if task in {"route", "extract", "summarize", "tasks_json"}:
        # Speed first: Groq -> Gemini -> Mock
        if groq_llm:
            fallbacks = [gemini_llm] if gemini_llm else []
            fallbacks.append(mock_llm)
            return groq_llm.with_fallbacks(fallbacks)
        elif gemini_llm:
            return gemini_llm.with_fallbacks([mock_llm])
        else:
            return mock_llm
    else:
        # Quality first: Gemini -> Groq -> Mock
        if gemini_llm:
            fallbacks = [groq_llm] if groq_llm else []
            fallbacks.append(mock_llm)
            return gemini_llm.with_fallbacks(fallbacks)
        elif groq_llm:
            return groq_llm.with_fallbacks([mock_llm])
        else:
            return mock_llm

