"""Render official Franka FER/Panda visual meshes with their native transforms.
Usage: python render_franka.py /path/to/franka_description /output/directory
Dependencies: numpy, pyyaml, trimesh, pycollada, pyrender, pillow; EGL.
This creates a static method illustration, not a validated grasp or experiment.
"""
import os
os.environ.setdefault('PYOPENGL_PLATFORM','egl')
import sys
from pathlib import Path
import numpy as np
# pyrender 0.1.45 uses the NumPy 1.x alias.
if not hasattr(np, "infty"): np.infty = np.inf
import yaml
import trimesh
import pyrender
from PIL import Image
from trimesh.transformations import euler_matrix, translation_matrix
src,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
kin=yaml.safe_load((src/'robots/fer/kinematics.yaml').read_text())
T=translation_matrix([0,0,0.022]);Ts=[T.copy()]
q=[0,-np.pi/4,0,-3*np.pi/4,0,np.pi/2,np.pi/4]
for i in range(1,9):
 d=kin[f'joint{i}']['kinematic']
 T=T@translation_matrix([d['x'],d['y'],d['z']])@euler_matrix(d['roll'],d['pitch'],d['yaw'])
 if i<=7:T=T@euler_matrix(0,0,q[i-1])
 Ts.append(T.copy())
hand=Ts[8]@euler_matrix(0,0,-np.pi/4)
scene=pyrender.Scene(bg_color=[1.0,1.0,1.0,1.0],ambient_light=[.12,.12,.12])
def add_visual(path,pose):
 model=trimesh.load(path,force='scene')
 nodes=[]
 for key in model.graph.nodes_geometry:
  mat,gname=model.graph[key]
  mesh=model.geometry[gname].copy()
  c=mesh.visual.material.baseColorFactor.astype(float)/255
  c[:3]=c[:3]**2.2
  material=pyrender.MetallicRoughnessMaterial(baseColorFactor=c,metallicFactor=0.05,roughnessFactor=.65)
  nodes.append(scene.add(pyrender.Mesh.from_trimesh(mesh,material=material,smooth=True),pose=pose@mat))
 return nodes
arm_nodes={}
for i in range(8):arm_nodes[i]=add_visual(src/f'meshes/robots/fer/visual/link{i}.dae',Ts[i])
add_visual(src/'meshes/robots/fer/visual/hand.dae',hand)
# Stock two-finger geometry, 50 mm opposing inner-face gap.
for sign in [1,-1]:
 finger=hand@translation_matrix([0,sign*.025,.0584])
 if sign<0:finger=finger@euler_matrix(0,0,np.pi)
 add_visual(src/'meshes/robots/fer/visual/finger.dae',finger)
box=trimesh.creation.box(extents=[.053,.05,.061])
box.visual.vertex_colors=[59,70,73,255]
scene.add(pyrender.Mesh.from_trimesh(box,smooth=False),pose=hand@translation_matrix([0,0,.112]))
# Neutral stage; robot base resting on an aluminum mounting pad.
for ext,col,pos in [([1.6,1.4,.02],[247,249,247,255],[.15,0,-.01]),([.24,.24,.022],[168,181,183,255],[0,0,.011])]:
 m=trimesh.creation.box(extents=ext);m.visual.vertex_colors=col
 scene.add(pyrender.Mesh.from_trimesh(m,smooth=False),pose=translation_matrix(pos))
def look(eye,target):
 eye=np.array(eye,dtype=float);target=np.array(target,dtype=float)
 z=eye-target;z/=np.linalg.norm(z)
 x=np.cross([0,0,1],z);x/=np.linalg.norm(x)
 y=np.cross(z,x)
 p=np.eye(4);p[:3,0]=x;p[:3,1]=y;p[:3,2]=z;p[:3,3]=eye
 return p
for eye,intensity in [([1,-1,2],1.6),([-1,-.5,1.5],.65),([.5,1.5,1.8],.8)]:
 scene.add(pyrender.DirectionalLight(color=np.ones(3),intensity=intensity),pose=look(eye,[.2,0,.4]))
center=(hand@np.array([0,0,.065,1]))[:3]
for name,size,eye,target,scale in [
 ('franka-panda-lifting.png',(1200,1200),[1.2,-1.3,1.02],[.20,0,.40],.62),
 ('franka-hand-lifting.png',(850,1100),center+[.30,-.30,.10],center+[0,0,-.022],.165),
]:
 if name.startswith('franka-hand'):
  for i in range(7):
   for nd in arm_nodes[i]:scene.remove_node(nd)
 camera=pyrender.OrthographicCamera(xmag=scale*size[0]/size[1],ymag=scale,znear=.01,zfar=10)
 node=scene.add(camera,pose=look(eye,target))
 renderer=pyrender.OffscreenRenderer(*size)
 color,_=renderer.render(scene,flags=pyrender.RenderFlags.SHADOWS_DIRECTIONAL)
 Image.fromarray(color).save(out/name)
 renderer.delete();scene.remove_node(node)
 print(name, 'rendered')
print('Hand origin:',hand[:3,3].tolist())
