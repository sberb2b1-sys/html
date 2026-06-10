from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    llm_calls_today = Column(Integer, default=0, nullable=False)
    last_call_reset = Column(Date, nullable=True)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user")
    general_messages = relationship("GeneralMessage", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    deadline = Column(String(100), default="Без срока")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    general_messages = relationship("GeneralMessage", back_populates="project", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="project", cascade="all, delete-orphan")
    analysis_reports = relationship(
        "AnalysisReport", back_populates="project", cascade="all, delete-orphan"
    )
    task_approvals = relationship(
        "TaskApproval", back_populates="project", cascade="all, delete-orphan"
    )


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="planning", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="sprints")
    tasks = relationship("Task", back_populates="sprint")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    system_prompt = Column(Text, default="")
    avatar_url = Column(String(500), default="")
    is_online = Column(Boolean, default=True, nullable=False)

    project = relationship("Project", back_populates="agents")
    tasks = relationship("Task", back_populates="assignee_agent")
    chat_messages = relationship("ChatMessage", back_populates="agent")
    general_messages = relationship("GeneralMessage", back_populates="agent")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    status = Column(String(50), default="todo", nullable=False, index=True)
    priority = Column(String(50), default="Medium", nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True, index=True)
    assignee_agent_id = Column(String(50), ForeignKey("agents.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")
    assignee_agent = relationship("Agent", back_populates="tasks")
    approval = relationship("TaskApproval", back_populates="task", uselist=False)
    analysis_report = relationship("AnalysisReport", back_populates="task", uselist=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")
    agent = relationship("Agent", back_populates="chat_messages")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    user_idea = Column(Text, nullable=False)
    winner_analyst = Column(String(255), default="")
    winner_proposal = Column(Text, default="")
    report = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="analysis_reports")
    task = relationship("Task", back_populates="analysis_report")
    proposals = relationship(
        "AnalysisProposal", back_populates="report", cascade="all, delete-orphan"
    )
    approval = relationship("TaskApproval", back_populates="report", uselist=False)


class AnalysisProposal(Base):
    __tablename__ = "analysis_proposals"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("analysis_reports.id"), nullable=False, index=True)
    analyst_name = Column(String(255), nullable=False)
    analyst_style = Column(String(50), default="")
    proposal = Column(Text, nullable=False)
    votes = Column(Integer, default=0, nullable=False)

    report = relationship("AnalysisReport", back_populates="proposals")


class TaskApproval(Base):
    __tablename__ = "task_approvals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, unique=True, index=True)
    report_id = Column(Integer, ForeignKey("analysis_reports.id"), nullable=True, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)
    rejection_reason = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="task_approvals")
    task = relationship("Task", back_populates="approval")
    report = relationship("AnalysisReport", back_populates="approval")


class GeneralMessage(Base):
    __tablename__ = "general_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="general_messages")
    user = relationship("User", back_populates="general_messages")
    agent = relationship("Agent", back_populates="general_messages")
