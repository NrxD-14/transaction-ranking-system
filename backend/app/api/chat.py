"""Authenticated group and direct messaging with admin moderation."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, literal, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account, require_admin
from app.models import Account, ChatMessage, ChatReadState, User
from app.schemas.chat import ChatMessageCreate, ChatReadUpdate, GroupChatAccessUpdate
from app.services.log_service import record_log

router = APIRouter(tags=["Chat"])


def _serialize_message(message: ChatMessage) -> dict:
    sender_account = message.sender.account
    recipient = message.recipient
    return {
        "id": message.id,
        "roomType": message.room_type,
        "senderUserId": message.sender_user_id,
        "senderName": message.sender.name,
        "senderEmail": message.sender.email,
        "senderAvatar": message.sender.avatar,
        "senderProfilePicture": message.sender.profile_picture,
        "senderRole": sender_account.role if sender_account else "user",
        "recipientUserId": message.recipient_user_id,
        "recipientName": recipient.name if recipient else None,
        "content": "[Message deleted by admin]" if message.deleted_at else message.content,
        "isDeleted": message.deleted_at is not None,
        "createdAt": message.created_at,
    }


def _ensure_group_access(account: Account) -> None:
    if account.role != "admin" and account.user.group_chat_removed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your access to the group chat has been removed by an administrator",
        )


@router.get("/chat/participants")
def get_chat_participants(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    participants = (
        db.query(User, Account.role)
        .join(Account, Account.user_id == User.id)
        .filter(User.id != account.user_id)
        .order_by(User.name)
        .all()
    )
    return {
        "groupChatEnabled": account.role == "admin" or account.user.group_chat_removed_at is None,
        "participants": [
            {
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar,
                "profilePicture": user.profile_picture,
                "role": role,
                "groupChatEnabled": user.group_chat_removed_at is None,
            }
            for user, role in participants
        ]
    }


@router.get("/chat/unread")
def get_unread_chat_counts(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if account.role == "admin" or account.user.group_chat_removed_at is None:
        group_state = (
            db.query(ChatReadState)
            .filter(
                ChatReadState.user_id == account.user_id,
                ChatReadState.conversation_key == "group",
            )
            .first()
        )
        group_cursor = group_state.last_read_message_id if group_state else 0
        group_count = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.room_type == "group",
                ChatMessage.sender_user_id != account.user_id,
                ChatMessage.id > group_cursor,
            )
            .scalar()
        )
    else:
        group_count = 0

    read_key = literal("direct:") + ChatMessage.sender_user_id
    direct_counts = (
        db.query(ChatMessage.sender_user_id, func.count(ChatMessage.id))
        .outerjoin(
            ChatReadState,
            and_(
                ChatReadState.user_id == account.user_id,
                ChatReadState.conversation_key == read_key,
            ),
        )
        .filter(
            ChatMessage.room_type == "direct",
            ChatMessage.recipient_user_id == account.user_id,
            ChatMessage.sender_user_id != account.user_id,
            or_(
                ChatReadState.id.is_(None),
                ChatMessage.id > ChatReadState.last_read_message_id,
            ),
        )
        .group_by(ChatMessage.sender_user_id)
        .all()
    )
    return {
        "groupCount": group_count or 0,
        "directCounts": {user_id: count for user_id, count in direct_counts},
    }


@router.post("/chat/read")
def mark_chat_read(
    payload: ChatReadUpdate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    if payload.roomType == "group":
        _ensure_group_access(account)
        if payload.peerUserId is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Group read state cannot include a peer",
            )
        conversation_key = "group"
        message_query = db.query(ChatMessage).filter(
            ChatMessage.id == payload.throughMessageId,
            ChatMessage.room_type == "group",
        )
    else:
        peer_user_id = payload.peerUserId
        if not peer_user_id or peer_user_id == account.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid conversation participant is required")
        conversation_key = f"direct:{peer_user_id}"
        message_query = db.query(ChatMessage).filter(
            ChatMessage.id == payload.throughMessageId,
            ChatMessage.room_type == "direct",
            or_(
                and_(
                    ChatMessage.sender_user_id == account.user_id,
                    ChatMessage.recipient_user_id == peer_user_id,
                ),
                and_(
                    ChatMessage.sender_user_id == peer_user_id,
                    ChatMessage.recipient_user_id == account.user_id,
                ),
            ),
        )

    if not message_query.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found in this conversation")

    read_state = (
        db.query(ChatReadState)
        .filter(
            ChatReadState.user_id == account.user_id,
            ChatReadState.conversation_key == conversation_key,
        )
        .with_for_update()
        .first()
    )
    if read_state is None:
        read_state = ChatReadState(
            user_id=account.user_id,
            conversation_key=conversation_key,
            last_read_message_id=payload.throughMessageId,
            updated_at=datetime.utcnow(),
        )
        db.add(read_state)
    else:
        read_state.last_read_message_id = max(read_state.last_read_message_id, payload.throughMessageId)
        read_state.updated_at = datetime.utcnow()
    db.commit()
    return {"conversationKey": conversation_key, "lastReadMessageId": read_state.last_read_message_id}


@router.get("/chat/group/messages")
def get_group_messages(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=200),
    before_id: int | None = Query(None, ge=1),
):
    _ensure_group_access(account)
    query = db.query(ChatMessage).filter(ChatMessage.room_type == "group")
    if before_id is not None:
        query = query.filter(ChatMessage.id < before_id)
    total = query.count()
    messages = (
        query
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return {
        "messages": [_serialize_message(message) for message in reversed(messages)],
        "hasMore": total > len(messages),
    }


@router.get("/chat/direct/{peer_user_id}/messages")
def get_direct_messages(
    peer_user_id: str,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=200),
    before_id: int | None = Query(None, ge=1),
):
    if peer_user_id == account.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot open a conversation with yourself")
    peer = db.query(User).join(Account, Account.user_id == User.id).filter(User.id == peer_user_id).first()
    if not peer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat participant not found")
    query = db.query(ChatMessage).filter(
            ChatMessage.room_type == "direct",
            or_(
                (ChatMessage.sender_user_id == account.user_id) & (ChatMessage.recipient_user_id == peer_user_id),
                (ChatMessage.sender_user_id == peer_user_id) & (ChatMessage.recipient_user_id == account.user_id),
            ),
        )
    if before_id is not None:
        query = query.filter(ChatMessage.id < before_id)
    total = query.count()
    messages = (
        query
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return {
        "messages": [_serialize_message(message) for message in reversed(messages)],
        "hasMore": total > len(messages),
    }


@router.post("/chat/messages", status_code=status.HTTP_201_CREATED)
def send_chat_message(
    payload: ChatMessageCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    recipient_id = payload.recipientUserId
    if recipient_id is None:
        _ensure_group_access(account)
        room_type = "group"
    else:
        if recipient_id == account.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send a message to yourself")
        recipient = (
            db.query(User)
            .join(Account, Account.user_id == User.id)
            .filter(User.id == recipient_id)
            .first()
        )
        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat participant not found")
        room_type = "direct"

    message = ChatMessage(
        room_type=room_type,
        sender_user_id=account.user_id,
        recipient_user_id=recipient_id,
        content=payload.content,
        created_at=datetime.utcnow(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _serialize_message(message)


@router.get("/admin/chat/messages")
def get_all_chat_messages(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = (
        db.query(ChatMessage)
        .join(User, ChatMessage.sender_user_id == User.id)
        .join(Account, Account.user_id == User.id)
        .filter(Account.role == "user")
    )
    total = query.count()
    messages = query.order_by(ChatMessage.id.desc()).offset(offset).limit(limit).all()
    return {
        "messages": [_serialize_message(message) for message in messages],
        "total": total,
    }


@router.delete("/admin/chat/messages/{message_id}")
def delete_chat_message(
    message_id: int,
    account: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Message has already been deleted")

    message.deleted_at = datetime.utcnow()
    message.deleted_by_email = account.email
    db.commit()
    record_log(
        db,
        category="chat",
        message=f"Admin deleted a {message.room_type} chat message",
        user_email=account.email,
        metadata={"messageId": message.id, "senderUserId": message.sender_user_id},
    )
    return {"message": "Chat message deleted", "chatMessage": _serialize_message(message)}


@router.patch("/admin/chat/users/{user_id}/group-access")
def update_group_chat_access(
    user_id: str,
    payload: GroupChatAccessUpdate,
    account: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).join(Account, Account.user_id == User.id).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target_account = user.account
    if target_account.role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Administrator group access cannot be changed")

    user.group_chat_removed_at = None if payload.enabled else datetime.utcnow()
    db.commit()
    record_log(
        db,
        category="chat",
        message=f"Admin {'restored' if payload.enabled else 'removed'} {user.name} {'to' if payload.enabled else 'from'} group chat",
        user_email=account.email,
        metadata={"userId": user.id, "enabled": payload.enabled},
    )
    return {
        "userId": user.id,
        "groupChatEnabled": user.group_chat_removed_at is None,
    }
