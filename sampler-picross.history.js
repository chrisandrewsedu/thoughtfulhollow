// sampler-picross.history.js — minimal undo/redo for the player + author boards.
// Snapshots are caller-supplied JSON-safe objects; the module is agnostic about
// shape. Exposes a single factory on window.PicrossHistory.

(function () {
  function create(opts) {
    opts = opts || {};
    const cap = Math.max(2, opts.cap || 50);
    const onChange = typeof opts.onChange === 'function' ? opts.onChange : () => {};
    const stack = [];
    let cursor = -1; // points at the current state; -1 = empty

    function clone(s) { return s == null ? null : JSON.parse(JSON.stringify(s)); }

    function reset(initial) {
      stack.length = 0;
      cursor = -1;
      if (initial !== undefined) push(initial);
      else onChange(api);
    }

    function push(state) {
      // Drop any redo branch.
      if (cursor < stack.length - 1) stack.length = cursor + 1;
      stack.push(clone(state));
      // Cap.
      if (stack.length > cap) stack.shift();
      cursor = stack.length - 1;
      onChange(api);
    }

    function undo() {
      if (cursor <= 0) return null;
      cursor -= 1;
      onChange(api);
      return clone(stack[cursor]);
    }

    function redo() {
      if (cursor >= stack.length - 1) return null;
      cursor += 1;
      onChange(api);
      return clone(stack[cursor]);
    }

    function canUndo() { return cursor > 0; }
    function canRedo() { return cursor < stack.length - 1; }
    function current() { return cursor < 0 ? null : clone(stack[cursor]); }
    function size() { return stack.length; }

    const api = { reset, push, undo, redo, canUndo, canRedo, current, size };
    return api;
  }

  window.PicrossHistory = { create };
})();
