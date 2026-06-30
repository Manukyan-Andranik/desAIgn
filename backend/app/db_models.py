from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserRecord(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    credits = Column(Integer, default=1000)
    edit_count = Column(Integer, default=0)
    plan = Column(String, default="Standard")
    created_at = Column(DateTime, default=datetime.utcnow)


    projects = relationship("ProjectRecord", back_populates="user", cascade="all, delete-orphan")

class ProjectRecord(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    image_id = Column(String, nullable=False)
    room_type = Column(String, default="Living Room")
    design_style = Column(String, default="Japandi Minimalist")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="projects")

class SceneGraphRecord(Base):
    __tablename__ = "scene_graphs"

    id = Column(String, primary_key=True, index=True)
    image_url = Column(String, nullable=True)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    version = Column(Integer, default=1)
    relationships = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    objects = relationship("SceneObjectRecord", back_populates="scene_graph", cascade="all, delete-orphan")
    history = relationship("OrchestrationHistoryRecord", back_populates="scene_graph", cascade="all, delete-orphan")

class SceneObjectRecord(Base):
    __tablename__ = "scene_objects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    object_id = Column(String, nullable=False, index=True)
    scene_graph_id = Column(String, ForeignKey("scene_graphs.id"), nullable=False)
    object_class = Column(String, nullable=False)
    polygon = Column(JSON, nullable=False)
    segmentation = Column(JSON, nullable=True)
    bbox = Column(JSON, nullable=True)
    depth = Column(Float, nullable=False)
    material = Column(String, nullable=False)
    style = Column(String, nullable=True)
    editable = Column(Boolean, default=True)
    confidence = Column(Float, nullable=False)
    parent = Column(String, nullable=True)
    
    # Extended columns
    surface_orientation = Column(String, nullable=True)
    normal_vector = Column(JSON, nullable=True)
    reflectivity = Column(Float, nullable=True)
    roughness = Column(Float, nullable=True)
    color_hex = Column(String, nullable=True)
    sub_components = Column(JSON, nullable=True)

    scene_graph = relationship("SceneGraphRecord", back_populates="objects")

class OrchestrationHistoryRecord(Base):
    __tablename__ = "orchestration_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scene_graph_id = Column(String, ForeignKey("scene_graphs.id"), nullable=False)
    target_id = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    action_type = Column(String, nullable=False)
    target_material = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scene_graph = relationship("SceneGraphRecord", back_populates="history")
