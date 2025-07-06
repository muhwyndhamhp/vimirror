import { Extension as VueExtension } from "@tiptap/vue-3";
import { Extension as ReactExtension } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";

import { defaultKeymap, KeyType } from "./defaultKeymap";
import { Action, Actions, CursorPosition, Motion, Motions, VimModes } from "./types";

const mappedDefaultKeyMap: Record<string, KeyType> = {};

for (const key of defaultKeymap) {
  mappedDefaultKeyMap[key.keys] = key;
}

const VimModesList = [
  VimModes.Normal,
  VimModes.Insert,
  VimModes.Visual,
  VimModes.Command,
  VimModes.Replace,
];

const wordSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/? ";

enum TransactionMeta {
  ChangeModeTo = "changeModeTo",
  SetShowCursor = "setShowCursor",
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vim: {};
    history: {
      undo: () => ReturnType;
      redo: () => ReturnType;
    };
  }
}

type MotionsInterface = {
  [key in Motions]: Motion;
};

const motions: MotionsInterface = {
  [Motions.MoveDown]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;
    const { $from } = state.selection;

    const currentBlockStart = $from.start($from.depth);
    const currentBlockEnd = currentBlockStart + $from.node($from.depth).nodeSize;

    let nextBlock: { node: PMNode; pos: number } | null = null;

    try {
      doc.nodesBetween(currentBlockEnd, doc.content.size, (node, pos) => {
        if (node.isBlock) {
          nextBlock = { node, pos };
          throw new Error("found");
        }
        return true;
      });
    } catch (e) {
      if (e instanceof Error) {
        if (e.message !== "found") throw e;
      } else {
        throw e; // re-throw if it's not even an Error
      }
    }

    if (!nextBlock) {
      return false
    }

    const { pos } = nextBlock;

    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, pos + 1))
      .scrollIntoView();

    dispatch(tr);

    return true;
  },

  [Motions.MoveUp]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { $from } = state.selection;

    const currentBlockStart = $from.start($from.depth);

    let previousBlock: { node: PMNode; pos: number } | null = null;

    doc.nodesBetween(0, currentBlockStart - 1, (node, pos) => {
      if (node.isBlock && node.content.content.length > 0) {
        previousBlock = { node, pos };
      }
    });

    if (!previousBlock) {
      return false;
    }

    const { pos } = previousBlock;

    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, pos + 1))
      .scrollIntoView();

    dispatch(tr);

    return true;
  },
  [Motions.MoveToRight]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { from, to } = state.selection;

    const [$from, $to] = [doc.resolve(from + 1), doc.resolve(to + 1)];

    const selection = new TextSelection($from, $to);

    dispatch(state.tr.setSelection(selection));

    return true;
  },
  [Motions.MoveToLeft]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { from, to } = state.selection;

    const [$from, $to] = [doc.resolve(from - 1), doc.resolve(to - 1)];

    const selection = new TextSelection($from, $to);

    dispatch(state.tr.setSelection(selection));

    return true;
  },
  [Motions.FocusStart]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.focus("start");
  },
  [Motions.FocusEnd]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.focus("end");
  },

  [Motions.WordJumpForward]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc, selection } = state;

    const { from, to } = selection;

    if (from !== to) return false;

    const nodeWithPos = {
      node: undefined,
      pos: 0,
      to: 0,
    } as { node?: PMNode; pos: number; to: number };

    doc.descendants((node, pos) => {
      if (!node.isBlock || nodeWithPos.node) return;

      const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];

      if (nodeFrom <= from && from <= nodeTo) {
        nodeWithPos.node = node;
        nodeWithPos.pos = pos;
        nodeWithPos.to = nodeTo;
      }
    });

    const content = nodeWithPos.node?.textContent;

    if (!content)
      throw new Error(
        "If theres no content, where the hell are you pressing the W from?"
      );

    const inlineSelectionIndex = from - nodeWithPos.pos;

    let foundSeparator = false;
    let indexToJump: number | undefined = undefined;

    for (let i = inlineSelectionIndex; i < nodeWithPos.to; i += 1) {
      const currentChar = content[i];

      if (wordSeparators.includes(currentChar)) foundSeparator = true;

      if (foundSeparator) {
        indexToJump = i + 2;
        break;
      }
    }

    if (!indexToJump) return false;

    const newPos = doc.resolve(nodeWithPos.pos + indexToJump);

    const newSelection = new TextSelection(newPos, newPos);

    dispatch(state.tr.setSelection(newSelection));

    return true;
  },
  [Motions.WordJumpBackward]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc, selection } = state;

    const { from, to } = selection;

    if (from !== to) return false;

    const nodeWithPos = {
      node: undefined,
      pos: 0,
      to: 0,
    } as { node?: PMNode; pos: number; to: number };

    doc.descendants((node, pos) => {
      if (!node.isBlock || nodeWithPos.node) return;

      const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];

      if (nodeFrom <= from && from <= nodeTo) {
        nodeWithPos.node = node;
        nodeWithPos.pos = pos;
        nodeWithPos.to = nodeTo;
      }
    });

    const content = nodeWithPos.node?.textContent;

    if (!content)
      throw new Error(
        'If theres no content, where the hell are you pressing the "b" from?'
      );

    const inlineSelectionIndex = from - nodeWithPos.pos;

    let foundSeparator = false;
    let indexToJump: number | undefined = undefined;

    for (let i = inlineSelectionIndex - 3; i > 0; i -= 1) {
      const currentChar = content[i];

      if (
        wordSeparators.includes(currentChar) &&
        !wordSeparators.includes(content[i + 1])
      ) {
        foundSeparator = true;
        indexToJump = i + 1;
        break;
      }
    }

    if (!indexToJump) return false;

    const newPos = doc.resolve(nodeWithPos.pos + indexToJump + 1);

    const newSelection = new TextSelection(newPos, newPos);

    dispatch(state.tr.setSelection(newSelection));

    return true;
  },
};

type ActionsInterface = {
  [key in Actions]: Action;
};

const actions: ActionsInterface = {
  [Actions.EnterInsertMode]: ({
    editor: {
      state: { tr, doc, selection: { from, to, $from: baseFrom } },
      view: { dispatch },
    },
    props
  }) => {
    if (props) {
      switch (props['cursorPosition']) {
        case CursorPosition.BeforeCurrent:
          break
        case CursorPosition.AfterCurrent: {
          const [$from, $to] = [doc.resolve(from + 1), doc.resolve(to + 1)];
          const selection = new TextSelection($from, $to);
          dispatch(tr.setSelection(selection))
          break
        }
        case CursorPosition.BlockStart: {
          const currentBlockStart = baseFrom.start(baseFrom.depth);
          const [$from, $to] = [doc.resolve(currentBlockStart), doc.resolve(currentBlockStart)]

          const selection = new TextSelection($from, $to)
          dispatch(tr.setSelection(selection))
          break
        }
        case CursorPosition.BlockEnd: {
          const currentBlockStart = baseFrom.start(baseFrom.depth);
          const currentBlockEnd = currentBlockStart + baseFrom.node(baseFrom.depth).nodeSize;
          const [$from, $to] = [doc.resolve(currentBlockEnd - 2), doc.resolve(currentBlockEnd - 2)]

          const selection = new TextSelection($from, $to)
          dispatch(tr.setSelection(selection))
          break
        }
      }
    }

    dispatch(tr.setMeta(TransactionMeta.ChangeModeTo, VimModes.Insert));

    return true;
  },

  [Actions.EnterNormalMode]: ({
    editor: {
      state: { selection, doc, tr },
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;
    let { from, to } = selection;

    from = from - 1;
    to = to - 1;

    if (from <= 0 && to <= 0) {
      from = 1;
      to = 1;
    }

    const [$from, $to] = [doc.resolve(from), doc.resolve(to)];

    const newSelection = new TextSelection($from, $to);

    tr = tr.setMeta(TransactionMeta.ChangeModeTo, VimModes.Normal);
    tr = tr.setMeta(TransactionMeta.SetShowCursor, false);

    if (storage.currentVimMode === VimModes.Insert)
      tr = tr.setSelection(newSelection);

    dispatch(tr);

    return true;
  },
  [Actions.Undo]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;
    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.undo();
  },
  [Actions.Redo]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.redo();
  },
};

interface VimirrorOptions {
  updateValue: ({ mode }: { mode: string }) => void;
}

interface VimirrorStorage {
  editor: Editor;
  decorationSet: DecorationSet;
  prosemirror: HTMLDivElement;
  currentVimMode: VimModes;
  showCursor: boolean;
  cursorDecoration: Decoration;
}

function createVimirrorExtension(BaseExtension: typeof VueExtension | typeof ReactExtension) {
  return BaseExtension.create<VimirrorOptions, VimirrorStorage>({
    name: "vimirror",

    addOptions() {
      return {
        updateValue: () => { },
      };
    },

    addStorage() {
      return {
        editor: null as any,
        decorationSet: null as any,
        prosemirror: null as any,
        cursorDecoration: null as any,
        currentVimMode: VimModes.Normal,
        showCursor: false,
      };
    },

    addProseMirrorPlugins() {
      const editor = this.editor;
      const options = this.options;
      const getStorage = () => this.storage;

      const vimModesPlugin = new Plugin({
        key: new PluginKey("vimPlugin"),

        props: {
          decorations(state) {
            return this.getState(state).decorationSet;
          },
          attributes() {
            const storage = getStorage();

            return {
              "vim-active": "true",
              mode: storage.currentVimMode,
              "show-cursor": storage.showCursor ? "true" : "false",
            };
          },
          handleDOMEvents: {
            keypress: (view, event) => {
              // this only serves purpose of not letting any keys work while escape mode
              if (getStorage().currentVimMode !== VimModes.Insert) {
                event.preventDefault();
              }
              return true;
            },
          },
        },

        state: {
          init: (_, state) => {
            const storage = getStorage();
            const { from, to } = state.selection;

            storage.cursorDecoration = Decoration.inline(from, to + 1, {
              class: "vim-cursor",
            });

            options.updateValue({ mode: storage.currentVimMode });

            storage.decorationSet = DecorationSet.create(state.doc, [
              storage.cursorDecoration,
            ]);

            return {
              mode: storage.currentVimMode,
              decorationSet: storage.decorationSet,
            };
          },
          apply: (tr, _, __, newState) => {
            const storage = getStorage();

            let { from, to } = newState.selection;

            storage.cursorDecoration = Decoration.inline(from, to + 1, {
              class: "vim-cursor",
            });

            const changeModeTo: VimModes = tr.getMeta(
              TransactionMeta.ChangeModeTo
            );

            if (VimModesList.includes(changeModeTo)) {
              storage.currentVimMode = changeModeTo;

              options.updateValue({ mode: storage.currentVimMode });
            }

            const showCursorVal: boolean = tr.getMeta(
              TransactionMeta.SetShowCursor
            );

            if ([true, false].includes(showCursorVal))
              storage.showCursor = showCursorVal;

            storage.decorationSet = DecorationSet.create(newState.doc, [
              storage.cursorDecoration,
            ]);

            return {
              mode: storage.currentVimMode,
              decorationSet: storage.decorationSet,
            };
          },
        },
      });

      const handleKey = ({
        type,
        motion,
        mode,
        action,
        props
      }: KeyType): boolean => {
        const storage = getStorage();

        if (mode && mode !== storage.currentVimMode) return false;

        if (type === "motion" && motion && motions[motion] && storage.currentVimMode !== VimModes.Insert)
          return motions[motion]({ editor });

        if (type === "action" && action && actions[action])
          return actions[action]({ editor, props });

        return false;
      };

      const baseVimKeyMap: Record<string, Function> = {};

      for (const [keyString, key] of Object.entries(mappedDefaultKeyMap)) {
        baseVimKeyMap[keyString] = () => handleKey(key);
      }

      const vimKeyMap = keymap(baseVimKeyMap as any);

      return [vimModesPlugin, vimKeyMap];
    },

    addCommands() {
      return {
      };
    },
  });
}

const VimirrorVue = createVimirrorExtension(VueExtension);
const VimirrorReact = createVimirrorExtension(ReactExtension);

export { VimirrorVue, VimirrorReact };
