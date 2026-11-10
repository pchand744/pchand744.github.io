// Algorithm 3 on the two-vertex graph: each singleton has one possible fixed port.
class SingletonMeeting extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const view = this.attachShadow({ mode: "open" });
    view.innerHTML = `
      <style>
        :host { display:block; width:min(100%,1120px); margin:32px auto; color:#102c41; }
        * { box-sizing:border-box; }
        details { border:1px solid #cbd8df; border-radius:12px; background:white; overflow:hidden; }
        summary { cursor:pointer; padding:20px 24px; font:600 17px/1.45 Arial,sans-serif; }
        summary:focus-visible, select:focus-visible, button:focus-visible { outline:3px solid #de821b; outline-offset:-3px; }
        .body { border-top:1px solid #d6dfe7; padding:20px 24px 24px; font:16px/1.55 Arial,sans-serif; }
        p { margin:0 0 16px; max-width:72ch; }
        label { display:block; font-size:14px; font-weight:600; margin-bottom:5px; }
        select, button { font:inherit; min-height:42px; border-radius:5px; border:1px solid #a9bbc8; color:inherit; background:white; padding:5px 12px; }
        select { max-width:100%; }
        button { cursor:pointer; font-weight:600; font-size:14px; }
        button:disabled { cursor:default; opacity:.46; }
        .diagram { display:grid; grid-template-columns:1fr minmax(24px,1fr) 1fr; align-items:center; max-width:480px; margin:24px 0 14px; }
        .node { min-height:88px; display:grid; align-content:center; justify-items:center; padding:8px; border-radius:10px; border:2px solid #6d899c; background:#f3f7fa; }
        .node b { font-size:19px; }
        .node span { text-align:center; font-size:14px; }
        .together { border-color:#155ac7; background:#e6f1ff; }
        .edge { height:2px; background:#6d899c; }
        .actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        output { font-weight:600; font-variant-numeric:tabular-nums; margin-right:7px; }
        .next { background:#102c41; color:white; border-color:#102c41; }
      </style>
      <details>
        <summary>How two singletons start a DFS tree · Algorithm 3</summary>
        <div class="body">
          <p>Place one agent at each end of a single edge. Starting with the rightmost bit of its ID, an agent moves out and back for a 1, or waits two rounds for a 0. A meeting at a vertex starts a two-node depth-first search tree.</p>
          <label for="pair">Agent IDs (decimal and binary)</label>
          <select id="pair">
            <option value="5,7">5 (101) and 7 (111)</option>
            <option value="4,6">4 (100) and 6 (110)</option>
            <option value="4,5">4 (100) and 5 (101)</option>
          </select>
          <div class="diagram" aria-label="Agent positions">
            <div class="node"><b>A</b><span></span></div><div class="edge"></div><div class="node"><b>B</b><span></span></div>
          </div>
          <p class="status" aria-live="polite"></p>
          <div class="actions">
            <output></output><button type="button" class="prev">Previous round</button>
            <button type="button" class="next">Next round</button>
          </div>
        </div>
      </details>`;
    const pair = view.querySelector("select");
    const next = view.querySelector(".next");
    const previous = view.querySelector(".prev");
    const nodes = Array.from(view.querySelectorAll(".node"));
    let round = 0;
    function render() {
      const ids = pair.value.split(",").map(Number);
      const bit = Math.max(0, Math.floor((round - 1) / 2));
      const bits = ids.map(id => (id >> bit) & 1);
      const outward = round % 2 === 1;
      const positions = bits.map((move, home) => outward && move ? 1 - home : home);
      const met = positions[0] === positions[1];
      nodes.forEach((node, location) => {
        const here = ids.filter((_, i) => positions[i] === location);
        node.querySelector("span").textContent = here.length ? "ID " + here.join(" + ID ") : "Empty";
        node.classList.toggle("together", here.length === 2);
      });
      let message = "Both agents are at home. Advance one round to read their rightmost bits.";
      if (round > 0) {
        const read = "Bit " + bit + " (counting from 0): " + bits.join(" and ") + ". ";
        if (met) message = read + "The moving agent finds the waiting agent at " + (positions[0] ? "B" : "A") + ". They start a two-node DFS tree and stop scanning.";
        else if (bits[0] === 0) message = read + "Both agents wait at their own vertices.";
        else message = read + (outward ? "Both agents cross the edge. They end at different vertices, so there is no meeting." : "Both agents return home. They can now read the next bit.");
      }
      view.querySelector(".status").textContent = message;
      view.querySelector("output").textContent = "Round " + round;
      previous.disabled = round === 0;
      next.disabled = met;
    }
    pair.addEventListener("change", () => { round = 0; render(); });
    previous.addEventListener("click", () => { round--; render(); });
    next.addEventListener("click", () => { round++; render(); });
    render();
  }
}
customElements.define("tcs-singletons", SingletonMeeting);
