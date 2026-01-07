/**
 * FILE: declarations.d.ts
 * PURPOSE: Global type declarations for the app
 * OWNERSHIP: CLI
 */

declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}


