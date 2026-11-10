/* Paper-level events for Algorithms 2, 4–6. Array indices are observer labels. */
const TcsSimulation = (() => {
  const graphs = {
    diamonds: {
      name: 'Twin diamonds',
      points: [[56,150],[164,73],[164,227],[266,150],[374,150],[478,73],[478,227],[584,150]],
      edges: [[0,1],[0,2],[1,2],[1,3],[2,3],[3,4],[4,5],[4,6],[5,6],[5,7],[6,7]]
    },
    star: {
      name: 'Star',
      points: [[320,150],[320,48],[465,94],[465,211],[320,258],[175,211],[175,94]],
      edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]]
    },
    path: {
      name: 'Path',
      points: [[58,172],[131,100],[206,172],[281,100],[356,172],[431,100],[506,172],[581,100]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]
    },
    cycle: {
      name: 'Cycle',
      points: [[219,53],[421,53],[510,103],[510,198],[421,247],[219,247],[130,198],[130,103]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]]
    },
    grid: {
      name: 'Grid',
      points: [[155,50],[320,50],[485,50],[155,150],[320,150],[485,150],[155,250],[320,250],[485,250]],
      edges: [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8]]
    }
  };

  const label = vertex => String.fromCharCode(65 + vertex);
  const names = vertices => vertices.map(label).join(', ');

  function adjacency(graph) {
    const neighbours = graph.points.map(() => []);
    for (const [u, v] of graph.edges) {
      neighbours[u].push(v);
      neighbours[v].push(u);
    }
    // This chooses an explicit, fixed local port order for the example.
    return neighbours.map(list => list.sort((a, b) => a - b));
  }

  function dfs(neighbours, root) {
    const order = [];
    const parent = neighbours.map(() => -1);
    parent[root] = root;
    function visit(node) {
      order.push(node);
      for (const next of neighbours[node]) {
        if (parent[next] !== -1) continue;
        parent[next] = node;
        visit(next);
      }
    }
    visit(root);
    return { order, parent };
  }

  function checkSet(neighbours, colours) {
    const red = new Set(colours.flatMap((colour, node) => colour === 'red' ? [node] : []));
    const dominated = node => red.has(node) || neighbours[node].some(v => red.has(v));
    const dominates = neighbours.every((_, node) => dominated(node));
    const independent = [...red].every(node => neighbours[node].every(v => !red.has(v)));
    const minimal = dominates && [...red].every(node => {
      red.delete(node);
      const losesCoverage = neighbours.some((_, v) => !dominated(v));
      red.add(node);
      return losesCoverage;
    });
    return { dominates, independent, minimal };
  }

  function buildRun(graph, root, start) {
    const neighbours = adjacency(graph);
    const n = neighbours.length;
    const seekers = Math.ceil(n / 3);
    const { order, parent } = dfs(neighbours, root);
    const colours = Array(n).fill('neutral');
    const frames = [];
    const add = (phase, title, detail, extras = {}) => {
      frames.push({ phase, title, detail, colours: [...colours], focus: null, probes: [], ...extras });
    };
    const occupancy = Array(n).fill(0);
    if (start === 'clusters') {
      const other = order[order.length - 1];
      occupancy[root] = Math.ceil(n / 2);
      occupancy[other] = n - occupancy[root];
      add('Cluster start', 'Two clusters begin exploring', 'Agents in each cluster start a local DFS. When two DFS trees meet, one absorbs the other. The badges show how many agents occupy each node.', { counts: [...occupancy] });
      occupancy.fill(1);
      add('Leader election', 'One DFS tree survives', 'In this illustrative outcome, backtracking reaches the surviving root ' + label(root) + ' with no external edge left. Dispersion finishes with one agent per node. The root agent is elected leader.', { focus: root, tree: true, counts: [...occupancy] });
      const moved = new Set();
      while (moved.size < n - 1) {
        const ready = order.filter(node => node !== root && !moved.has(node) &&
          !order.some(child => child !== node && parent[child] === node && !moved.has(child)));
        for (const node of ready) {
          occupancy[parent[node]] += occupancy[node];
          occupancy[node] = 0;
          moved.add(node);
        }
        add('Gathering', 'Move completed subtrees upward', 'Groups at ' + names(ready) + ' move to their parents. An internal agent carries its group upward only when every child has arrived.', { tree: true, moves: ready.map(v => [v, parent[v]]), counts: [...occupancy] });
      }
    } else {
      occupancy[root] = n;
      add('Rooted start', 'All agents start at ' + label(root), 'The connected graph has ' + n + ' vertices and ' + n + ' mobile agents. They start together at the chosen root.', { focus: root, counts: [...occupancy] });
    }

    add('Coverage', 'Prepare the seeker team', 'The covering procedure sets up DFS pointers. Stationary and oscillating agents represent every vertex; ' + seekers + ' seekers return to the root. The drawn tree gives the traversal order.', { focus: root, tree: true });
    colours[root] = 'red';
    add('Colouring', 'Select the root', 'The seekers instruct the agent representing ' + label(root) + ' to record red. It is the first member of the dominating set.', { focus: root });
    for (const node of order.slice(1)) {
      const adjacent = neighbours[node];
      const reds = adjacent.filter(v => colours[v] === 'red');
      for (let offset = 0; offset < adjacent.length; offset += seekers) {
        const batch = adjacent.slice(offset, offset + seekers);
        const reports = batch.map(v => label(v) + ' is ' + (colours[v] === 'neutral' ? 'uncoloured' : colours[v])).join('; ');
        add('Neighbour probe', 'Probe from ' + label(node), 'Seekers visit ' + names(batch) + ' and return. Reports: ' + reports + '.', { focus: node, probes: batch });
      }
      colours[node] = reds.length ? 'blue' : 'red';
      add('Colouring', 'Mark ' + label(node) + ' ' + colours[node], reds.length
        ? 'Earlier red neighbour ' + label(reds[0]) + ' already dominates ' + label(node) + '. Its representative records blue.'
        : 'None of its neighbours is red. Its representative records red, adding ' + label(node) + ' to the set.', { focus: node });
    }
    add('Settlement', 'Make the colours permanent', 'On the final DFS pass, a seeker settles at each vacant covered node. Every agent now keeps the permanent colour of its vertex.', { tree: true, counts: Array(n).fill(1) });
    add('Result', 'A minimal dominating set', 'The red vertices dominate the graph. Removing any red vertex leaves that vertex without coverage.', { done: true });
    return { neighbours, order, parent, seekers, frames, checks: checkSet(neighbours, colours) };
  }
  return { graphs, label, buildRun, checkSet };
})();
