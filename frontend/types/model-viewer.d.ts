import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "auto-rotate-delay"?: number | string;
          "rotation-per-second"?: string;
          "camera-controls"?: boolean | string;
          "shadow-intensity"?: string;
          "shadow-softness"?: string;
          exposure?: string;
          "camera-orbit"?: string;
          "interaction-prompt"?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}
