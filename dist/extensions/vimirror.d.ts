import { Extension as VueExtension } from "@tiptap/vue-3";
import { VimirrorStorage } from "./storage";
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
    updateValue: ({ mode }: {
        mode: string;
    }) => void;
}
declare const VimirrorVue: VueExtension<VimirrorOptions, VimirrorStorage>;
declare const VimirrorReact: VueExtension<VimirrorOptions, VimirrorStorage>;
export { VimirrorVue, VimirrorReact };
