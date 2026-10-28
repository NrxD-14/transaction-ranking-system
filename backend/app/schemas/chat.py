"""Request schemas for persistent group and direct messaging."""
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    recipientUserId: str | None = Field(default=None, min_length=4, max_length=32)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("Message cannot be blank")
        return content


class ChatReadUpdate(BaseModel):
    roomType: Literal["group", "direct"]
    throughMessageId: int = Field(ge=1)
    peerUserId: str | None = Field(default=None, min_length=4, max_length=32)


class GroupChatAccessUpdate(BaseModel):
    enabled: bool
