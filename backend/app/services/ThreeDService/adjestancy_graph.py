from shapely.geometry import Polygon
import networkx as nx


def build_adjacency_graph(geometry):

    graph = nx.Graph()

    rooms=geometry["rooms"]

    for room in rooms:
        graph.add_node(
            room["room_id"],
            label=room["label"]
        )

    for i in range(len(rooms)):
        p1=Polygon(rooms[i]["polygon_points"])

        for j in range(i+1,len(rooms)):
            p2=Polygon(rooms[j]["polygon_points"])

            if p1.touches(p2) or p1.intersects(p2):
                graph.add_edge(
                    rooms[i]["room_id"],
                    rooms[j]["room_id"]
                )

    return {
        "graph": graph,
        "edges": list(graph.edges())
    }