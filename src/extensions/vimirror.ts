import { Extension as VueExtension } from "@tiptap/vue-3";
import { Extension as ReactExtension } from "@tiptap/react";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";

import { defaultKeymap, KeyType } from "./defaultKeymap";
import { VimModes } from "./types";
import { VimirrorStorage } from "./storage";
import { motions } from "./motions";
import { TransactionMeta, VimModesList } from "./meta";
import { actions } from "./actions";

const mappedDefaultKeyMap: Record<string, KeyType> = {};

for (const key of defaultKeymap) {
  mappedDefaultKeyMap[key.keys] = key;
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

interface VimirrorOptions {
  updateValue: ({ mode }: { mode: string }) => void;
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
