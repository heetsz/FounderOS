import json
import asyncio
import logging
from typing import AsyncGenerator
from pydantic import BaseModel, Field
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import HumanMessage
from app.graph.builder import orchestrator
from app.memory.falkor import load_memory_context

logger = logging.getLogger("founderos.api.chat")
router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatStreamRequest(BaseModel):
    founder_id: str = Field(..., description="The founder's ID")
    message: str = Field(..., description="User query or instruction")
    thread_id: str = Field(default="", description="Chat thread or session ID")

async def chat_event_generator(req: ChatStreamRequest) -> AsyncGenerator[dict, None]:
    founder_id = req.founder_id
    thread_id = req.thread_id.strip() or f"sess_{founder_id}_main"
    startup_id = f"startup_{founder_id}"

    # Initial input state
    initial_state = {
        "founder_id": founder_id,
        "startup_id": startup_id,
        "thread_id": thread_id,
        "messages": [HumanMessage(content=req.message)],
        "memory_context": {},
        "active_agent": "supervisor",
        "handoff": None,
        "new_facts": [],
        "hops": 0,
        "response_stream": ""
    }

    config = {"configurable": {"thread_id": thread_id}}

    try:
        # Pre-read memory to provide immediate UI feedback
        mem_ctx = await load_memory_context(founder_id)
        yield {
            "event": "memory_read",
            "data": json.dumps({
                "facts": mem_ctx.get("facts", []),
                "count": len(mem_ctx.get("facts", [])),
                "decisions": mem_ctx.get("decisions", []),
                "episodes": mem_ctx.get("episodes", [])
            })
        }
        await asyncio.sleep(0.05)

        # Execute LangGraph nodes stream
        current_agent = "supervisor"
        async for output in orchestrator.astream(initial_state, config=config):
            for node_name, node_output in output.items():
                logger.info(f"LangGraph node executed: {node_name}")

                if node_name == "load_memory":
                    yield {
                        "event": "memory_read",
                        "data": json.dumps({
                            "facts": node_output.get("memory_context", {}).get("facts", []),
                            "count": len(node_output.get("memory_context", {}).get("facts", []))
                        })
                    }

                elif node_name == "supervisor":
                    active_agent = node_output.get("active_agent", "validator")
                    current_agent = active_agent
                    yield {
                        "event": "agent_changed",
                        "data": json.dumps({
                            "agent": active_agent,
                            "reason": f"Supervisor routed request to {active_agent}"
                        })
                    }
                    await asyncio.sleep(0.05)

                elif node_name in ["validator", "market_scout", "business_model", "brand_pitch", "launch_planner"]:
                    # Stream tokens for the specialist's response
                    full_text = node_output.get("response_stream", "")
                    # Chunk stream to simulate organic fast streaming
                    chunk_size = 28
                    for i in range(0, len(full_text), chunk_size):
                        chunk = full_text[i:i + chunk_size]
                        yield {
                            "event": "token",
                            "data": json.dumps({
                                "token": chunk,
                                "agent": node_name
                            })
                        }
                        await asyncio.sleep(0.02)

                    # Check if node triggered handoff
                    handoff = node_output.get("handoff")
                    if handoff:
                        yield {
                            "event": "handoff",
                            "data": json.dumps({
                                "from_agent": node_name,
                                "to_agent": handoff.get("to"),
                                "reason": handoff.get("reason")
                            })
                        }
                        await asyncio.sleep(0.05)

                elif node_name == "curator":
                    # Curator produced written memory
                    written_facts = node_output.get("new_facts", [])
                    yield {
                        "event": "memory_written",
                        "data": json.dumps({
                            "new_facts": written_facts,
                            "count": len(written_facts)
                        })
                    }
                    await asyncio.sleep(0.05)

        # Final completion event
        yield {
            "event": "done",
            "data": json.dumps({
                "status": "completed",
                "thread_id": thread_id
            })
        }

    except Exception as e:
        logger.error(f"Error in chat stream: {e}", exc_info=True)
        yield {
            "event": "error",
            "data": json.dumps({"error": str(e)})
        }

@router.post("")
@router.post("/stream")
async def chat_stream(req: ChatStreamRequest):
    """
    Main SSE endpoint for streaming chat, agent transitions, and real-time graph memory reads/writes.
    """
    return EventSourceResponse(chat_event_generator(req))
