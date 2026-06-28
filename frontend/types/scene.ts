export interface Point {
  x: number;
  y: number;
}

export interface NormalVector {
  nx: number;
  ny: number;
  nz: number;
}

export interface MaskSegmentation {
  type: string;
  points?: number[][];
  rle?: string;
}

export interface SceneObject {
  id: string;
  class: string;
  layer?: string;
  polygon: Point[];
  segmentation?: MaskSegmentation;
  mask?: MaskSegmentation;
  bbox?: number[];
  parent?: string;
  depth: number;
  material: string;
  style?: string;
  editable: boolean;
  confidence: number;
  surface_orientation?: string;
  normal_vector?: NormalVector;
  reflectivity?: number;
  roughness?: number;
  color_hex?: string;
  sub_components?: string[];
}

export interface SceneRelationship {
  subject_id: string;
  predicate: string;
  object_id: string;
}

export interface SceneGraph {
  image_id: string;
  image_url?: string;
  width: number;
  height: number;
  version: number;
  room_type?: string;
  design_style?: string;
  objects: SceneObject[];
  relationships?: SceneRelationship[];
}

export interface OrchestratorAction {
  targets: string[];
  action: string;
  material?: string;
  color?: string;
  style?: string;
}

export interface OrchestratorResponse {
  status: string;
  action: OrchestratorAction;
  updated_object?: SceneObject;
  updated_image_url?: string;
  message: string;
}
