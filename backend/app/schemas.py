from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


AgentType = Literal["research", "strategy", "execution"]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    goals: list[str] = []
    constraints: list[str] = []
    status: str = "active"


class ConversationCreate(BaseModel):
    title: str = Field(default="New conversation", max_length=200)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20000)
    agent_type: AgentType = "strategy"
    request_id: str | None = None


class AgentRunRequest(BaseModel):
    task: str = Field(min_length=1, max_length=20000)
    conversation_id: str | None = None
    record_ids: list[str] = []


class DecisionApprovalRequest(BaseModel):
    note: str = ""


class AlertReviewRequest(BaseModel):
    status: Literal["reviewed", "dismissed", "actioned"]


class TaskUpdate(BaseModel):
    status: Literal["todo", "in_progress", "blocked", "done"] | None = None
    title: str | None = Field(default=None, max_length=300)
    expected_version: int = Field(ge=1)


class RecordCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(default="", max_length=20000)
    status: str = "draft"
    owner: str = ""
    source_ids: list[str] = []
    evidence_ids: list[str] = []
