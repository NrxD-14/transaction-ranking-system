"""Per-user read cursor for each group or direct conversation."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ChatReadState(Base):
    __tablename__ = "chat_read_states"
    __table_args__ = (
        UniqueConstraint("user_id", "conversation_key", name="uq_chat_read_state_user_conversation"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), nullable=False, index=True)
    conversation_key: Mapped[str] = mapped_column(String(40), nullable=False)
    last_read_message_id: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
