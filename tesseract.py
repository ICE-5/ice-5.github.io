import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.animation import FuncAnimation
from matplotlib.animation import FuncAnimation

# Function to generate vertices of a hypercube (tesseract) in n dimensions
def hypercube_vertices(dimensions):
    vertices = np.array([[x, y, z, w] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1) for w in (-1, 1)])
    return vertices / np.sqrt(dimensions)

# Function to generate edges of a hypercube (tesseract) from its vertices
def hypercube_edges(vertices):
    edges = []
    for i, v1 in enumerate(vertices):
        for j, v2 in enumerate(vertices):
            if np.sum(np.abs(v1 - v2)) == 2:
                edges.append((i, j))
    return edges

# Generate vertices and edges of a tesseract in 4 dimensions
vertices = hypercube_vertices(4)
edges = hypercube_edges(vertices)

# Create a figure and a 3D axis
import matplotlib.pyplot as plt
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Plot the vertices and edges of the tesseract
for edge in edges:
  ax.plot3D(*zip(*vertices[edge]), color="b")

# Animation function
def update(frame):
  ax.view_init(elev=30, azim=frame)

# Create animation
ani = FuncAnimation(fig, update, frames=np.arange(0, 360, 2), interval=50)

plt.show()
