import { Extension as VueExtension } from "@tiptap/vue-3";
import { Extension as ReactExtension } from "@tiptap/react";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import { defaultKeymap } from "./defaultKeymap";
import { VimModes } from "./types";
import { motions } from "./motions";
import { TransactionMeta, VimModesList } from "./meta";
import { actions } from "./actions";
const mappedDefaultKeyMap = {};
for (const key of defaultKeymap) {
    mappedDefaultKeyMap[key.keys] = key;
}
function createVimirrorExtension(BaseExtension) {
    return BaseExtension.create({
        name: "vimirror",
        addOptions() {
            return {
                updateValue: () => { },
            };
        },
        addStorage() {
            return {
                editor: null,
                decorationSet: null,
                prosemirror: null,
                cursorDecoration: null,
                currentVimMode: VimModes.Normal,
                showCursor: false,
                motionBuffer: "",
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
                        const changeModeTo = tr.getMeta(TransactionMeta.ChangeModeTo);
                        if (VimModesList.includes(changeModeTo)) {
                            storage.currentVimMode = changeModeTo;
                            options.updateValue({ mode: storage.currentVimMode });
                        }
                        const showCursorVal = tr.getMeta(TransactionMeta.SetShowCursor);
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
            const handleKey = ({ type, motion, mode, action, props }) => {
                const storage = getStorage();
                if (mode && mode !== storage.currentVimMode)
                    return false;
                if (type === "motion" && motion && motions[motion] && storage.currentVimMode !== VimModes.Insert)
                    return motions[motion]({ editor });
                if (type === "action" && action && actions[action])
                    return actions[action]({ editor, props });
                return false;
            };
            const baseVimKeyMap = {};
            for (const [keyString, key] of Object.entries(mappedDefaultKeyMap)) {
                baseVimKeyMap[keyString] = () => handleKey(key);
            }
            const vimKeyMap = keymap(baseVimKeyMap);
            return [vimModesPlugin, vimKeyMap];
        },
        addCommands() {
            return {};
        },
    });
}
const VimirrorVue = createVimirrorExtension(VueExtension);
const VimirrorReact = createVimirrorExtension(ReactExtension);
export { VimirrorVue, VimirrorReact };
//# sourceMappingURL=vimirror.js.map